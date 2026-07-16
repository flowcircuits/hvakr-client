import { z } from 'zod'

export const DeadlineDataSchema_v0 = z.object({
    complete: z.boolean(),
    date: z.number(),
    name: z.string().optional(),
    timestamp: z.number().optional().meta({ disableUserWrite: true }),
})

export type DeadlineData_v0 = z.infer<typeof DeadlineDataSchema_v0>
