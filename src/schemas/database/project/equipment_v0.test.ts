import { describe, expect, it } from 'vitest'
import type { ProjectSubcollectionKey_v0 } from '../../../HVAKRClient'
import {
    ComponentSchema_v0,
    ComponentTypes_v0,
    EquipmentDataSchema_v0,
    EquipmentInletMethods_v0,
    EquipmentLinkDataSchema_v0,
    OutsideAirMethods_v0,
    SpaceDataSchema_v0,
    SystemDataSchema_v0,
    ZoneDataSchema_v0,
} from '.'
import {
    ExpandedProjectPatchSchema_v0,
    ExpandedProjectPostSchema_v0,
    PROJECT_SUBCOLLECTION_KEYS_V0,
} from './expandedProject_v0'

describe('canonical v0 equipment schemas', () => {
    it('parses mode-keyed component configurations', () => {
        const parsed = EquipmentDataSchema_v0.parse({
            projectScope: { type: 'system', id: 'ahu-1' },
            components: [
                { id: 'oa', type: ComponentTypes_v0.OUTSIDE_AIR_INTAKE },
                { id: 'cc', type: ComponentTypes_v0.COOLING_COIL },
            ],
            componentConfigsByMode: {
                cooling_mode: {
                    oa: {
                        enabled: true,
                        configuration: {
                            componentType: ComponentTypes_v0.OUTSIDE_AIR_INTAKE,
                            method: OutsideAirMethods_v0.MULTI_ZONE,
                        },
                    },
                    cc: {
                        enabled: true,
                        configuration: {
                            componentType: ComponentTypes_v0.COOLING_COIL,
                            targetTemperature: 55,
                        },
                    },
                },
            },
            inletData: {
                enabled: true,
                configuration: {
                    componentType: ComponentTypes_v0.EQUIPMENT_INLET,
                    decoupled: false,
                    method: EquipmentInletMethods_v0.SUM_OF_SPACES_OA,
                },
            },
        })

        expect(parsed.components).toHaveLength(2)
        expect(
            parsed.componentConfigsByMode?.cooling_mode?.oa?.configuration
        ).toMatchObject({ method: 'MULTI_ZONE' })
    })

    it('keeps placeholders out of the persisted component union', () => {
        expect(
            ComponentSchema_v0.safeParse({
                componentType: ComponentTypes_v0.HUMIDIFIER,
            }).success
        ).toBe(false)
        expect(
            ComponentSchema_v0.safeParse({
                componentType: ComponentTypes_v0.EQUIPMENT_INLET,
                decoupled: false,
                method: EquipmentInletMethods_v0.SUM_OF_SPACES_OA,
            }).success
        ).toBe(false)
    })

    it('scopes equipment to a system or zone via projectScope', () => {
        const system = EquipmentDataSchema_v0.parse({
            projectScope: { type: 'system', id: 'ahu-1' },
            dimensionData: { length: 60, width: 30 },
            energyConfiguration: {
                schedule: { warmupHours: 2, warmupMultiplier: 1.5 },
                efficiency: { heatingType: 'gasFurnace', coolingSeer: 14 },
            },
        })
        expect(system.projectScope).toEqual({ type: 'system', id: 'ahu-1' })
        expect(system.dimensionData).toEqual({ length: 60, width: 30 })

        const zone = EquipmentDataSchema_v0.parse({
            projectScope: { type: 'zone', id: 'vav-1' },
            dimensionData: { inletSize: '8' },
        })
        expect(zone.projectScope).toEqual({ type: 'zone', id: 'vav-1' })
        expect(zone.dimensionData?.inletSize).toBe('8')
    })

    it('requires projectScope on every equipment document', () => {
        expect(
            EquipmentDataSchema_v0.safeParse({
                dimensionData: { inletSize: '8' },
            }).success
        ).toBe(false)
        expect(
            EquipmentDataSchema_v0.safeParse({
                projectScope: { type: 'floor', id: 'level-1' },
            }).success
        ).toBe(false)
    })

    it('keeps a single canonical equipment shape on systems and zones', () => {
        expect(SystemDataSchema_v0.shape).not.toHaveProperty('equipmentConfig')
        expect(ZoneDataSchema_v0.shape).not.toHaveProperty('equipmentConfig')
        expect(SystemDataSchema_v0.shape).toHaveProperty('name')
        expect(ZoneDataSchema_v0.shape).toHaveProperty('systemId')
    })

    it('exposes equipment as a requestable subcollection', () => {
        expect(PROJECT_SUBCOLLECTION_KEYS_V0).toContain('equipment')

        const expand: ProjectSubcollectionKey_v0[] = ['equipment', 'systems']
        expect(expand).toContain('equipment')
    })

    it('uses mode/load-condition scoped space airflow inputs only', () => {
        expect(SpaceDataSchema_v0.shape).toHaveProperty('designAirflowsByMode')
        expect(SpaceDataSchema_v0.shape).toHaveProperty(
            'airflowRequirementsByLoadCondition'
        )
        expect(SpaceDataSchema_v0.shape).not.toHaveProperty('customSupply')
        expect(SpaceDataSchema_v0.shape).not.toHaveProperty('customReturn')
        expect(SpaceDataSchema_v0.shape).not.toHaveProperty('customExhaust')
        expect(SpaceDataSchema_v0.shape).not.toHaveProperty('ventilationReq')
        expect(SpaceDataSchema_v0.shape).not.toHaveProperty(
            'infiltrationWinterReqMethod'
        )
    })

    it('parses equipment links without adding them to project nesting', () => {
        expect(
            EquipmentLinkDataSchema_v0.parse({
                upstreamEquipment: { id: 'ahu-1', outletId: 'supply' },
                downstreamEquipment: { id: 'vav-1', inletId: 'inlet' },
            })
        ).toEqual({
            upstreamEquipment: { id: 'ahu-1', outletId: 'supply' },
            downstreamEquipment: { id: 'vav-1', inletId: 'inlet' },
        })
    })

    it('accepts a top-level equipment record on create', () => {
        expect(
            ExpandedProjectPostSchema_v0.safeParse({
                systems: { 'system-1': { name: 'AHU-1', configured: true } },
                zones: {
                    'zone-1': {
                        name: 'VAV-1',
                        configured: true,
                        systemId: 'system-1',
                    },
                },
                equipment: {
                    'equipment-ahu-1': {
                        projectScope: { type: 'system', id: 'system-1' },
                        dimensionData: { length: 60, width: 30 },
                        energyConfiguration: {
                            efficiency: { coolingSeer: 14 },
                        },
                    },
                    'equipment-vav-1': {
                        projectScope: { type: 'zone', id: 'zone-1' },
                        dimensionData: { inletSize: '8' },
                    },
                },
            }).success
        ).toBe(true)
    })

    it('supports granular equipment patches and whole-document deletion', () => {
        expect(
            ExpandedProjectPatchSchema_v0.parse({
                equipment: {
                    'equipment-ahu-1': {
                        componentConfigsByMode: {
                            cooling_mode: { cc: { enabled: false } },
                        },
                        energyConfiguration: { schedule: null },
                    },
                    'equipment-vav-1': null,
                },
            })
        ).toMatchObject({
            equipment: {
                'equipment-ahu-1': {
                    componentConfigsByMode: {
                        cooling_mode: { cc: { enabled: false } },
                    },
                    energyConfiguration: { schedule: null },
                },
                'equipment-vav-1': null,
            },
        })
    })

    it('rejects legacy nested equipmentConfig on create and patch', () => {
        expect(
            ExpandedProjectPostSchema_v0.safeParse({
                systems: {
                    'system-1': {
                        name: 'AHU-1',
                        equipmentConfig: { components: [] },
                    },
                },
            }).success
        ).toBe(false)
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({
                zones: {
                    'zone-1': {
                        equipmentConfig: { componentConfigsByMode: {} },
                    },
                },
            }).success
        ).toBe(false)
    })
})
