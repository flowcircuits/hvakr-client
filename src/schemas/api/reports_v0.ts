import { z } from 'zod'
import { ReportFileTypeSchema_v0 } from '../database/project/report_v0'

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

// Reports are created via `POST /projects/{id}/jobs` with `type: "report"`
// (see `APIJobCreateSchema_v0`), read via `GET /projects/{id}?expand=reports`,
// and polled via `GET /projects/{id}/jobs/{jobId}`.
