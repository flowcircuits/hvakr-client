import { z } from 'zod'
import { PointSchema } from '../../misc'
import { disableUserWrite } from '../../utility'

export const SheetFileMetadataSchema_v0 = disableUserWrite(
    z.object({
        title: z.string().optional(),
        author: z.string().optional(),
        subject: z.string().optional(),
        keywords: z.string().optional(),
        creator: z.string().optional(),
        producer: z.string().optional(),
        creationDate: z.string().optional(),
        modificationDate: z.string().optional(),
    })
)
export type SheetFileMetadata_v0 = z.infer<typeof SheetFileMetadataSchema_v0>

export const SheetFileDataSchema_v0 = z.object({
    metadata: SheetFileMetadataSchema_v0.optional(),
    name: z.string().optional(),
    pageCount: disableUserWrite(z.number().optional()),
    processingFinishTime: disableUserWrite(z.number().optional()),
    processingError: disableUserWrite(z.string().optional()),
    processingStartTime: disableUserWrite(z.number().optional()),
    sheetNumberBox: disableUserWrite(z.array(PointSchema).optional()),
    sourceFileName: disableUserWrite(z.string()),
    timestamp: disableUserWrite(z.number()),
    uploadFinishTime: disableUserWrite(z.number().optional()),
    uploadStartTime: disableUserWrite(z.number()),
    url: disableUserWrite(z.string()),
})
export type SheetFileData_v0 = z.infer<typeof SheetFileDataSchema_v0>
