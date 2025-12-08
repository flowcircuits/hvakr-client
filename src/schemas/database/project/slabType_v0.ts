import { z } from 'zod'

export const SlabTypeDataSchema_v0 = z.object({
    color: z.string().optional(),
    fFactor: z.number().optional(),
    name: z.string().optional(),
    timestamp: z.number().optional(),
    uValue: z.number().optional(),
    unconditionedCoolingTempF: z.number().optional(),
    unconditionedHeatingTempF: z.number().optional(),
})
export type SlabTypeData_v0 = z.infer<typeof SlabTypeDataSchema_v0>
