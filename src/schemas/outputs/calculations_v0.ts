import { z } from 'zod'
import {
    AirStatePsychrometricsSchema_v0,
    CalculatedOutsideAirflowSchema_v0,
    CalculatorFlagsSchema_v0,
    CentralUnitAirflowDataSchema_v0,
    CoilOutputsSchema_v0,
    DesignLoadConditionAirflowsSchema_v0,
    EquipmentAirflowsSchema_v0,
    EquipmentChecksumsSchema_v0,
    IAQPCalculationsSchema_v0,
    RequiredLoadConditionAirflowsSchema_v0,
    RequiredOutsideAirflowComponentsSchema_v0,
    ScopeChecksumsSchema_v0,
} from './calculator_v0'
import { ErrorSchema_v0 } from './ErrorSchema_v0'
import {
    CoolingLoadsSchema_v0,
    HeatingLoadsSchema_v0,
    MetaDrySideGraphSchema_v0,
    SpaceRegisterScheduleRowSchema_v0,
} from './misc_v0'

/**
 * The v0 `/projects/{id}/calculations` contract. One calculator run produces
 * every section; a request selects which sections to compute and return via
 * `?include=`. Each section below is the calculator output reshaped — the
 * values are already computed, these schemas only describe the wire shape.
 *
 * Sections are flat: `registerSchedule` is the row array itself, `drySideGraph`
 * is the graph itself, and `equipment` is the per-equipment record itself — no
 * redundant single-key wrappers.
 */

// --------------------------------------------------------------------
// -- Loads -----------------------------------------------------------

/** Per-scope cooling (monthly/hourly) and heating (design) loads. */
export const CalcLoadsSectionSchema_v0 = z
    .object({
        spaceCoolingLoads: z.record(z.string(), CoolingLoadsSchema_v0),
        spaceHeatingLoads: z.record(z.string(), HeatingLoadsSchema_v0),
        systemCoolingLoads: z.record(z.string(), CoolingLoadsSchema_v0),
        systemHeatingLoads: z.record(z.string(), HeatingLoadsSchema_v0),
        zoneCoolingLoads: z.record(z.string(), CoolingLoadsSchema_v0),
        zoneHeatingLoads: z.record(z.string(), HeatingLoadsSchema_v0),
    })
    .describe('Per-scope cooling and heating loads.')
export type CalcLoadsSection_v0 = z.infer<typeof CalcLoadsSectionSchema_v0>

// --------------------------------------------------------------------
// -- Register schedule -----------------------------------------------

/** Per-space diffuser/register schedule rows. */
export const CalcRegisterScheduleSectionSchema_v0 = z
    .array(SpaceRegisterScheduleRowSchema_v0)
    .describe('Per-space register schedule rows.')
export type CalcRegisterScheduleSection_v0 = z.infer<
    typeof CalcRegisterScheduleSectionSchema_v0
>

// --------------------------------------------------------------------
// -- Dryside graph ---------------------------------------------------

/** Duct (dry-side) graph annotated with flow rates, sizes, and pressures. */
export const CalcDrySideGraphSectionSchema_v0 =
    MetaDrySideGraphSchema_v0.describe(
        'Duct graph annotated with flow rates, duct sizes, and pressures.'
    )
export type CalcDrySideGraphSection_v0 = z.infer<
    typeof CalcDrySideGraphSectionSchema_v0
>

// --------------------------------------------------------------------
// -- Ventilation -----------------------------------------------------

/** Ventilation results for a single scope (space, zone, system, or project). */
export const ScopeVentilationSchema_v0 = z
    .object({
        requiredOutsideAirflowComponents:
            RequiredOutsideAirflowComponentsSchema_v0.optional().describe(
                'ASHRAE 62.1 V_BZ components (people + area).'
            ),
        calculatedOutsideAirflow:
            CalculatedOutsideAirflowSchema_v0.optional().describe(
                'Code-calculated outside airflow V_OZ per condition.'
            ),
        peopleOutdoorAirRate: z
            .number()
            .optional()
            .describe(
                'People outdoor air rate Rp (CFM/person). Aggregate scopes only.'
            ),
        areaOutdoorAirRate: z
            .number()
            .optional()
            .describe(
                'Area outdoor air rate Ra (CFM/ft²). Aggregate scopes only.'
            ),
        dominantSpaceTypeId: z
            .string()
            .optional()
            .describe(
                'ID of the space type contributing the greatest total Voz. Aggregate scopes only.'
            ),
        iaqp: IAQPCalculationsSchema_v0.optional().describe(
            'ASHRAE 62.1 Indoor Air Quality Procedure results.'
        ),
    })
    .describe('Ventilation results for a scope.')

/** Ventilation results for a single piece of equipment. */
export const EquipmentVentilationSchema_v0 = z
    .object({
        centralUnit: CentralUnitAirflowDataSchema_v0.optional().describe(
            'Central-unit outdoor-air aggregates (V_OT, diversity, sum of spaces).'
        ),
    })
    .describe('Ventilation results for a piece of equipment.')

/** ASHRAE 62.1 ventilation results per scope and per equipment. */
export const CalcVentilationSectionSchema_v0 = z
    .object({
        project: ScopeVentilationSchema_v0.optional(),
        spaces: z.record(z.string(), ScopeVentilationSchema_v0),
        systems: z.record(z.string(), ScopeVentilationSchema_v0),
        zones: z.record(z.string(), ScopeVentilationSchema_v0),
        equipment: z.record(z.string(), EquipmentVentilationSchema_v0),
    })
    .describe('ASHRAE 62.1 ventilation results per scope and equipment.')
export type CalcVentilationSection_v0 = z.infer<
    typeof CalcVentilationSectionSchema_v0
>

// --------------------------------------------------------------------
// -- Equipment -------------------------------------------------------

/**
 * Coil loads flattened to the design condition. Each condition reports the
 * `withLeakage.withHeatGain` coil outputs — the values used for equipment
 * sizing.
 */
export const EquipmentCoilOutputsSchema_v0 = z
    .object({
        cooling: CoilOutputsSchema_v0.describe(
            'Cooling coil outputs (withLeakage.withHeatGain).'
        ),
        heating: CoilOutputsSchema_v0.describe(
            'Heating coil outputs (withLeakage.withHeatGain).'
        ),
    })
    .describe('Design-condition coil loads.')

/** Psychrometric air states per load condition. */
export const EquipmentPsychrometricsSchema_v0 = z
    .object({
        cooling: AirStatePsychrometricsSchema_v0,
        heating: AirStatePsychrometricsSchema_v0,
    })
    .describe('Equipment psychrometric air states per load condition.')

/** Calculated outputs for a single piece of equipment. */
export const EquipmentOutputSchema_v0 = z
    .object({
        airflows: EquipmentAirflowsSchema_v0.optional(),
        coil: EquipmentCoilOutputsSchema_v0.optional(),
        psychrometrics: EquipmentPsychrometricsSchema_v0.optional(),
    })
    .describe('Calculated outputs for a piece of equipment.')

/** Per-equipment calculated outputs (airflows, coil loads, psychrometrics). */
export const CalcEquipmentSectionSchema_v0 = z
    .record(z.string(), EquipmentOutputSchema_v0)
    .describe('Per-equipment calculated outputs, keyed by equipment id.')
export type CalcEquipmentSection_v0 = z.infer<
    typeof CalcEquipmentSectionSchema_v0
>

// --------------------------------------------------------------------
// -- Checksums -------------------------------------------------------

/** Design checksums per scope and per equipment. */
export const CalcChecksumsSectionSchema_v0 = z
    .object({
        project: ScopeChecksumsSchema_v0.optional(),
        spaces: z.record(z.string(), ScopeChecksumsSchema_v0),
        systems: z.record(z.string(), ScopeChecksumsSchema_v0),
        zones: z.record(z.string(), ScopeChecksumsSchema_v0),
        equipment: z.record(z.string(), EquipmentChecksumsSchema_v0),
    })
    .describe('Design checksums per scope and equipment.')
export type CalcChecksumsSection_v0 = z.infer<
    typeof CalcChecksumsSectionSchema_v0
>

// --------------------------------------------------------------------
// -- Airflows --------------------------------------------------------

/** Airflow results for a single scope (space, zone, system, or project). */
export const ScopeAirflowsSchema_v0 = z
    .object({
        design: DesignLoadConditionAirflowsSchema_v0.describe(
            'Design airflows per load condition.'
        ),
        required: RequiredLoadConditionAirflowsSchema_v0.describe(
            'Required airflows per load condition.'
        ),
        calculatedOutsideAirflow: CalculatedOutsideAirflowSchema_v0.describe(
            'Code-calculated outside airflow V_OZ per condition.'
        ),
    })
    .describe('Airflow results for a scope.')

/** Design and required airflows per scope. */
export const CalcAirflowsSectionSchema_v0 = z
    .object({
        project: ScopeAirflowsSchema_v0.optional(),
        spaces: z.record(z.string(), ScopeAirflowsSchema_v0),
        systems: z.record(z.string(), ScopeAirflowsSchema_v0),
        zones: z.record(z.string(), ScopeAirflowsSchema_v0),
    })
    .describe('Design and required airflows per scope.')
export type CalcAirflowsSection_v0 = z.infer<
    typeof CalcAirflowsSectionSchema_v0
>

// --------------------------------------------------------------------
// -- Section selector ------------------------------------------------

/**
 * Calculation section keys accepted by `?include=`. Snake-case on the wire;
 * they map to the camelCase fields on {@link APIProjectCalculationsSchema_v0}
 * (`register_schedule` → `registerSchedule`, `dryside_graph` → `drySideGraph`).
 */
export const APICalculationSections_v0 = {
    loads: 'loads',
    register_schedule: 'register_schedule',
    dryside_graph: 'dryside_graph',
    ventilation: 'ventilation',
    equipment: 'equipment',
    checksums: 'checksums',
    airflows: 'airflows',
} as const

export const APICalculationSectionSchema_v0 = z
    .enum(Object.values(APICalculationSections_v0))
    .describe('A selectable calculation section for the `include` parameter.')
export type APICalculationSection_v0 = z.infer<
    typeof APICalculationSectionSchema_v0
>

// --------------------------------------------------------------------
// -- Calculations ----------------------------------------------------

/**
 * The result of `GET /projects/{id}/calculations`. `errors` and `flags` are
 * always present; every section is present iff it was requested via `include`
 * (all sections when `include` is omitted).
 */
export const APIProjectCalculationsSchema_v0 = z
    .object({
        errors: z
            .array(ErrorSchema_v0)
            .describe('Calculation diagnostics (not transport errors).'),
        flags: CalculatorFlagsSchema_v0,
        loads: CalcLoadsSectionSchema_v0.optional(),
        registerSchedule: CalcRegisterScheduleSectionSchema_v0.optional(),
        drySideGraph: CalcDrySideGraphSectionSchema_v0.optional(),
        ventilation: CalcVentilationSectionSchema_v0.optional(),
        equipment: CalcEquipmentSectionSchema_v0.optional(),
        checksums: CalcChecksumsSectionSchema_v0.optional(),
        airflows: CalcAirflowsSectionSchema_v0.optional(),
    })
    .describe('Selected calculation sections from a single calculator run.')
export type APIProjectCalculations_v0 = z.infer<
    typeof APIProjectCalculationsSchema_v0
>
