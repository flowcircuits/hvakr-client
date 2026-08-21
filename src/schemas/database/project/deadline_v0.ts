import { z } from 'zod'
import { disableUserWrite } from '../../utility'

export const DeadlineDataSchema_v0 = z.object({
    complete: z.boolean(),
    date: z.number(),
    name: z.string().optional(),
    createdAt: disableUserWrite(z.number().optional()),
})

export type DeadlineData_v0 = z.infer<typeof DeadlineDataSchema_v0>
