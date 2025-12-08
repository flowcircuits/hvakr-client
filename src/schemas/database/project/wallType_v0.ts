import { z } from 'zod'

export const WallTypeDataSchema_v0 = z.object({
    ashraeWallTypeId: z.string().optional(),
    belowGradeCoolingTempF: z.number().optional(),
    belowGradeHeatingTempF: z.number().optional(),
    color: z.string().optional(),
    name: z.string().optional(),
    surfaceAbsorptance: z.number().optional(),
    timestamp: z.number().optional(),
    uValue: z.number().optional(),
})
export type WallTypeData_v0 = z.infer<typeof WallTypeDataSchema_v0>
