import { z } from 'zod'
import { DisplayUnitSystemIdSchema } from '../../misc'

const REPORT_FILE_TYPES = { PDF: 'PDF', CSV: 'CSV' } as const

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
})

export const ReportDataSchema_v0 = z.object({
    accessToken: z.string(),
    date: z.number(),
    displayUnitSystemId: DisplayUnitSystemIdSchema,
    fileName: z.string(),
    name: z.string(),
    pending: z.boolean(),
    template: ReportTemplateSchema_v0,
})
export type ReportData_v0 = z.infer<typeof ReportDataSchema_v0>
