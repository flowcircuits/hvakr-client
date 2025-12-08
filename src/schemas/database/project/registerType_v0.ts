import { z } from 'zod'
import { RegisterSpecificDataSchema_v0 } from './graph_v0'

const DEFAULT_REGISTER_TYPES = {
    LARGE: 'LARGE',
    NORMAL: 'NORMAL',
    SMALL: 'SMALL',
} as const

export const DefaultRegisterTypeSchema_v0 = z.enum(
    Object.values(DEFAULT_REGISTER_TYPES)
)

export const RegisterTypeDataSchema_v0 = z.object({
    ...RegisterSpecificDataSchema_v0.shape,
    defaultType: DefaultRegisterTypeSchema_v0.optional(),
    name: z.string().optional(),
    timestamp: z.number().optional(),
})
export type RegisterTypeData_v0 = z.infer<typeof RegisterTypeDataSchema_v0>
