import { z } from 'zod'
import { EquipmentDataSchema_v0 } from './equipment_v0'

export const TERMINAL_UNIT_INLET_SIZES_v0 = [
    '6',
    '8',
    '10',
    '12',
    '14',
    '16',
    '24x16',
] as const satisfies Readonly<string[]>
export const TerminalUnitInletSizeSchema_v0 = z.enum(
    TERMINAL_UNIT_INLET_SIZES_v0
)
export type TerminalUnitInletSize_v0 = z.infer<
    typeof TerminalUnitInletSizeSchema_v0
>

export const TerminalUnitDimensionDataSchema_v0 = z.object({
    inletSize: TerminalUnitInletSizeSchema_v0.optional(),
})
export type TerminalUnitDimensionData_v0 = z.infer<
    typeof TerminalUnitDimensionDataSchema_v0
>

export const TerminalUnitConfigurationSchema_v0 = z.object({
    ...EquipmentDataSchema_v0.shape,
    dimensionData: TerminalUnitDimensionDataSchema_v0.optional(),
})
export type TerminalUnitConfiguration_v0 = z.infer<
    typeof TerminalUnitConfigurationSchema_v0
>

export const ZoneDataSchema_v0 = z.object({
    color: z.string().optional(),
    configured: z.boolean().optional(),
    equipmentConfig: TerminalUnitConfigurationSchema_v0.optional(),
    name: z.string().optional(),
    systemId: z.string().optional(),
})
export type ZoneData_v0 = z.infer<typeof ZoneDataSchema_v0>

export interface Zone_v0 extends ZoneData_v0 {
    id: string
}
