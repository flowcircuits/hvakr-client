# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Pre-1.0 / unstable.** While this project is on `0.x`, breaking changes ship in
> **minor** bumps (`0.x.0`) and are listed under a **Breaking Changes** heading. Patch
> bumps (`0.x.y`) are backwards-compatible. See [Versioning & stability](./README.md#versioning--stability).

## [0.11.0] - 2026-08-04

### Breaking Changes

- `SpaceDataSchema_v0.edges` is now optional. Real space documents can predate
  the field, so declaring it as a required `z.record(...)` let the type system
  hide a gap that consumers hit at runtime (`Object.values(space.edges)` throws
  on an edge-less document). `SpaceData_v0['edges']` is now
  `Record<string, Edge_v0> | undefined`; dereference it defensively (e.g.
  `Object.values(space.edges ?? {})`), matching the sibling geometry records
  `windows`, `doors`, and `skylights`, which were already optional.

## [0.10.0] - 2026-07-23

### Breaking Changes

- Central and terminal equipment now live in a top-level `equipment`
  subcollection instead of under `systems[id].equipmentConfig` and
  `zones[id].equipmentConfig`. `equipmentConfig` has been removed from
  `SystemDataSchema_v0` and `ZoneDataSchema_v0`; system/zone names, colors,
  `configured` flags, diversity data, and `zone.systemId` are unchanged.
- Each equipment document requires a `projectScope: { type: 'system' | 'zone';
id: string }` binding it to the system or zone it configures. The equipment
  document id is independent of the referenced system/zone id.
- There is now one canonical equipment shape. The
  `CentralUnitConfigurationSchema_v0` / `CentralUnitConfiguration_v0` and
  `TerminalUnitConfigurationSchema_v0` / `TerminalUnitConfiguration_v0` schemas
  and types are removed with no deprecated aliases. Their `dimensionData` and
  energy schemas are consolidated on `EquipmentDataSchema_v0`:
    - `dimensionData` merges central `length`/`width` and terminal `inletSize`
      into `EquipmentDimensionDataSchema_v0`.
    - `energyConfiguration` (`EnergyConfigurationSchema_v0`, with
      `EnergyScheduleSchema_v0` and `EquipmentEfficiencySchema_v0`) moves from
      `system_v0.ts` to `equipment_v0.ts`.
    - `TerminalUnitInletSizeSchema_v0` / `TERMINAL_UNIT_INLET_SIZES_v0` move from
      `zone_v0.ts` to `equipment_v0.ts`.
- `equipment` is added to `ProjectSubcollectionsSchema_v0` and flows through the
  writable, post, patch, and expanded project schemas,
  `PROJECT_SUBCOLLECTION_KEYS_V0`, `ProjectSubcollectionKey_v0`, and the
  generated JSON/OpenAPI schemas and declarations. Create and patch write
  schemas now reject nested legacy `systems.*.equipmentConfig` and
  `zones.*.equipmentConfig` rather than stripping them silently.

New exports: `EquipmentProjectScopeTypeSchema_v0` / `EquipmentProjectScopeType_v0`,
`EquipmentProjectScopeSchema_v0` / `EquipmentProjectScope_v0`, and
`EquipmentDimensionDataSchema_v0` / `EquipmentDimensionData_v0`.

- `UsageScheduleSchema_v0` is now an internal shared primitive
  (`misc/time_v0.ts`), consumed by both space types and equipment energy
  configuration, and is no longer a top-level package export. Its structure is
  unchanged and still reachable through `SpaceTypeData_v0['usageSchedule']` and
  `EnergySchedule_v0['occupiedHours']`.

#### Migration

```ts
// Before (0.9.0): equipment nested on systems/zones
const project = {
    systems: {
        'system-1': {
            name: 'AHU-1',
            equipmentConfig: {
                components: [...],
                dimensionData: { length: 60, width: 30 },
                energyConfiguration: { efficiency: { coolingSeer: 14 } },
            },
        },
    },
    zones: {
        'zone-1': {
            name: 'VAV-1',
            systemId: 'system-1',
            equipmentConfig: { dimensionData: { inletSize: '8' } },
        },
    },
}

// After (0.10.0): a top-level equipment record scoped by projectScope
const project = {
    systems: { 'system-1': { name: 'AHU-1', configured: true } },
    zones: {
        'zone-1': { name: 'VAV-1', configured: true, systemId: 'system-1' },
    },
    equipment: {
        'equipment-ahu-1': {
            projectScope: { type: 'system', id: 'system-1' },
            components: [...],
            dimensionData: { length: 60, width: 30 },
            energyConfiguration: { efficiency: { coolingSeer: 14 } },
        },
        'equipment-vav-1': {
            projectScope: { type: 'zone', id: 'zone-1' },
            dimensionData: { inletSize: '8' },
        },
    },
}
```

## [0.9.0] - 2026-07-21

### Breaking Changes

- Removed legacy project-as-template fields from the public contract: `isTemplate`,
  `isHVAKRTemplate`, `source`, `standardNumber`, and `standardYear` are no longer
  present on `ProjectDataSchema_v0`, `WritableProjectDataSchema_v0`,
  `ProjectPostSchema_v0`, `ExpandedProjectPostSchema_v0`,
  `ExpandedProjectPatchSchema_v0`, or their generated JSON Schemas/declarations.
- `TemplateSourceSchema_v0` and its inferred `TemplateSource_v0` export have been
  removed (no longer referenced after `source` removal).
- No template collection endpoints, `listTemplates`, `getTemplate`, or new template
  functionality is added. `climateZone` and unrelated template references (e.g.
  `templateProjectIds`, space-type auto-assignment template flags, report/export
  definitions) remain unchanged.

## [0.8.0] - 2026-07-16

### Breaking Changes

- Replaced the v0 API report resource with the export resource. Project
  expansion now uses `exports` instead of `reports`, and the public schemas and
  types are `APIExportSchema_v0`, `APIExport_v0`, and `APIExportStatusSchema_v0`.
  The removed report-named exports have no aliases or compatibility shims.
- Export-generation jobs now use `type: "export"` and `definition` instead of
  `type: "report"` and `template`. The job result is now
  `{ exportId, export? }` instead of `{ reportId, report? }`.
- Renamed the job-result schema and type to `APIExportJobResultSchema_v0` and
  `APIExportJobResult_v0`.
- Renamed database export schemas and types: `ReportDataSchema_v0` →
  `ExportDataSchema_v0`, `ReportFileTypeSchema_v0` → `ExportFileTypeSchema_v0`,
  `ReportTemplateSchema_v0` → `ExportDefinitionSchema_v0`,
  `ReportTemplateOptionSchema_v0` → `ExportDefinitionOptionSchema_v0`, and the
  matching inferred types. The export definition field is now `definition`
  instead of `template`.
- `APIJobCreateTypes_v0.report` is now `APIJobCreateTypes_v0.export` (the
  constant object remains exported for create-only job kinds).

### Added

- `APIExportDefinitionIdSchema_v0`, `APIExportDefinitionId_v0`, and
  `APIExportDefinitionIds_v0`, covering `load-calculation`, `basis-of-design`,
  `ventilation-csv`, and `hourly-loads-csv`.
- The public export schema includes export identity, name, generation status,
  creation date, optional signed download URL, output file type, and progress.
- Export file types include XML and JSON, and export definitions preserve
  optional P.E. and preliminary cover-stamp settings.

### Notes

- Project analytics still expose `hasReports` on the wire; that field name is
  unchanged in this release.

## [0.7.0] - 2026-07-16

### Breaking Changes

- Project create and patch schemas are now strict: unknown keys are rejected
  instead of being silently stripped. Payloads carrying fields outside the
  writable schema (including server-owned fields) will no longer validate.
- Project create no longer accepts `sheetFiles`; sheet-file creation stays in
  the dedicated upload flow. `sheetFiles[id].name` remains writable through
  project patches.
- The `PROJECT_SERVER_CONTROLLED_WRITE_FIELDS_V0` and
  `PROJECT_RESTRICTED_WRITE_FIELDS_V0` exports are now identical compatibility
  views derived from schema metadata, `PROJECT_PRIVATE_READ_FIELDS_V0` is now
  empty, and `WritableProjectSubcollectionsSchema_v0` is derived from the
  canonical subcollections schema. Their shapes and contents have changed.

### Added

- Project reads now expose all canonical project fields, including computed,
  organization, analytics, automation, coordinate, deletion, and payment state.
- Project schemas carry `disableUserWrite: true` Zod metadata for server-owned
  root and nested fields. Omitted metadata means the field is normally writable.
- Projects support flat, user-writable `metadata` with string, number, or
  boolean values for external IDs and other application-specific context.
- `SheetFileData_v0.name`, PDF metadata, and processing error fields now match
  the canonical sheet-file response.

### Fixed

- Project create and patch schemas recursively reject server-owned fields such
  as coordinates, trigger timestamps, processing state, reports, and sheet-file
  upload metadata instead of maintaining separate field registries.
- Existing project-field-list exports remain available as compatibility views
  derived from the schema metadata rather than independent policy definitions.

## [0.6.1] - 2026-07-14

### Added

- `createSheetFile(projectId, { file, fileName, name? }, opts?)` uploads one PDF
  through multipart form data and returns a `sheet-upload` job. It preflights the
  API's 30 MiB limit, preserves the supplied filename, and supports idempotency.
- `sheet-upload` is now a response-only API job kind. Its discriminated result
  includes the uploaded file, placement counts, takeoff readiness, and actionable
  per-page processing state. JSON `createJob` requests remain limited to the
  existing report, auto-group, check, and auto-takeoff job kinds.

## [0.6.0] - 2026-07-13

### Breaking Changes

- Replaced the legacy central/terminal equipment fields with the modular,
  mode-keyed equipment model from HVAKR's advanced equipment configuration
  release. `SystemData_v0.centralUnitConfiguration` and
  `ZoneData_v0.terminalUnitConfiguration` are removed; use `equipmentConfig`
  with an ordered `components` registry and `componentConfigsByMode`.
- Added required `ProjectData_v0.equipmentModes`, keyed by mode id. Project
  creation may omit it to receive the default `cooling_mode` and `heating_mode`
  registry.
- Replaced flat space design-airflow fields (`customSupply`, `customReturn`,
  `customExhaust`, `airTransferIn`, and `airTransferOut`) with
  `designAirflowsByMode`. Moved ventilation and infiltration overrides into
  `airflowRequirementsByLoadCondition`; removed the separate flat winter
  override fields.
- Calculation `airflows`, `checksums`, and `equipment` payloads now preserve
  arbitrary project modes instead of collapsing them into `cooling` and
  `heating`. Removed the legacy load-condition airflow/checksum, flattened coil,
  and psychrometric output schemas. The `/v0` route and calculation section
  selectors are unchanged.
- Removed legacy equipment-config schemas and supporting exports without
  deprecated aliases or runtime adapters. Replacement schemas use their clean
  canonical names (`CentralUnitConfigurationSchema_v0` and
  `TerminalUnitConfigurationSchema_v0`); no `NEW_*` names are exported.

### Added

- Modular equipment component schemas for outside-air and return-air intakes,
  energy recovery, cooling/heating coils, equipment inefficiency, equipment
  inlets/outlets, component registries, per-mode configuration, and equipment
  mode definitions.
- `EquipmentLinkDataSchema_v0`, `LoadConditionSchema_v0`,
  `EquipmentModesSchema_v0`, and default equipment-mode ids/data.
- Canonical mode-keyed calculator schemas, including equipment pipeline IO,
  per-mode summaries, airflow differentials and supply sources, and mode-keyed
  scope/equipment checksums.

### Migration

| 0.5.x                                                  | 0.6.0                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| `system.centralUnitConfiguration`                      | `system.equipmentConfig`                                            |
| `zone.terminalUnitConfiguration`                       | `zone.equipmentConfig`                                              |
| `space.customSupply/customReturn/customExhaust`        | `space.designAirflowsByMode[modeId].supplyAir/returnAir/exhaustAir` |
| `space.airTransferIn/airTransferOut`                   | `space.designAirflowsByMode[modeId].airTransferIn/airTransferOut`   |
| Flat `space.ventilationReq` and infiltration overrides | `space.airflowRequirementsByLoadCondition.COOLING/HEATING`          |
| `airflows.design/required.cooling/heating`             | `airflows.byMode[modeId].design/required`                           |
| `checksums.cooling/heating`                            | `checksums[modeId]`                                                 |
| `equipment.coil/psychrometrics`                        | `equipment.modes[modeId].pipeline/summary`                          |

Removed schema exports map as follows:

| Removed in 0.6.0                                                                                                                                           | Replacement                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SupplyAirDataSchema_v0`, `CoolingCoilDataSchema_v0`, `HeatingCoilDataSchema_v0`, `ReturnAirDataSchema_v0`, `OutsideAirDataSchema_v0`                      | Component schemas in `equipment_v0`, including `CoolingCoilSchema_v0`, `HeatingCoilSchema_v0`, `ReturnAirIntakeSchema_v0`, and `OutsideAirIntakeSchema_v0` |
| `TerminalUnitOutsideAirDataSchema_v0`, `TerminalUnitSupplyAirDataSchema_v0`                                                                                | `EquipmentInletSchema_v0` and the component schemas above                                                                                                  |
| `LoadConditionAirflowsSchema_v0`, `DesignLoadConditionAirflowsSchema_v0`, `RequiredLoadConditionAirflowsSchema_v0`                                         | `ModeAirflowsSchema_v0` and `ProjectScopeAirflowsSchema_v0`                                                                                                |
| `CoolingChecksumsSchema_v0`, `HeatingChecksumsSchema_v0`, `ScopeCoolingChecksumsSchema_v0`                                                                 | `ModeChecksumsSchema_v0` and `ScopeModeChecksumsSchema_v0`                                                                                                 |
| `CoilOutputsSchema_v0`, `AirStatePsychrometricsSchema_v0`, `EquipmentCoilOutputsSchema_v0`, `EquipmentPsychrometricsSchema_v0`, `EquipmentOutputSchema_v0` | `EquipmentModeCalculationsSchema_v0`, `EquipmentCalculationsSchema_v0`, and `EquipmentSectionOutputSchema_v0`                                              |

## [0.5.0] - 2026-07-08

### Breaking Changes

- `listProducts` is now paginated and returns `{ products, hasMore, nextCursor }`
  (`ProductListResponse_v0`) instead of a bare `APIProduct_v0[]`, matching
  `listProjects`. It also accepts `limit` and `cursor`. Update callers from
  `const products = await client.listProducts()` to
  `const { products } = await client.listProducts()`.

### Added

- `me()` — returns the authenticated caller's identity, organization memberships,
  plan, and rate-limit budget. A good first call to confirm auth and capabilities.
  Adds `MeResponseSchema_v0` / `APIMe_v0`.
- `listProjects` gains optional `search` (name/number/address), `status`, and
  `projectType` filters. Exports the `ProjectType_v0` type.
- `sidewall` added to `RegisterModelTypes_v0`, widening the register-schedule
  `modelType` to match the platform.
- The client now sends `X-HVAKR-Client: hvakr-client-ts/<version>` on every
  request. When the API reports the version as outdated (via an
  `X-HVAKR-Client-Warning` response header), the client logs a one-time upgrade
  notice.

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
