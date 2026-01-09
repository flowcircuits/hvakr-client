import { z } from 'zod'
import {
    CoolingCoilDataSchema_v0,
    HeatingCoilDataSchema_v0,
    OutsideAirDataSchema_v0,
    SupplyAirDataSchema_v0,
} from './system_v0'

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

export const TerminalUnitDimensionDataSchema_v0 = z.object({
    inletSize: TerminalUnitInletSizeSchema_v0.optional(),
})

export const TerminalUnitOutsideAirMethods_v0 = {
    SUM_OF_SPACES: 0,
    PERCENT: 1,
    CUSTOM: 2,
} as const
export const TerminalUnitOutsideAirMethodSchema_v0 = z.union(
    Object.values(TerminalUnitOutsideAirMethods_v0).map((value) =>
        z.literal(value)
    )
)
export const TerminalUnitOutsideAirDataSchema_v0 = z.object({
    ...OutsideAirDataSchema_v0.shape,
    method: TerminalUnitOutsideAirMethodSchema_v0.optional(),
})

export const TerminalUnitSupplyAirDataSchema_v0 = SupplyAirDataSchema_v0.pick({
    coolingTemperature: true,
    customSupplyIn: true,
    heatingTemperature: true,
})

export const TerminalUnitConfigurationSchema_v0 = z.object({
    coolingCoil: z.boolean().optional(),
    coolingCoilData: CoolingCoilDataSchema_v0.optional(),
    customReturnIn: z.number().optional(),
    dimensionData: TerminalUnitDimensionDataSchema_v0.optional(),
    heatingCoil: z.boolean().optional(),
    heatingCoilData: HeatingCoilDataSchema_v0.optional(),
    outsideAirData: TerminalUnitOutsideAirDataSchema_v0.optional(),
    pressureLoss: z.number().optional(),
    returnAir: z.boolean().optional(),
    supplyAirData: TerminalUnitSupplyAirDataSchema_v0.optional(),
})

export const ZoneDataSchema_v0 = z.object({
    color: z.string().optional(),
    configured: z.boolean().optional(),
    name: z.string().optional(),
    systemId: z.string().optional(),
    terminalUnitConfiguration: TerminalUnitConfigurationSchema_v0.optional(),
})
export type ZoneData_v0 = z.infer<typeof ZoneDataSchema_v0>
