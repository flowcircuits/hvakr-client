import { z } from 'zod'

export const ErrorSchema_v0 = z.object({
    name: z.string(),
    message: z.string(),
    stack: z.string().optional(),
    cause: z.any().optional(),
})
