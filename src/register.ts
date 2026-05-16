// Run once to register all slash commands with Discord:
// npx ts-node src/register.ts

const STRING      = 3
const NUMBER      = 10
const SUB_COMMAND = 1

const AGENT_CHOICES = [
  { name: 'RELAY — your plain-English guide',     value: 'bridge' },
  { name: 'AXIOM — finance & money pools',         value: 'finance' },
  { name: 'VAULT — treasury & approvals',          value: 'treasury' },
  { name: 'NEXUS — deals & CRM pipeline',          value: 'crm' },
  { name: 'FORGE — vendors & procurement',         value: 'procurement' },
  { name: 'HERALD — event infrastructure',         value: 'bifrost' },
  { name: 'TENSOR — anomaly detection & ML',       value: 'ml' },
  { name: 'SENTINEL — risk & compliance',          value: 'risk' },
  { name: 'LEDGE — audit & permanent record',      value: 'auditor' },
  { name: 'ATLAS — system ops & tier gating',      value: 'operator' },
  { name: 'QUILL — content & narrative engine',    value: 'scriptwriter' },
]

const COMMANDS = [
  {
    name: 'ask',
    description: 'Ask any of the 11 SnapKitty agents a question from Discord',
    options: [
      { name: 'agent',   description: 'Which agent to route to', type: STRING, required: true, choices: AGENT_CHOICES },
      { name: 'message', description: 'Your question',           type: STRING, required: true },
    ],
  },
  {
    name: 'pool',
    description: 'Money pool management — create, fund, and track capital pools',
    options: [
      { name: 'create', description: 'Create a new money pool', type: SUB_COMMAND,
        options: [
          { name: 'name',    description: 'Pool name',         type: STRING, required: true },
          { name: 'purpose', description: 'What it is for',    type: STRING, required: false },
          { name: 'goal',    description: 'Target USD amount', type: NUMBER, required: false },
        ] },
      { name: 'list', description: 'List all active pools', type: SUB_COMMAND },
      { name: 'fund', description: 'Add funds to a pool', type: SUB_COMMAND,
        options: [
          { name: 'name',   description: 'Pool name',       type: STRING, required: true },
          { name: 'amount', description: 'Amount to add',   type: NUMBER, required: true },
        ] },
      { name: 'close', description: 'Close a pool', type: SUB_COMMAND,
        options: [{ name: 'name', description: 'Pool name', type: STRING, required: true }] },
    ],
  },
  { name: 'tier',    description: 'Current fundability tier status and blockers' },
  { name: 'agents',  description: 'Plain-English directory of all 11 SnapKitty agents' },
  { name: 'status',  description: 'System health — Bifrost, database, infrastructure' },
  { name: 'seal',    description: 'Last decision seal — event type, risk, timestamp' },
  { name: 'audit',   description: 'Audit trail — last 5 Bifrost events with risk scores' },
  { name: 'merkle',  description: 'Merkle root and WORM chain entry count' },
]

async function register() {
  const { DISCORD_BOT_TOKEN, DISCORD_APP_ID } = process.env
  if (!DISCORD_BOT_TOKEN || !DISCORD_APP_ID) {
    console.error('Missing DISCORD_BOT_TOKEN or DISCORD_APP_ID in environment')
    process.exit(1)
  }

  const url = `https://discord.com/api/v10/applications/${DISCORD_APP_ID}/commands`
  const res  = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(COMMANDS),
  })

  const data = await res.json() as any[]
  if (!res.ok) { console.error('Discord error:', data); process.exit(1) }

  console.log(`Registered ${data.length} commands:`)
  data.forEach((c: any) => console.log(` /${c.name}`))
}

register().catch(console.error)
