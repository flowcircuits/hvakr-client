import { describe, expect, it } from 'vitest'
import { ExpandedProjectPatchSchema_v0 } from './expandedProject_v0'
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
