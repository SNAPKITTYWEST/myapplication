import express, { Request, Response } from 'express'
import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions'
import { GuildMember } from 'discord.js'
import { handleAsk } from './commands/ask'
import { handlePool } from './commands/pool'
import { handleTier } from './commands/tier'
import { handleAgents, handleStatus, handleSeal, handleAudit, handleMerkle } from './commands/info'
import { startGateway, handleVerify } from './onboarding'

const app  = express()
const PORT = parseInt(process.env.PORT ?? '3001', 10)

app.use(express.raw({ type: 'application/json' }))

// Start Discord gateway for member events + button interactions
const gatewayClient = startGateway()

app.get('/health', (_req, res) => {
  res.json({
    status:  'online',
    agents:  11,
    bot:     'snapkitty',
    gateway: gatewayClient ? 'connected' : 'disabled',
  })
})

app.post('/interactions', async (req: Request, res: Response) => {
  const signature = req.headers['x-signature-ed25519'] as string
  const timestamp = req.headers['x-signature-timestamp'] as string
  const publicKey = process.env.DISCORD_PUBLIC_KEY

  if (!publicKey) {
    res.status(500).json({ error: 'DISCORD_PUBLIC_KEY not configured' })
    return
  }

  const rawBody = req.body as Buffer
  const isValid = await verifyKey(rawBody, signature, timestamp, publicKey)
  if (!isValid) {
    res.status(401).end('Invalid signature')
    return
  }

  const body = JSON.parse(rawBody.toString())

  if (body.type === InteractionType.PING) {
    res.json({ type: InteractionResponseType.PONG })
    return
  }

  if (body.type === InteractionType.APPLICATION_COMMAND) {
    const { name, options = [] } = body.data
    const getOpt = (key: string) => options.find((o: any) => o.name === key)?.value

    let content = ''

    if (name === 'ask') {
      content = await handleAsk(getOpt('agent') || 'bridge', getOpt('message') || '')

    } else if (name === 'pool') {
      const sub     = options[0]
      const subOpts: Record<string, any> = {}
      for (const o of sub?.options ?? []) subOpts[o.name] = o.value
      content = await handlePool(sub?.name || '', subOpts)

    } else if (name === 'verify') {
      const githubUsername = getOpt('github-username') || ''
      if (!githubUsername) {
        content = 'GitHub username required. Use `/verify github-username:YourHandle`'
      } else if (!gatewayClient) {
        content = 'Gateway not connected — bot token required for role assignment.'
      } else {
        const guild  = gatewayClient.guilds.cache.first()
        const member = guild ? await guild.members.fetch(body.member?.user?.id).catch(() => null) : null
        if (!member) {
          content = 'Could not find your server membership. Try again in a moment.'
        } else {
          content = await handleVerify(
            body.member.user.id,
            `${body.member.user.username}#${body.member.user.discriminator}`,
            githubUsername,
            member as GuildMember
          )
        }
      }

    } else if (name === 'community') {
      content = await handleCommunity()

    } else if (name === 'tier')    { content = await handleTier()
    } else if (name === 'agents')  { content = await handleAgents()
    } else if (name === 'status')  { content = await handleStatus()
    } else if (name === 'seal')    { content = await handleSeal()
    } else if (name === 'audit')   { content = await handleAudit()
    } else if (name === 'merkle')  { content = await handleMerkle()
    } else { content = `Unknown command: ${name}. Try \`/agents\` for the full directory.` }

    if (content.length > 1990) content = content.slice(0, 1987) + '…'

    res.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content },
    })
    return
  }

  res.status(400).json({ error: 'Unknown interaction type' })
})

async function handleCommunity(): Promise<string> {
  const base = process.env.SNAPKITTY_API_URL ?? 'http://localhost:3000'
  try {
    const res  = await fetch(`${base}/api/community/members`)
    const data = await res.json() as { total: number; verified: number; roles: Record<string, number> }
    const roleLines = Object.entries(data.roles)
      .map(([role, count]) => `  ${role.padEnd(22)} ${count}`)
      .join('\n')
    return `**SnapKitty Community**\n\`\`\`\nTotal members:   ${data.total}\nVerified devs:   ${data.verified}\n\nBy role:\n${roleLines}\n\nJoin: discord.gg/dugymT3rj\n\`\`\``
  } catch {
    return '**SnapKitty Community**\n```\nCommunity hub at collectivekitty.com/community\nJoin: discord.gg/dugymT3rj\n```'
  }
}

app.listen(PORT, () => {
  console.log(`SnapKitty Bot online — port ${PORT}`)
  console.log(`Interactions: POST http://localhost:${PORT}/interactions`)
  console.log(`Health:       GET  http://localhost:${PORT}/health`)
})
