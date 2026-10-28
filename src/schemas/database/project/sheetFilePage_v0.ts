import { z } from 'zod'
import { PointSchema } from '../../misc'
import { disableUserWrite } from '../../utility'
import { CustomScaleInfoSchema_v0 } from './sheet_v0'

const AutoTakeoffPolygonSchema_v0 = z.object({
    points: z.array(PointSchema).describe('Polygon points, in pixels.'),
    area: z.number().describe('Polygon area, in square meters.'),
    perimeter: z.number().describe('Polygon perimeter, in meters.'),
})

const AutoTakeoffLineSchema_v0 = z.object({
    p1: PointSchema.describe('Line start point, in pixels.'),
    p2: PointSchema.describe('Line end point, in pixels.'),
    length: z.number().describe('Line length, in meters.'),
    thickness: z.number().describe('Line thickness, in meters.'),
})

const AutoTakeoffPageResultSchema_v0 = z.object({
    confidence: z.number().optional(),
    cropBox: z.array(z.number()).length(4).optional(),
    scale: z.number(),
    spaces: z.array(AutoTakeoffPolygonSchema_v0),
    walls: z.array(AutoTakeoffLineSchema_v0),
    windows: z.array(AutoTakeoffLineSchema_v0),
    modelVersion: z.string().optional(),
})

const AutoTakeoffDataSchema_v0 = z.object({
    fileKey: z.string().optional(),
    projectId: z.number().optional(),
    scale: z.number().optional(),
    results: z.record(z.string(), AutoTakeoffPageResultSchema_v0).optional(),
})

const WaitingSchema_v0 = z.object({ status: z.enum(['PENDING', 'PROCESSING']) })
const ErroredSchema_v0 = z.object({
    status: z.literal('ERROR'),
    error: z.string(),
})

const ImageSchema_v0 = z.union([
    z.object({
        height: z.number(),
        resolution: z.number(),
        status: z.literal('COMPLETE'),
        url: z.string(),
        width: z.number(),
    }),
    WaitingSchema_v0,
    ErroredSchema_v0,
])

const ProcessingNumberResultSchema_v0 = z.object({
    result: z.number(),
    confidence: z.number(),
})
const ProcessingStringResultSchema_v0 = z.object({
    result: z.string(),
    confidence: z.number(),
})

const ProcessingSchema_v0 = z.union([
    WaitingSchema_v0,
    z.object({
        status: z.literal('COMPLETE'),
        results: z.object({
            defaultCeilingHeight: ProcessingNumberResultSchema_v0.optional(),
            defaultSlabHeight: ProcessingNumberResultSchema_v0.optional(),
            ocrDetectedLevel: ProcessingNumberResultSchema_v0.optional(),
            ocrDetectedTopLevel: ProcessingNumberResultSchema_v0.optional(),
            scale: ProcessingNumberResultSchema_v0.optional(),
            sheetNumber: ProcessingStringResultSchema_v0.optional(),
        }),
    }),
    ErroredSchema_v0,
    z.object({ status: z.literal('CANCELED') }),
])

/**
 * One page of an uploaded sheet file. The sheet-upload flow creates pages;
 * project patches can change only the user-writable fields, such as `scale`.
 */
export const SheetFilePageDataSchema_v0 = z.object({
    aiProcessing: disableUserWrite(
        ProcessingSchema_v0.describe(
            'Page processing state. `results.scale` holds the detected scale and its confidence.'
        )
    ),
    customScaleInfo: CustomScaleInfoSchema_v0.optional().describe(
        'State of a custom scale entered in the Sheet Library. Set it to null when you set a standard scale.'
    ),
    defaultCeilingHeight: z
        .number()
        .optional()
        .describe('Default ceiling height, in inches.'),
    ocrDetectedLevel: disableUserWrite(z.number().optional()),
    ocrDetectedTopLevel: disableUserWrite(z.number().optional()),
    defaultSlabHeight: z
        .number()
        .optional()
        .describe('Default slab height, in inches.'),
    markdown: disableUserWrite(z.string().optional()),
    autoTakeoff: disableUserWrite(AutoTakeoffDataSchema_v0.optional()),
    pageNumber: disableUserWrite(
        z.number().describe('Page number in the uploaded PDF.')
    ),
    pdfUrl: disableUserWrite(z.string()),
    png: disableUserWrite(
        z.object({ standard: ImageSchema_v0, thumbnail: ImageSchema_v0 })
    ),
    scale: z
        .number()
        .positive()
        .describe(
            'Drawing scale as real inches per paper inch: 48 for 1/4" = 1\'-0", 96 for 1/8" = 1\'-0", 100 for 1:100. Auto-takeoff converts sheet geometry with this value.'
        ),
    sheetFileId: disableUserWrite(
        z.string().describe('ID of the sheet file this page belongs to.')
    ),
    sheetNumber: z.string(),
    sourceFileName: disableUserWrite(z.string()),
    createdAt: disableUserWrite(z.number()),
    title: z.string().optional(),
})
export type SheetFilePageData_v0 = z.infer<typeof SheetFilePageDataSchema_v0>
