import { z } from 'zod'

export const WindowTypeDataSchema_v0 = z.object({
    ashraeWindowTypeId: z.string().optional(),
    infiltrationAreaReq: z.number().optional(),
    infiltrationLfReq: z.number().optional(),
    infiltrationUseSeparateWinterReqs: z.boolean().optional(),
    infiltrationWinterAreaReq: z.number().optional(),
    infiltrationWinterLfReq: z.number().optional(),
    name: z.string().optional(),
    shgc: z.number().optional(),
    timestamp: z.number().optional(),
    uValue: z.number().optional(),
})

export type WindowTypeData_v0 = z.infer<typeof WindowTypeDataSchema_v0>
