import { z } from 'zod'

export const AgentSourceSchema = z.enum(['antigravity', 'claude-code', 'simulator'])
export type AgentSource = z.infer<typeof AgentSourceSchema>

export const ModelTierSchema = z.enum(['fast', 'standard', 'deep'])
export type ModelTier = z.infer<typeof ModelTierSchema>

export const AgentEventKindSchema = z.enum([
  'tool_call',
  'tool_result',
  'skill_used',
  'subagent_spawn',
  'message',
  'turn_complete',
])
export type AgentEventKind = z.infer<typeof AgentEventKindSchema>

export const AgentEventSchema = z.object({
  id: z.string().min(1),
  source: AgentSourceSchema,
  agentId: z.string().min(1).max(80),
  agentName: z.string().min(1).max(80),
  modelTier: ModelTierSchema.optional(),
  kind: AgentEventKindSchema,
  toolName: z.string().min(1).max(80).optional(),
  skillName: z.string().min(1).max(80).optional(),
  targetFile: z.string().min(1).max(120).optional(),
  status: z.enum(['ok', 'error']).optional(),
  timestamp: z.string().min(1),
})

export type AgentEvent = z.infer<typeof AgentEventSchema>
