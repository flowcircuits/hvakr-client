import { z } from 'zod'

const InfiltrationRequirementMethods = {
    AREA: 'AREA',
    FLOW_RATE: 'FLOW_RATE',
    PERIMETER: 'PERIMETER',
    VOLUME: 'VOLUME',
} as const
export const InfiltrationRequirementMethodSchema_v0 = z.enum(
    Object.values(InfiltrationRequirementMethods)
)

export const SPACE_CREATION_SOURCES_V0 = {
    /** Created via the API */
    API: 'API',
    /** Created via the API from Revit */
    API_REVIT: 'API_REVIT',
    /** Created automatically by our system */
    AUTO: 'AUTO',
    /** Legacy spaces created before we had creation sources */
    LEGACY: 'LEGACY',
    /** Merged spaces */
    MERGE: 'MERGE',
    /** Copied spaces */
    PASTE: 'PASTE',
    /** Created via the polygon tool */
    POLYGON: 'POLYGON',
    /** Created via the rectangle tool */
    RECTANGLE: 'RECTANGLE',
    /** Split spaces */
    SPLIT: 'SPLIT',
} as const
export const SpaceCreationSourceSchema_v0 = z.enum(
    Object.values(SPACE_CREATION_SOURCES_V0)
)
export type SpaceCreationSource_v0 = z.infer<
    typeof SpaceCreationSourceSchema_v0
>

export const SkylightDataSchema_v0 = z.object({
    height: z.number(),
    rotation: z.number().optional(),
    width: z.number(),
    windowTypeId: z.string().optional(),
    x: z.number(),
    y: z.number(),
})

export const InternalShadingDataSchema_v0 = z.object({
    beamIAC0: z.number().optional(),
    beamIAC60: z.number().optional(),
    diffuseIAC: z.number().optional(),
    radiantFraction: z.number().optional(),
})

export const ExternalShadingDataSchema_v0 = z.object({
    sideOverhangDepth: z.number().optional(),
    sideOverhangOffset: z.number().optional(),
    topOverhangDepth: z.number().optional(),
    topOverhangOffset: z.number().optional(),
})

export const WindowDataSchema_v0 = z.object({
    bottom: z.number().optional(),
    externalShading: z.boolean().optional(),
    externalShadingData: ExternalShadingDataSchema_v0.optional(),
    height: z.number(),
    internalShading: z.boolean().optional(),
    internalShadingData: InternalShadingDataSchema_v0.optional(),
    width: z.number(),
    windowTypeId: z.string().optional(),
    x: z.number(),
    y: z.number(),
})

export const DoorDataSchema_v0 = z.object({
    doorTypeId: z.string().optional(),
    height: z.number(),
    width: z.number(),
    x: z.number(),
    y: z.number(),
})

export const EdgeSchema_v0 = z.object({
    applyLoadToCeiling: z.boolean().optional(),
    doors: z.record(z.string(), DoorDataSchema_v0).optional(),
    index: z.number(),
    name: z.string().optional(),
    surfaceTilt: z.number().optional(),
    wallTypeId: z.string().optional(),
    windows: z.record(z.string(), WindowDataSchema_v0).optional(),
    x1: z.number(),
    x2: z.number(),
    y1: z.number(),
    y2: z.number(),
})
export type Edge_v0 = z.infer<typeof EdgeSchema_v0>

export const SpaceDataSchema_v0 = z.object({
    airTransferIn: z.number().optional(),
    airTransferOut: z.number().optional(),
    applyRoofLoadToCeiling: z.boolean().optional(),
    ceilingHeight: z.number().optional(),
    creationSource: SpaceCreationSourceSchema_v0,
    customExhaust: z.number().optional(),
    customReturn: z.number().optional(),
    customSupply: z.number().optional(),
    edges: z.record(z.string(), EdgeSchema_v0),
    exhaustUnits: z.number().optional(),
    infiltrationAchReq: z.number().optional(),
    infiltrationAreaReq: z.number().optional(),
    infiltrationFlowRateReq: z.number().optional(),
    infiltrationLfReq: z.number().optional(),
    infiltrationReqMethod: InfiltrationRequirementMethodSchema_v0.optional(),
    infiltrationUseSeparateWinterReqs: z.boolean().optional(),
    infiltrationWinterAchReq: z.number().optional(),
    infiltrationWinterAreaReq: z.number().optional(),
    infiltrationWinterFlowRateReq: z.number().optional(),
    infiltrationWinterLfReq: z.number().optional(),
    infiltrationWinterReqMethod:
        InfiltrationRequirementMethodSchema_v0.optional(),
    level: z.number(),
    miscHeatingLoad: z.number().optional(),
    miscLatentCoolingLoad: z.number().optional(),
    miscSensibleCoolingLoad: z.number().optional(),
    name: z.string().optional(),
    number: z.string().optional(),
    occupancy: z.number().optional(),
    processed: z.boolean().optional(),
    revitId: z.string().optional(),
    roofAzimuth: z.number().optional(),
    roofPitch: z.number().optional(),
    roofTypeId: z.string().optional(),
    skylights: z.record(z.string(), SkylightDataSchema_v0).optional(),
    slabHeight: z.number().optional(),
    slabTypeId: z.string().optional(),
    spaceNameAndNumberInputHash: z.string().optional(),
    spaceTypeId: z.string().optional(),
    suggested: z.boolean().optional(),
    suggestedSpaceName: z.string().optional(),
    suggestedSpaceNumber: z.string().optional(),
    ventilationReq: z.number().optional(),
    zoneId: z.string().optional(),
})
export type SpaceData_v0 = z.infer<typeof SpaceDataSchema_v0>
