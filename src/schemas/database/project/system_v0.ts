import { z } from 'zod'
import { EquipmentDataSchema_v0 } from './equipment_v0'
import { UsageScheduleSchema_v0 } from './spaceType_v0'

export const DiversityDataSchema_v0 = z.object({
    equipment: z.number().optional(),
    lighting: z.number().optional(),
    occupancy: z.number().optional(),
})
export type DiversityData_v0 = z.infer<typeof DiversityDataSchema_v0>

export const CentralUnitDimensionDataSchema_v0 = z.object({
    length: z.number().optional(),
    width: z.number().optional(),
})
export type CentralUnitDimensionData_v0 = z.infer<
    typeof CentralUnitDimensionDataSchema_v0
>

export const HeatingEquipmentTypes_v0 = ['heatPump', 'gasFurnace'] as const
export type HeatingEquipmentType_v0 = (typeof HeatingEquipmentTypes_v0)[number]

export const EnergyScheduleSchema_v0 = z.object({
    occupiedHours: UsageScheduleSchema_v0.optional(),
    warmupHours: z.number().optional(),
    warmupMultiplier: z.number().optional(),
})
export type EnergySchedule_v0 = z.infer<typeof EnergyScheduleSchema_v0>

export const EquipmentEfficiencySchema_v0 = z.object({
    heatingType: z.enum(HeatingEquipmentTypes_v0).optional(),
    coolingSeer: z.number().optional(),
    heatingCop: z.number().optional(),
    heatingAfue: z.number().optional(),
})
export type EquipmentEfficiency_v0 = z.infer<
    typeof EquipmentEfficiencySchema_v0
>

export const EnergyConfigurationSchema_v0 = z.object({
    schedule: EnergyScheduleSchema_v0.optional(),
    efficiency: EquipmentEfficiencySchema_v0.optional(),
})
export type EnergyConfiguration_v0 = z.infer<
    typeof EnergyConfigurationSchema_v0
>

export const CentralUnitConfigurationSchema_v0 = z.object({
    ...EquipmentDataSchema_v0.shape,
    dimensionData: CentralUnitDimensionDataSchema_v0.optional(),
    energyConfiguration: EnergyConfigurationSchema_v0.optional(),
})
export type CentralUnitConfiguration_v0 = z.infer<
    typeof CentralUnitConfigurationSchema_v0
>

export const SystemDataSchema_v0 = z.object({
    equipmentConfig: CentralUnitConfigurationSchema_v0.optional(),
    diversityData: DiversityDataSchema_v0.optional(),
    color: z.string().optional(),
    configured: z.boolean().optional(),
    name: z.string().optional(),
})
export type SystemData_v0 = z.infer<typeof SystemDataSchema_v0>

export interface System_v0 extends SystemData_v0 {
    id: string
}
