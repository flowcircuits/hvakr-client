import { z } from 'zod'
import {
    PointSchema,
    DisplayUnitSystemIdSchema,
    LoadConditions_v0,
} from '../../misc'
import {
    CoolingPercentSchema_v0,
    HeatingPercentSchema_v0,
} from '../weatherStation'
import {
    disableUserWrite,
    getStrictSchema,
    getUserWritableSchema,
    type UserWriteDisabledKeys,
} from '../../utility'
import * as Graph_v0 from './graph_v0'
import { ModeIdSchema_v0, ModeSchema_v0 } from './equipment_v0'
import { SpaceDataSchema_v0 } from './space_v0'

export const WeatherSpecSchema_v0 = z.object({
    coolDb: z.number().optional(),
    coolPercent: CoolingPercentSchema_v0.optional(),
    coolWb: z.number().optional(),
    heatDb: z.number().optional(),
    heatPercent: HeatingPercentSchema_v0.optional(),
    loading: disableUserWrite(z.boolean().optional()),
    nearestWeatherStationIds: disableUserWrite(z.array(z.string()).optional()),
    selectedStationId: z.string().optional(),
})

export const MapTypeSchema_v0 = z.enum(['roadmap', 'satellite', 'hybrid'])

export const MapDataSchema_v0 = z.object({
    isLocked: z.boolean().optional(),
    type: MapTypeSchema_v0.optional(),
    x: z.number().optional(),
    xOffset: z.number().optional(),
    y: z.number().optional(),
    yOffset: z.number().optional(),
    zoom: z.number().optional(),
})

/** JSON-safe primitive values stored as user-defined project metadata. */
export const ProjectMetadataValueSchema_v0 = z.union([
    z.string(),
    z.number(),
    z.boolean(),
])
export type ProjectMetadataValue_v0 = z.infer<
    typeof ProjectMetadataValueSchema_v0
>

/** Flat user-defined data for linking a project to external systems. */
export const ProjectMetadataSchema_v0 = z.record(
    z.string().min(1),
    ProjectMetadataValueSchema_v0
)
export type ProjectMetadata_v0 = z.infer<typeof ProjectMetadataSchema_v0>

export const LevelDataSchema_v0 = z.object({
    relativeElevation: z
        .number()
        .optional()
        .describe(
            'Distance from the floor of the level below to the floor of this level, in inches. The lowest level sits at the project datum and has no relative elevation.'
        ),
})

export const OutsideAirSpecSchema_v0 = z.object({
    loading: z.boolean().optional(),
})

export const UtilityRatesSchema_v0 = z.object({
    electricRate: z.number().optional(),
    gasRate: z.number().optional(),
})

export const PresentModeConfigSchema_v0 = z.object({
    hiddenSlides: z.array(z.string()).optional(),
})

export const SpaceTypeAutoAssignmentSourcesSchema_v0 = z.object({
    hvakrTemplates: z.boolean().optional(),
    myTemplates: z.boolean().optional(),
})

export const TakeoffModelSchema_v0 = z.enum(['V1', 'V2'])

/**
 * IAQP design compounds keyed by EPA AQS Parameter Code.
 * See https://aqs.epa.gov/aqsweb/documents/codetables/parameters.html
 */
export const IAQPDesignCompoundIdSchema_v0 = z.enum([
    '42101',
    '42604',
    '43502',
    '43503',
    '43551',
    '43802',
    '43814',
    '43817',
    '44201',
    '45102',
    '45201',
    '45202',
    '45300',
    '45850',
    '88101',
])

export const OutdoorContaminantDataSchema_v0 = z.object({
    autoValue: z.number().optional(),
    isManuallySet: z.boolean().optional(),
    selectedSiteId: z.string().optional(),
    value: z.number().optional(),
})

export const ConstraintSchema_v0 = z.object({
    description: z.string().optional(),
    name: z.string().optional(),
    createdAt: disableUserWrite(z.number()),
})

export const ContactSchema_v0 = z.object({
    address: z.string().optional(),
    company: z.string().optional(),
    email: z.string().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    role: z.string().optional(),
    createdAt: disableUserWrite(z.number()),
    trade: z.string().optional(),
})

export const StandardSchema_v0 = z.object({
    description: z.string().optional(),
    name: z.string().optional(),
    createdAt: disableUserWrite(z.number()),
})

export const BuildingDataSchema_v0 = z.object({
    area: z.number().optional(),
    ashraeBuildingTypeId: z.string().optional(),
    description: z.string().optional(),
    name: z.string().optional(),
    occupancy: z.number().optional(),
    planRotation: z.number().optional(),
})

export const DuctSizingDataSchema_v0 = z.object({
    ductSizes: z.record(z.string(), Graph_v0.DuctSizeSchema_v0).optional(),
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

export const DuctDesignDataSchema_v0 = z.object({
    fittings: FittingsConfigSchema_v0.optional(),
    sizingData: DuctSizingDataSchema_v0.optional(),
})

export const RevisionSchema_v0 = z.object({
    description: z.string().optional(),
    id: z.string(),
    log: z.string().optional(),
    savedBy: z.string(),
    createdAt: z.number(),
})

const VentilationStandards_v0 = {
    ASHRAE_2022: 'ASHRAE 62.1 / 170 (2022)',
    ASHRAE_2025: 'ASHRAE 62.1 / 170 (2025)',
    TITLE_24_PRE_2019: 'Title 24 (Pre-2019)',
    TITLE_24_POST_2019: 'Title 24 (Post-2019)',
} as const
export const VentilationStandardSchema_v0 = z.enum(
    Object.values(VentilationStandards_v0)
)

export const EquipmentModesSchema_v0 = z.record(ModeIdSchema_v0, ModeSchema_v0)
export type EquipmentModes_v0 = z.infer<typeof EquipmentModesSchema_v0>

export const DEFAULT_COOLING_MODE_ID_v0 = 'cooling_mode'
export const DEFAULT_HEATING_MODE_ID_v0 = 'heating_mode'

export const DEFAULT_EQUIPMENT_MODES_v0: EquipmentModes_v0 = {
    [DEFAULT_COOLING_MODE_ID_v0]: {
        id: DEFAULT_COOLING_MODE_ID_v0,
        loadCondition: LoadConditions_v0.COOLING,
        name: 'Cooling',
        description: '',
    },
    [DEFAULT_HEATING_MODE_ID_v0]: {
        id: DEFAULT_HEATING_MODE_ID_v0,
        loadCondition: LoadConditions_v0.HEATING,
        name: 'Heating',
        description: '',
    },
}

export const ProjectAccessLevels_v0 = {
    VIEWER: 1,
    COMMENTER: 2,
    MEMBER: 4,
    ADMIN: 8,
    OWNER: 10,
} as const
export const ProjectAccessLevelSchema_v0 = z
    .union(
        Object.values(ProjectAccessLevels_v0).map((level) => z.literal(level))
    )
    .describe('Access level for a collaborative document')
export type ProjectAccessLevel_v0 = z.infer<typeof ProjectAccessLevelSchema_v0>
export type ProjectAccessLevelName_v0 = keyof typeof ProjectAccessLevels_v0

export const UserAccessSchema_v0 = z.object({
    accessLevel: ProjectAccessLevelSchema_v0,
    email: z.string().describe("User's email (denormalized for display)"),
    firstName: z.string().optional().describe("User's first name"),
    lastName: z.string().optional().describe("User's last name"),
    profilePicture: z
        .string()
        .nullish()
        .describe("URL to user's profile picture"),
})
export type UserAccess_v0 = z.infer<typeof UserAccessSchema_v0>

export const UserGroupAccessSchema_v0 = z.object({
    accessLevel: ProjectAccessLevelSchema_v0,
    name: z.string().describe('Name of the user group'),
    organizationId: z
        .string()
        .describe('ID of the organization that owns the user group'),
})
export type UserGroupAccess_v0 = z.infer<typeof UserGroupAccessSchema_v0>

export const OrganizationAccessSchema_v0 = z.object({
    accessLevel: ProjectAccessLevelSchema_v0,
    id: z.string(),
    name: z.string().describe('Name of the organization'),
    profilePicture: z
        .string()
        .nullish()
        .describe("URL to organization's profile picture"),
})
export type OrganizationAccess_v0 = z.infer<typeof OrganizationAccessSchema_v0>

const PrincipalIdSchema_v0 = z.union([
    z.templateLiteral(['user', ':', z.string()]),
    z.templateLiteral(['userGroup', ':', z.string(), ':', z.string()]),
    z.templateLiteral(['organization', ':', z.string()]),
])

export const AtLeastAccessSchema_v0 = z.object({
    VIEWER: z.array(PrincipalIdSchema_v0),
    COMMENTER: z.array(PrincipalIdSchema_v0),
    MEMBER: z.array(PrincipalIdSchema_v0),
    ADMIN: z.array(PrincipalIdSchema_v0),
    OWNER: z.array(PrincipalIdSchema_v0),
})
export type AtLeastAccess_v0 = z.infer<typeof AtLeastAccessSchema_v0>

export const AccessGrantsSchema_v0 = z.object({
    users: z
        .record(z.string(), UserAccessSchema_v0)
        .describe(
            'Users granted access, keyed by Firebase uid. New keys are added by the invite callable only.'
        ),
    userGroups: z
        .record(z.string(), UserGroupAccessSchema_v0)
        .optional()
        .describe(
            'User groups granted access, keyed by user group id. New keys are added by the invite callable only.'
        ),
    organization: OrganizationAccessSchema_v0.optional().describe(
        'The single organization granted access. Added by the invite callable only, which refuses an organization that differs from the inherited one.'
    ),
})
export type AccessGrants_v0 = z.infer<typeof AccessGrantsSchema_v0>

export const ProjectAccessSchema_v0 = z.object({
    direct: AccessGrantsSchema_v0.describe(
        'Grants made on this document. A direct grant replaces the inherited level for that principal, even when lower.'
    ),
    inherited: AccessGrantsSchema_v0.optional().describe(
        "The parent folder's effective grants: its direct grants resolved over its own inherited grants. Written by the folder reconcile only. Absent at root."
    ),
    _atLeastAccess: AtLeastAccessSchema_v0.optional().describe(
        'Index of principal ids holding at least each access level, converted from direct resolved over inherited. Read by Firestore rules, list queries, storage rules, and embedding access control only.'
    ),
})
export type ProjectAccess_v0 = z.infer<typeof ProjectAccessSchema_v0>

export const ProjectUserPresenceSchema_v0 = z.object({
    lastActive: z
        .number()
        .describe('Unix milliseconds when the user last opened the project'),
    email: z
        .string()
        .optional()
        .describe(
            "User's email (denormalized for display). Missing on entries written before profiles were stored."
        ),
    firstName: z.string().optional().describe("User's first name"),
    lastName: z.string().optional().describe("User's last name"),
    profilePicture: z
        .string()
        .nullish()
        .describe("URL to user's profile picture"),
})
export type ProjectUserPresence_v0 = z.infer<
    typeof ProjectUserPresenceSchema_v0
>

export const InvitedUserDataSchema_v0 = z.object({
    invitedByUserId: z.string().describe('Firebase uid of the inviter'),
    accessLevel: ProjectAccessLevelSchema_v0.describe(
        'Access level granted on consume'
    ),
    timestamp: z.number().describe('Unix ms created'),
})
export type InvitedUserData_v0 = z.infer<typeof InvitedUserDataSchema_v0>

export const ProjectTypes_v0 = {
    residential: 'residential',
    commercial: 'commercial',
} as const
export const ProjectTypeSchema_v0 = z.enum(Object.values(ProjectTypes_v0))
export type ProjectType_v0 = z.infer<typeof ProjectTypeSchema_v0>

export const ProjectStatuses_v0 = {
    new: 'new',
    inProgress: 'inProgress',
    inReview: 'inReview',
    done: 'done',
    archived: 'archived',
} as const
export const ProjectStatusSchema_v0 = z.enum(Object.values(ProjectStatuses_v0))
export type ProjectStatus_v0 = z.infer<typeof ProjectStatusSchema_v0>

export const ProjectAnalyticsSchema_v0 = z.object({
    hasDuctsSized: z.boolean().optional(),
    hasLayoutStarted: z.boolean().optional(),
    hasEquipmentConfigured: z.boolean().optional(),
    hasProjectComments: z.boolean().optional(),
    hasReports: z.boolean().optional(),
    hasSheets: z.boolean().optional(),
    hasSpaceTypes: z.boolean().optional(),
    hasSpaces: z.boolean().optional(),
    hasSystems: z.boolean().optional(),
    hasWallTypes: z.boolean().optional(),
    hasZones: z.boolean().optional(),
    numUsers: z.number().optional(),
    updatedAt: z.number(),
})
export type ProjectAnalytics_v0 = z.infer<typeof ProjectAnalyticsSchema_v0>

export const ComputedProjectDataSchema_v0 = z.object({
    _nameLowercase: disableUserWrite(z.string().optional()),
})

export const ProjectDataSchema_v0 = ComputedProjectDataSchema_v0.extend({
    access: disableUserWrite(
        ProjectAccessSchema_v0.describe(
            'Collaborative access: direct grants, grants inherited from the folder, and the at-least index.'
        )
    ),
    address: z.string().optional(),
    organizationId: disableUserWrite(z.string().optional()),
    airflowIncrement: z.number().int().min(1).optional(),
    analytics: disableUserWrite(ProjectAnalyticsSchema_v0.optional()),
    apiCreated: disableUserWrite(z.boolean().optional()),
    building: BuildingDataSchema_v0.optional(),
    climateZone: z.string().optional(),
    constraints: z.record(z.string(), ConstraintSchema_v0).optional(),
    constructionType: z.enum(['New', 'Retrofit']).optional(),
    contacts: z.record(z.string(), ContactSchema_v0).optional(),
    description: z.string().optional(),
    ductDesign: DuctDesignDataSchema_v0.optional(),
    duplicatedFrom: disableUserWrite(z.string().optional()),
    elevation: disableUserWrite(z.number().optional()),
    equipmentModes: EquipmentModesSchema_v0,
    defaultSystemPresetId: disableUserWrite(z.string().optional()),
    fromExample: disableUserWrite(z.string().optional()),
    iaqpOutdoorAirMerv: z.number().int().min(8).max(15).optional(),
    isDeleted: disableUserWrite(z.boolean().optional()),
    isExample: disableUserWrite(z.boolean().optional()),
    isHealthcare: z.boolean().optional(),
    lastOpenTime: disableUserWrite(z.number().optional()),
    latitude: disableUserWrite(z.number().optional()),
    levels: z.record(z.coerce.number(), LevelDataSchema_v0).optional(),
    longitude: disableUserWrite(z.number().optional()),
    maps: z.record(z.string(), MapDataSchema_v0).optional(),
    metadata: ProjectMetadataSchema_v0.optional(),
    name: z.string(),
    number: z.string().optional(),
    outdoorContaminants: z
        .partialRecord(
            IAQPDesignCompoundIdSchema_v0,
            OutdoorContaminantDataSchema_v0
        )
        .optional(),
    outsideAirSpec: disableUserWrite(OutsideAirSpecSchema_v0.optional()),
    pictureThumbnailURL: z.string().optional(),
    pictureURL: z.string().optional(),
    pictureVerticalPosition: z.number().optional(),
    presentMode: PresentModeConfigSchema_v0.optional(),
    projectType: ProjectTypeSchema_v0.optional(),
    revision: disableUserWrite(z.string().optional()),
    revisions: disableUserWrite(
        z.record(z.string(), RevisionSchema_v0).optional()
    ),
    sheetMarkers: z.record(z.string(), PointSchema).optional(),
    slackChannelId: disableUserWrite(z.string().optional()),
    spaceTypeAutoAssignment: SpaceTypeAutoAssignmentSourcesSchema_v0.optional(),
    standards: z.record(z.string(), StandardSchema_v0).optional(),
    status: ProjectStatusSchema_v0.optional(),
    suggestedSpaces: disableUserWrite(
        z.record(z.string(), SpaceDataSchema_v0).optional()
    ),
    takeoffModel: TakeoffModelSchema_v0.optional(),
    createdAt: disableUserWrite(z.number().optional()),
    unitSystem: DisplayUnitSystemIdSchema.optional(),
    invitedEmails: disableUserWrite(
        z
            .record(z.string(), InvitedUserDataSchema_v0)
            .optional()
            .describe(
                'Pending invites keyed by normalized email. Grants zero access until consumed server-side into access.direct.users[uid].'
            )
    ),
    userPresence: disableUserWrite(
        z
            .record(z.string(), ProjectUserPresenceSchema_v0)
            .optional()
            .describe(
                'Profile and last open time of each user who has opened the project, keyed by Firebase uid. Written by onUserStatusUpdate. Grants no access.'
            )
    ),
    utilityRates: UtilityRatesSchema_v0.optional(),
    ventilationStandard: VentilationStandardSchema_v0.optional().describe(
        'How outdoor air is calculated. ASHRAE 62.1 / 170 editions add the people and area rates and divide by Ez; the 2025 edition also applies air-density correction. Title 24 (Pre-2019) uses the greater of 15 CFM per person and the area rate, without Ez. Title 24 (Post-2019) follows the ASHRAE sum and multiplies breathing-zone airflow by the applied safety factor before Ez.'
    ),
    ventilationSafetyFactor: z
        .number()
        .min(0)
        .optional()
        .meta({
            title: 'Applied Safety Factor',
            description:
                'Multiplier on breathing-zone outdoor airflow, applied before zone air distribution effectiveness. Omit to use the ventilation standard default: 1.3 for Title 24 (Post-2019) and 1.0 for every other standard.',
        }),
    weatherSpec: WeatherSpecSchema_v0.optional(),
    yearBuilt: z.string().optional(),
})
export type ProjectData_v0 = z.infer<typeof ProjectDataSchema_v0>

export interface Project_v0 extends ProjectData_v0 {
    id: string
}

/* BEGIN API ENDPOINT SCHEMAS */

const disabledUserWriteFields = Object.fromEntries(
    Object.entries(ProjectDataSchema_v0.shape)
        .filter(([, schema]) => schema.meta()?.disableUserWrite)
        .map(([field]) => [field, true])
) as Record<UserWriteDisabledKeys<typeof ProjectDataSchema_v0>, true>

/** Compatibility view derived from canonical Zod metadata. */
export const PROJECT_SERVER_CONTROLLED_WRITE_FIELDS_V0 = disabledUserWriteFields

/** Compatibility view derived from canonical Zod metadata. */
export const PROJECT_RESTRICTED_WRITE_FIELDS_V0 = disabledUserWriteFields

/** Project fields writable through create/update requests. */
export const WritableProjectDataSchema_v0 = getStrictSchema(
    getUserWritableSchema(ProjectDataSchema_v0)
)

export const ProjectPostSchema_v0 = z.strictObject({
    ...WritableProjectDataSchema_v0.shape,
    /** Optional because creation seeds the default cooling/heating modes. */
    equipmentModes: getStrictSchema(EquipmentModesSchema_v0).optional(),
    /** Optional because the project can be created with a default name */
    name: z.string().optional(),
})
export type ProjectPost_v0 = z.infer<typeof ProjectPostSchema_v0>

/** Summary fields returned for each project by the list endpoint. */
export const ProjectListItemSchema_v0 = z.object({
    id: z.string(),
    name: z.string().optional(),
    number: z.string().optional(),
    address: z.string().optional(),
    status: ProjectStatusSchema_v0.optional(),
    projectType: ProjectTypeSchema_v0.optional(),
    createdAt: z.number().optional(),
    lastOpenTime: z.number().optional(),
})
export type ProjectListItem_v0 = z.infer<typeof ProjectListItemSchema_v0>

/** Paginated response shape returned by the list-projects endpoint. */
export const ProjectListResponseSchema_v0 = z.object({
    projects: z.array(ProjectListItemSchema_v0),
    hasMore: z.boolean(),
    nextCursor: z.string().nullable(),
})
export type ProjectListResponse_v0 = z.infer<
    typeof ProjectListResponseSchema_v0
>
