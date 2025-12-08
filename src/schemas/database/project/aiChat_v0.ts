import { z } from 'zod'

export const AIChatDataSchema_v0 = z.object({
    name: z.string(),
    timestamp: z.number(),
})

export type AIChatData_v0 = z.infer<typeof AIChatDataSchema_v0>
