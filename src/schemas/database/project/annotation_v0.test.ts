import { describe, expect, it } from 'vitest'
import {
    AnnotationDataSchema_v0,
    type AnnotationData_v0,
    ExpandedProjectPatchSchema_v0,
    ExpandedProjectPostSchema_v0,
    ExpandedProjectSchema_v0,
    PROJECT_SUBCOLLECTION_KEYS_V0,
    ProjectSubcollectionsSchema_v0,
} from '../../../index'
import { ExpandedProjectPostDataExample_v0 } from '../../../fixtures'

const annotation: AnnotationData_v0 = {
    x: 100,
    y: 200,
    text: 'Verify diffuser location',
    author: 'engineer@example.com',
    createdAt: 1_700_000_000_000,
    level: 1,
}

const styledAnnotation: AnnotationData_v0 = {
    ...annotation,
    arrowX: 50,
    arrowY: 75,
    width: 240,
    color: '#ff0000',
    size: 'large',
    align: 'center',
    shape: 'cloud',
}

describe('annotation v0 contract', () => {
    it('accepts a text annotation without an arrow or style overrides', () => {
        expect(AnnotationDataSchema_v0.parse(annotation)).toEqual(annotation)
    })

    it('preserves style fields on expanded project reads and creates', () => {
        const annotations = { 'note-1': styledAnnotation }

        expect(PROJECT_SUBCOLLECTION_KEYS_V0).toContain('annotations')
        expect(
            ProjectSubcollectionsSchema_v0.parse({ annotations }).annotations
        ).toEqual(annotations)
        expect(
            ExpandedProjectSchema_v0.parse({
                ...ExpandedProjectPostDataExample_v0,
                users: {},
                annotations,
            }).annotations
        ).toEqual(annotations)
        expect(
            ExpandedProjectPostSchema_v0.parse({ annotations }).annotations
        ).toEqual(annotations)
    })

    it('accepts partial annotation updates and null deletions', () => {
        const patch = {
            annotations: {
                'note-1': { text: 'Updated note', size: 'small', width: null },
                'note-2': null,
            },
        }

        expect(ExpandedProjectPatchSchema_v0.parse(patch)).toEqual(patch)
    })

    it.each([0, -10])('rejects nonpositive width %s on writes', (width) => {
        expect(
            ExpandedProjectPostSchema_v0.safeParse({
                annotations: { 'note-1': { ...annotation, width } },
            }).success
        ).toBe(false)
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({
                annotations: { 'note-1': { width } },
            }).success
        ).toBe(false)
    })

    it.each([
        { size: 'extra-large' },
        { align: 'justify' },
        { shape: 'circle' },
    ])('rejects unsupported styles %j on writes', (style) => {
        expect(
            ExpandedProjectPostSchema_v0.safeParse({
                annotations: { 'note-1': { ...annotation, ...style } },
            }).success
        ).toBe(false)
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({
                annotations: { 'note-1': style },
            }).success
        ).toBe(false)
    })
})
