import { z } from 'zod'
import { BoxSchema, PolygonSchema } from '../../misc'

export const LengthUnits_v0 = { IN: 'IN', FT: 'FT', MM: 'MM', M: 'M' } as const

export const LengthUnitSchema_v0 = z.enum(Object.values(LengthUnits_v0))
export type LengthUnit_v0 = z.infer<typeof LengthUnitSchema_v0>

export const SheetAnnotationSchema_v0 = z.object({
    confidence: z.number().optional(),
    polygon: PolygonSchema,
    text: z.string(),
    type: z.string(),
})

export const CustomScaleInfoSchema_v0 = z.object({
    leftScale: z.number().optional(),
    leftUnit: LengthUnitSchema_v0.optional(),
    rightScale: z.number().optional(),
    rightUnit: LengthUnitSchema_v0.optional(),
})

export const SheetVersionDataSchema_v0 = z.object({
    accessToken: z.string(),
    imageFileName: z.string(),
    pageNumber: z.number(),
    sheetFileId: z.string(),
    sheetFilePageId: z.string(),
    sourceFileName: z.string(),
})

export const SheetPlacementDataSchema_v0 = z.object({
    cropBox: BoxSchema.optional(),
    isLocked: z.boolean().optional(),
    level: z.number(),
    rotation: z.number().optional(),
    x: z.number(),
    y: z.number(),
})

const sheetTypes: string[] = [
    'Enlarged Floor Plan',
    'Overall Floor Plan',
    'Reflected Ceiling Plan',
    'Furniture Plan',
    'Exterior Elevation',
    'Interior Elevation',
]
const SheetTypeSchema_v0 = z.enum(sheetTypes)

export const SheetDataSchema_v0 = z.object({
    activeSheetFilePageId: z.string().optional(),
    placements: z.record(z.string(), SheetPlacementDataSchema_v0).optional(),
    sheetType: SheetTypeSchema_v0.optional(),
})
export type SheetData_v0 = z.infer<typeof SheetDataSchema_v0>
