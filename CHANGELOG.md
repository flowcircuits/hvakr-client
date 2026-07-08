# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Pre-1.0 / unstable.** While this project is on `0.x`, breaking changes ship in
> **minor** bumps (`0.x.0`) and are listed under a **Breaking Changes** heading. Patch
> bumps (`0.x.y`) are backwards-compatible. See [Versioning & stability](./README.md#versioning--stability).

## [0.4.0] - 2026-07-07

### Breaking Changes

- Replaced `getProjectOutputs(id, type)` (one output type per call) with
  `getProjectCalculations(id, { include? })`, which runs the calculator once and
  returns any of `loads`, `register_schedule`, `dryside_graph`, `ventilation`,
  `equipment`, `checksums`, and `airflows` (plus `errors` and `flags`) in a single
  response. Omit `include` to return every section. The old per-output schema
  exports (`APIProjectOutputLoadsSchema`, `APIProjectOutputDrySideGraphSchema`,
  `APIProjectOutputRegisterScheduleSchema`) are removed; the output types now live
  under `calculations_v0` / `calculator_v0`.
- Removed the weather-station endpoints `searchWeatherStations` and
  `getWeatherStation`, along with the `WeatherStationData_v0` export. Projects still
  carry their resolved `weatherSpec` (the `CoolingPercentSchema_v0` /
  `HeatingPercentSchema_v0` percentiles remain exported).
- Removed the Revit ingestion endpoints `createProjectFromRevit` and
  `updateProjectFromRevit`, the `createRevitURL` helper, and the `RevitData_v0`
  schema. The persisted `revitId` field and the `API_REVIT` space creation source
  are unchanged.

### Added

- `createJob(id, body, opts?)` and `getJob(id, jobId)` — one uniform job resource
  covering `report`, `auto-group`, `check`, and `auto-takeoff`. Sync jobs return
  `status: "completed"` with `result` populated; async jobs return `queued` — poll
  `getJob` until the status settles. Adds `APIJob_v0` and `APIJobCreate_v0`.
- `listProducts({ search? })` and `getProduct(id)` — read-only access to the product
  catalog (the organization's products plus public products). Adds `APIProduct_v0`.
- Idempotency for write methods: `createProject`, `updateProject`, and `createJob`
  accept an optional `opts.idempotencyKey`, sent as the `Idempotency-Key` header, so
  retrying a request returns the original result instead of repeating the action.
- Structured error envelope: `HVAKRClientError` now exposes the HTTP `status`
  alongside the parsed `metadata` body.
- New `schemas/api` namespace (`error_v0`, `jobs_v0`, `products_v0`, `reports_v0`).

### Changed

- Reorganized the output schemas into `calculations_v0` / `calculator_v0` and bumped
  dependencies.

## [0.3.1] - 2026-06-24

### Added

- Added `NCC` as a project template source on `TemplateSourceSchema_v0`. The
  `source` field on `ProjectData_v0` now accepts both `'ASHRAE'` and `'NCC'`.

## [0.3.0] - 2026-06-23

### Breaking Changes

- Renamed the space `customOutsideAirflow` field to `ventilationReq` on
  `SpaceData_v0`. There is no compatibility shim — rename the field when
  upgrading; the value semantics are unchanged.
- Renamed the space type `outsideAch` field to `ventilationAchReq` on
  `SpaceTypeData_v0`. There is no compatibility shim — rename the field when
  upgrading; the value semantics are unchanged.

## [0.2.0] - 2026-06-16

### Breaking Changes

- Replaced the space `roofDirection` field (legacy cardinal `EdgeExposure_v0`:
  `'N' | 'E' | 'S' | 'W'`) with a continuous `roofAzimuth` (`number`) on
  `SpaceData_v0`. The `EdgeExposureSchema_v0` export has been removed. There is no
  compatibility shim — convert cardinal directions to degrees (e.g. `N` → `0`,
  `E` → `90`, `S` → `180`, `W` → `270`) when upgrading.
- `listProjects()` is now paginated. It accepts optional `{ limit?, cursor? }` and
  returns `{ projects, hasMore, nextCursor }` instead of `{ ids }`. Each entry in
  `projects` is a summary (`id`, and optional `name`, `number`, `address`, `status`,
  `projectType`, `timestamp`, `lastOpenTime`). Page through results by passing
  `nextCursor` back as `cursor` while `hasMore` is `true`.
- Removed server-owned fields from the create/update request types
  (`ProjectPost_v0`, `ExpandedProjectPost_v0`, `ExpandedProjectPatch_v0`):
  `revision`, `revisions`, `timestamp`, `lastOpenTime`, `isHVAKRTemplate`,
  `isExample`, `fromExample`, `duplicatedFrom`. `isTemplate` and `status` remain
  writable.
- Project response types no longer expose the internal backend fields `isDeleted`
  and `_userEmails`.

### Added

- `status` field on projects (`ProjectStatus_v0`: `new`, `inProgress`, `inReview`,
  `done`, `archived`), writable on create and update.
- Exported list-response types `ProjectListItem_v0` and `ProjectListResponse_v0`.
- `WeatherStationData_v0` now models fields the API already returns: `id`,
  `localeClimateZone`, `tmyDataUrl`, and `tmyPeriod`.
- `OpportunityCreatedPayload_v0` now includes `organizationId` (always sent) and the
  optional `status` (`OpportunityStatus_v0`: `new`, `inProgress`, `done`, `archived`)
  that the `opportunity.created` webhook already delivers.
- `ReportFileTypeSchema_v0` now includes `DOCX` and `ZIP` (was `PDF`/`CSV` only), and
  `ReportData_v0` now models the `error`, `notifyOnComplete`, `notifyOnCompleteEmail`,
  and `outputFileType` fields (plus `outputFileType` on the report template) that
  reports already carry.

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
