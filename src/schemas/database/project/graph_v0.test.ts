import { describe, expect, it } from 'vitest'
import {
    ExpandedProjectPatchSchema_v0,
    ExpandedProjectPostSchema_v0,
} from './expandedProject_v0'
import { GraphSchema_v0 } from './graph_v0'

describe('air cleaner v0 contract', () => {
    const airCleaner = {
        adjacencies: [],
        id: 'ac-1',
        level: 1,
        nodeType: 'AIR_CLEANER',
        point: { x: 36, y: 74 },
        productId: 'product-1',
        tag: 'AC-1',
        cleaningAirflow: 300,
        filterLocation: 'IN_SPACE',
        filterEfficiencies: { PM2_5: 0.9 },
    }

    it('preserves tags and IAQP settings on reads', () => {
        expect(GraphSchema_v0.parse({ ac: airCleaner })).toEqual({
            ac: airCleaner,
        })
    })

    it('accepts setting and clearing tags and IAQP settings in patches', () => {
        const settings = {
            tag: 'AC-2',
            cleaningAirflow: 400,
            filterLocation: 'IN_SPACE',
            filterEfficiencies: { PM2_5: 0.8 },
        }
        const graph = { ac: settings }
        expect(ExpandedProjectPatchSchema_v0.parse({ graph })).toEqual({
            graph,
        })

        const clearedGraph = {
            ac: {
                tag: null,
                cleaningAirflow: null,
                filterLocation: null,
                filterEfficiencies: null,
            },
        }
        expect(
            ExpandedProjectPatchSchema_v0.parse({ graph: clearedGraph })
        ).toEqual({ graph: clearedGraph })
    })
})

describe('equipment and register node size and product link', () => {
    const coordinates = { adjacencies: [], level: 1, point: { x: 0, y: 0 } }
    const register = {
        ...coordinates,
        id: 'reg',
        nodeType: 'REGISTER',
        flowType: 'SUPPLY',
        placementType: 'CEILING',
    }
    const graph = {
        cu: {
            ...coordinates,
            id: 'cu',
            nodeType: 'CENTRAL_UNIT',
            systemId: 'system-1',
            productId: 'product-rtu',
            width: 144,
            height: 72,
        },
        tu: {
            ...coordinates,
            id: 'tu',
            nodeType: 'TERMINAL_UNIT',
            zoneId: 'zone-1',
            productId: 'product-vav',
            width: 40,
            height: 16,
        },
        reg: {
            ...register,
            productId: 'product-grille',
            width: 24,
            height: 12,
        },
    }

    it('preserves flat width, height, and productId on reads', () => {
        expect(GraphSchema_v0.parse(graph)).toEqual(graph)
    })

    it('accepts nodes without width or height', () => {
        expect(GraphSchema_v0.safeParse({ reg: register }).success).toBe(true)
    })
})

describe('unit-node equipment and placement', () => {
    const units = [
        { nodeType: 'CENTRAL_UNIT', systemId: 'system-1' },
        { nodeType: 'TERMINAL_UNIT', zoneId: 'zone-1' },
    ]
    const configuration = {
        components: [{ id: 'coil', type: 'COOLING_COIL' }],
        componentConfigsByMode: {
            cooling_mode: {
                coil: {
                    enabled: true,
                    configuration: {
                        componentType: 'COOLING_COIL',
                        targetTemperature: 55,
                    },
                },
            },
        },
        pressureLoss: 0.2,
        miscInefficiencies: 0.01,
        outlet: { ductHeatGain: 2, ductLeakagePercent: 0.01 },
        energyConfiguration: { efficiency: { coolingSEER: 14 } },
        cost: 1200,
        selections: { heater: { productId: 'heater-1', quantity: 2 } },
        productId: 'unit-1',
        width: 40,
        height: 16,
    }

    it.each(units)(
        'preserves configuration on placed and unplaced $nodeType nodes',
        (unit) => {
            const node = {
                ...unit,
                id: 'unit',
                adjacencies: [],
                ...configuration,
            }
            for (const placement of [{}, { level: 1, point: { x: 0, y: 0 } }]) {
                const graph = { unit: { ...node, ...placement } }
                expect(GraphSchema_v0.parse(graph)).toEqual(graph)
                expect(ExpandedProjectPostSchema_v0.parse({ graph })).toEqual({
                    graph,
                })
            }
        }
    )

    it.each(units)(
        'requires paired coordinates and nonnegative cost for $nodeType',
        (unit) => {
            const node = { ...unit, id: 'unit', adjacencies: [] }
            for (const invalid of [
                { level: 1 },
                { point: { x: 0, y: 0 } },
                { cost: -1 },
            ]) {
                expect(
                    ExpandedProjectPostSchema_v0.safeParse({
                        graph: { unit: { ...node, ...invalid } },
                    }).success
                ).toBe(false)
            }
        }
    )

    it('requires placement for non-unit nodes', () => {
        for (const nodeType of [
            'FITTING',
            'AIR_CLEANER',
            'PUMP',
            'VALVE',
            'TERMINAL_EQUIPMENT',
        ]) {
            const node = { nodeType, id: 'node', adjacencies: [] }
            expect(
                GraphSchema_v0.parse({
                    node: { ...node, level: 1, point: { x: 0, y: 0 } },
                })
            ).toHaveProperty('node.level', 1)
            expect(GraphSchema_v0.safeParse({ node }).success).toBe(false)
        }
    })

    it.each(units)(
        'unplaces a $nodeType while preserving its configuration in the patch',
        (unit) => {
            const graph = {
                unit: {
                    ...unit,
                    level: null,
                    point: null,
                    adjacencies: [],
                    ...configuration,
                },
            }
            expect(ExpandedProjectPatchSchema_v0.parse({ graph })).toEqual({
                graph,
            })
        }
    )

    it('supports granular node configuration patches and clearing optional fields', () => {
        const graph = {
            unit: {
                componentConfigsByMode: {
                    cooling_mode: { coil: { enabled: false } },
                },
                energyConfiguration: { schedule: null },
                outlet: { ductHeatGain: null },
                cost: null,
            },
        }
        expect(ExpandedProjectPatchSchema_v0.parse({ graph })).toEqual({
            graph,
        })
    })
})
