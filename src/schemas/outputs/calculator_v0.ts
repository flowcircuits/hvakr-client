import { z } from 'zod'
import {
    ComponentTypes_v0,
    ModeIdSchema_v0,
} from '../database/project/equipment_v0'

/** Canonical calculator building blocks for the public v0 output contract. */

// --------------------------------------------------------------------
// -- Flags -----------------------------------------------------------

export const CalculatorFlagTypes_v0 = {
    NO_WEATHER_STATION_SELECTED: 'NO_WEATHER_STATION_SELECTED',
    WEATHER_STATION_NOT_FOUND: 'WEATHER_STATION_NOT_FOUND',
    NO_SPACES_DEFINED: 'NO_SPACES_DEFINED',
    NO_SPACES_IN_ZONE: 'NO_SPACES_IN_ZONE',
    NO_ZONES_IN_SYSTEM: 'NO_ZONES_IN_SYSTEM',
    COOLING_LOAD_FAILED: 'COOLING_LOAD_FAILED',
    HEATING_LOAD_FAILED: 'HEATING_LOAD_FAILED',
    COOLING_LOAD_INCOMPLETE: 'COOLING_LOAD_INCOMPLETE',
    HEATING_LOAD_INCOMPLETE: 'HEATING_LOAD_INCOMPLETE',
    AIRFLOWS_MISSING_LOADS: 'AIRFLOWS_MISSING_LOADS',
    INFILTRATION_MISSING_SPACE_TYPE: 'INFILTRATION_MISSING_SPACE_TYPE',
    INFILTRATION_MISSING_WEATHER_DATA: 'INFILTRATION_MISSING_WEATHER_DATA',
    INFILTRATION_FAILED: 'INFILTRATION_FAILED',
    EQUIPMENT_MISSING_WEATHER_DATA: 'EQUIPMENT_MISSING_WEATHER_DATA',
    EQUIPMENT_PSYCHROMETRICS_FAILED: 'EQUIPMENT_PSYCHROMETRICS_FAILED',
    EQUIPMENT_CENTRAL_UNIT_UNAVAILABLE: 'EQUIPMENT_CENTRAL_UNIT_UNAVAILABLE',
    EQUIPMENT_OUTSIDE_AIR_UNAVAILABLE: 'EQUIPMENT_OUTSIDE_AIR_UNAVAILABLE',
    EQUIPMENT_COMPONENT_SKIPPED: 'EQUIPMENT_COMPONENT_SKIPPED',
    ENERGY_LOAD_FAILED: 'ENERGY_LOAD_FAILED',
    ENERGY_LOAD_INCOMPLETE: 'ENERGY_LOAD_INCOMPLETE',
    ENERGY_MISSING_SPACE_TYPE: 'ENERGY_MISSING_SPACE_TYPE',
    ENERGY_MISSING_INDOOR_HUMIDITY: 'ENERGY_MISSING_INDOOR_HUMIDITY',
    ENERGY_MISSING_AIRFLOWS: 'ENERGY_MISSING_AIRFLOWS',
    ENERGY_MISSING_SETPOINT: 'ENERGY_MISSING_SETPOINT',
    ENERGY_MISSING_EFFICIENCY: 'ENERGY_MISSING_EFFICIENCY',
} as const

export const CalculatorFlagTypeSchema_v0 = z.enum(
    Object.values(CalculatorFlagTypes_v0)
)
export type CalculatorFlagType_v0 = z.infer<typeof CalculatorFlagTypeSchema_v0>

export const FlagEntitySchema_v0 = z.union([
    z.object({ entityType: z.literal('project') }),
    z.object({
        componentId: z.string().optional(),
        entityType: z.enum(['space', 'zone', 'system', 'equipment']),
        id: z.string(),
        modeId: z.string().optional(),
    }),
])
export type FlagEntity_v0 = z.infer<typeof FlagEntitySchema_v0>

export const CalculatorFlagsSchema_v0 = z.partialRecord(
    CalculatorFlagTypeSchema_v0,
    z.array(FlagEntitySchema_v0)
)
export type CalculatorFlags_v0 = z.infer<typeof CalculatorFlagsSchema_v0>

// --------------------------------------------------------------------
// -- Shared air state and process results ---------------------------

export const PsychrometricsSchema_v0 = z.object({
    RH: z.number(),
    T_db: z.number(),
    T_wb: z.number(),
    W: z.number(),
    W_s: z.number(),
    W_sTwb: z.number(),
    elevation: z.number(),
    h: z.number(),
    p: z.number(),
    p_v: z.number(),
    p_ws: z.number(),
    p_wsTwb: z.number(),
    t_d: z.number(),
    v: z.number(),
    μ: z.number(),
})
export type Psychrometrics_v0 = z.infer<typeof PsychrometricsSchema_v0>

export const ProcessResultSchema_v0 = z.object({
    T_db: z.number(),
    T_wb: z.number(),
    m_w: z.number().optional(),
    q: z.number(),
})
export type ProcessResult_v0 = z.infer<typeof ProcessResultSchema_v0>

export const AirStreamSchema_v0 = z.object({
    flowRate: z.number(),
    psychrometrics: PsychrometricsSchema_v0,
})
export type AirStream_v0 = z.infer<typeof AirStreamSchema_v0>

// --------------------------------------------------------------------
// -- Project-scope airflows -----------------------------------------

export const AirflowsSchema_v0 = z.object({
    exhaust: z.number(),
    outside: z.number(),
    relief: z.number(),
    return: z.number(),
    supply: z.number(),
})
export type Airflows_v0 = z.infer<typeof AirflowsSchema_v0>

export const MonthHourSchema_v0 = z.object({
    hour: z.number(),
    month: z.number(),
})
export type MonthHour_v0 = z.infer<typeof MonthHourSchema_v0>

export const SupplySourcesSchema_v0 = z.object({
    codeRequiredSupply: z.number(),
    directAirSpaceSensible: z.number(),
    directOutsideAir: z.number(),
    loadRequiredSupply: z.number(),
    totalSpaceSensible: z.number(),
})
export type SupplySources_v0 = z.infer<typeof SupplySourcesSchema_v0>

export const ModeAirflowsSchema_v0 = z.object({
    airflowDifferential: z.object({ design: z.number(), required: z.number() }),
    design: AirflowsSchema_v0,
    monthHour: MonthHourSchema_v0.optional(),
    required: AirflowsSchema_v0,
    spacePeaksSum: AirflowsSchema_v0,
    supplySources: SupplySourcesSchema_v0,
})
export type ModeAirflows_v0 = z.infer<typeof ModeAirflowsSchema_v0>

export const CalculatedOutsideAirflowSchema_v0 = z.object({
    cooling: z.number(),
    heating: z.number(),
    max: z.number(),
})
export type CalculatedOutsideAirflow_v0 = z.infer<
    typeof CalculatedOutsideAirflowSchema_v0
>

export const RequiredOutsideAirflowComponentsSchema_v0 = z.object({
    code: z.object({ ach: z.number() }),
    load: z.object({ area: z.number(), people: z.number(), total: z.number() }),
})
export type RequiredOutsideAirflowComponents_v0 = z.infer<
    typeof RequiredOutsideAirflowComponentsSchema_v0
>

export const ProjectScopeAirflowsSchema_v0 = z.object({
    byMode: z.record(ModeIdSchema_v0, ModeAirflowsSchema_v0),
    calculatedOutsideAirflow: CalculatedOutsideAirflowSchema_v0,
    max: ModeAirflowsSchema_v0.pick({
        airflowDifferential: true,
        design: true,
        required: true,
    }),
    requiredOutsideAirflowComponents: RequiredOutsideAirflowComponentsSchema_v0,
})
export type ProjectScopeAirflows_v0 = z.infer<
    typeof ProjectScopeAirflowsSchema_v0
>

// --------------------------------------------------------------------
// -- Ventilation -----------------------------------------------------

export const CentralUnitAirflowDataSchema_v0 = z.object({
    diversity: z.number(),
    outdoorIntakeMultiZone: z.number(),
    outdoorIntakeSumOfSpaces: z.number(),
})
export type CentralUnitAirflowData_v0 = z.infer<
    typeof CentralUnitAirflowDataSchema_v0
>

export const IAQP_NOT_ACHIEVABLE_v0 = 'not achievable'

export const IAQPMinimumOutsideAirflowSchema_v0 = z.union([
    z.number(),
    z.literal(IAQP_NOT_ACHIEVABLE_v0),
])
export type IAQPMinimumOutsideAirflow_v0 = z.infer<
    typeof IAQPMinimumOutsideAirflowSchema_v0
>

export const IAQPCO2CalculationsSchema_v0 = z.object({
    requiredOutsideAirflow: z.number(),
    controls: z.boolean(),
})
export type IAQPCO2Calculations_v0 = z.infer<
    typeof IAQPCO2CalculationsSchema_v0
>

export const IAQPCalculationsSchema_v0 = z.object({
    airCleanerCount: z.number(),
    cleaningAirflow: z.number(),
    co2: IAQPCO2CalculationsSchema_v0.optional(),
    controllingCompoundId: z.string().optional(),
    minimumOutsideAirflow: IAQPMinimumOutsideAirflowSchema_v0,
    minimumOutsideAirflowByCompound: z
        .record(z.string(), IAQPMinimumOutsideAirflowSchema_v0)
        .optional(),
})
export type IAQPCalculations_v0 = z.infer<typeof IAQPCalculationsSchema_v0>

// --------------------------------------------------------------------
// -- Mode-keyed checksums -------------------------------------------

export const ModeChecksumsSchema_v0 = z.object({
    airflowDensity: z.number().optional(),
    airflowLoadRatio: z.number().optional(),
    exhaustAirflowDensity: z.number().optional(),
    loadDensity: z.number().optional(),
    loadDistribution: z.number().optional(),
    oaAirflowDensity: z.number().optional(),
    oaAirflowPerPerson: z.number().optional(),
    oaFraction: z.number().optional(),
    shr: z.number().optional(),
})
export type ModeChecksums_v0 = z.infer<typeof ModeChecksumsSchema_v0>

export const ScopeModeChecksumsSchema_v0 = ModeChecksumsSchema_v0.extend({
    equipmentDensity: z.number().optional(),
    lightingDensity: z.number().optional(),
    spacePeakSumSensibleLoad: z.number().optional(),
    spacePeakSumSupplyCFM: z.number().optional(),
    spacePeakSumTotalLoad: z.number().optional(),
})
export type ScopeModeChecksums_v0 = z.infer<typeof ScopeModeChecksumsSchema_v0>

export const ScopeChecksumsSchema_v0 = z.record(
    ModeIdSchema_v0,
    ScopeModeChecksumsSchema_v0
)
export type ScopeChecksums_v0 = z.infer<typeof ScopeChecksumsSchema_v0>

export const EquipmentChecksumsSchema_v0 = z.record(
    ModeIdSchema_v0,
    ModeChecksumsSchema_v0
)
export type EquipmentChecksums_v0 = z.infer<typeof EquipmentChecksumsSchema_v0>

// --------------------------------------------------------------------
// -- Equipment pipeline ---------------------------------------------

export const OutsideAirIntakeIOSchema_v0 = z.object({
    componentType: z.literal(ComponentTypes_v0.OUTSIDE_AIR_INTAKE),
    inputs: z.object({
        equipmentAir: AirStreamSchema_v0.optional(),
        outsideAir: AirStreamSchema_v0,
    }),
    outputs: z.object({ equipmentAir: AirStreamSchema_v0 }),
})
export type OutsideAirIntakeIO_v0 = z.infer<typeof OutsideAirIntakeIOSchema_v0>

export const EnergyRecoveryUnitIOSchema_v0 = z.object({
    componentType: z.literal(ComponentTypes_v0.ENERGY_RECOVERY_UNIT),
    inputs: z.object({
        equipmentAir: AirStreamSchema_v0,
        exhaustAir: AirStreamSchema_v0.optional(),
    }),
    outputs: z.object({
        equipmentAir: AirStreamSchema_v0,
        exhaustAir: AirStreamSchema_v0.optional(),
    }),
})
export type EnergyRecoveryUnitIO_v0 = z.infer<
    typeof EnergyRecoveryUnitIOSchema_v0
>

export const ReturnAirIntakeIOSchema_v0 = z.object({
    componentType: z.literal(ComponentTypes_v0.RETURN_AIR_INTAKE),
    inputs: z.object({
        equipmentAir: AirStreamSchema_v0.optional(),
        returnAir: AirStreamSchema_v0.optional(),
    }),
    outputs: z.object({
        equipmentAir: AirStreamSchema_v0,
        reliefAir: AirStreamSchema_v0.optional(),
    }),
})
export type ReturnAirIntakeIO_v0 = z.infer<typeof ReturnAirIntakeIOSchema_v0>

export const WaterCoilDataSchema_v0 = z.object({
    deltaT: z.number().optional(),
    flowRate: z.number().optional(),
})
export type WaterCoilData_v0 = z.infer<typeof WaterCoilDataSchema_v0>

export const CoolingCoilIOSchema_v0 = z.object({
    coilLoad: ProcessResultSchema_v0,
    componentType: z.literal(ComponentTypes_v0.COOLING_COIL),
    inputs: z.object({ equipmentAir: AirStreamSchema_v0 }),
    outputs: z.object({ equipmentAir: AirStreamSchema_v0 }),
    sensibleCoilLoad: ProcessResultSchema_v0.optional(),
    shr: z.number().optional(),
    water: WaterCoilDataSchema_v0.optional(),
})
export type CoolingCoilIO_v0 = z.infer<typeof CoolingCoilIOSchema_v0>

export const HeatingCoilIOSchema_v0 = z.object({
    coilLoad: ProcessResultSchema_v0,
    componentType: z.literal(ComponentTypes_v0.HEATING_COIL),
    inputs: z.object({ equipmentAir: AirStreamSchema_v0 }),
    outputs: z.object({ equipmentAir: AirStreamSchema_v0 }),
    water: WaterCoilDataSchema_v0.optional(),
})
export type HeatingCoilIO_v0 = z.infer<typeof HeatingCoilIOSchema_v0>

export const EquipmentInefficiencyIOSchema_v0 = z.object({
    componentType: z.literal(ComponentTypes_v0.EQUIPMENT_INEFFICIENCY),
    inputs: z.object({ equipmentAir: AirStreamSchema_v0 }),
    outputs: z.object({ equipmentAir: AirStreamSchema_v0 }),
})
export type EquipmentInefficiencyIO_v0 = z.infer<
    typeof EquipmentInefficiencyIOSchema_v0
>

export const ComponentIOSchema_v0 = z.discriminatedUnion('componentType', [
    OutsideAirIntakeIOSchema_v0,
    EnergyRecoveryUnitIOSchema_v0,
    ReturnAirIntakeIOSchema_v0,
    CoolingCoilIOSchema_v0,
    HeatingCoilIOSchema_v0,
    EquipmentInefficiencyIOSchema_v0,
])
export type ComponentIO_v0 = z.infer<typeof ComponentIOSchema_v0>

export const ModePipelineOutputSchema_v0 = z.object({
    componentResults: z.record(z.string(), ComponentIOSchema_v0),
    decoupledAirStream: AirStreamSchema_v0.optional(),
    supplyInletAirStream: AirStreamSchema_v0.optional(),
    supplyOutletAirStream: AirStreamSchema_v0.optional(),
})
export type ModePipelineOutput_v0 = z.infer<typeof ModePipelineOutputSchema_v0>

export const ConfiguredAirflowsSchema_v0 = z.object({
    withLeakage: z.record(ModeIdSchema_v0, AirflowsSchema_v0),
    withoutLeakage: z.record(ModeIdSchema_v0, AirflowsSchema_v0),
})
export type ConfiguredAirflows_v0 = z.infer<typeof ConfiguredAirflowsSchema_v0>

export const ModeInletFlowsSchema_v0 = z.record(ModeIdSchema_v0, z.number())
export type ModeInletFlows_v0 = z.infer<typeof ModeInletFlowsSchema_v0>

export const EquipmentAirflowsSchema_v0 = z.object({
    centralUnit: CentralUnitAirflowDataSchema_v0.optional(),
    raw: z.record(ModeIdSchema_v0, AirflowsSchema_v0),
})
export type EquipmentAirflows_v0 = z.infer<typeof EquipmentAirflowsSchema_v0>

export const CoilTotalsSchema_v0 = z.object({
    coilGPM: z.number().optional(),
    coilLoad: z.number().optional(),
    sensibleCoilLoad: z.number().optional(),
})
export type CoilTotals_v0 = z.infer<typeof CoilTotalsSchema_v0>

export const EquipmentModeSystemProcessSchema_v0 = z.object({
    ductHeatGainOrLoss: z.number().optional(),
    ductLeakage: z.number().optional(),
    fanMotorHeatGain: z.number(),
    otherInefficiencies: z.number(),
    total: z.number(),
})
export type EquipmentModeSystemProcess_v0 = z.infer<
    typeof EquipmentModeSystemProcessSchema_v0
>

export const EquipmentModeSummarySchema_v0 = z.object({
    airflows: z.object({
        asConfigured: AirflowsSchema_v0,
        withoutLeakage: AirflowsSchema_v0,
    }),
    coilTotals: CoilTotalsSchema_v0.optional(),
    systemProcess: EquipmentModeSystemProcessSchema_v0,
})
export type EquipmentModeSummary_v0 = z.infer<
    typeof EquipmentModeSummarySchema_v0
>

export const EquipmentModeCalculationsSchema_v0 = z.object({
    pipeline: ModePipelineOutputSchema_v0,
    summary: EquipmentModeSummarySchema_v0,
})
export type EquipmentModeCalculations_v0 = z.infer<
    typeof EquipmentModeCalculationsSchema_v0
>

export const EquipmentCalculationsSchema_v0 = z.object({
    airflows: EquipmentAirflowsSchema_v0.optional(),
    checksums: EquipmentChecksumsSchema_v0.optional(),
    modes: z
        .record(ModeIdSchema_v0, EquipmentModeCalculationsSchema_v0)
        .optional(),
})
export type EquipmentCalculations_v0 = z.infer<
    typeof EquipmentCalculationsSchema_v0
>
