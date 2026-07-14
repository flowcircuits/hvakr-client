import { describe, expect, it } from 'vitest'
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
import { ExpandedProjectPatchSchema_v0 } from './expandedProject_v0'

describe('canonical v0 equipment schemas', () => {
    it('parses mode-keyed component configurations', () => {
        const parsed = EquipmentDataSchema_v0.parse({
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

    it('uses canonical system and zone equipmentConfig fields only', () => {
        expect(SystemDataSchema_v0.shape).toHaveProperty('equipmentConfig')
        expect(SystemDataSchema_v0.shape).not.toHaveProperty(
            'centralUnitConfiguration'
        )
        expect(ZoneDataSchema_v0.shape).toHaveProperty('equipmentConfig')
        expect(ZoneDataSchema_v0.shape).not.toHaveProperty(
            'terminalUnitConfiguration'
        )
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

    it('supports deep partial equipment config patches', () => {
        expect(
            ExpandedProjectPatchSchema_v0.parse({
                systems: {
                    'ahu-1': {
                        equipmentConfig: {
                            componentConfigsByMode: {
                                cooling_mode: { cc: { enabled: false } },
                            },
                        },
                    },
                },
            })
        ).toMatchObject({
            systems: {
                'ahu-1': {
                    equipmentConfig: {
                        componentConfigsByMode: {
                            cooling_mode: { cc: { enabled: false } },
                        },
                    },
                },
            },
        })
    })
})
