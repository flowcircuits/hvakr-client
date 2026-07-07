import { z } from 'zod'

// --------------------------------------------------------------------
// -- Auto-group ------------------------------------------------------

/** Request body for the auto-group action. */
export const APIAutoGroupRequestSchema_v0 = z
    .object({
        scope: z
            .enum(['spaces', 'zones'])
            .describe(
                'What to group: "spaces" groups spaces into zones, "zones" groups zones into systems.'
            ),
        entityIds: z
            .array(z.string().min(1))
            .optional()
            .describe(
                'When set, only group these specific entities instead of all ungrouped ones.'
            ),
    })
    .describe('Request body for the auto-group action.')
export type APIAutoGroupRequest_v0 = z.infer<
    typeof APIAutoGroupRequestSchema_v0
>

/** Result of the auto-group action. */
export const APIAutoGroupResultSchema_v0 = z
    .object({
        created: z.number().describe('Number of new zones/systems created.'),
        assigned: z
            .number()
            .describe('Number of entities assigned to a group.'),
    })
    .describe('Result of the auto-group action.')
export type APIAutoGroupResult_v0 = z.infer<typeof APIAutoGroupResultSchema_v0>

// --------------------------------------------------------------------
// -- Check -----------------------------------------------------------

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

/** Full project-check report. */
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
    .describe('Full project-check report.')
export type APICheckReport_v0 = z.infer<typeof APICheckReportSchema_v0>

// --------------------------------------------------------------------
// -- Auto-takeoff (async job) ----------------------------------------

/** Request parameters for the auto-takeoff action. */
export const APIAutoTakeoffRequestSchema_v0 = z
    .object({
        confidence: z
            .number()
            .optional()
            .describe('Minimum detection confidence threshold (0–1).'),
        levels: z
            .array(z.number())
            .optional()
            .describe('Building levels to run takeoff on; omit for all.'),
        roofTypeId: z
            .string()
            .optional()
            .describe('Roof type to assign to detected roofs.'),
        slabTypeId: z
            .string()
            .optional()
            .describe('Slab type to assign to detected slabs.'),
        wallTypeId: z
            .string()
            .optional()
            .describe('Wall type to assign to detected walls.'),
        windowTypeId: z
            .string()
            .optional()
            .describe('Window type to assign to detected windows.'),
    })
    .describe('Request parameters for the auto-takeoff action.')
export type APIAutoTakeoffRequest_v0 = z.infer<
    typeof APIAutoTakeoffRequestSchema_v0
>

/** Status of an async API job. */
export const APIJobStatusSchema_v0 = z
    .enum(['queued', 'running', 'completed', 'failed'])
    .describe(
        'Status of an async job. Poll GET until it leaves queued/running.'
    )
export type APIJobStatus_v0 = z.infer<typeof APIJobStatusSchema_v0>

/** Error detail returned on a failed auto-takeoff job. */
export const APIAutoTakeoffErrorSchema_v0 = z
    .object({
        code: z
            .enum(['failed_precondition', 'timed_out'])
            .describe('Machine-readable failure code.'),
        message: z.string().describe('Human-readable failure description.'),
    })
    .describe('Error detail on a failed auto-takeoff job.')

/** Result payload of a completed auto-takeoff job. */
export const APIAutoTakeoffResultSchema_v0 = z
    .object({ error: APIAutoTakeoffErrorSchema_v0.optional() })
    .describe('Result payload of a completed auto-takeoff job.')

/** Response when creating an auto-takeoff job. */
export const APIAutoTakeoffJobCreateResponseSchema_v0 = z
    .object({
        jobId: z.string().describe('ID of the created job; use it to poll.'),
        status: APIJobStatusSchema_v0,
    })
    .describe('Response when creating an auto-takeoff job.')
export type APIAutoTakeoffJobCreateResponse_v0 = z.infer<
    typeof APIAutoTakeoffJobCreateResponseSchema_v0
>

/** Auto-takeoff job as returned when polling. */
export const APIAutoTakeoffJobSchema_v0 = z
    .object({
        jobId: z.string().describe('Job id.'),
        status: APIJobStatusSchema_v0,
        error: z
            .string()
            .optional()
            .describe('Job-level error message, when the job failed.'),
        result: APIAutoTakeoffResultSchema_v0.optional().describe(
            'Job result, present when status is "completed".'
        ),
    })
    .describe('Auto-takeoff job state.')
export type APIAutoTakeoffJob_v0 = z.infer<typeof APIAutoTakeoffJobSchema_v0>
