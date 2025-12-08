import { z } from 'zod'

export const BranchTypeDataSchema_v0 = z.object({
    lossCoefficient: z.number().optional(),
    name: z.string().optional(),
})

export type BranchTypeData_v0 = z.infer<typeof BranchTypeDataSchema_v0>
