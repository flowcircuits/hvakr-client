import { describe, expect, it } from 'vitest'
import { ExpandedProjectPostDataExample_v0 } from '../../../fixtures'
import {
    ExpandedProjectPatchSchema_v0,
    ExpandedProjectPostSchema_v0,
    PROJECT_SUBCOLLECTION_KEYS_V0,
    ProjectSubcollectionsSchema_v0,
} from './expandedProject_v0'

const page = {
    aiProcessing: {
        status: 'COMPLETE',
        results: { scale: { result: 96, confidence: 0.9 } },
    },
    createdAt: 1793158316000,
    pageNumber: 1,
    pdfUrl: 'https://example.com/page-1.pdf',
    png: { standard: { status: 'PENDING' }, thumbnail: { status: 'PENDING' } },
    scale: 96,
    sheetFileId: 'sheet-file-1',
    sheetNumber: 'A-101',
    sourceFileName: 'A-Plans.pdf',
}

describe('sheetFilePages', () => {
    it('is an expandable project subcollection', () => {
        expect(PROJECT_SUBCOLLECTION_KEYS_V0).toContain('sheetFilePages')
        expect(
            ProjectSubcollectionsSchema_v0.parse({
                sheetFilePages: { 'page-1': page },
            }).sheetFilePages
        ).toEqual({ 'page-1': page })
    })

    it('patches scale and clears customScaleInfo', () => {
        expect(
            ExpandedProjectPatchSchema_v0.parse({
                sheetFilePages: {
                    'page-1': { scale: 48, customScaleInfo: null },
                },
            })
        ).toEqual({
            sheetFilePages: { 'page-1': { scale: 48, customScaleInfo: null } },
        })
    })

    it('rejects a scale that is not positive', () => {
        for (const scale of [0, -48]) {
            expect(
                ExpandedProjectPatchSchema_v0.safeParse({
                    sheetFilePages: { 'page-1': { scale } },
                }).success
            ).toBe(false)
        }
    })

    it('rejects writes to server-owned page fields', () => {
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({
                sheetFilePages: { 'page-1': { pageNumber: 2 } },
            }).success
        ).toBe(false)
        for (const field of [
            'aiProcessing',
            'autoTakeoff',
            'markdown',
            'sheetFileId',
        ]) {
            expect(
                ExpandedProjectPatchSchema_v0.safeParse({
                    sheetFilePages: { 'page-1': { [field]: 'x' } },
                }).success
            ).toBe(false)
        }
    })

    it('cannot be posted with a new project', () => {
        expect(
            ExpandedProjectPostSchema_v0.safeParse({
                ...ExpandedProjectPostDataExample_v0,
                sheetFilePages: {},
            }).success
        ).toBe(false)
    })
})
