import { z } from 'zod'

export const DiversityDataSchema_v0 = z.object({
    equipment: z.number().optional(),
    lighting: z.number().optional(),
    occupancy: z.number().optional(),
})
export type DiversityData_v0 = z.infer<typeof DiversityDataSchema_v0>

export const SystemDataSchema_v0 = z.object({
    diversityData: DiversityDataSchema_v0.optional(),
    color: z.string().optional(),
    configured: z.boolean().optional(),
    name: z.string().optional(),
})
export type SystemData_v0 = z.infer<typeof SystemDataSchema_v0>

export interface System_v0 extends SystemData_v0 {
    id: string
}
