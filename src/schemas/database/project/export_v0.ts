import { z } from 'zod'
import { DisplayUnitSystemIdSchema } from '../../misc'

const EXPORT_FILE_TYPES = {
    PDF: 'PDF',
    CSV: 'CSV',
    DOCX: 'DOCX',
    ZIP: 'ZIP',
    XML: 'XML',
    JSON: 'JSON',
} as const

export const ExportFileTypeSchema_v0 = z.enum(Object.values(EXPORT_FILE_TYPES))

export const ExportDefinitionOptionSchema_v0 = z.object({
    id: z.string(),
    label: z.string(),
    type: z.union([z.literal('checkbox'), z.literal('select')]),
    value: z.union([z.boolean(), z.string()]),
    options: z.record(z.string(), z.string()).optional(),
})

export const CoverStampsSchema_v0 = z.object({
    peStampUrl: z.string().optional(),
    preliminary: z.boolean().optional(),
})
export type CoverStamps_v0 = z.infer<typeof CoverStampsSchema_v0>

export const ExportDefinitionSchema_v0 = z.object({
    fileType: ExportFileTypeSchema_v0,
    id: z.string(),
    name: z.string(),
    options: z.record(z.string(), ExportDefinitionOptionSchema_v0).optional(),
    /** Actual generated file type for the export definition */
    outputFileType: ExportFileTypeSchema_v0.optional(),
    stamps: CoverStampsSchema_v0.optional(),
})

export const ExportDataSchema_v0 = z.object({
    accessToken: z.string(),
    date: z.number(),
    displayUnitSystemId: DisplayUnitSystemIdSchema,
    /** Whether export generation failed */
    error: z.boolean().optional(),
    fileName: z.string(),
    name: z.string(),
    /** User ID to notify when export generation is complete */
    notifyOnComplete: z.string().optional(),
    /** Email address to send the export to when generation completes or fails */
    notifyOnCompleteEmail: z.string().optional(),
    /** Actual generated file type stored in storage */
    outputFileType: ExportFileTypeSchema_v0.optional(),
    pending: z.boolean(),
    definition: ExportDefinitionSchema_v0,
})
export type ExportData_v0 = z.infer<typeof ExportDataSchema_v0>
