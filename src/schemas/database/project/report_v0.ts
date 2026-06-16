import { z } from 'zod'
import { DisplayUnitSystemIdSchema } from '../../misc'

const REPORT_FILE_TYPES = {
    PDF: 'PDF',
    CSV: 'CSV',
    DOCX: 'DOCX',
    ZIP: 'ZIP',
} as const

export const ReportFileTypeSchema_v0 = z.enum(Object.values(REPORT_FILE_TYPES))

export const ReportTemplateOptionSchema_v0 = z.object({
    id: z.string(),
    label: z.string(),
    type: z.union([z.literal('checkbox'), z.literal('select')]),
    value: z.union([z.boolean(), z.string()]),
    options: z.record(z.string(), z.string()).optional(),
})

export const ReportTemplateSchema_v0 = z.object({
    fileType: ReportFileTypeSchema_v0,
    id: z.string(),
    name: z.string(),
    options: z.record(z.string(), ReportTemplateOptionSchema_v0).optional(),
    /** Actual generated file type for the report template */
    outputFileType: ReportFileTypeSchema_v0.optional(),
})

export const ReportDataSchema_v0 = z.object({
    accessToken: z.string(),
    date: z.number(),
    displayUnitSystemId: DisplayUnitSystemIdSchema,
    /** Whether report generation failed */
    error: z.boolean().optional(),
    fileName: z.string(),
    name: z.string(),
    /** User ID to notify when report generation is complete */
    notifyOnComplete: z.string().optional(),
    /** Email address to send the report to when generation completes or fails */
    notifyOnCompleteEmail: z.string().optional(),
    /** Actual generated file type stored in storage */
    outputFileType: ReportFileTypeSchema_v0.optional(),
    pending: z.boolean(),
    template: ReportTemplateSchema_v0,
})
export type ReportData_v0 = z.infer<typeof ReportDataSchema_v0>
