import { z } from 'zod'
import { PointSchema } from '../../misc'

export const SheetFileMetadataSchema_v0 = z
    .object({
        title: z.string().optional(),
        author: z.string().optional(),
        subject: z.string().optional(),
        keywords: z.string().optional(),
        creator: z.string().optional(),
        producer: z.string().optional(),
        creationDate: z.string().optional(),
        modificationDate: z.string().optional(),
    })
    .meta({ disableUserWrite: true })
export type SheetFileMetadata_v0 = z.infer<typeof SheetFileMetadataSchema_v0>

export const SheetFileDataSchema_v0 = z.object({
    metadata: SheetFileMetadataSchema_v0.optional(),
    name: z.string().optional(),
    pageCount: z.number().optional().meta({ disableUserWrite: true }),
    processingFinishTime: z
        .number()
        .optional()
        .meta({ disableUserWrite: true }),
    processingError: z.string().optional().meta({ disableUserWrite: true }),
    processingStartTime: z.number().optional().meta({ disableUserWrite: true }),
    sheetNumberBox: z
        .array(PointSchema)
        .optional()
        .meta({ disableUserWrite: true }),
    sourceFileName: z.string().meta({ disableUserWrite: true }),
    timestamp: z.number().meta({ disableUserWrite: true }),
    uploadFinishTime: z.number().optional().meta({ disableUserWrite: true }),
    uploadStartTime: z.number().meta({ disableUserWrite: true }),
    url: z.string().meta({ disableUserWrite: true }),
})
export type SheetFileData_v0 = z.infer<typeof SheetFileDataSchema_v0>
