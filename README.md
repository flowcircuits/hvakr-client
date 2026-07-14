# HVAKR SDK for TypeScript/JavaScript

<img alt="HVAKR Icon" src="https://www.hvakr.com/HVAKRIcon.png" width="64" />

**A simple and easy to use client for the [HVAKR API](https://api.hvakr.com/v0/docs/).**

![Build status](https://github.com/flowcircuits/hvakr-client/actions/workflows/build.yml/badge.svg)
[![npm version](https://badge.fury.io/js/%40hvakr%2Fclient.svg)](https://www.npmjs.com/package/@hvakr/client)

> [!WARNING]
> **Unstable API.** HVAKR is pre-1.0 (`v0`). Response shapes, method arguments, and
> exported types may change in **any** release while we iterate. We do not maintain
> older versions in parallel — when we ship a breaking change, everyone upgrades.
>
> Breaking changes ship in **minor** version bumps (`0.x.0`); patches (`0.x.y`) are
> backwards-compatible fixes. Pin an exact version (e.g. `@hvakr/client@0.1.16`) if you
> need stability, and read the [CHANGELOG](./CHANGELOG.md) before upgrading.

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
const { projects } = await hvakr.listProjects()
```

> [!NOTE]
> See the complete list of endpoints in the [API reference](https://api.hvakr.com/v0/docs/).

Each method returns a `Promise` that resolves the response.

```ts
console.log(projects)
```

```ts
;[
    {
        id: '5c6a2821-6bb1-4a7e-b6e1-c50111515c3d',
        name: 'Office Retrofit',
        number: '2024-014',
        address: 'Mansfield, TX, USA',
        status: 'inProgress',
        projectType: 'commercial',
        timestamp: 1714405200000,
        lastOpenTime: 1717084800000,
    },
    // ...
]
```

`listProjects()` is paginated. Pass `limit` to control the page size, and follow
`nextCursor` while `hasMore` is `true` to page through every project.

```ts
const allProjects = []
let cursor: string | undefined

while (true) {
    const page = await hvakr.listProjects({ limit: 50, cursor })
    allProjects.push(...page.projects)
    if (!page.hasMore || !page.nextCursor) break
    cursor = page.nextCursor
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

### Version reporting

The client sends its version to the API on every request (`X-HVAKR-Client:
hvakr-client-ts/<version>`). If your installed version is behind the minimum the
API still supports, the response carries an `X-HVAKR-Client-Warning` header and
the client logs a one-time `console.warn` telling you to upgrade — useful because
breaking changes ship in minor bumps (see [Versioning & stability](#versioning--stability)).

## API Reference

### Projects

| Method                                                              | Description                                                                                                                                                                        |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listProjects({ limit?, cursor?, search?, status?, projectType? })` | List a page of projects accessible to the authenticated user. Page with `nextCursor` while `hasMore`. Optional `search` (name/number/address), `status`, and `projectType` filters |
| `getProject(id, expand?)`                                           | Get a project by ID. Set `expand: true` for full project data, or pass an array of subcollection keys (e.g. `['spaces', 'zones']`) to expand only those                            |
| `createProject(data, opts?)`                                        | Create a new project                                                                                                                                                               |
| `updateProject(id, data, opts?)`                                    | Update an existing project                                                                                                                                                         |
| `deleteProject(id)`                                                 | Delete a project                                                                                                                                                                   |
| `getProjectCalculations(id, { include? })`                          | Run the calculator and return the requested sections (`loads`, `register_schedule`, `dryside_graph`, `ventilation`, `equipment`, `checksums`, `airflows`). Omit `include` for all. |

### Jobs

| Method                       | Description                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `createJob(id, body, opts?)` | Create a job (`report`, `auto-group`, `check`, or `auto-takeoff`). Sync jobs return `status: "completed"`; async jobs return `queued` |
| `getJob(id, jobId)`          | Get a job's current state. Poll async jobs until `status` leaves `queued`/`running`                                                   |

### Products

| Method                                       | Description                                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `listProducts({ search?, limit?, cursor? })` | List a page of products accessible to the authenticated user (read-only). Page with `nextCursor` while `hasMore`. Filter by `search` |
| `getProduct(id)`                             | Get a single product by ID                                                                                                           |

Like `listProjects`, `listProducts` is paginated — it returns
`{ products, hasMore, nextCursor }`; page with `nextCursor` while `hasMore`.

### Equipment modes and calculations

Since `0.6.0`, projects use a shared `equipmentModes` registry. System and zone
equipment configuration is stored under `equipmentConfig`, with an ordered
component list and per-mode component configuration:

```ts
import {
    ComponentTypes_v0,
    DEFAULT_COOLING_MODE_ID_v0,
    OutsideAirMethods_v0,
} from '@hvakr/client'

const system = {
    equipmentConfig: {
        components: [{ id: 'oa', type: ComponentTypes_v0.OUTSIDE_AIR_INTAKE }],
        componentConfigsByMode: {
            [DEFAULT_COOLING_MODE_ID_v0]: {
                oa: {
                    enabled: true,
                    configuration: {
                        componentType: ComponentTypes_v0.OUTSIDE_AIR_INTAKE,
                        method: OutsideAirMethods_v0.SUM_OF_SPACES,
                    },
                },
            },
        },
    },
}
```

Space design overrides live under `designAirflowsByMode`; ventilation and
infiltration requirements live under `airflowRequirementsByLoadCondition`.
Calculation sections remain selectable with `include`, while airflow,
checksum, and equipment results are keyed by the project's mode ids.

See the [`0.6.0` migration table](./CHANGELOG.md#060---2026-07-13) for the
complete field mapping. The API path remains `/v0`.

### Account

| Method | Description                                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `me()` | Return the authenticated caller's identity, organization memberships, plan, and rate-limit budget. A good first call to confirm auth |

Write methods (`createProject`, `updateProject`, `createJob`) accept an optional
`opts` argument with an `idempotencyKey` — retrying a request with the same key
returns the original result instead of performing the action twice.

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

## Versioning & stability

This SDK is **pre-1.0** and the API it wraps is still evolving. We deliberately stay on
`0.x` so we can move quickly, and we follow the [SemVer](https://semver.org/) `0.x`
convention:

| Bump              | Example             | Meaning                                                                     |
| ----------------- | ------------------- | --------------------------------------------------------------------------- |
| **Minor** `0.x.0` | `0.1.16` → `0.2.0`  | **Breaking change** — response shapes, arguments, or exported types changed |
| **Patch** `0.x.y` | `0.1.16` → `0.1.17` | Backwards-compatible fix or addition                                        |

We do **not** version the API path beyond `v0` or run multiple API versions in parallel.
There is one current version; breaking changes apply to everyone. When the API surface
stabilizes, we will cut a `1.0.0` release and adopt standard SemVer guarantees.

**What this means for you:**

- Every breaking change is documented under its version in the [CHANGELOG](./CHANGELOG.md).
- If you depend on stability, pin an exact version (`@hvakr/client@0.1.16`) rather than a
  range, and upgrade deliberately after reading the changelog.
- A default caret range (`^0.1.0`) will **not** auto-upgrade you across a breaking minor
  bump, so you stay on a compatible line until you opt in.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and contribution guidelines.

## Getting help

If you want to submit a feature request or are experiencing any issues with the API, please contact HVAKR support at [support@hvakr.com](mailto://support@hvakr.com)
