import { prisma } from '../lib/prisma'

export async function handlePool(subcommand: string, opts: Record<string, any>): Promise<string> {
  if (subcommand === 'list') {
    try {
      const pools = await prisma.moneyPool.findMany({ where: { status: 'active' }, orderBy: { createdAt: 'desc' } })
      if (!pools.length) return '**Money Pools**\nNo active pools. Create one with `/pool create name:my-pool`'
      const lines = pools.map(p => {
        const pct = p.targetAmount ? ` — ${Math.round((p.balance / p.targetAmount) * 100)}% of $${p.targetAmount.toLocaleString()} goal` : ''
        return `• **${p.name}** $${p.balance.toLocaleString()}${pct}\n  ${p.purpose}`
      }).join('\n')
      return `**Active Money Pools**\n${lines}`
    } catch { return '**Money Pools**\nDatabase unreachable.' }
  }

  if (subcommand === 'create') {
    const { name, purpose, goal } = opts
    if (!name) return 'Pool name required. Use `/pool create name:my-pool`'
    try {
      const pool = await prisma.moneyPool.create({
        data: { name, purpose: purpose || name, targetAmount: goal ?? null },
      })
      const goalStr = pool.targetAmount != null ? ` Goal: $${pool.targetAmount.toLocaleString()}.` : ''
      return `**Pool Created**\n**${pool.name}** — ${pool.purpose}${goalStr}\nBalance: $0. Fund it with \`/pool fund name:${pool.name} amount:1000\``
    } catch { return `Couldn't create pool "${name}". It may already exist.` }
  }

  if (subcommand === 'fund') {
    const { name, amount } = opts
    if (!name || !amount) return 'Name and amount required. Use `/pool fund name:my-pool amount:1000`'
    try {
      const pool = await prisma.moneyPool.findFirst({ where: { name, status: 'active' } })
      if (!pool) return `Pool "${name}" not found. Use \`/pool list\` to see active pools.`
      const txs = Array.isArray(pool.transactions) ? pool.transactions as any[] : []
      const updated = await prisma.moneyPool.update({
        where: { id: pool.id },
        data: {
          balance: pool.balance + Number(amount),
          transactions: [...txs, { amount: Number(amount), ts: new Date().toISOString(), type: 'fund', via: 'discord' }],
        },
      })
      const pct = updated.targetAmount ? ` (${Math.round((updated.balance / updated.targetAmount) * 100)}% of goal)` : ''
      return `**Pool Funded**\n**${name}** → +$${Number(amount).toLocaleString()}\nNew balance: **$${updated.balance.toLocaleString()}**${pct}`
    } catch { return `Couldn't fund pool "${name}". Database error.` }
  }

  if (subcommand === 'close') {
    const { name } = opts
    if (!name) return 'Pool name required.'
    try {
      const pool = await prisma.moneyPool.findFirst({ where: { name, status: 'active' } })
      if (!pool) return `Pool "${name}" not found or already closed.`
      await prisma.moneyPool.update({ where: { id: pool.id }, data: { status: 'closed' } })
      return `**Pool Closed**\n"${name}" archived. Final balance: $${pool.balance.toLocaleString()}.`
    } catch { return `Couldn't close pool "${name}". Database error.` }
  }

  return 'Unknown pool subcommand. Use: `/pool create`, `/pool list`, `/pool fund`, `/pool close`'
}
