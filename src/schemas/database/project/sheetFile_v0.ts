import { z } from 'zod'
import { PointSchema } from '../../misc'

export const SheetFileDataSchema_v0 = z.object({
    assigned: z.boolean().optional(),
    processingFinishTime: z.number().optional(),
    processingStartTime: z.number().optional(),
    sheetNumberBox: z.array(PointSchema).optional(),
    sourceFileName: z.string(),
    timestamp: z.number().optional(),
    uploadFinishTime: z.number().optional(),
    uploadStartTime: z.number(),
    url: z.string(),
    versionSetId: z.string(),
})
export type SheetFileData_v0 = z.infer<typeof SheetFileDataSchema_v0>
