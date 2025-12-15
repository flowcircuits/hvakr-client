# HVAKR Javascript/Typescript Client

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

### TypeScript

This package contains type definitions for all request parameters and responses.

```ts
import {
    HVAKRClient,
    HVAKRClientError,
    // Project types
    Project_v0,
    ExpandedProject_v0,
    ExpandedProjectPost_v0,
    ExpandedProjectPatch_v0,
    // Output types
    APIProjectOutputLoads_v0,
    APIProjectOutputDrySideGraph,
    APIProjectOutputRegisterSchedule_v0,
    // Weather station types
    WeatherStationData_v0,
    // Revit integration types
    RevitData_v0,
} from '@hvakr/client'
```

The client methods are fully typed with overloads for different return types:

```ts
// Returns Project_v0
const project = await hvakr.getProject(projectId)

// Returns ExpandedProject_v0
const expandedProject = await hvakr.getProject(projectId, true)

// Returns APIProjectOutputLoads_v0
const loads = await hvakr.getProjectOutputs(projectId, 'loads')

// Returns APIProjectOutputDrySideGraph
const graph = await hvakr.getProjectOutputs(projectId, 'dryside_graph')

// Returns APIProjectOutputRegisterSchedule_v0
const schedule = await hvakr.getProjectOutputs(projectId, 'register_schedule')
```

### Revit integration

The client supports direct Revit data payloads for project creation and updates:

```ts
// Create project from Revit data
const { id } = await hvakr.createProject(revitData, true)

// Update project with Revit data
await hvakr.updateProject(projectId, revitData, true)
```

## Requirements

This package supports the following minimum versions:

- Runtime: `node >= 22`
- Type definitions (optional): `typescript >= 5.9`

## Getting help

If you want to submit a feature request or are experiencing any issues with the API platform, please contact HVAKR support at [support@hvakr.com](mailto://support@hvakr.com)
