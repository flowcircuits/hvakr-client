import { z } from 'zod'
import {
    CalculatedOutsideAirflowSchema_v0,
    CalculatorFlagsSchema_v0,
    CentralUnitAirflowDataSchema_v0,
    IAQPCalculationsSchema_v0,
    RequiredOutsideAirflowComponentsSchema_v0,
} from './calculator_v0'
import { ErrorSchema_v0 } from './ErrorSchema_v0'

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

/**
 * ASHRAE 62.1 ventilation outputs for a project, broken down per scope
 * (spaces/zones/systems/project) and per equipment.
 */
export const APIProjectOutputVentilationSchema_v0 = z
    .object({
        errors: z
            .array(ErrorSchema_v0)
            .describe('Calculation diagnostics (not transport errors).'),
        flags: CalculatorFlagsSchema_v0,
        project: ScopeVentilationSchema_v0.optional(),
        spaces: z.record(z.string(), ScopeVentilationSchema_v0),
        systems: z.record(z.string(), ScopeVentilationSchema_v0),
        zones: z.record(z.string(), ScopeVentilationSchema_v0),
        equipment: z.record(z.string(), EquipmentVentilationSchema_v0),
    })
    .describe('ASHRAE 62.1 ventilation outputs per scope and equipment.')

export type APIProjectOutputVentilation_v0 = z.infer<
    typeof APIProjectOutputVentilationSchema_v0
>
