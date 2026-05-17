import {
  Client, GatewayIntentBits, Partials,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  Events, GuildMember, ButtonInteraction,
} from 'discord.js'
import { prisma } from './lib/prisma'

// ── Role names — create these in your Discord server ─────────────────────────
export const ROLES = {
  SOVEREIGN:   'Sovereign',
  CONTRIBUTOR: 'Verified Contributor',
  DEVELOPER:   'Developer',
  BUILDER:     'Builder',
  UK_BUILDER:  'UK Builder',
  CYPHERPUNK:  'Cypherpunk Guild',
  OBSERVER:    'Observer',
}

// ── GitHub contributor check ──────────────────────────────────────────────────
async function isRepoContributor(githubUsername: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/SNAPKITTYWEST/DEVFLOW-FINANCE/contributors?per_page=100`,
      { headers: { 'User-Agent': 'snapkitty-bot', ...(process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {}) } }
    )
    if (!res.ok) return false
    const contributors = await res.json() as Array<{ login: string }>
    return contributors.some(c => c.login.toLowerCase() === githubUsername.toLowerCase())
  } catch { return false }
}

// ── Write member to DB ────────────────────────────────────────────────────────
async function upsertCommunityMember(data: {
  discordId: string
  discordTag: string
  role: string
  githubUsername?: string
  verified?: boolean
}) {
  try {
    await prisma.communityMember.upsert({
      where:  { discordId: data.discordId },
      update: { role: data.role, githubUsername: data.githubUsername, verified: data.verified ?? false, updatedAt: new Date() },
      create: {
        discordId:      data.discordId,
        discordTag:     data.discordTag,
        role:           data.role,
        githubUsername: data.githubUsername,
        verified:       data.verified ?? false,
      },
    })
  } catch (e) { console.error('DB write failed:', e) }
}

// ── Welcome embed + role buttons ─────────────────────────────────────────────
function buildWelcomeEmbed(member: GuildMember) {
  return new EmbedBuilder()
    .setColor(0x6d28d9)
    .setTitle('Saint Errant · Sovereign Digital Society')
    .setDescription(
      `**${member.user.username}** — you have been granted entry.\n\n` +
      `This is not a server. This is a sovereign digital society.\n` +
      `SnapKitty is the operating system. The agents are the mind.\n` +
      `The chain is the record. The fortress does not sleep.\n\n` +
      `**Declare your guild to receive your clearance:**`
    )
    .addFields(
      { name: '⚡ Developer',      value: 'Building on the sovereign codebase',        inline: true },
      { name: '🔨 Builder',        value: 'Working in the broader ecosystem',          inline: true },
      { name: '🔐 Cypherpunk',     value: 'Security, cryptography, zero-trust ops',   inline: true },
      { name: '🇬🇧 UK Builder',   value: 'UK Treasury Social Nest member',            inline: true },
      { name: '👁 Observer',       value: 'Witness to the machine',                   inline: true },
    )
    .setFooter({ text: 'Saint Errant · Sovereign Digital Society — built in the open, proven in chain' })
}

function buildRoleButtons() {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('role_developer').setLabel('⚡ Developer').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('role_builder').setLabel('🔨 Builder').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('role_cypherpunk').setLabel('🔐 Cypherpunk').setStyle(ButtonStyle.Danger),
  )
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('role_uk').setLabel('🇬🇧 UK Builder').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('role_observer').setLabel('👁 Observer').setStyle(ButtonStyle.Secondary),
  )
  return [row1, row2]
}

// ── Assign role helper ────────────────────────────────────────────────────────
async function assignRole(member: GuildMember, roleName: string): Promise<boolean> {
  try {
    const role = member.guild.roles.cache.find(r => r.name === roleName)
    if (!role) { console.warn(`Role "${roleName}" not found in server`); return false }
    await member.roles.add(role)
    return true
  } catch (e) { console.error('Role assign failed:', e); return false }
}

// ── Gateway client ────────────────────────────────────────────────────────────
export function startGateway() {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token) { console.warn('DISCORD_BOT_TOKEN not set — gateway disabled'); return }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
  })

  // ── New member joins ───────────────────────────────────────────────────────
  client.on(Events.GuildMemberAdd, async (member) => {
    console.log(`New member: ${member.user.tag}`)

    const welcomeChannel = member.guild.channels.cache.find(
      ch => ch.name === 'welcome' || ch.name === 'general'
    )

    if (welcomeChannel?.isTextBased()) {
      await welcomeChannel.send({
        content:    `<@${member.id}>`,
        embeds:     [buildWelcomeEmbed(member)],
        components: buildRoleButtons(),
      })
    }

    // Also DM the member
    try {
      await member.send({
        embeds:     [buildWelcomeEmbed(member)],
        components: buildRoleButtons(),
      })
    } catch { /* DMs may be closed */ }
  })

  // ── Button interactions ────────────────────────────────────────────────────
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return
    const btn = interaction as ButtonInteraction
    const member = btn.member as GuildMember

    if (btn.customId === 'role_developer') {
      await assignRole(member, ROLES.DEVELOPER)
      await upsertCommunityMember({ discordId: member.id, discordTag: member.user.tag, role: 'developer' })
      await btn.reply({
        content: `**Developer role assigned.**\n\nNow run \`/verify github-username:YourGitHubHandle\` to verify your contributions to DEVFLOW-FINANCE and unlock **Verified Contributor** status.`,
        ephemeral: true,
      })
    }

    else if (btn.customId === 'role_builder') {
      await assignRole(member, ROLES.BUILDER)
      await upsertCommunityMember({ discordId: member.id, discordTag: member.user.tag, role: 'builder' })
      await btn.reply({
        content: `**Builder role assigned.** Welcome to the ecosystem.\n\nCheck out the War Room at https://collectivekitty.com and use \`/ask\` to talk to any of the 11 agents.`,
        ephemeral: true,
      })
    }

    else if (btn.customId === 'role_uk') {
      await assignRole(member, ROLES.UK_BUILDER)
      await upsertCommunityMember({ discordId: member.id, discordTag: member.user.tag, role: 'uk_builder' })
      await btn.reply({
        content: `**UK Builder role assigned.**\n\nYou're now part of the UK Treasury Social Nest. Use \`/ask agent:sterling message:walk me through UK Tier 0\` to get started with the UK business credit system.`,
        ephemeral: true,
      })
    }

    else if (btn.customId === 'role_cypherpunk') {
      await assignRole(member, ROLES.CYPHERPUNK)
      await upsertCommunityMember({ discordId: member.id, discordTag: member.user.tag, role: 'cypherpunk' })
      await btn.reply({
        content: `**Cypherpunk Guild — clearance granted.**\n\n` +
          `The fortress runs SHA-256 sealed decisions, WORM immutable ledger, Ed25519 signature verification on every interaction, and a three-pillar preflight that kills unsigned payloads before they're processed.\n\n` +
          `Use \`/ask agent:sentinel message:show me the threat model\` to start.\n` +
          `The chain is at https://github.com/SNAPKITTYWEST/DEVFLOW-FINANCE`,
        ephemeral: true,
      })
    }

    else if (btn.customId === 'role_observer') {
      await assignRole(member, ROLES.OBSERVER)
      await upsertCommunityMember({ discordId: member.id, discordTag: member.user.tag, role: 'observer' })
      await btn.reply({
        content: `**Observer clearance granted.**\n\nWitness the machine at https://collectivekitty.com\nThe chain: https://github.com/SNAPKITTYWEST/DEVFLOW-FINANCE`,
        ephemeral: true,
      })
    }
  })

  client.once(Events.ClientReady, (c) => {
    console.log(`Gateway online — logged in as ${c.user.tag}`)
    console.log(`Watching ${c.guilds.cache.size} server(s)`)
  })

  client.login(token)
  return client
}

// ── GitHub verification slash handler (called from index.ts) ──────────────────
export async function handleVerify(
  discordId: string,
  discordTag: string,
  githubUsername: string,
  member: GuildMember
): Promise<string> {
  const isContributor = await isRepoContributor(githubUsername)

  if (isContributor) {
    await assignRole(member, ROLES.CONTRIBUTOR)
    await upsertCommunityMember({
      discordId, discordTag,
      role: 'verified_contributor',
      githubUsername,
      verified: true,
    })
    return `**Verified.** @${githubUsername} is a contributor to DEVFLOW-FINANCE.\n**Verified Contributor** role assigned. Welcome to the core.`
  } else {
    await assignRole(member, ROLES.DEVELOPER)
    await upsertCommunityMember({
      discordId, discordTag,
      role: 'developer',
      githubUsername,
      verified: false,
    })
    return `**@${githubUsername}** — not yet a contributor to DEVFLOW-FINANCE.\n**Developer** role assigned. Make your first PR at https://github.com/SNAPKITTYWEST/DEVFLOW-FINANCE and run \`/verify\` again to unlock Verified Contributor.`
  }
}
