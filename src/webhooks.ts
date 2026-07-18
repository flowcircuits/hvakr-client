import { createHmac, timingSafeEqual } from 'node:crypto'
import { Buffer } from 'node:buffer'
import {
    KnownWebhookEventSchema_v0,
    type KnownWebhookEvent_v0,
    type WebhookEvent_v0,
    WebhookEvents,
    type UnknownWebhookEvent_v0,
    UnknownWebhookEventSchema_v0,
    WebhookTimestampSchema_v0,
} from './schemas/webhooks/webhooks_v0'

const DEFAULT_TOLERANCE_SECONDS = 300

/** Error thrown when an HVAKR webhook cannot be verified or parsed. */
export class HVAKRWebhookError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'HVAKRWebhookError'
    }
}

/** Options for {@link constructWebhookEvent}. */
export interface ConstructWebhookEventOptions {
    /**
     * The raw request body **as a string or Buffer**. Pass the bytes received
     * over the wire — re-stringifying a parsed JSON object will change the
     * byte sequence and invalidate the signature.
     */
    payload: string | Buffer
    /** Value of the `X-HVAKR-Signature` header. */
    signature: string
    /** Webhook signing secret from your HVAKR organization settings. */
    secret: string
    /**
     * Maximum allowed age of the webhook timestamp, in seconds. Protects
     * against replay attacks. Defaults to 300. Set to 0 to disable.
     */
    tolerance?: number
    /**
     * Whether to accept webhook event types that this SDK version does not
     * recognize yet. Defaults to false so the returned event remains a
     * discriminated union over the known event types.
     */
    allowUnknownEvents?: boolean
}

interface ConstructKnownWebhookEventOptions extends ConstructWebhookEventOptions {
    allowUnknownEvents?: false
}

interface ConstructAnyWebhookEventOptions extends ConstructWebhookEventOptions {
    allowUnknownEvents: true
}

/**
 * Verifies an HVAKR webhook signature and returns the parsed event.
 *
 * @example
 * ```ts
 * import { constructWebhookEvent, HVAKRWebhookError } from '@hvakr/client'
 *
 * try {
 *   const event = constructWebhookEvent({
 *     payload: rawBody,
 *     signature: req.headers['x-hvakr-signature'] as string,
 *     secret: process.env.HVAKR_WEBHOOK_SECRET!,
 *   })
 *   if (event.event === 'project.created') {
 *     console.log('New project:', event.data.id)
 *   }
 * } catch (err) {
 *   if (err instanceof HVAKRWebhookError) {
 *     return res.status(400).send(err.message)
 *   }
 *   throw err
 * }
 * ```
 *
 * @throws {HVAKRWebhookError} If the signature is malformed or invalid, the
 * payload is not valid JSON, the event payload does not match the expected
 * schema, or the timestamp is outside the tolerance window.
 */
export function constructWebhookEvent(
    options: ConstructKnownWebhookEventOptions
): KnownWebhookEvent_v0
export function constructWebhookEvent(
    options: ConstructAnyWebhookEventOptions
): WebhookEvent_v0
export function constructWebhookEvent({
    payload,
    signature,
    secret,
    tolerance = DEFAULT_TOLERANCE_SECONDS,
    allowUnknownEvents = false,
}: ConstructWebhookEventOptions): KnownWebhookEvent_v0 | WebhookEvent_v0 {
    const payloadBuffer = Buffer.isBuffer(payload)
        ? payload
        : Buffer.from(payload, 'utf8')
    const payloadString = payloadBuffer.toString('utf8')

    const expected = `sha256=${createHmac('sha256', secret).update(payloadBuffer).digest('hex')}`
    const expectedBuffer = Buffer.from(expected)
    const receivedBuffer = Buffer.from(signature)
    if (
        expectedBuffer.length !== receivedBuffer.length ||
        !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
        throw new HVAKRWebhookError('Invalid webhook signature')
    }

    let parsed: unknown
    try {
        parsed = JSON.parse(payloadString)
    } catch {
        throw new HVAKRWebhookError('Webhook payload is not valid JSON')
    }

    if (!parsed || typeof parsed !== 'object') {
        throw new HVAKRWebhookError(
            'Webhook payload is missing required fields'
        )
    }

    const candidate = parsed as {
        data?: unknown
        event?: unknown
        timestamp?: unknown
    }
    if (
        typeof candidate.event !== 'string' ||
        typeof candidate.timestamp !== 'string' ||
        !('data' in parsed)
    ) {
        throw new HVAKRWebhookError(
            'Webhook payload is missing required fields'
        )
    }

    if (!WebhookTimestampSchema_v0.safeParse(candidate.timestamp).success) {
        throw new HVAKRWebhookError('Webhook timestamp is not a valid date')
    }

    const genericEventResult = UnknownWebhookEventSchema_v0.safeParse(parsed)
    if (!genericEventResult.success) {
        throw new HVAKRWebhookError(
            'Webhook payload is missing required fields'
        )
    }

    const genericEvent = genericEventResult.data
    const knownEventNames = new Set<string>(Object.values(WebhookEvents))
    const isKnownEvent = knownEventNames.has(genericEvent.event)

    let event: KnownWebhookEvent_v0 | UnknownWebhookEvent_v0
    if (isKnownEvent) {
        const knownEventResult = KnownWebhookEventSchema_v0.safeParse(parsed)
        if (!knownEventResult.success) {
            throw new HVAKRWebhookError(
                'Webhook payload does not match the event schema'
            )
        }
        event = knownEventResult.data
    } else {
        if (!allowUnknownEvents) {
            throw new HVAKRWebhookError('Unsupported webhook event type')
        }
        event = genericEvent
    }

    if (tolerance > 0) {
        const eventTime = Date.parse(event.timestamp)
        if (Number.isNaN(eventTime)) {
            throw new HVAKRWebhookError('Webhook timestamp is not a valid date')
        }
        const ageSeconds = Math.abs(Date.now() - eventTime) / 1000
        if (ageSeconds > tolerance) {
            throw new HVAKRWebhookError(
                'Webhook timestamp is outside the tolerance window'
            )
        }
    }

    return event
}
