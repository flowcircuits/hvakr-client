import { z } from 'zod'
import { CustomScaleInfoSchema_v0, SheetAnnotationSchema_v0 } from './sheet_v0'

export const SheetFilePageDataSchema_v0 = z.object({
    accessToken: z.string(),
    annotations: z.record(z.string(), SheetAnnotationSchema_v0).optional(),
    assigned: z.boolean().optional(),
    customScaleInfo: CustomScaleInfoSchema_v0.optional(),
    defaultCeilingHeight: z.number().optional(),
    defaultSlabHeight: z.number().optional(),
    height: z.number(),
    imageFileName: z.string(),
    level: z.number().optional(),
    pageNumber: z.number(),
    resolution: z.number(),
    scale: z.number().optional(),
    suggestedSheetNumber: z.string().optional(),
    userSheetNumber: z.string().optional(),
    versionSetId: z.string(),
    width: z.number(),
})
export type SheetFilePageData_v0 = z.infer<typeof SheetFilePageDataSchema_v0>
