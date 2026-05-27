import { z } from 'zod'

export const RevitBoundarySegmentSchema_v0 = z.object({
    /** Stored in feet (lengthUnit) */
    x1: z.number(),
    /** Stored in feet (lengthUnit) */
    x2: z.number(),
    /** Stored in feet (lengthUnit) */
    y1: z.number(),
    /** Stored in feet (lengthUnit) */
    y2: z.number(),
})
export type RevitBoundarySegment_v0 = z.infer<
    typeof RevitBoundarySegmentSchema_v0
>

export const RevitSpaceDataSchema_v0 = z.object({
    /** Stored in square feet (areaUnit) */
    area: z.number(),
    /** Nested array b/c revit spaces support holes */
    boundaries: z.array(z.array(RevitBoundarySegmentSchema_v0)),
    /** Stored in feet (lengthUnit) */
    levelElevation: z.number(),
    name: z.string().nullable(),
    number: z.string().nullable(),
    /** Stored in feet (lengthUnit) */
    unboundedHeight: z.number(),
    uniqueId: z.string(),
    /** Stored in cubic feet (volumeUnit) */
    volume: z.number(),
})
export type RevitSpaceData_v0 = z.infer<typeof RevitSpaceDataSchema_v0>

export const RevitDataSchema_v0 = z.object({
    projectAddress: z.string().nullable(),
    projectName: z.string().nullable(),
    /** Stored in degrees (angleUnit) */
    projectRotationDegrees: z.number(),
    revitSpaces: z.array(RevitSpaceDataSchema_v0),
})
export type RevitData_v0 = z.infer<typeof RevitDataSchema_v0>
