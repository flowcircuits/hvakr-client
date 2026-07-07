import { z } from 'zod'
import { CalculatorFlags_v0, CalculatorFlagsSchema_v0 } from './calculator_v0'
import { ErrorSchema_v0 } from './ErrorSchema_v0'
import { MetaDrySideGraph_v0, MetaDrySideGraphSchema_v0 } from './misc_v0'

export const APIProjectOutputDrySideGraphSchema_v0 = z.object({
    drySideGraph: MetaDrySideGraphSchema_v0,
    errors: z.array(ErrorSchema_v0),
    flags: CalculatorFlagsSchema_v0,
})

export interface APIProjectOutputDrySideGraph {
    drySideGraph: MetaDrySideGraph_v0
    errors: Error[]
    flags: CalculatorFlags_v0
}
