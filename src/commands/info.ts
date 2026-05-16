import { prisma } from '../lib/prisma'

export async function handleAgents(): Promise<string> {
  return `**SnapKitty — Agent Directory**
\`\`\`
RELAY      bridge        Your plain-English guide. Start here.
AXIOM      finance       Cash flow, revenue, expenses, money pools, GL.
VAULT      treasury      Reserve management, payment approvals. Veto power.
NEXUS      crm           Deals, contacts, pipeline, forecast.
FORGE      procurement   Vendors, purchase orders, spend analysis.
HERALD     bifrost       Event routing, infrastructure health, traces.
TENSOR     ml            Anomaly detection, predictions, risk scoring.
SENTINEL   risk          Risk status, compliance flags, credit utilization.
LEDGE      auditor       Permanent record, audit reports, qualification seal.
ATLAS      operator      System health, tier gate, agent roster. Gate authority.
QUILL      scriptwriter  Board decks, investor pitches, reports, social copy.
\`\`\`
Use \`/ask agent:bridge message:where do I start\` to talk to any agent.`
}

export async function handleStatus(): Promise<string> {
  try {
    const count  = await prisma.bifrostEvent.count()
    const recent = await prisma.bifrostEvent.findFirst({ orderBy: { createdAt: 'desc' } })
    const pools  = await prisma.moneyPool.count({ where: { status: 'active' } })
    return `**SnapKitty OS — System Status**
\`\`\`
Bifrost Events:  ${count}
Last Event:      ${recent?.eventType ?? 'none'}
Active Pools:    ${pools}
Database:        ONLINE
Agents:          11 ONLINE
Status:          OPERATIONAL
\`\`\``
  } catch { return '⚠ Database unreachable — Bifrost offline' }
}

export async function handleSeal(): Promise<string> {
  try {
    const last = await prisma.bifrostEvent.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!last) return '**Decision Seal**\n```\nNo sealed transactions yet\n```'
    return `**Last Decision Seal**\n\`\`\`\nEvent:   ${last.eventType}\nSource:  ${last.source}\nRisk:    ${((last.riskScore ?? 0) * 100).toFixed(0)}%\nSealed:  ${new Date(last.createdAt).toISOString()}\n\`\`\``
  } catch { return '**Decision Seal**\n```\nDatabase unreachable\n```' }
}

export async function handleAudit(): Promise<string> {
  try {
    const events = await prisma.bifrostEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
    if (!events.length) return '**Audit Trail**\n```\nNo events yet\n```'
    const lines = events.map(e =>
      `${new Date(e.createdAt).toISOString().slice(0, 19)} | ${e.eventType.padEnd(30)} | risk:${((e.riskScore ?? 0) * 100).toFixed(0).padStart(3)}%`
    ).join('\n')
    return `**Audit Trail — Last 5 Events**\n\`\`\`\n${lines}\n\`\`\``
  } catch { return '**Audit Trail**\n```\nDatabase unreachable\n```' }
}

export async function handleMerkle(): Promise<string> {
  const base = process.env.SNAPKITTY_API_URL ?? 'http://localhost:3000'
  try {
    const res  = await fetch(`${base}/api/ledger/merkle-root`)
    const data = await res.json() as { merkle_root?: string; entry_count?: number; status?: string }
    return `**Merkle Ledger**\n\`\`\`\nRoot:    ${data.merkle_root?.slice(0, 32)}…\nEntries: ${data.entry_count}\nStatus:  ${data.status}\n\`\`\``
  } catch { return '**Merkle Ledger**\n```\nRust handler offline — no merkle data\n```' }
}
