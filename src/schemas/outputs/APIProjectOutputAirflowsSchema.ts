import { z } from 'zod'
import {
    CalculatedOutsideAirflowSchema_v0,
    CalculatorFlagsSchema_v0,
    DesignLoadConditionAirflowsSchema_v0,
    RequiredLoadConditionAirflowsSchema_v0,
} from './calculator_v0'
import { ErrorSchema_v0 } from './ErrorSchema_v0'

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

/** Airflow outputs for a project, broken down per scope. */
export const APIProjectOutputAirflowsSchema_v0 = z
    .object({
        errors: z
            .array(ErrorSchema_v0)
            .describe('Calculation diagnostics (not transport errors).'),
        flags: CalculatorFlagsSchema_v0,
        project: ScopeAirflowsSchema_v0.optional(),
        spaces: z.record(z.string(), ScopeAirflowsSchema_v0),
        systems: z.record(z.string(), ScopeAirflowsSchema_v0),
        zones: z.record(z.string(), ScopeAirflowsSchema_v0),
    })
    .describe('Airflow outputs per scope.')

export type APIProjectOutputAirflows_v0 = z.infer<
    typeof APIProjectOutputAirflowsSchema_v0
>
