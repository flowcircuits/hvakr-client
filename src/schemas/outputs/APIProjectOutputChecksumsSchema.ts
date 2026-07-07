import { z } from 'zod'
import {
    CalculatorFlagsSchema_v0,
    EquipmentChecksumsSchema_v0,
    ScopeChecksumsSchema_v0,
} from './calculator_v0'
import { ErrorSchema_v0 } from './ErrorSchema_v0'

/** Design checksums per scope and per equipment for a project. */
export const APIProjectOutputChecksumsSchema_v0 = z
    .object({
        errors: z
            .array(ErrorSchema_v0)
            .describe('Calculation diagnostics (not transport errors).'),
        flags: CalculatorFlagsSchema_v0,
        project: ScopeChecksumsSchema_v0.optional(),
        spaces: z.record(z.string(), ScopeChecksumsSchema_v0),
        systems: z.record(z.string(), ScopeChecksumsSchema_v0),
        zones: z.record(z.string(), ScopeChecksumsSchema_v0),
        equipment: z.record(z.string(), EquipmentChecksumsSchema_v0),
    })
    .describe('Design checksums per scope and equipment.')

export type APIProjectOutputChecksums_v0 = z.infer<
    typeof APIProjectOutputChecksumsSchema_v0
>
