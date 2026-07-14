import { z } from 'zod'
import { LoadConditionSchema_v0 } from '../../misc'

export const ComponentTypes_v0 = {
    OUTSIDE_AIR_INTAKE: 'OUTSIDE_AIR_INTAKE',
    ENERGY_RECOVERY_UNIT: 'ENERGY_RECOVERY_UNIT',
    RETURN_AIR_INTAKE: 'RETURN_AIR_INTAKE',
    COOLING_COIL: 'COOLING_COIL',
    HEATING_COIL: 'HEATING_COIL',
    EQUIPMENT_INEFFICIENCY: 'EQUIPMENT_INEFFICIENCY',
    HUMIDIFIER: 'HUMIDIFIER',
    DEHUMIDIFIER: 'DEHUMIDIFIER',
    EQUIPMENT_INLET: 'EQUIPMENT_INLET',
    EQUIPMENT_OUTLET: 'EQUIPMENT_OUTLET',
} as const

export const ComponentTypeSchema_v0 = z.enum(Object.values(ComponentTypes_v0))
export type ComponentType_v0 = z.infer<typeof ComponentTypeSchema_v0>

export const OutsideAirMethods_v0 = {
    SUM_OF_SPACES: 'SUM_OF_SPACES',
    PERCENT: 'PERCENT',
    CUSTOM: 'CUSTOM',
    MULTI_ZONE: 'MULTI_ZONE',
} as const

export const OutsideAirMethodSchema_v0 = z.enum(
    Object.values(OutsideAirMethods_v0)
)
export type OutsideAirMethod_v0 = z.infer<typeof OutsideAirMethodSchema_v0>

export const OutsideAirIntakeSchema_v0 = z.discriminatedUnion('method', [
    z.object({
        componentType: z.literal(ComponentTypes_v0.OUTSIDE_AIR_INTAKE),
        method: z.literal(OutsideAirMethods_v0.SUM_OF_SPACES),
    }),
    z.object({
        componentType: z.literal(ComponentTypes_v0.OUTSIDE_AIR_INTAKE),
        method: z.literal(OutsideAirMethods_v0.PERCENT),
        percentage: z.number(),
    }),
    z.object({
        componentType: z.literal(ComponentTypes_v0.OUTSIDE_AIR_INTAKE),
        method: z.literal(OutsideAirMethods_v0.CUSTOM),
        flowRate: z.number(),
    }),
    z.object({
        componentType: z.literal(ComponentTypes_v0.OUTSIDE_AIR_INTAKE),
        method: z.literal(OutsideAirMethods_v0.MULTI_ZONE),
    }),
])
export type OutsideAirIntake_v0 = z.infer<typeof OutsideAirIntakeSchema_v0>

export const EnergyRecoveryUnitSchema_v0 = z.object({
    componentType: z.literal(ComponentTypes_v0.ENERGY_RECOVERY_UNIT),
    ductHeatGain: z.number().optional(),
    ervWheelEffectiveness: z.number().optional(),
})
export type EnergyRecoveryUnit_v0 = z.infer<typeof EnergyRecoveryUnitSchema_v0>

export const ReturnAirIntakeSchema_v0 = z.object({
    componentType: z.literal(ComponentTypes_v0.RETURN_AIR_INTAKE),
    ductHeatGain: z.number().optional(),
    ductLeakagePercent: z.number().optional(),
    reliefEnabled: z.boolean(),
})
export type ReturnAirIntake_v0 = z.infer<typeof ReturnAirIntakeSchema_v0>

export const CoolingCoilTypes_v0 = { WATER: 0, EXPANSION: 1 } as const
export const CoolingCoilTypeSchema_v0 = z.union(
    Object.values(CoolingCoilTypes_v0).map((value) => z.literal(value))
)
export type CoolingCoilType_v0 = z.infer<typeof CoolingCoilTypeSchema_v0>

export const CoolingCoilSchema_v0 = z.object({
    componentType: z.literal(ComponentTypes_v0.COOLING_COIL),
    targetTemperature: z.number().optional(),
    type: CoolingCoilTypeSchema_v0.optional(),
    waterDeltaT: z.number().optional(),
})
export type CoolingCoil_v0 = z.infer<typeof CoolingCoilSchema_v0>

export const HeatingCoilTypes_v0 = {
    WATER: 0,
    EXPANSION: 1,
    GAS: 2,
    ELECTRIC: 3,
} as const
export const HeatingCoilTypeSchema_v0 = z.union(
    Object.values(HeatingCoilTypes_v0).map((value) => z.literal(value))
)
export type HeatingCoilType_v0 = z.infer<typeof HeatingCoilTypeSchema_v0>

export const HeatingCoilSchema_v0 = z.object({
    componentType: z.literal(ComponentTypes_v0.HEATING_COIL),
    targetTemperature: z.number().optional(),
    type: HeatingCoilTypeSchema_v0.optional(),
    waterDeltaT: z.number().optional(),
})
export type HeatingCoil_v0 = z.infer<typeof HeatingCoilSchema_v0>

export const CoilSchema_v0 = z.discriminatedUnion('componentType', [
    CoolingCoilSchema_v0,
    HeatingCoilSchema_v0,
])
export type Coil_v0 = z.infer<typeof CoilSchema_v0>

export const EquipmentInefficiencyTypes_v0 = {
    POWER: 'POWER',
    TEMPERATURE_DELTA: 'TEMPERATURE_DELTA',
} as const

export const EquipmentInefficiencySchema_v0 = z.object({
    componentType: z.literal(ComponentTypes_v0.EQUIPMENT_INEFFICIENCY),
    sensibleHeatGain: z.discriminatedUnion('type', [
        z.object({
            type: z.literal(EquipmentInefficiencyTypes_v0.POWER),
            power: z.number(),
        }),
        z.object({
            type: z.literal(EquipmentInefficiencyTypes_v0.TEMPERATURE_DELTA),
            temperatureDelta: z.number(),
        }),
    ]),
})
export type EquipmentInefficiency_v0 = z.infer<
    typeof EquipmentInefficiencySchema_v0
>

export const HumidifierSchema_v0 = z.object({
    componentType: z.literal(ComponentTypes_v0.HUMIDIFIER),
})
export type Humidifier_v0 = z.infer<typeof HumidifierSchema_v0>

export const DehumidifierSchema_v0 = z.object({
    componentType: z.literal(ComponentTypes_v0.DEHUMIDIFIER),
})
export type Dehumidifier_v0 = z.infer<typeof DehumidifierSchema_v0>

export const EquipmentInletMethods_v0 = {
    SUM_OF_SPACES_OA: 'SUM_OF_SPACES_OA',
    PERCENT_SUPPLY: 'PERCENT_SUPPLY',
    CUSTOM: 'CUSTOM',
} as const

export const EquipmentInletSchema_v0 = z.discriminatedUnion('method', [
    z.object({
        componentType: z.literal(ComponentTypes_v0.EQUIPMENT_INLET),
        decoupled: z.boolean(),
        method: z.literal(EquipmentInletMethods_v0.SUM_OF_SPACES_OA),
    }),
    z.object({
        componentType: z.literal(ComponentTypes_v0.EQUIPMENT_INLET),
        decoupled: z.boolean(),
        method: z.literal(EquipmentInletMethods_v0.PERCENT_SUPPLY),
        percentage: z.number(),
    }),
    z.object({
        componentType: z.literal(ComponentTypes_v0.EQUIPMENT_INLET),
        decoupled: z.boolean(),
        method: z.literal(EquipmentInletMethods_v0.CUSTOM),
        flowRate: z.number(),
    }),
])
export type EquipmentInlet_v0 = z.infer<typeof EquipmentInletSchema_v0>

export const EquipmentOutletSchema_v0 = z.object({
    componentType: z.literal(ComponentTypes_v0.EQUIPMENT_OUTLET),
})
export type EquipmentOutlet_v0 = z.infer<typeof EquipmentOutletSchema_v0>

export const ComponentSchema_v0 = z.discriminatedUnion('componentType', [
    OutsideAirIntakeSchema_v0,
    EnergyRecoveryUnitSchema_v0,
    ReturnAirIntakeSchema_v0,
    CoolingCoilSchema_v0,
    HeatingCoilSchema_v0,
    EquipmentInefficiencySchema_v0,
])
export type Component_v0 = z.infer<typeof ComponentSchema_v0>

export const ComponentIdSchema_v0 = z.string()
export type ComponentId_v0 = z.infer<typeof ComponentIdSchema_v0>

export const ComponentConfigurationSchema_v0 = z.object({
    enabled: z.boolean(),
    configuration: ComponentSchema_v0,
})
export type ComponentConfiguration_v0 = z.infer<
    typeof ComponentConfigurationSchema_v0
>

export const ComponentConfigurationsSchema_v0 = z.record(
    ComponentIdSchema_v0,
    ComponentConfigurationSchema_v0
)
export type ComponentConfigurations_v0 = z.infer<
    typeof ComponentConfigurationsSchema_v0
>

export const ModeIdSchema_v0 = z.string()
export type ModeId_v0 = z.infer<typeof ModeIdSchema_v0>

export const ModeSchema_v0 = z.object({
    description: z.string(),
    id: ModeIdSchema_v0,
    loadCondition: LoadConditionSchema_v0,
    name: z.string(),
})
export type Mode_v0 = z.infer<typeof ModeSchema_v0>

export const EquipmentComponentSchema_v0 = z.object({
    id: ComponentIdSchema_v0,
    type: ComponentTypeSchema_v0,
})
export type EquipmentComponent_v0 = z.infer<typeof EquipmentComponentSchema_v0>

export const EquipmentDataSchema_v0 = z.object({
    components: z.array(EquipmentComponentSchema_v0).optional(),
    componentConfigsByMode: z
        .record(ModeIdSchema_v0, ComponentConfigurationsSchema_v0)
        .optional(),
    ductHeatGain: z.number().optional(),
    ductLeakagePercent: z.number().optional(),
    miscInefficiencies: z.number().optional(),
    pressureLoss: z.number().optional(),
    inletData: z
        .object({
            enabled: z.boolean(),
            configuration: EquipmentInletSchema_v0,
        })
        .optional(),
})
export type EquipmentData_v0 = z.infer<typeof EquipmentDataSchema_v0>
