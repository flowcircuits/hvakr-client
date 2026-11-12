import { z } from 'zod'
import { APIExportSchema_v0 } from '../../api/exports_v0'
import {
    disableUserWrite,
    getPatchSchema,
    getStrictSchema,
    getUserWritableSchema,
} from '../../utility'
import { AnnotationDataSchema_v0 } from './annotation_v0'
import { DeadlineDataSchema_v0 } from './deadline_v0'
import { DoorTypeDataSchema_v0 } from './doorType_v0'
import { DuctTypeDataSchema_v0 } from './ductType_v0'
import { GraphSchema_v0 } from './graph_v0'
import { ProjectDataSchema_v0, ProjectPostSchema_v0 } from './project_v0'
import { RegisterTypeDataSchema_v0 } from './registerType_v0'
import { RoofTypeDataSchema_v0 } from './roofType_v0'
import { SheetFilePageDataSchema_v0 } from './sheetFilePage_v0'
import { SheetFileDataSchema_v0 } from './sheetFile_v0'
import { SheetDataSchema_v0 } from './sheet_v0'
import { SlabTypeDataSchema_v0 } from './slabType_v0'
import { SpaceTypeDataSchema_v0 } from './spaceType_v0'
import { SpaceDataSchema_v0 } from './space_v0'
import { SystemDataSchema_v0 } from './system_v0'
import { WallTypeDataSchema_v0 } from './wallType_v0'
import { WindowTypeDataSchema_v0 } from './windowType_v0'
import { ZoneDataSchema_v0 } from './zone_v0'

/** Subcollections returned by `expand`. */
export const ProjectSubcollectionsSchema_v0 = z.object({
    annotations: z.record(z.string(), AnnotationDataSchema_v0).optional(),
    deadlines: z.record(z.string(), DeadlineDataSchema_v0).optional(),
    doorTypes: z.record(z.string(), DoorTypeDataSchema_v0).optional(),
    ductTypes: z.record(z.string(), DuctTypeDataSchema_v0).optional(),
    exports: disableUserWrite(
        z.record(z.string(), APIExportSchema_v0).optional()
    ),
    graph: GraphSchema_v0.optional(),
    registerTypes: z.record(z.string(), RegisterTypeDataSchema_v0).optional(),
    roofTypes: z.record(z.string(), RoofTypeDataSchema_v0).optional(),
    sheetFilePages: z.record(z.string(), SheetFilePageDataSchema_v0).optional(),
    sheetFiles: z.record(z.string(), SheetFileDataSchema_v0).optional(),
    sheets: z.record(z.string(), SheetDataSchema_v0).optional(),
    slabTypes: z.record(z.string(), SlabTypeDataSchema_v0).optional(),
    spaceTypes: z.record(z.string(), SpaceTypeDataSchema_v0).optional(),
    spaces: z.record(z.string(), SpaceDataSchema_v0).optional(),
    systems: z.record(z.string(), SystemDataSchema_v0).optional(),
    wallTypes: z.record(z.string(), WallTypeDataSchema_v0).optional(),
    windowTypes: z.record(z.string(), WindowTypeDataSchema_v0).optional(),
    zones: z.record(z.string(), ZoneDataSchema_v0).optional(),
})

/** User-writable view derived from canonical Zod metadata. */
export const WritableProjectSubcollectionsSchema_v0 = getStrictSchema(
    getUserWritableSchema(ProjectSubcollectionsSchema_v0)
)

export type ProjectSubcollections_v0 = z.infer<
    typeof ProjectSubcollectionsSchema_v0
>

export const PROJECT_SUBCOLLECTION_KEYS_V0 = Object.keys(
    ProjectSubcollectionsSchema_v0.shape
)

export const ExpandedProjectSchema_v0 = z.object({
    ...ProjectDataSchema_v0.shape,
    ...ProjectSubcollectionsSchema_v0.shape,
})
export type ExpandedProject_v0 = z.infer<typeof ExpandedProjectSchema_v0> & {
    id: string
}

/* BEGIN API ENDPOINT SCHEMAS */

export const ProjectSubcollectionsPostSchema_v0 = getStrictSchema(
    getUserWritableSchema(
        ProjectSubcollectionsSchema_v0.omit({
            sheetFilePages: true,
            sheetFiles: true,
        })
    )
)
export type ProjectSubcollectionsPost_v0 = z.infer<
    typeof ProjectSubcollectionsPostSchema_v0
>

/** Most space or duct type template IDs one create request can import. */
export const MAX_PROJECT_SETUP_TEMPLATE_IDS_V0 = 100

/**
 * Setup jobs to run after a project is created: the same setup the HVAKR app
 * runs. Create-only; the project does not store it.
 */
export const ProjectSetupSchema_v0 = z
    .strictObject({
        czMinimumEnvelopes: z
            .boolean()
            .optional()
            .describe(
                'Import the ASHRAE 90.1 minimum envelope types for the project climate zone.'
            ),
        spaceTypeTemplateProjectIds: z
            .array(z.string().min(1))
            .max(MAX_PROJECT_SETUP_TEMPLATE_IDS_V0)
            .optional()
            .describe('Template projects whose space types to import.'),
        ductTypeTemplateIds: z
            .array(z.string().min(1))
            .max(MAX_PROJECT_SETUP_TEMPLATE_IDS_V0)
            .optional()
            .describe('Templates whose duct types to import.'),
        mapTakeoff: z
            .boolean()
            .optional()
            .describe(
                'Detect spaces from the map footprint at the project address. Imports the climate zone envelope types too.'
            ),
    })
    .describe(
        'Setup jobs to run after the project is created. The response returns their job IDs in setupJobIds.'
    )
export type ProjectSetup_v0 = z.infer<typeof ProjectSetupSchema_v0>

export const ExpandedProjectPostSchema_v0 = z.strictObject({
    ...ProjectPostSchema_v0.shape,
    ...ProjectSubcollectionsPostSchema_v0.shape,
    setup: ProjectSetupSchema_v0.optional(),
})
export type ExpandedProjectPost_v0 = z.infer<
    typeof ExpandedProjectPostSchema_v0
>

/** Response of `POST /projects`. */
export const ProjectCreateResponseSchema_v0 = z.object({
    id: z.string().describe('The new project ID.'),
    setupJobIds: z
        .object({
            czEnvelopes: z
                .string()
                .optional()
                .describe('import-cz-envelopes job.'),
            spaceTypes: z
                .string()
                .optional()
                .describe('import-space-types job.'),
            ductTypes: z.string().optional().describe('import-duct-types job.'),
            mapTakeoff: z
                .string()
                .optional()
                .describe(
                    'map-takeoff job. It waits until the envelope and space type imports complete.'
                ),
        })
        .describe(
            'Job ID of each setup job the request started. Empty when the request has no setup. Poll each with GET /projects/{id}/jobs/{jobId}.'
        ),
})
export type ProjectCreateResponse_v0 = z.infer<
    typeof ProjectCreateResponseSchema_v0
>

/** Patch schema for normal user-controlled project updates. */
export const ExpandedProjectPatchSchema_v0 = getStrictSchema(
    getPatchSchema(getUserWritableSchema(ExpandedProjectSchema_v0))
)
export type ExpandedProjectPatch_v0 = z.infer<
    typeof ExpandedProjectPatchSchema_v0
>
