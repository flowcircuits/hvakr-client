import { z } from 'zod'

/**
 * License tiers, mirrored from the platform's user license types. Determines
 * both whether a caller has API access and their per-minute rate limit.
 */
export const APILicenseTypes_v0 = {
    ENTERPRISE: 'enterprise',
    PAY_PER_PROJECT: 'payPerProject',
    SOLO: 'solo',
    TEAM: 'team',
    UNIVERSITY: 'university',
} as const
export const APILicenseTypeSchema_v0 = z.enum(Object.values(APILicenseTypes_v0))
export type APILicenseType_v0 = z.infer<typeof APILicenseTypeSchema_v0>

/** The caller's role within one of their organizations. */
export const APIOrganizationRoles_v0 = {
    MEMBER: 1,
    ADMIN: 7,
    OWNER: 10,
} as const
export const APIOrganizationRoleSchema_v0 = z.union(
    Object.values(APIOrganizationRoles_v0).map((role) => z.literal(role))
)
export type APIOrganizationRole_v0 = z.infer<
    typeof APIOrganizationRoleSchema_v0
>

/** An organization the caller belongs to, with their role in it. */
export const APIMeOrganizationSchema_v0 = z
    .object({
        id: z.string().describe('Organization id.'),
        name: z.string().optional().describe('Organization name.'),
        domain: z.string().optional().describe('Organization email domain.'),
        role: APIOrganizationRoleSchema_v0.describe(
            "The caller's role in this organization."
        ),
    })
    .describe('An organization membership.')

/** The authenticated caller. */
export const APIMeUserSchema_v0 = z
    .object({
        id: z.string().describe('User id.'),
        email: z.string().describe('User email.'),
        firstName: z.string().optional().describe('Given name.'),
        lastName: z.string().optional().describe('Family name.'),
        license: APILicenseTypeSchema_v0.describe('License tier.'),
    })
    .describe('The authenticated user.')

/** The caller's plan and what it grants. */
export const APIMePlanSchema_v0 = z
    .object({
        license: APILicenseTypeSchema_v0.describe('License tier.'),
        apiAccess: z
            .boolean()
            .describe('Whether the plan includes programmatic API access.'),
    })
    .describe('Plan entitlements.')

/** The caller's rate-limit budget. */
export const APIMeRateLimitSchema_v0 = z
    .object({
        limitPerMinute: z
            .number()
            .describe('Requests allowed per minute for this caller.'),
    })
    .describe('Rate-limit budget.')

/**
 * Response shape for `GET /me` — the authenticated caller's identity, their
 * organization memberships, plan entitlements, and rate-limit budget.
 * Recommended first call for any integration to confirm auth and capabilities.
 */
export const MeResponseSchema_v0 = z
    .object({
        user: APIMeUserSchema_v0,
        organizations: z
            .array(APIMeOrganizationSchema_v0)
            .describe('Organizations the caller is a member of.'),
        plan: APIMePlanSchema_v0,
        rateLimit: APIMeRateLimitSchema_v0,
    })
    .describe('The authenticated caller, their orgs, plan, and rate limit.')

export type APIMe_v0 = z.infer<typeof MeResponseSchema_v0>
