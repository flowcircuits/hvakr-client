import { z } from 'zod'

export const PipeMaterialTypes_v0 = {
    STEEL: 'STEEL',
    COPPER: 'COPPER',
} as const

export const PipeMaterialTypeSchema_v0 = z.enum(
    Object.values(PipeMaterialTypes_v0)
)

export const PipeTypeDataSchema_v0 = z.object({
    insulation: z.number().optional(),
    material: PipeMaterialTypeSchema_v0.optional(),
    maxPressureDropRate: z.number().optional(),
    maxVelocity: z.number().optional(),
    name: z.string().optional(),
})
export type PipeTypeData_v0 = z.infer<typeof PipeTypeDataSchema_v0>
