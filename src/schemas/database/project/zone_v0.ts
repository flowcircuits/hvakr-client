import { z } from 'zod'

export const ZoneDataSchema_v0 = z.object({
    color: z.string().optional(),
    configured: z.boolean().optional(),
    name: z.string().optional(),
    systemId: z.string().optional(),
})
export type ZoneData_v0 = z.infer<typeof ZoneDataSchema_v0>

export interface Zone_v0 extends ZoneData_v0 {
    id: string
}
