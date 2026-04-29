import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { constructWebhookEvent, HVAKRWebhookError } from './webhooks'
import type { KnownWebhookEvent_v0, WebhookEvent_v0 } from './schemas'

const SECRET = 'whsec_test_abc123'

const sign = (body: string, secret: string = SECRET) =>
    `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`

const buildBody = (
    event: string,
    data: unknown,
    timestamp: string = new Date().toISOString()
) => JSON.stringify({ event, timestamp, data })

describe('constructWebhookEvent', () => {
    it('verifies a valid signature and returns the parsed event', () => {
        const body = buildBody('project.created', {
            id: 'proj_123',
            name: 'Test',
            organizationId: 'org_1',
        })
        const event = constructWebhookEvent({
            payload: body,
            signature: sign(body),
            secret: SECRET,
        })
        expect(event.event).toBe('project.created')
        if (event.event === 'project.created') {
            expect(event.data.id).toBe('proj_123')
            expect(event.data.organizationId).toBe('org_1')
        }
    })

    it('accepts a Buffer payload', () => {
        const body = buildBody('project.created', {
            id: 'proj_123',
            name: 'Test',
            organizationId: 'org_1',
        })
        const event = constructWebhookEvent({
            payload: Buffer.from(body),
            signature: sign(body),
            secret: SECRET,
        })
        expect(event.event).toBe('project.created')
    })

    it('rejects a body that has been mutated after signing', () => {
        const body = buildBody('project.created', {
            id: 'proj_123',
            name: 'Test',
            organizationId: 'org_1',
        })
        const signature = sign(body)
        const tampered = body.replace('proj_123', 'proj_456')
        expect(() =>
            constructWebhookEvent({
                payload: tampered,
                signature,
                secret: SECRET,
            })
        ).toThrow(HVAKRWebhookError)
    })

    it('rejects a signature signed with the wrong secret', () => {
        const body = buildBody('project.created', {
            id: 'proj_123',
            name: 'Test',
            organizationId: 'org_1',
        })
        expect(() =>
            constructWebhookEvent({
                payload: body,
                signature: sign(body, 'whsec_wrong'),
                secret: SECRET,
            })
        ).toThrow(/Invalid webhook signature/)
    })

    it('rejects a malformed signature header', () => {
        const body = buildBody('project.created', {
            id: 'proj_123',
            name: 'Test',
            organizationId: 'org_1',
        })
        expect(() =>
            constructWebhookEvent({
                payload: body,
                signature: 'not-a-valid-signature',
                secret: SECRET,
            })
        ).toThrow(/Invalid webhook signature/)
    })

    it('rejects a payload that is not valid JSON', () => {
        const body = '{ not json'
        expect(() =>
            constructWebhookEvent({
                payload: body,
                signature: sign(body),
                secret: SECRET,
            })
        ).toThrow(/not valid JSON/)
    })

    it('rejects a payload missing required fields', () => {
        const body = JSON.stringify({ hello: 'world' })
        expect(() =>
            constructWebhookEvent({
                payload: body,
                signature: sign(body),
                secret: SECRET,
            })
        ).toThrow(/missing required fields/)
    })

    it('rejects a known event whose data does not match the expected schema', () => {
        const body = buildBody('project.created', {
            id: 123,
            organizationId: 'org_1',
        })
        expect(() =>
            constructWebhookEvent({
                payload: body,
                signature: sign(body),
                secret: SECRET,
            })
        ).toThrow(/does not match the event schema/)
    })

    it('rejects an event older than the tolerance window', () => {
        const old = new Date(Date.now() - 10 * 60 * 1000).toISOString()
        const body = buildBody(
            'project.created',
            { id: 'proj_123', name: 'Test', organizationId: 'org_1' },
            old
        )
        expect(() =>
            constructWebhookEvent({
                payload: body,
                signature: sign(body),
                secret: SECRET,
                tolerance: 300,
            })
        ).toThrow(/tolerance window/)
    })

    it('accepts an old event when tolerance is disabled', () => {
        const old = new Date(Date.now() - 10 * 60 * 1000).toISOString()
        const body = buildBody(
            'project.created',
            { id: 'proj_123', name: 'Test', organizationId: 'org_1' },
            old
        )
        const event = constructWebhookEvent({
            payload: body,
            signature: sign(body),
            secret: SECRET,
            tolerance: 0,
        })
        expect(event.event).toBe('project.created')
    })

    it('rejects an invalid timestamp even when tolerance is disabled', () => {
        const body = buildBody(
            'project.created',
            { id: 'proj_123', name: 'Test', organizationId: 'org_1' },
            'not-a-timestamp'
        )
        expect(() =>
            constructWebhookEvent({
                payload: body,
                signature: sign(body),
                secret: SECRET,
                tolerance: 0,
            })
        ).toThrow(/timestamp is not a valid date/)
    })

    it('rejects unknown event types by default', () => {
        const body = buildBody('future.event.added.later', { foo: 'bar' })
        expect(() =>
            constructWebhookEvent({
                payload: body,
                signature: sign(body),
                secret: SECRET,
            })
        ).toThrow(/Unsupported webhook event type/)
    })

    it('accepts unknown event types when explicitly allowed', () => {
        const body = buildBody('future.event.added.later', { foo: 'bar' })
        const event = constructWebhookEvent({
            payload: body,
            signature: sign(body),
            secret: SECRET,
            allowUnknownEvents: true,
        })
        expect(event.event).toBe('future.event.added.later')
        expect(event.data).toEqual({ foo: 'bar' })
    })

    it('returns a discriminated union for known events by default', () => {
        const body = buildBody('project.created', {
            id: 'proj_123',
            name: 'Test',
            organizationId: 'org_1',
        })
        const event: KnownWebhookEvent_v0 = constructWebhookEvent({
            payload: body,
            signature: sign(body),
            secret: SECRET,
        })

        if (event.event === 'project.created') {
            expect(event.data.organizationId).toBe('org_1')
        }
    })

    it('returns the broader event type when unknown events are allowed', () => {
        const body = buildBody('future.event.added.later', { foo: 'bar' })
        const event: WebhookEvent_v0 = constructWebhookEvent({
            payload: body,
            signature: sign(body),
            secret: SECRET,
            allowUnknownEvents: true,
        })

        expect(event.data).toEqual({ foo: 'bar' })
    })
})
