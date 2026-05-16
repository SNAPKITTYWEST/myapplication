const AGENT_NAMES: Record<string, string> = {
  bridge:       'RELAY',
  finance:      'AXIOM',
  treasury:     'VAULT',
  crm:          'NEXUS',
  procurement:  'FORGE',
  bifrost:      'HERALD',
  ml:           'TENSOR',
  risk:         'SENTINEL',
  auditor:      'LEDGE',
  operator:     'ATLAS',
  scriptwriter: 'QUILL',
}

export function agentName(key: string): string {
  return AGENT_NAMES[key] ?? key.toUpperCase()
}

export async function askAgent(agent: string, message: string): Promise<string> {
  const base = process.env.SNAPKITTY_API_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${base}/api/agents/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent, message }),
      signal: AbortSignal.timeout(35000),
    })
    if (!res.ok) return `Agent ${agentName(agent)} returned an error. Try the War Room.`
    const data = await res.json() as { reply?: string }
    return data.reply ?? 'No response.'
  } catch {
    return `${agentName(agent)} is not responding. Try the War Room at collectivekitty.com`
  }
}
