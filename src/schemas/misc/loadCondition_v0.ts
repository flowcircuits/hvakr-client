import { z } from 'zod'

export const LoadConditions_v0 = {
    COOLING: 'COOLING',
    HEATING: 'HEATING',
} as const

export const LoadConditionSchema_v0 = z.enum(Object.values(LoadConditions_v0))
export type LoadCondition_v0 = z.infer<typeof LoadConditionSchema_v0>
