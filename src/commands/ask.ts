import { askAgent, agentName } from '../lib/agents'

export async function handleAsk(agent: string, message: string): Promise<string> {
  const reply = await askAgent(agent, message)
  return `**${agentName(agent)}**\n${reply}`
}
