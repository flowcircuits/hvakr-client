import { z } from 'zod'

export const RoofTypeDataSchema_v0 = z.object({
    ashraeRoofTypeId: z.string().optional(),
    color: z.string().optional(),
    name: z.string().optional(),
    surfaceAbsorptance: z.number().optional(),
    timestamp: z.number().optional(),
    uValue: z.number().optional(),
    unconditionedCoolingTempF: z.number().optional(),
    unconditionedHeatingTempF: z.number().optional(),
})
export type RoofTypeData_v0 = z.infer<typeof RoofTypeDataSchema_v0>
