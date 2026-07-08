import { z } from 'zod'

/**
 * The frozen error-code vocabulary for the v0 API. Every error response
 * carries one of these codes in `error.code`.
 */
export const API_ERROR_CODES_v0 = {
    invalid_request: 'invalid_request',
    validation_failed: 'validation_failed',
    unauthenticated: 'unauthenticated',
    permission_denied: 'permission_denied',
    not_found: 'not_found',
    method_not_allowed: 'method_not_allowed',
    conflict: 'conflict',
    rate_limited: 'rate_limited',
    internal: 'internal',
} as const

export const APIErrorCodeSchema_v0 = z
    .enum(Object.values(API_ERROR_CODES_v0))
    .describe(
        'Stable machine-readable error code. One of: invalid_request (malformed request), validation_failed (body failed schema validation, see details), unauthenticated (missing/invalid token), permission_denied (authenticated but lacking license/role/org access), not_found, method_not_allowed, conflict (e.g. idempotency replay in flight), rate_limited (see Retry-After), internal.'
    )
export type APIErrorCode_v0 = z.infer<typeof APIErrorCodeSchema_v0>

/**
 * Standard error envelope returned by every v0 API error response.
 * `requestId` matches the `X-Request-Id` response header for correlation.
 */
export const APIErrorSchema_v0 = z
    .object({
        error: z
            .object({
                code: APIErrorCodeSchema_v0,
                message: z
                    .string()
                    .describe('Human-readable description of the error.'),
                details: z
                    .unknown()
                    .optional()
                    .describe(
                        'Optional structured detail. For validation_failed this holds the Zod issues array.'
                    ),
            })
            .describe('The error payload.'),
        requestId: z
            .string()
            .describe(
                'Request correlation id, also returned in the X-Request-Id header.'
            ),
    })
    .describe('Standard v0 API error envelope.')

export type APIError_v0 = z.infer<typeof APIErrorSchema_v0>
