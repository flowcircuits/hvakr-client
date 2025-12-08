import { z } from 'zod'

export const DoorTypeDataSchema_v0 = z.object({
    name: z.string().optional(),
    openFraction: z.number().optional(),
    seals: z.boolean().optional(),
    surfaceAbsorptance: z.number().optional(),
    timestamp: z.number().optional(),
    uValue: z.number().optional(),
})

export type DoorTypeData_v0 = z.infer<typeof DoorTypeDataSchema_v0>
