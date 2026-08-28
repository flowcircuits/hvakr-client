import { describe, expect, it } from 'vitest'
import {
    MINIMUM_SPACE_EDGE_COUNT_V0,
    SpaceDataSchema_v0,
    type Edge_v0,
} from './space_v0'
import {
    ExpandedProjectPatchSchema_v0,
    ProjectSubcollectionsPostSchema_v0,
} from './expandedProject_v0'

const edge = (index: number): Edge_v0 => ({
    index,
    x1: 0,
    y1: 0,
    x2: index,
    y2: index,
})

const space = (edgeCount: number) => ({
    creationSource: 'API' as const,
    level: 0,
    edges: Object.fromEntries(
        Array.from({ length: edgeCount }, (_, i) => [`edge-${i}`, edge(i)])
    ),
})

describe('SpaceDataSchema_v0 edges', () => {
    it('accepts a space with the minimum edge count', () => {
        expect(
            SpaceDataSchema_v0.safeParse(space(MINIMUM_SPACE_EDGE_COUNT_V0))
                .success
        ).toBe(true)
    })

    it('rejects a space with fewer than the minimum edges', () => {
        expect(
            SpaceDataSchema_v0.safeParse(space(MINIMUM_SPACE_EDGE_COUNT_V0 - 1))
                .success
        ).toBe(false)
    })
})

describe('space edge invariant on the write path', () => {
    it('rejects created spaces with too few edges', () => {
        expect(
            ProjectSubcollectionsPostSchema_v0.safeParse({
                spaces: { s1: space(MINIMUM_SPACE_EDGE_COUNT_V0 - 1) },
            }).success
        ).toBe(false)
        expect(
            ProjectSubcollectionsPostSchema_v0.safeParse({
                spaces: { s1: space(MINIMUM_SPACE_EDGE_COUNT_V0) },
            }).success
        ).toBe(true)
    })

    it('still allows partial edge patches', () => {
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({
                spaces: { s1: { edges: { 'edge-0': edge(0) } } },
            }).success
        ).toBe(true)
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({
                spaces: { s1: { edges: { 'edge-0': null } } },
            }).success
        ).toBe(true)
    })
})
