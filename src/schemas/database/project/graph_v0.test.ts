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
