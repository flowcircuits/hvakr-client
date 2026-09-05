import { z } from 'zod'
import { disableUserWrite } from '../../utility'

export const WindowTypeDataSchema_v0 = z.object({
    ashraeWindowTypeId: z.string().optional(),
    infiltrationAreaReq: z.number().optional(),
    infiltrationPerimeterReq: z.number().optional(),
    infiltrationUseSeparateWinterReqs: z.boolean().optional(),
    infiltrationWinterAreaReq: z.number().optional(),
    infiltrationWinterPerimeterReq: z.number().optional(),
    name: z.string().optional(),
    shgc: z.number().optional(),
    createdAt: disableUserWrite(z.number().optional()),
    uValue: z.number().optional(),
})

export type WindowTypeData_v0 = z.infer<typeof WindowTypeDataSchema_v0>
