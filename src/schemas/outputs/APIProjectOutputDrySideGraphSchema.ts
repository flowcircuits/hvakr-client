import { z } from 'zod'
import { ErrorSchema_v0 } from './ErrorSchema_v0'
import { MetaDrySideGraph_v0 } from './misc_v0'

export const APIProjectOutputDrySideGraphSchema_v0 = z.object({
    drySideGraph: z.custom<MetaDrySideGraph_v0>(),
    errors: z.array(ErrorSchema_v0),
})

export const APIProjectOutputDrySideGraphSchemaJSON_v0 = z.toJSONSchema(
    APIProjectOutputDrySideGraphSchema_v0
)

export interface APIProjectOutputDrySideGraph {
    drySideGraph: MetaDrySideGraph_v0
    errors: Error[]
}
