import { z } from 'zod'
import { ReportFileTypeSchema_v0 } from '../database/project/report_v0'
import { DisplayUnitSystemIdSchema } from '../misc'

/** Report template slugs accepted by the v0 API. */
export const APIReportTemplateIds_v0 = {
    'load-calculation': 'load-calculation',
    'basis-of-design': 'basis-of-design',
    'ventilation-csv': 'ventilation-csv',
    'hourly-loads-csv': 'hourly-loads-csv',
} as const

export const APIReportTemplateIdSchema_v0 = z
    .enum(Object.values(APIReportTemplateIds_v0))
    .describe(
        'Report template slug: load-calculation (PDF loads report), basis-of-design (PDF), ventilation-csv (ZIP of CSVs), hourly-loads-csv (ZIP of CSVs).'
    )
export type APIReportTemplateId_v0 = z.infer<
    typeof APIReportTemplateIdSchema_v0
>

/** Report generation status. */
export const APIReportStatusSchema_v0 = z
    .enum(['pending', 'completed', 'failed'])
    .describe(
        'Report generation status. Poll GET until the status leaves "pending".'
    )
export type APIReportStatus_v0 = z.infer<typeof APIReportStatusSchema_v0>

/** A report as returned by the v0 API. */
export const APIReportSchema_v0 = z
    .object({
        id: z.string().describe('Report id.'),
        name: z.string().describe('Display name of the report.'),
        status: APIReportStatusSchema_v0,
        downloadUrl: z
            .string()
            .optional()
            .describe(
                'Signed download URL. Present only when status is "completed".'
            ),
        date: z.number().describe('Creation timestamp (Unix milliseconds).'),
        outputFileType: ReportFileTypeSchema_v0.optional().describe(
            'File type of the generated report (PDF, CSV, DOCX, or ZIP).'
        ),
        progress: z
            .number()
            .optional()
            .describe('Generation progress (0–1), when reported.'),
    })
    .describe('A generated (or in-progress) project report.')
export type APIReport_v0 = z.infer<typeof APIReportSchema_v0>

/**
 * Response returned when creating a report. Generation runs asynchronously,
 * so only the id and initial status are returned; poll `getReport` for the
 * download URL once the status leaves "pending".
 */
export const APIReportCreateResponseSchema_v0 = z
    .object({
        id: z.string().describe('ID of the created report.'),
        status: APIReportStatusSchema_v0,
    })
    .describe('Response returned when creating a report.')
export type APIReportCreateResponse_v0 = z.infer<
    typeof APIReportCreateResponseSchema_v0
>

/** Request body for creating a report. */
export const APIReportCreateSchema_v0 = z
    .object({
        template: APIReportTemplateIdSchema_v0.describe(
            'Template slug to generate.'
        ),
        name: z
            .string()
            .optional()
            .describe('Optional report name; defaults to the template name.'),
        displayUnitSystemId: DisplayUnitSystemIdSchema.optional().describe(
            'Unit system for the report; defaults to IMPERIAL.'
        ),
    })
    .describe('Request body to create a report.')
export type APIReportCreate_v0 = z.infer<typeof APIReportCreateSchema_v0>
