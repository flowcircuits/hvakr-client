# HVAKR SDK for TypeScript/JavaScript

<img alt="HVAKR Icon" src="https://www.hvakr.com/HVAKRIcon.png" width="64" />

**A simple and easy to use client for the [HVAKR API](https://api.hvakr.com/v0/docs/).**

![Build status](https://github.com/flowcircuits/hvakr-client/actions/workflows/build.yml/badge.svg)
[![npm version](https://badge.fury.io/js/%40hvakr%2Fclient.svg)](https://www.npmjs.com/package/@hvakr/client)

## Installation

```bash
npm install @hvakr/client
```

## Usage

> [!NOTE]
> You can get an access token from HVAKR with a Professional or Enterprise license at [HVAKR -> Settings -> Access Tokens](https://app.hvakr.com/settings/access-tokens)

Import and initialize a client using an access token.

```ts
import { HVAKRClient } from '@hvakr/client'

// Initializing a client
const hvakr = new HVAKRClient({
    accessToken: process.env.HVAKR_ACCESS_TOKEN,
    version: 'v0',
})
```

Make a request to any HVAKR API endpoint.

```ts
const projects = await hvakr.listProjects()
```

> [!NOTE]
> See the complete list of endpoints in the [API reference](https://api.hvakr.com/v0/docs/).

Each method returns a `Promise` that resolves the response.

```ts
console.log(projects)
```

```ts
{
    ids: [
        '5c6a2821-6bb1-4a7e-b6e1-c50111515c3d',
        '897e5a76-ae52-4b48-9fdf-e71f5945d1af',
        // ...
    ]
}
```

### Handling errors

If the API returns an unsuccessful response, the returned `Promise` rejects with a `HVAKRClientError`.

The error contains a `message` with the HTTP status code and optional `metadata` with additional details from the response.

```ts
import { HVAKRClient, HVAKRClientError } from '@hvakr/client'

try {
    const hvakr = new HVAKRClient({
        accessToken: process.env.HVAKR_ACCESS_TOKEN,
    })
    const project = await hvakr.getProject(projectId)
} catch (error) {
    if (error instanceof HVAKRClientError) {
        console.error('API Error:', error.message)
        console.error('Details:', error.metadata)
    } else {
        // Other error handling code
        console.error(error)
    }
}
```

### Client options

The `HVAKRClient` supports the following options on initialization. These options are all keys in the single constructor parameter.

| Option        | Default value             | Type     | Description                                                                            |
| ------------- | ------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `accessToken` | —                         | `string` | **Required.** Access token for authentication. Obtain from your HVAKR account.         |
| `baseUrl`     | `"https://api.hvakr.com"` | `string` | The root URL for sending API requests. This can be changed to test with a mock server. |
| `version`     | `"v0"`                    | `string` | The API version to use.                                                                |

## API Reference

### Projects

| Method                                   | Description                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| `listProjects()`                         | List all project IDs accessible to the authenticated user                 |
| `getProject(id, expand?)`                | Get a project by ID. Set `expand: true` for full project data             |
| `createProject(data, revitPayload?)`     | Create a new project                                                      |
| `updateProject(id, data, revitPayload?)` | Update an existing project                                                |
| `deleteProject(id)`                      | Delete a project                                                          |
| `getProjectOutputs(id, type)`            | Get calculated outputs (`loads`, `dryside_graph`, or `register_schedule`) |

### Weather Stations

| Method                            | Description                           |
| --------------------------------- | ------------------------------------- |
| `searchWeatherStations(lat, lng)` | Find weather stations near a location |
| `getWeatherStation(id)`           | Get detailed weather station data     |

## Receiving webhooks

HVAKR can deliver real-time event notifications to an HTTPS endpoint you control. Each request includes an `X-HVAKR-Event` header and is signed with HMAC-SHA256 in the `X-HVAKR-Signature` header using a secret you receive when the webhook is created. Use `constructWebhookEvent` to verify the signature and parse the event in one step.

```ts
import { constructWebhookEvent, HVAKRWebhookError } from '@hvakr/client'

// Express example. Use a raw-body parser so the signature still matches —
// re-stringifying a parsed object will change the bytes.
app.post(
    '/webhooks/hvakr',
    express.raw({ type: 'application/json' }),
    (req, res) => {
        try {
            const event = constructWebhookEvent({
                payload: req.body, // Buffer of the raw bytes
                signature: req.header('X-HVAKR-Signature')!,
                secret: process.env.HVAKR_WEBHOOK_SECRET!,
            })

            switch (event.event) {
                case 'project.created':
                    console.log('New project:', event.data.id)
                    break
                case 'opportunity.created':
                    console.log('New opportunity:', event.data.email)
                    break
            }

            res.status(204).end()
        } catch (err) {
            if (err instanceof HVAKRWebhookError) {
                return res.status(400).send(err.message)
            }
            throw err
        }
    }
)
```

By default, `constructWebhookEvent` only accepts event types and payload shapes that this SDK version knows about, so TypeScript can narrow `event.data` safely inside each `case`. If you need forward compatibility with newer event types, pass `allowUnknownEvents: true` and validate `event.data` yourself for unknown events.

`constructWebhookEvent` throws `HVAKRWebhookError` when the signature is invalid, the payload is malformed, the event payload does not match the expected schema, or the timestamp is outside a 300-second tolerance window (configurable via the `tolerance` option).

See the [API reference](https://api.hvakr.com/v0/docs/) for the current API documentation.

## TypeScript

This SDK is written in TypeScript and includes full type definitions. All API responses are typed using [Zod](https://zod.dev) schemas.

```ts
import { HVAKRClient, ExpandedProject_v0 } from '@hvakr/client'

const hvakr = new HVAKRClient({ accessToken: process.env.HVAKR_ACCESS_TOKEN })

// TypeScript knows this is ExpandedProject_v0
const project = await hvakr.getProject('project-id', true)
```

## See Also

- [hvakr-python](https://github.com/flowcircuits/hvakr-python) - HVAKR SDK for Python

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and contribution guidelines.

## Getting help

If you want to submit a feature request or are experiencing any issues with the API, please contact HVAKR support at [support@hvakr.com](mailto://support@hvakr.com)
