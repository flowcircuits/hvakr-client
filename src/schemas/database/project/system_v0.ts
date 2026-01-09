import { z } from 'zod'

export const OutsideAirMethods_v0 = {
    SUM_OF_SPACES: 0,
    PERCENT: 1,
    CUSTOM: 2,
    MULTI_ZONE: 3,
} as const

export const OutsideAirMethodSchema_v0 = z.union(
    Object.values(OutsideAirMethods_v0).map((value) => z.literal(value))
)

export const CoolingCoilTypes_v0 = { WATER: 0, EXPANSION: 1 } as const

export const CoolingCoilTypeSchema_v0 = z.union(
    Object.values(CoolingCoilTypes_v0).map((value) => z.literal(value))
)

export const HeatingCoilTypes_v0 = {
    WATER: 0,
    EXPANSION: 1,
    GAS: 2,
    ELECTRIC: 3,
} as const

export const HeatingCoilTypeSchema_v0 = z.union(
    Object.values(HeatingCoilTypes_v0).map((value) => z.literal(value))
)

export const SupplyAirDataSchema_v0 = z.object({
    coolingTemperature: z.number().optional(),
    customSupplyIn: z.number().optional(),
    ductHeatGain: z.number().optional(),
    ductLeakagePercent: z.number().optional(),
    heatingTemperature: z.number().optional(),
})

export const CoolingCoilDataSchema_v0 = z.object({
    chilledWaterDeltaT: z.number().optional(),
    type: CoolingCoilTypeSchema_v0.optional(),
})

export const HeatingCoilDataSchema_v0 = z.object({
    heatingWaterDeltaT: z.number().optional(),
    type: HeatingCoilTypeSchema_v0.optional(),
})

export const ReturnAirDataSchema_v0 = z.object({
    ductHeatGain: z.number().optional(),
    ductLeakagePercent: z.number().optional(),
})

export const OutsideAirDataSchema_v0 = z.object({
    custom: z.number().optional(),
    method: OutsideAirMethodSchema_v0.optional(),
    percentage: z.number().optional(),
    previousMethod: OutsideAirMethodSchema_v0.optional(),
})

export const DiversityDataSchema_v0 = z.object({
    equipment: z.number().optional(),
    lighting: z.number().optional(),
    occupacy: z.number().optional(),
})

export const CentralUnitDimensionDataSchema_v0 = z.object({
    length: z.number().optional(),
    width: z.number().optional(),
})

export const CentralUnitConfigurationSchema_v0 = z.object({
    coolingCoil: z.boolean().optional(),
    coolingCoilData: CoolingCoilDataSchema_v0.optional(),
    customReliefAir: z.number().optional(),
    dimensionData: CentralUnitDimensionDataSchema_v0.optional(),
    diversityData: DiversityDataSchema_v0.optional(),
    ervWheel: z.boolean().optional(),
    ervWheelEffectiveness: z.number().optional(),
    fanMotorHeatGain: z.number().optional(),
    heatingCoil: z.boolean().optional(),
    heatingCoilData: HeatingCoilDataSchema_v0.optional(),
    miscInefficiencies: z.number().optional(),
    outsideAir: z.boolean().optional(),
    outsideAirData: OutsideAirDataSchema_v0.optional(),
    pressureLoss: z.number().optional(),
    returnAir: z.boolean().optional(),
    returnAirData: ReturnAirDataSchema_v0.optional(),
    supplyAirData: SupplyAirDataSchema_v0.optional(),
})

export const EnergyConfigurationSchema_v0 = z.object({
    efficiency: z.number().optional(),
    energyType: z.enum(['electric', 'gas']).optional(),
    name: z.string().optional(),
    useFactor: z.number().optional(),
})

export const SystemDataSchema_v0 = z.object({
    centralUnitConfiguration: CentralUnitConfigurationSchema_v0.optional(),
    color: z.string().optional(),
    configured: z.boolean().optional(),
    energyConfigurations: z
        .record(z.string(), EnergyConfigurationSchema_v0)
        .optional(),
    name: z.string().optional(),
})
export type SystemData_v0 = z.infer<typeof SystemDataSchema_v0>
