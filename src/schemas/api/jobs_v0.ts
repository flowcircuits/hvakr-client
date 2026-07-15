import { z } from 'zod'
import { DisplayUnitSystemIdSchema } from '../misc'
import { APIReportSchema_v0, APIReportTemplateIdSchema_v0 } from './reports_v0'

// --------------------------------------------------------------------
// -- Job status ------------------------------------------------------

/** Status of an API job. */
export const APIJobStatusSchema_v0 = z
    .enum(['queued', 'running', 'completed', 'failed'])
    .describe(
        'Job status. Sync jobs return "completed" immediately; async jobs return "queued" — poll GET until the status leaves queued/running.'
    )
export type APIJobStatus_v0 = z.infer<typeof APIJobStatusSchema_v0>

// --------------------------------------------------------------------
// -- Job type --------------------------------------------------------

/** Job kinds that JSON callers can create through `POST /projects/{id}/jobs`. */
export const APIJobCreateTypes_v0 = {
    report: 'report',
    'auto-group': 'auto-group',
    check: 'check',
    'auto-takeoff': 'auto-takeoff',
} as const

export const APIJobCreateTypeSchema_v0 = z
    .enum(Object.values(APIJobCreateTypes_v0))
    .describe(
        'Job kind: report (async PDF/CSV/ZIP generation), auto-group (sync zoning/system grouping), check (sync validation), auto-takeoff (async floor-plan extraction).'
    )
export type APIJobCreateType_v0 = z.infer<typeof APIJobCreateTypeSchema_v0>

/** Every job kind returned by the v0 API. `sheet-upload` is multipart-only. */
export const APIJobTypes_v0 = {
    ...APIJobCreateTypes_v0,
    'sheet-upload': 'sheet-upload',
} as const

export const APIJobTypeSchema_v0 = z
    .enum(Object.values(APIJobTypes_v0))
    .describe(
        'Job kind. `sheet-upload` is created only by uploading a PDF to POST /projects/{id}/sheet-files; all other kinds use POST /projects/{id}/jobs.'
    )
export type APIJobType_v0 = z.infer<typeof APIJobTypeSchema_v0>

// --------------------------------------------------------------------
// -- Job create body -------------------------------------------------

/**
 * Request body to create a job. A single flat object (Anthropic tool schemas
 * require a top-level `type: object`, so this cannot be a discriminated union):
 * `type` selects the job kind and the variant fields it consumes; every other
 * field is ignored. Variant requirements are enforced server-side:
 *
 * - `report` → requires `template`; accepts `name`, `displayUnitSystemId`.
 * - `auto-group` → requires `scope`; accepts `entityIds`.
 * - `check` → no parameters.
 * - `auto-takeoff` → all parameters optional (`confidence`, `levels`,
 *   `roofTypeId`, `slabTypeId`, `wallTypeId`, `windowTypeId`).
 */
export const APIJobCreateSchema_v0 = z
    .object({
        type: APIJobCreateTypeSchema_v0,
        // report
        template: APIReportTemplateIdSchema_v0.optional().describe(
            'Report template slug. Required when type is "report".'
        ),
        name: z
            .string()
            .optional()
            .describe(
                'Report name (report jobs); defaults to the template name.'
            ),
        displayUnitSystemId: DisplayUnitSystemIdSchema.optional().describe(
            'Unit system for report jobs; defaults to IMPERIAL.'
        ),
        // auto-group
        scope: z
            .enum(['spaces', 'zones'])
            .optional()
            .describe(
                'Auto-group scope. Required when type is "auto-group": "spaces" groups spaces into zones, "zones" groups zones into systems.'
            ),
        entityIds: z
            .array(z.string().min(1))
            .optional()
            .describe(
                'Auto-group: when set, only group these specific entities instead of all ungrouped ones.'
            ),
        // auto-takeoff
        confidence: z
            .number()
            .optional()
            .describe('Auto-takeoff: minimum detection confidence (0–1).'),
        levels: z
            .array(z.number())
            .optional()
            .describe('Auto-takeoff: building levels to run on; omit for all.'),
        roofTypeId: z
            .string()
            .optional()
            .describe('Auto-takeoff: roof type assigned to detected roofs.'),
        slabTypeId: z
            .string()
            .optional()
            .describe('Auto-takeoff: slab type assigned to detected slabs.'),
        wallTypeId: z
            .string()
            .optional()
            .describe('Auto-takeoff: wall type assigned to detected walls.'),
        windowTypeId: z
            .string()
            .optional()
            .describe(
                'Auto-takeoff: window type assigned to detected windows.'
            ),
    })
    .describe('Request body to create a job.')
export type APIJobCreate_v0 = z.infer<typeof APIJobCreateSchema_v0>

// --------------------------------------------------------------------
// -- Auto-group result -----------------------------------------------

/** Result of an `auto-group` job. */
export const APIAutoGroupResultSchema_v0 = z
    .object({
        created: z.number().describe('Number of new zones/systems created.'),
        assigned: z
            .number()
            .describe('Number of entities assigned to a group.'),
    })
    .describe('Result of an auto-group job.')
export type APIAutoGroupResult_v0 = z.infer<typeof APIAutoGroupResultSchema_v0>

// --------------------------------------------------------------------
// -- Check result ----------------------------------------------------

/** Severity of a project-check finding. */
export const APICheckSeveritySchema_v0 = z
    .enum(['error', 'warning', 'info'])
    .describe('Severity of a project-check finding.')

/** A single project-check finding. */
export const APICheckFindingSchema_v0 = z
    .object({
        tier: z
            .union([z.literal(1), z.literal(2), z.literal(3)])
            .describe('Check tier (1–3).'),
        severity: APICheckSeveritySchema_v0,
        message: z.string().describe('Human-readable description.'),
        entityType: z
            .enum(['space', 'zone', 'system', 'equipment'])
            .optional()
            .describe('Type of the entity the finding applies to.'),
        entityId: z.string().optional().describe('ID of the entity.'),
        entityName: z
            .string()
            .optional()
            .describe('Display name of the entity.'),
    })
    .describe('A single project-check finding.')

/** Results for one tier of the project check. */
export const APICheckTierResultSchema_v0 = z
    .object({
        tier: z
            .union([z.literal(1), z.literal(2), z.literal(3)])
            .describe('Check tier (1–3).'),
        label: z.string().describe('Human-readable tier label.'),
        passed: z.boolean().describe('Whether every check in the tier passed.'),
        findings: z.array(APICheckFindingSchema_v0),
    })
    .describe('Results for one tier of the project check.')

/** Result of a `check` job — the full project-check report. */
export const APICheckReportSchema_v0 = z
    .object({
        passed: z.boolean().describe('Whether the project passed all checks.'),
        summary: z
            .object({
                errors: z.number(),
                warnings: z.number(),
                info: z.number(),
            })
            .describe('Finding counts by severity.'),
        tiers: z.array(APICheckTierResultSchema_v0),
    })
    .describe('Result of a check job (tiered findings + summary).')
export type APICheckReport_v0 = z.infer<typeof APICheckReportSchema_v0>

// --------------------------------------------------------------------
// -- Auto-takeoff result ---------------------------------------------

/** Error detail returned on a failed auto-takeoff job. */
export const APIAutoTakeoffErrorSchema_v0 = z
    .object({
        code: z
            .enum(['failed_precondition', 'timed_out'])
            .describe('Machine-readable failure code.'),
        message: z.string().describe('Human-readable failure description.'),
    })
    .describe('Error detail on a failed auto-takeoff job.')

/** Result of a completed `auto-takeoff` job. */
export const APIAutoTakeoffResultSchema_v0 = z
    .object({ error: APIAutoTakeoffErrorSchema_v0.optional() })
    .describe('Result of an auto-takeoff job.')
export type APIAutoTakeoffResult_v0 = z.infer<
    typeof APIAutoTakeoffResultSchema_v0
>

// --------------------------------------------------------------------
// -- Report job result -----------------------------------------------

/**
 * Result of a `report` job. `reportId` links to the created report doc; the
 * polished report (with `downloadUrl` once complete) is embedded as `report`
 * on GET and is also visible via `GET /projects/{id}?expand=reports`.
 */
export const APIReportJobResultSchema_v0 = z
    .object({
        reportId: z.string().describe('ID of the created report.'),
        report: APIReportSchema_v0.optional().describe(
            'The linked report; present on GET once the doc exists.'
        ),
    })
    .describe('Result of a report job.')
export type APIReportJobResult_v0 = z.infer<typeof APIReportJobResultSchema_v0>

// --------------------------------------------------------------------
// -- Sheet-upload job result -----------------------------------------

/** Processing state for one page in a sheet-upload job. */
export const APISheetUploadPageStatusSchema_v0 = z
    .enum(['queued', 'running', 'completed', 'failed'])
    .describe(
        'Public processing state for this page. A failed page makes the parent sheet-upload job fail.'
    )
export type APISheetUploadPageStatus_v0 = z.infer<
    typeof APISheetUploadPageStatusSchema_v0
>

/** A processed PDF page exposed by a sheet-upload job. */
export const APISheetUploadPageSchema_v0 = z
    .object({
        id: z.string().describe('Sheet-file page id.'),
        pageNumber: z
            .number()
            .describe('One-based page number in the uploaded PDF.'),
        sheetNumber: z
            .string()
            .optional()
            .describe('Sheet number detected from the page title block.'),
        sheetType: z
            .string()
            .optional()
            .describe('Detected sheet type, such as Overall Floor Plan.'),
        detectedLevel: z
            .number()
            .optional()
            .describe('Building level detected from the page title block.'),
        scale: z.number().optional().describe('Detected drawing scale.'),
        status: APISheetUploadPageStatusSchema_v0,
        error: z
            .string()
            .optional()
            .describe('Page processing failure, when status is failed.'),
        placed: z
            .boolean()
            .describe(
                'Whether this page is the active, placed page for its sheet.'
            ),
    })
    .describe('An actionable page from a sheet-upload job.')
export type APISheetUploadPage_v0 = z.infer<typeof APISheetUploadPageSchema_v0>

/** Result derived live from the uploaded file, its pages, and active sheets. */
export const APISheetUploadJobResultSchema_v0 = z
    .object({
        sheetFileId: z.string().describe('ID of the uploaded sheet file.'),
        sourceFileName: z.string().describe('Normalized uploaded filename.'),
        name: z
            .string()
            .optional()
            .describe('Optional display name supplied at upload.'),
        readyForTakeoff: z
            .boolean()
            .optional()
            .describe(
                'Present on completed jobs; true when at least one page is actively placed.'
            ),
        pagesProcessed: z
            .number()
            .describe('Number of pages extracted from the uploaded PDF.'),
        placedSheets: z
            .number()
            .describe('Distinct active sheets placed from this upload.'),
        pages: z.array(APISheetUploadPageSchema_v0),
    })
    .describe('Live result for a sheet-upload job.')
export type APISheetUploadJobResult_v0 = z.infer<
    typeof APISheetUploadJobResultSchema_v0
>

// --------------------------------------------------------------------
// -- Job -------------------------------------------------------------

/** Union of every job result payload, discriminated by the job's `type`. */
export const APIJobResultSchema_v0 = z
    .union([
        APIReportJobResultSchema_v0,
        APIAutoGroupResultSchema_v0,
        APICheckReportSchema_v0,
        APIAutoTakeoffResultSchema_v0,
        APISheetUploadJobResultSchema_v0,
    ])
    .describe('Job result payload; shape depends on the job type.')
export type APIJobResult_v0 = z.infer<typeof APIJobResultSchema_v0>

/**
 * A job as returned by `POST /projects/{id}/jobs` and
 * `GET /projects/{id}/jobs/{jobId}`. Sync jobs (`auto-group`, `check`) come
 * back `completed` with `result` populated; async jobs (`report`,
 * `auto-takeoff`) come back `queued` — poll GET until the status settles.
 */
const APIJobBaseSchema_v0 = z.object({
    jobId: z.string().describe('Job id; use it to poll GET.'),
    status: APIJobStatusSchema_v0,
    error: z
        .string()
        .optional()
        .describe('Job-level error message, when the job failed.'),
})

/**
 * A job returned by the API. The discriminated `type` keeps each result shape
 * narrowable without admitting `sheet-upload` in the JSON creation schema.
 */
export const APIJobSchema_v0 = z
    .discriminatedUnion('type', [
        APIJobBaseSchema_v0.extend({
            type: z.literal(APIJobTypes_v0.report),
            result: APIReportJobResultSchema_v0.optional(),
        }),
        APIJobBaseSchema_v0.extend({
            type: z.literal(APIJobTypes_v0['auto-group']),
            result: APIAutoGroupResultSchema_v0.optional(),
        }),
        APIJobBaseSchema_v0.extend({
            type: z.literal(APIJobTypes_v0.check),
            result: APICheckReportSchema_v0.optional(),
        }),
        APIJobBaseSchema_v0.extend({
            type: z.literal(APIJobTypes_v0['auto-takeoff']),
            result: APIAutoTakeoffResultSchema_v0.optional(),
        }),
        APIJobBaseSchema_v0.extend({
            type: z.literal(APIJobTypes_v0['sheet-upload']),
            result: APISheetUploadJobResultSchema_v0.optional(),
        }),
    ])
    .describe('A v0 API job.')
export type APIJob_v0 = z.infer<typeof APIJobSchema_v0>
