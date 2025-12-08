import { z } from 'zod'

export const VersionSetDataSchema_v0 = z.object({
    date: z.number(),
    name: z.string(),
    sequence: z.number(),
})
export type VersionSetData_v0 = z.infer<typeof VersionSetDataSchema_v0>

export const VersionSetIdSchema_v0 = z.string()
