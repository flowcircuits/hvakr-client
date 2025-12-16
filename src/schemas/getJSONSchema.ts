import { z } from 'zod'

type JSONSchemaOptions = {
    target?: 'draft-04' | 'draft-07' | 'draft-2020-12' | 'openapi-3.0'
    unrepresentable?: 'throw' | 'any'
}

export const getJSONSchema = (
    schema: z.ZodType,
    options: JSONSchemaOptions = {
        target: 'openapi-3.0',
        unrepresentable: 'any',
    }
) => z.toJSONSchema(schema, options)
