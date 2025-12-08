import { z } from 'zod'

export const DuctTypeDataSchema_v0 = z.object({
    color: z.string().optional(),
    linerThickness: z.number().optional(),
    maxHeight: z.number().optional(),
    maxPressureDropRate: z.number().optional(),
    maxVelocity: z.number().optional(),
    name: z.string().optional(),
    timestamp: z.number().optional(),
})

export type DuctTypeData_v0 = z.infer<typeof DuctTypeDataSchema_v0>
