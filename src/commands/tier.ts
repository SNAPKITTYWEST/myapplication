import { prisma } from '../lib/prisma'

export async function handleTier(): Promise<string> {
  try {
    const dealCount   = await prisma.deal.count()
    const vendorCount = await prisma.vendor.count({ where: { status: 'active' } })
    const poCount     = await prisma.purchaseOrder.count()
    const poolCount   = await prisma.moneyPool.count({ where: { status: 'active' } })
    return `**Fundability Tier Status**
\`\`\`
Tier 0 — Foundation          ◐ in progress
  Entity formation            ○ not confirmed
  EIN registered              ○ not confirmed
  Business bank account       ○ not confirmed

Tier 1 — Fundability         ○ pending Tier 0
  Google Business Profile     ○
  411 directory listing        ○
  Website + domain email       ○
  DUNS number                  ○

Tier 2 — Tradelines          ○ pending Tier 1
  Net-30 accounts (need 3)    ○
  Bureau reporting (need 2)   ○
  Paydex ≥ 80                 ○

Tier 3 — Revolving Lines     ○ pending Tier 2
  Revolving accounts (need 2) ○
  Utilization < 30%            ○
  12+ months in business       ○

Tier 4 — Vendor Expansion    ○ pending Tier 3
  Active vendors: ${vendorCount}/5
  Open POs:       ${poCount}
  Active pools:   ${poolCount}
  Open deals:     ${dealCount}

Next step: /ask agent:bridge message:walk me through Tier 0
\`\`\``
  } catch {
    return '**Tier Status**\n```\nDatabase unreachable — use War Room for live status\n```'
  }
}
