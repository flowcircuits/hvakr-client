import { describe, expect, it } from 'vitest'
import type { SpaceData_v0 } from './space_v0'
import { SpaceDataSchema_v0 } from './space_v0'

describe('Space v0 schemas', () => {
    const baseSpace = { creationSource: 'API', level: 1 } as const

    it('parses a canonical space with edges', () => {
        const parsed = SpaceDataSchema_v0.safeParse({
            ...baseSpace,
            edges: { edge1: { index: 0, x1: 0, y1: 0, x2: 120, y2: 0 } },
        })
        expect(parsed.success).toBe(true)
        expect(parsed.data?.edges?.edge1?.index).toBe(0)
    })

    it('tolerates a space document that omits edges', () => {
        // Legacy/seeded documents can predate the `edges` field. The read
        // schema must accept them instead of hard-failing at the data boundary.
        const parsed = SpaceDataSchema_v0.safeParse(baseSpace)
        expect(parsed.success).toBe(true)
        expect(parsed.data?.edges).toBeUndefined()
    })

    it('keeps `edges` optional in the inferred type', () => {
        // Guards against silently re-tightening the field: consumers must treat
        // `space.edges` as possibly-absent (e.g. `Object.values(edges ?? {})`).
        const space: SpaceData_v0 = { creationSource: 'API', level: 1 }
        const edges: SpaceData_v0['edges'] = space.edges
        expect(edges).toBeUndefined()
    })
})
