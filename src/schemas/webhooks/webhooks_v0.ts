import { z } from 'zod'

export const WebhookTimestampSchema_v0 = z.iso.datetime()

export const WebhookEvents = {
    OPPORTUNITY_CREATED: 'opportunity.created',
    PROJECT_CREATED: 'project.created',
} as const

export const WebhookEventTypeSchema_v0 = z.enum(Object.values(WebhookEvents))
export type WebhookEventType_v0 = z.infer<typeof WebhookEventTypeSchema_v0>

export const OpportunityStatuses_v0 = {
    new: 'new',
    inProgress: 'inProgress',
    done: 'done',
    archived: 'archived',
} as const
export const OpportunityStatusSchema_v0 = z.enum(
    Object.values(OpportunityStatuses_v0)
)
export type OpportunityStatus_v0 = z.infer<typeof OpportunityStatusSchema_v0>

export const OpportunityCreatedPayloadSchema_v0 = z.object({
    id: z.string(),
    organizationId: z.string(),
    organizationDomain: z.string().optional(),
    email: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    company: z.string().optional(),
    status: OpportunityStatusSchema_v0.optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
    customFields: z.unknown().optional(),
})
export type OpportunityCreatedPayload_v0 = z.infer<
    typeof OpportunityCreatedPayloadSchema_v0
>

export const ProjectCreatedPayloadSchema_v0 = z.object({
    id: z.string(),
    name: z.string(),
    organizationId: z.string(),
    address: z.string().optional(),
    createdAt: z.number().optional(),
})
export type ProjectCreatedPayload_v0 = z.infer<
    typeof ProjectCreatedPayloadSchema_v0
>

export const OpportunityCreatedEventSchema_v0 = z.object({
    event: z.literal(WebhookEvents.OPPORTUNITY_CREATED),
    timestamp: WebhookTimestampSchema_v0,
    data: OpportunityCreatedPayloadSchema_v0,
})
export type OpportunityCreatedEvent_v0 = z.infer<
    typeof OpportunityCreatedEventSchema_v0
>

export const ProjectCreatedEventSchema_v0 = z.object({
    event: z.literal(WebhookEvents.PROJECT_CREATED),
    timestamp: WebhookTimestampSchema_v0,
    data: ProjectCreatedPayloadSchema_v0,
})
export type ProjectCreatedEvent_v0 = z.infer<
    typeof ProjectCreatedEventSchema_v0
>

export const KnownWebhookEventSchema_v0 = z.discriminatedUnion('event', [
    OpportunityCreatedEventSchema_v0,
    ProjectCreatedEventSchema_v0,
])
export type KnownWebhookEvent_v0 = z.infer<typeof KnownWebhookEventSchema_v0>

export const UnknownWebhookEventSchema_v0 = z.object({
    event: z.string(),
    timestamp: WebhookTimestampSchema_v0,
    data: z.unknown(),
})
export type UnknownWebhookEvent_v0 = z.infer<
    typeof UnknownWebhookEventSchema_v0
>

export type WebhookEvent_v0 = KnownWebhookEvent_v0 | UnknownWebhookEvent_v0
