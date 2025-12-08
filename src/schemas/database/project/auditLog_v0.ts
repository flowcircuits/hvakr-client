import { z } from 'zod'

export const AuditLogDataSchema_v0 = z.object({
    actor: z.string(),
    diff: z.record(z.string(), z.unknown()).nullable(),
    summary: z.string().optional(),
    timestamp: z.number(),
})

export type AuditLogData_v0 = z.infer<typeof AuditLogDataSchema_v0>
