import { z } from 'zod'
import { ErrorSchema_v0 } from './ErrorSchema_v0'
import { CoolingLoadsSchema_v0, HeatingLoadsSchema_v0 } from './misc_v0'

export const APIProjectOutputLoadsSchema_v0 = z.object({
    errors: z.array(ErrorSchema_v0),
    spaceCoolingLoads: z.record(z.string(), CoolingLoadsSchema_v0),
    spaceHeatingLoads: z.record(z.string(), HeatingLoadsSchema_v0),
    systemCoolingLoads: z.record(z.string(), CoolingLoadsSchema_v0),
    systemHeatingLoads: z.record(z.string(), HeatingLoadsSchema_v0),
    zoneCoolingLoads: z.record(z.string(), CoolingLoadsSchema_v0),
    zoneHeatingLoads: z.record(z.string(), HeatingLoadsSchema_v0),
})

export const APIProjectOutputLoadsSchemaJSON_v0 = z.toJSONSchema(
    APIProjectOutputLoadsSchema_v0
)

export type APIProjectOutputLoads_v0 = z.infer<
    typeof APIProjectOutputLoadsSchema_v0
>
