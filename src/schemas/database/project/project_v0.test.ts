import { describe, expect, it } from 'vitest'
import { ExpandedProjectPatchSchema_v0 } from './expandedProject_v0'
import {
    PROJECT_PRIVATE_READ_FIELDS_V0,
    PROJECT_RESTRICTED_WRITE_FIELDS_V0,
    ProjectDataSchema_v0,
    ProjectPostSchema_v0,
    WritableProjectDataSchema_v0,
} from './project_v0'

describe('Project v0 schemas', () => {
    it('keeps private and stale fields out of the public project response shape', () => {
        for (const field of Object.keys(PROJECT_PRIVATE_READ_FIELDS_V0)) {
            expect(ProjectDataSchema_v0.shape).not.toHaveProperty(field)
        }
    })

    it('accepts both ASHRAE and NCC template sources', () => {
        expect(
            ProjectDataSchema_v0.safeParse({
                name: 'ASHRAE template',
                users: {},
                source: 'ASHRAE',
            }).success
        ).toBe(true)

        expect(
            ProjectDataSchema_v0.safeParse({
                name: 'NCC template',
                users: {},
                source: 'NCC',
            }).success
        ).toBe(true)
    })

    it('uses a restricted-field list for project writes', () => {
        for (const field of Object.keys(PROJECT_RESTRICTED_WRITE_FIELDS_V0)) {
            expect(WritableProjectDataSchema_v0.shape).not.toHaveProperty(field)
            expect(ProjectPostSchema_v0.shape).not.toHaveProperty(field)
            expect(ExpandedProjectPatchSchema_v0.shape).not.toHaveProperty(
                field
            )
        }

        expect(WritableProjectDataSchema_v0.shape).toHaveProperty(
            'airflowIncrement'
        )
        expect(WritableProjectDataSchema_v0.shape).toHaveProperty('maps')
        expect(WritableProjectDataSchema_v0.shape).toHaveProperty(
            'utilityRates'
        )
    })
})
