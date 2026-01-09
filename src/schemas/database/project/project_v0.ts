import { z } from 'zod'
import { PointSchema, RectSchema, DisplayUnitSystemIdSchema } from '../../misc'
import { FlowTypeSchema_v0 } from '../../outputs/misc_v0'
import {
    CoolingPercentSchema_v0,
    HeatingPercentSchema_v0,
} from '../weatherStation'
import * as DrySide_v0 from './graph_v0'

export const WeatherSpecSchema_v0 = z.object({
    coolDb: z.number().optional(),
    coolPercent: CoolingPercentSchema_v0.optional(),
    coolWb: z.number().optional(),
    heatDb: z.number().optional(),
    heatPercent: HeatingPercentSchema_v0.optional(),
    loading: z.boolean().optional(),
    nearestWeatherStationIds: z.array(z.string()).optional(),
    selectedStationId: z.string().optional(),
})

export const MapTypeSchema_v0 = z.enum(['roadmap', 'satellite', 'hybrid'])

export const MapSpecSchema_v0 = z.object({
    active: z.boolean().optional(),
    cropBox: RectSchema.optional(),
    locked: z.boolean().optional(),
    type: MapTypeSchema_v0.optional(),
    x: z.number().optional(),
    xOffset: z.number().optional(),
    y: z.number().optional(),
    yOffset: z.number().optional(),
    zoom: z.number().optional(),
})

export const ConstraintSchema_v0 = z.object({
    description: z.string().optional(),
    name: z.string().optional(),
    timestamp: z.number(),
})

export const ContactSchema_v0 = z.object({
    address: z.string().optional(),
    company: z.string().optional(),
    email: z.string().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    role: z.string().optional(),
    timestamp: z.number(),
    trade: z.string().optional(),
})

export const StandardSchema_v0 = z.object({
    description: z.string().optional(),
    name: z.string().optional(),
    timestamp: z.number(),
})

export const BuildingDataSchema_v0 = z.object({
    area: z.number().optional(),
    ashraeBuildingTypeId: z.string().optional(),
    description: z.string().optional(),
    name: z.string().optional(),
    occupancy: z.number().optional(),
    planRotation: z.number().optional(),
    stories: z.number().optional(),
})

export const DuctSizingDataSchema_v0 = z.object({
    ductSizes: z.record(z.string(), DrySide_v0.DuctSizeSchema_v0).optional(),
    ductSizingHash: z.string().optional(),
})

const FITTING_TYPES = {
    ELBOW: 'ELBOW',
    WYE: 'WYE',
    TRANSITION: 'TRANSITION',
} as const

export const ElbowDataSchema_v0 = z.object({
    fittingType: z.literal(FITTING_TYPES.ELBOW),
    lossCoefficient: z.number().optional(),
})

const TRANSITION_TYPES = {
    EXPANSION: 'EXPANSION',
    REDUCTION: 'REDUCTION',
} as const

export const TransitionDataSchema_v0 = z.object({
    fittingType: z.literal(FITTING_TYPES.TRANSITION),
    lossCoefficient: z.number().optional(),
    transitionType: z.enum(Object.values(TRANSITION_TYPES)),
})

const WYE_TYPES = { DIVERGENT: 'DIVERGENT', CONVERGENT: 'CONVERGENT' } as const

export const WyeDataSchema_v0 = z.object({
    branchLossCoefficient: z.number().optional(),
    fittingType: z.literal(FITTING_TYPES.WYE),
    mainLossCoefficient: z.number().optional(),
    wyeType: z.enum(Object.values(WYE_TYPES)),
})

export const FittingsConfigSchema_v0 = z.object({
    CONVERGENT_WYE: WyeDataSchema_v0.omit({
        fittingType: true,
        wyeType: true,
    }).optional(),
    DIVERGENT_WYE: WyeDataSchema_v0.omit({
        fittingType: true,
        wyeType: true,
    }).optional(),
    ELBOW: ElbowDataSchema_v0.omit({ fittingType: true }).optional(),
    EXPANSION_TRANSITION: TransitionDataSchema_v0.omit({
        fittingType: true,
        transitionType: true,
    }).optional(),
    REDUCTION_TRANSITION: TransitionDataSchema_v0.omit({
        fittingType: true,
        transitionType: true,
    }).optional(),
})

export const DrySideDataSchema_v0 = z.object({
    fittings: FittingsConfigSchema_v0.optional(),
    flowColors: z.partialRecord(FlowTypeSchema_v0, z.string()).optional(),
    sizingData: DuctSizingDataSchema_v0.optional(),
})

export const RevisionSchema_v0 = z.object({
    description: z.string().optional(),
    id: z.string(),
    log: z.string().optional(),
    savedBy: z.string(),
    timestamp: z.number(),
})

const VentilationStandards_v0 = {
    ASHRAE_2022: 'ASHRAE 62.1 / 170 (2022)',
    ASHRAE_2025: 'ASHRAE 62.1 / 170 (2025)',
} as const
export const VentilationStandardSchema_v0 = z.enum(
    Object.values(VentilationStandards_v0)
)

export const ProjectUserRoles_v0 = {
    NONE: 0,
    VIEWER: 1,
    MEMBER: 4,
    ADMIN: 8,
    OWNER: 10,
} as const
export const ProjectUserRoleSchema_v0 = z.union(
    Object.values(ProjectUserRoles_v0).map((role) => z.literal(role))
)

export const ProjectUserDataSchema_v0 = z.object({
    active: z.boolean().optional(),
    firstName: z.string().optional(),
    lastActive: z.number().optional(),
    lastName: z.string().optional(),
    pendingSignUp: z.boolean().optional(),
    profilePicture: z.string().optional(),
    role: ProjectUserRoleSchema_v0,
})

export const ProjectTypes_v0 = {
    residential: 'residential',
    commercial: 'commercial',
} as const
export const ProjectTypeSchema_v0 = z.enum(Object.values(ProjectTypes_v0))

export const ComputedProjectDataSchema_v0 = z.object({
    _owner: z.string().optional(),
    _userEmails: z.array(z.string()).optional(),
})

export const ProjectDataSchema_v0 = z.object({
    ...ComputedProjectDataSchema_v0.shape,
    address: z.string().optional(),
    apiCreated: z.boolean().optional(),
    building: BuildingDataSchema_v0.optional(),
    constraints: z.record(z.string(), ConstraintSchema_v0).optional(),
    constructionType: z.enum(['New', 'Retrofit']).optional(),
    contacts: z.record(z.string(), ContactSchema_v0).optional(),
    description: z.string().optional(),
    drySide: DrySideDataSchema_v0.optional(),
    duplicatedFrom: z.string().optional(),
    elevation: z.number().optional(),
    fromExample: z.string().optional(),
    isArchived: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
    isExample: z.boolean().optional(),
    isHVAKRTemplate: z.boolean().optional(),
    isTemplate: z.boolean().optional(),
    lastOpenTime: z.number().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    mapSpec: MapSpecSchema_v0.optional(),
    name: z.string(),
    number: z.string().optional(),
    pictureThumbnailURL: z.string().optional(),
    pictureURL: z.string().optional(),
    pictureVerticalPosition: z.number().optional(),
    projectType: ProjectTypeSchema_v0.optional(),
    revision: z.string().optional(),
    revisions: z.record(z.string(), RevisionSchema_v0).optional(),
    sheetMarkers: z.record(z.string(), PointSchema).optional(),
    standards: z.record(z.string(), StandardSchema_v0).optional(),
    timestamp: z.number().optional(),
    unitSystem: DisplayUnitSystemIdSchema.optional(),
    users: z.record(z.string(), ProjectUserDataSchema_v0),
    ventilationStandard: VentilationStandardSchema_v0.optional(),
    weatherSpec: WeatherSpecSchema_v0.optional(),
    yearBuilt: z.string().optional(),
})
export type ProjectData_v0 = z.infer<typeof ProjectDataSchema_v0>

export interface Project_v0 extends ProjectData_v0 {
    id: string
}

/* BEGIN API ENDPOINT SCHEMAS */

export const ProjectPostSchema_v0 = z.object({
    ...ProjectDataSchema_v0.shape,
    /** Optional because the project can be created with a default name */
    name: z.string().optional(),
    /** Optional because the project can be created with default users */
    users: z.record(z.string(), ProjectUserDataSchema_v0).optional(),
})
export type ProjectPost_v0 = z.infer<typeof ProjectPostSchema_v0>
