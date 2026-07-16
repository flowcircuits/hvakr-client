import { describe, expect, it } from 'vitest'
import { ExpandedProjectPostDataExample_v0 } from '../../../fixtures'
import {
    ExpandedProjectPatchSchema_v0,
    ExpandedProjectPostSchema_v0,
} from './expandedProject_v0'
import {
    DEFAULT_EQUIPMENT_MODES_v0,
    PROJECT_PRIVATE_READ_FIELDS_V0,
    PROJECT_RESTRICTED_WRITE_FIELDS_V0,
    ProjectDataSchema_v0,
    ProjectPostSchema_v0,
    WritableProjectDataSchema_v0,
} from './project_v0'

describe('Project v0 schemas', () => {
    it('exposes every canonical project field on reads', () => {
        expect(PROJECT_PRIVATE_READ_FIELDS_V0).toEqual({})
        expect(
            ProjectDataSchema_v0.safeParse({
                equipmentModes: DEFAULT_EQUIPMENT_MODES_v0,
                name: 'Canonical read',
                users: {},
                _owner: 'owner@example.com',
                _userEmails: ['owner@example.com'],
                _userIds: ['user-1'],
                _nameLowercase: 'canonical read',
                organizationId: 'organization-1',
                analytics: { updatedAt: 1 },
                automations: { importSpaceTypes: { status: 'requested' } },
                elevation: 100,
                iaqpOutdoorAirMerv: 11,
                latitude: 40,
                longitude: -75,
                isDeleted: false,
                pendingPayment: false,
            }).success
        ).toBe(true)
    })

    it('accepts both ASHRAE and NCC template sources', () => {
        expect(
            ProjectDataSchema_v0.safeParse({
                equipmentModes: DEFAULT_EQUIPMENT_MODES_v0,
                name: 'ASHRAE template',
                users: {},
                source: 'ASHRAE',
            }).success
        ).toBe(true)

        expect(
            ProjectDataSchema_v0.safeParse({
                equipmentModes: DEFAULT_EQUIPMENT_MODES_v0,
                name: 'NCC template',
                users: {},
                source: 'NCC',
            }).success
        ).toBe(true)
    })

    it('derives project write restrictions from schema metadata', () => {
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
        expect(ProjectDataSchema_v0.shape.latitude.meta()).toMatchObject({
            disableUserWrite: true,
        })
    })

    it('applies write restrictions recursively', () => {
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({ latitude: 40 }).success
        ).toBe(false)
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({
                weatherSpec: { loading: true },
            }).success
        ).toBe(false)
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({
                spaces: { space: { processed: true } },
            }).success
        ).toBe(false)
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({
                spaces: { space: { ceilingHeight: 120 } },
            }).success
        ).toBe(true)
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({
                sheetFiles: { sheet: { name: 'Basement Plan' } },
            }).success
        ).toBe(true)
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({
                sheetFiles: { sheet: { url: 'file:///plan.pdf' } },
            }).success
        ).toBe(false)
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({
                reports: { report: { name: 'Loads' } },
            }).success
        ).toBe(false)
        expect(
            ExpandedProjectPostSchema_v0.safeParse({ sheetFiles: {} }).success
        ).toBe(false)
    })

    it('requires equipment modes on reads and defaults them on create', () => {
        expect(
            ProjectDataSchema_v0.safeParse({ name: 'Missing modes', users: {} })
                .success
        ).toBe(false)
        expect(
            ProjectPostSchema_v0.safeParse({ name: 'Default modes' }).success
        ).toBe(true)
        expect(
            ProjectDataSchema_v0.safeParse({
                equipmentModes: DEFAULT_EQUIPMENT_MODES_v0,
                name: 'Canonical modes',
                users: {},
            }).success
        ).toBe(true)
    })

    it('keeps the expanded project example valid under the canonical contract', () => {
        expect(
            ExpandedProjectPostSchema_v0.safeParse(
                ExpandedProjectPostDataExample_v0
            ).success
        ).toBe(true)
    })
})
