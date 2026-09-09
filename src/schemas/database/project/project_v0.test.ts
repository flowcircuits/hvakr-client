import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ExpandedProjectPostDataExample_v0 } from '../../../fixtures'
import {
    ExpandedProjectPatchSchema_v0,
    ExpandedProjectPostSchema_v0,
    WritableProjectSubcollectionsSchema_v0,
} from './expandedProject_v0'
import {
    DEFAULT_EQUIPMENT_MODES_v0,
    BuildingDataSchema_v0,
    PROJECT_PRIVATE_READ_FIELDS_V0,
    PROJECT_RESTRICTED_WRITE_FIELDS_V0,
    ProjectDataSchema_v0,
    ProjectPostSchema_v0,
    WritableProjectDataSchema_v0,
} from './project_v0'
import { SpaceAirflowRequirementsSchema_v0 } from './space_v0'
import { SpaceTypeDataSchema_v0 } from './spaceType_v0'
import { WindowTypeDataSchema_v0 } from './windowType_v0'

describe('Project v0 schemas', () => {
    it('removes the unused building stories field', () => {
        expect(BuildingDataSchema_v0.shape).not.toHaveProperty('stories')
        expect(BuildingDataSchema_v0.parse({ area: 3000, stories: 2 })).toEqual(
            { area: 3000 }
        )
    })

    it('exposes every canonical project field on reads', () => {
        expect(PROJECT_PRIVATE_READ_FIELDS_V0).toEqual({})
        expect(Object.keys(ProjectDataSchema_v0.shape)).toEqual([
            '_owner',
            '_userEmails',
            '_userIds',
            '_nameLowercase',
            'address',
            'organizationId',
            'airflowIncrement',
            'analytics',
            'annotations',
            'apiCreated',
            'automations',
            'building',
            'climateZone',
            'constraints',
            'constructionType',
            'contacts',
            'description',
            'drySide',
            'duplicatedFrom',
            'elevation',
            'equipmentModes',
            'fromExample',
            'iaqpOutdoorAirMerv',
            'isDeleted',
            'isExample',
            'isHealthcare',
            'isOpen',
            'lastOpenTime',
            'latitude',
            'levels',
            'longitude',
            'maps',
            'metadata',
            'name',
            'number',
            'outdoorContaminants',
            'outsideAirSpec',
            'pictureThumbnailURL',
            'pictureURL',
            'pictureVerticalPosition',
            'presentMode',
            'projectType',
            'revision',
            'revisions',
            'sheetMarkers',
            'slackChannelId',
            'spaceTypeAutoAssignment',
            'standards',
            'status',
            'suggestedSpaces',
            'takeoffModel',
            'createdAt',
            'unitSystem',
            'users',
            'utilityRates',
            'ventilationStandard',
            'weatherSpec',
            'yearBuilt',
        ])
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
                metadata: {
                    internalProjectId: 'project-123',
                    syncVersion: 2,
                    imported: true,
                },
            }).success
        ).toBe(true)
    })

    it('derives project write restrictions from schema metadata', () => {
        type RestrictedField = keyof typeof PROJECT_RESTRICTED_WRITE_FIELDS_V0
        const includesWritableField: 'name' extends RestrictedField
            ? true
            : false = false
        const includesRestrictedField: 'latitude' extends RestrictedField
            ? true
            : false = true
        expect(includesWritableField).toBe(false)
        expect(includesRestrictedField).toBe(true)

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

    it('accepts flat user-writable project metadata', () => {
        const metadata = {
            internalProjectId: 'project-123',
            syncVersion: 2,
            imported: true,
        }

        expect(ProjectPostSchema_v0.safeParse({ metadata }).success).toBe(true)
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({
                metadata: { ...metadata, obsoleteKey: null },
            }).success
        ).toBe(true)
        expect(WritableProjectDataSchema_v0.shape).toHaveProperty('metadata')
        expect(
            ProjectPostSchema_v0.safeParse({
                metadata: { nested: { id: 'project-123' } },
            }).success
        ).toBe(false)
        expect(
            ProjectPostSchema_v0.safeParse({ metadata: { tags: ['linked'] } })
                .success
        ).toBe(false)
        expect(
            ProjectPostSchema_v0.safeParse({ metadata: { '': 'value' } })
                .success
        ).toBe(false)
    })

    it('applies write restrictions recursively', () => {
        type WritableSubcollections = z.input<
            typeof WritableProjectSubcollectionsSchema_v0
        >
        const includesExports: 'exports' extends keyof WritableSubcollections
            ? true
            : false = false
        expect(includesExports).toBe(false)

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
                exports: { export: { name: 'Loads' } },
            }).success
        ).toBe(false)
        expect(
            ExpandedProjectPostSchema_v0.safeParse({
                ...ExpandedProjectPostDataExample_v0,
                sheetFiles: {},
            }).success
        ).toBe(false)
        expect(
            ExpandedProjectPostSchema_v0.safeParse({
                graph: {
                    node: {
                        adjacencies: [],
                        extra: true,
                        id: 'node-1',
                        level: 1,
                        nodeType: 'FITTING',
                        point: { x: 0, y: 0 },
                    },
                },
            }).success
        ).toBe(false)
        expect(
            ProjectPostSchema_v0.safeParse({
                equipmentModes: {
                    ...DEFAULT_EQUIPMENT_MODES_v0,
                    cooling_mode: {
                        ...DEFAULT_EQUIPMENT_MODES_v0.cooling_mode,
                        extra: true,
                    },
                },
            }).success
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

describe('Perimeter infiltration requirement fields', () => {
    it('keeps perimeter infiltration requirements on space types', () => {
        expect(
            SpaceTypeDataSchema_v0.parse({
                name: 'Reception areas',
                infiltrationPerimeterReq: 0.4,
                infiltrationUseSeparateWinterReqs: true,
                infiltrationWinterPerimeterReq: 0.6,
            })
        ).toMatchObject({
            infiltrationPerimeterReq: 0.4,
            infiltrationWinterPerimeterReq: 0.6,
        })
    })

    it('keeps perimeter infiltration requirements on window types', () => {
        expect(
            WindowTypeDataSchema_v0.parse({
                name: 'Operable Window',
                infiltrationPerimeterReq: 0.37,
                infiltrationUseSeparateWinterReqs: true,
                infiltrationWinterPerimeterReq: 0.55,
            })
        ).toMatchObject({
            infiltrationPerimeterReq: 0.37,
            infiltrationWinterPerimeterReq: 0.55,
        })
    })

    it('keeps the perimeter infiltration requirement on space airflows', () => {
        expect(
            SpaceAirflowRequirementsSchema_v0.parse({
                infiltrationPerimeterReq: 0.25,
                infiltrationReqMethod: 'PERIMETER',
            })
        ).toMatchObject({
            infiltrationPerimeterReq: 0.25,
            infiltrationReqMethod: 'PERIMETER',
        })
    })

    it('accepts perimeter infiltration requirements on strict writes', () => {
        expect(
            ExpandedProjectPatchSchema_v0.safeParse({
                spaceTypes: {
                    'space-type-1': { infiltrationPerimeterReq: 0.4 },
                },
                windowTypes: {
                    'window-type-1': { infiltrationWinterPerimeterReq: 0.55 },
                },
                spaces: {
                    'space-1': {
                        airflowRequirementsByLoadCondition: {
                            HEATING: {
                                infiltrationPerimeterReq: 0.25,
                                infiltrationReqMethod: 'PERIMETER',
                            },
                        },
                    },
                },
            }).success
        ).toBe(true)
    })
})
