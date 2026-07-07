import { z } from 'zod'
import {
    AirStatePsychrometricsSchema_v0,
    CalculatorFlagsSchema_v0,
    CoilOutputsSchema_v0,
    EquipmentAirflowsSchema_v0,
} from './calculator_v0'
import { ErrorSchema_v0 } from './ErrorSchema_v0'

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

/** Per-equipment calculated outputs for a project. */
export const APIProjectOutputEquipmentSchema_v0 = z
    .object({
        errors: z
            .array(ErrorSchema_v0)
            .describe('Calculation diagnostics (not transport errors).'),
        flags: CalculatorFlagsSchema_v0,
        equipment: z.record(z.string(), EquipmentOutputSchema_v0),
    })
    .describe('Per-equipment calculated outputs.')

export type APIProjectOutputEquipment_v0 = z.infer<
    typeof APIProjectOutputEquipmentSchema_v0
>
