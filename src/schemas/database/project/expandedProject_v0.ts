import { z } from 'zod'
import { getPatchSchema } from '../../utility'
import { BranchTypeDataSchema_v0 } from './branchType_v0'
import { DeadlineDataSchema_v0 } from './deadline_v0'
import { DoorTypeDataSchema_v0 } from './doorType_v0'
import { DuctTypeDataSchema_v0 } from './ductType_v0'
import { GraphSchema_v0 } from './graph_v0'
import { PipeTypeDataSchema_v0 } from './pipeType_v0'
import { ProjectDataSchema_v0, ProjectPostSchema_v0 } from './project_v0'
import { RegisterTypeDataSchema_v0 } from './registerType_v0'
import { ReportDataSchema_v0 } from './report_v0'
import { RoofTypeDataSchema_v0 } from './roofType_v0'
import { SheetFileDataSchema_v0 } from './sheetFile_v0'
import { SheetDataSchema_v0 } from './sheet_v0'
import { SlabTypeDataSchema_v0 } from './slabType_v0'
import { SpaceTypeDataSchema_v0 } from './spaceType_v0'
import { SpaceDataSchema_v0 } from './space_v0'
import { SystemDataSchema_v0 } from './system_v0'
import { WallTypeDataSchema_v0 } from './wallType_v0'
import { WindowTypeDataSchema_v0 } from './windowType_v0'
import { ZoneDataSchema_v0 } from './zone_v0'

export const ProjectSubcollectionsSchema_v0 = z.object({
    branchTypes: z.record(z.string(), BranchTypeDataSchema_v0).optional(),
    deadlines: z.record(z.string(), DeadlineDataSchema_v0).optional(),
    doorTypes: z.record(z.string(), DoorTypeDataSchema_v0).optional(),
    ductTypes: z.record(z.string(), DuctTypeDataSchema_v0).optional(),
    graph: GraphSchema_v0.optional(),
    pipeTypes: z.record(z.string(), PipeTypeDataSchema_v0).optional(),
    registerTypes: z.record(z.string(), RegisterTypeDataSchema_v0).optional(),
    reports: z.record(z.string(), ReportDataSchema_v0).optional(),
    roofTypes: z.record(z.string(), RoofTypeDataSchema_v0).optional(),
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

export const ProjectSubcollectionsPostSchema_v0 = z.object({
    ...ProjectSubcollectionsSchema_v0.shape,
})
export type ProjectSubcollectionsPost_v0 = z.infer<
    typeof ProjectSubcollectionsPostSchema_v0
>

export const ExpandedProjectPostSchema_v0 = z.object({
    ...ProjectPostSchema_v0.shape,
    ...ProjectSubcollectionsPostSchema_v0.shape,
})
export type ExpandedProjectPost_v0 = z.infer<
    typeof ExpandedProjectPostSchema_v0
>

export const ExpandedProjectPatchSchema_v0 = getPatchSchema(
    ExpandedProjectSchema_v0
)
export type ExpandedProjectPatch_v0 = z.infer<
    typeof ExpandedProjectPatchSchema_v0
>
