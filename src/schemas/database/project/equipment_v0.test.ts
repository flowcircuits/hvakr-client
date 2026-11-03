import { describe, expect, it } from 'vitest'
import type { ProjectSubcollectionKey_v0 } from '../../../HVAKRClient'
import {
    ComponentSchema_v0,
    ComponentTypes_v0,
    EquipmentConfigSchema_v0,
    EquipmentInletMethods_v0,
    EquipmentLinkDataSchema_v0,
    OutsideAirMethods_v0,
    SpaceDataSchema_v0,
} from '.'
import {
    ExpandedProjectPatchSchema_v0,
    ExpandedProjectPostSchema_v0,
    PROJECT_SUBCOLLECTION_KEYS_V0,
    ProjectSubcollectionsSchema_v0,
} from './expandedProject_v0'

describe('canonical v0 equipment schemas', () => {
    it.each([
        { nodeType: 'CENTRAL_UNIT', systemId: 'system-1' },
        { nodeType: 'TERMINAL_UNIT', zoneId: 'zone-1' },
    ])(
        'preserves supply outlet settings on $nodeType reads and creates',
        (unit) => {
            const project = {
                graph: {
                    unit: {
                        ...unit,
                        id: 'unit',
                        adjacencies: [],
                        outlet: { ductHeatGain: 2, ductLeakagePercent: 0.01 },
                    },
                },
            }

            expect(ProjectSubcollectionsSchema_v0.parse(project)).toEqual(
                project
            )
            expect(ExpandedProjectPostSchema_v0.parse(project)).toEqual(project)
        }
    )

    it.each([
        { ductHeatGain: 2 },
        { ductLeakagePercent: 0.01 },
        { ductHeatGain: null },
        { ductLeakagePercent: null },
        null,
    ])('supports granular supply outlet patches and clearing: %j', (outlet) => {
        const patch = { graph: { unit: { outlet } } }

        expect(ExpandedProjectPatchSchema_v0.parse(patch)).toEqual(patch)
    })

    it('parses mode-keyed component configurations', () => {
        const parsed = EquipmentConfigSchema_v0.parse({
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

    it('parses standalone configuration and expands graph unit nodes', () => {
        const configuration = {
            energyConfiguration: {
                schedule: { warmupHours: 2, warmupMultiplier: 1.5 },
                efficiency: { heatingType: 'gasFurnace', coolingSEER: 14 },
            },
        }
        expect(EquipmentConfigSchema_v0.parse(configuration)).toEqual(
            configuration
        )
        const expand: ProjectSubcollectionKey_v0[] = ['graph', 'systems']
        expect(
            expand.every((key) => PROJECT_SUBCOLLECTION_KEYS_V0.includes(key))
        ).toBe(true)
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

    it('creates scoped unit nodes alongside their systems and zones', () => {
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
                graph: {
                    'unit-ahu-1': {
                        id: 'unit-ahu-1',
                        adjacencies: [],
                        nodeType: 'CENTRAL_UNIT',
                        systemId: 'system-1',
                        energyConfiguration: {
                            efficiency: { coolingSEER: 14 },
                        },
                    },
                    'unit-vav-1': {
                        id: 'unit-vav-1',
                        adjacencies: [],
                        nodeType: 'TERMINAL_UNIT',
                        zoneId: 'zone-1',
                    },
                },
            }).success
        ).toBe(true)
    })

    it('supports granular graph-unit configuration patches', () => {
        expect(
            ExpandedProjectPatchSchema_v0.parse({
                graph: {
                    'unit-ahu-1': {
                        componentConfigsByMode: {
                            cooling_mode: { cc: { enabled: false } },
                        },
                        energyConfiguration: { schedule: null },
                    },
                    'unit-vav-1': null,
                },
            })
        ).toMatchObject({
            graph: {
                'unit-ahu-1': {
                    componentConfigsByMode: {
                        cooling_mode: { cc: { enabled: false } },
                    },
                    energyConfiguration: { schedule: null },
                },
                'unit-vav-1': null,
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
