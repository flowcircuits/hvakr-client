export interface RevitBoundarySegment_v0 {
    /** Stored in feet (lengthUnit) */
    x1: number
    /** Stored in feet (lengthUnit) */
    x2: number
    /** Stored in feet (lengthUnit) */
    y1: number
    /** Stored in feet (lengthUnit) */
    y2: number
}

export interface RevitSpaceData_v0 {
    /** Stored in square feet (areaUnit) */
    area: number
    /** Nested array b/c revit spaces support holes */
    boundaries: RevitBoundarySegment_v0[][]
    /** Stored in feet (lengthUnit) */
    levelElevation: number
    name: string | null
    number: string | null
    /** Stored in feet (lengthUnit) */
    unboundedHeight: number
    uniqueId: string
    /** Stored in cubic feet (volumeUnit) */
    volume: number
}

export interface RevitData_v0 {
    projectAddress: string | null
    projectName: string | null
    /** Stored in degrees (angleUnit) */
    projectRotationDegrees: number
    revitSpaces: RevitSpaceData_v0[]
}
