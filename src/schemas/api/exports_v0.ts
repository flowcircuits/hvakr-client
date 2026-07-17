import { z } from 'zod'
import { ExportFileTypeSchema_v0 } from '../database/project/export_v0'

/** Export definition slugs accepted by the v0 API. */
export const APIExportDefinitionIds_v0 = {
    'load-calculation': 'load-calculation',
    'basis-of-design': 'basis-of-design',
    'ventilation-csv': 'ventilation-csv',
    'hourly-loads-csv': 'hourly-loads-csv',
} as const

export const APIExportDefinitionIdSchema_v0 = z
    .enum(Object.values(APIExportDefinitionIds_v0))
    .describe(
        'Export definition slug: load-calculation (PDF loads report), basis-of-design (PDF), ventilation-csv (ZIP of CSVs), hourly-loads-csv (ZIP of CSVs).'
    )
export type APIExportDefinitionId_v0 = z.infer<
    typeof APIExportDefinitionIdSchema_v0
>

/** Export generation status. */
export const APIExportStatusSchema_v0 = z
    .enum(['pending', 'completed', 'failed'])
    .describe(
        'Export generation status. Poll GET until the status leaves "pending".'
    )
export type APIExportStatus_v0 = z.infer<typeof APIExportStatusSchema_v0>

/** An export as returned by the v0 API. */
export const APIExportSchema_v0 = z
    .object({
        id: z.string().describe('Export id.'),
        name: z.string().describe('Display name of the export.'),
        status: APIExportStatusSchema_v0,
        downloadUrl: z
            .string()
            .optional()
            .describe(
                'Signed download URL. Present only when status is "completed".'
            ),
        date: z.number().describe('Creation timestamp (Unix milliseconds).'),
        outputFileType: ExportFileTypeSchema_v0.optional().describe(
            'File type of the generated export (PDF, CSV, DOCX, or ZIP).'
        ),
        progress: z
            .number()
            .optional()
            .describe('Generation progress (0–1), when reported.'),
    })
    .describe('A generated (or in-progress) project export.')
export type APIExport_v0 = z.infer<typeof APIExportSchema_v0>

// Exports are created via `POST /projects/{id}/jobs` with `type: "export"`
// (see `APIJobCreateSchema_v0`), read via `GET /projects/{id}?expand=exports`,
// and polled via `GET /projects/{id}/jobs/{jobId}`.
