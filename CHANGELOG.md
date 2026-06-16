# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Pre-1.0 / unstable.** While this project is on `0.x`, breaking changes ship in
> **minor** bumps (`0.x.0`) and are listed under a **Breaking Changes** heading. Patch
> bumps (`0.x.y`) are backwards-compatible. See [Versioning & stability](./README.md#versioning--stability).

## [Unreleased]

### Breaking Changes

-

## [0.1.15] - 2026-04-29

### Added

- `constructWebhookEvent` for verifying and parsing incoming HVAKR webhooks
- `HVAKRWebhookError` thrown on signature, payload, or timestamp failures
- Webhook event types and payload schemas: `WebhookEvents`, `WebhookEvent_v0`, `OpportunityCreatedPayload_v0`, `ProjectCreatedPayload_v0`

### Changed

- Normalize trailing slashes in `baseUrl` and URL-encode request path/query values

## [0.1.9] - 2025-01-17

### Changed

- Updated Zod dependency to 4.3.5

## [0.1.8] - 2025-01-16

### Changed

- Refactored HVAKRClient to centralize authorization headers

## [0.1.7] - 2025-01-15

### Fixed

- Updated profilePicture schema to allow nullish values

## [0.1.6] - 2025-01-14

### Added

- New ventilation method to systems

### Fixed

- Test improvements for project ID handling

## [0.1.5] - 2025-01-13

### Changed

- Removed Zod customs for better JSON schema compatibility

## [0.1.4] - 2025-01-12

### Changed

- Updated dependencies

## [0.1.3] - 2025-01-11

### Added

- LICENSE file (MIT)
- GitHub workflows for build and publish
- Homepage and repository information in package.json

### Changed

- Updated README documentation

## [0.1.2] - 2025-01-10

### Changed

- Minor README updates
- Added prettier as dev dependency

## [0.1.1] - 2025-01-09

### Changed

- Updated geometry and box schemas
- Refactored: Moved example data to fixtures

## [0.1.0] - 2025-01-08

### Added

- Initial release
- Full TypeScript support with type definitions
- HVAKR API client with methods for projects, weather stations
- Zod schema validation for API responses
- Support for both ESM and CommonJS
