import { z } from 'zod'

const isZodObject = (schema: z.ZodType): schema is z.ZodObject => {
    return schema instanceof z.ZodObject
}

const isZodRecord = (schema: z.ZodType): schema is z.ZodRecord => {
    return schema instanceof z.ZodRecord
}

const isOptional = (schema: z.ZodType): schema is z.ZodOptional<z.ZodType> => {
    return schema instanceof z.ZodOptional
}

const unwrapSchema = (schema: z.ZodType): z.ZodType => {
    if (isOptional(schema)) {
        return schema.unwrap()
    }
    return schema
}

const transformField = (schema: z.ZodType): z.ZodType => {
    const unwrapped = unwrapSchema(schema)

    if (isZodObject(unwrapped)) {
        return getPatchSchema(unwrapped)
    }

    if (isZodRecord(unwrapped)) {
        const keySchema = unwrapped.keyType as z.ZodString
        const valueSchema = unwrapped.valueType as z.ZodType
        // Transform the value schema and make it nullish so entries can be deleted
        const transformedValue = transformField(valueSchema).nullish()
        return z.record(keySchema, transformedValue)
    }

    return schema
}

/**
 * Transforms a Zod object schema for update operations where:
 * - Optional properties become nullish (can be null to delete)
 * - Required properties become optional (can omit or be undefined to leave unchanged)
 *
 * Nested objects are transformed recursively.
 */
export const getPatchSchema = (schema: z.ZodObject): z.ZodObject => {
    const shape = schema.shape
    const newShape: Record<string, z.ZodType> = {}

    Object.keys(shape).forEach((key) => {
        const fieldSchema = shape[key]
        if (!fieldSchema) return

        const wasOptional = isOptional(fieldSchema)
        const transformedField = transformField(fieldSchema)

        if (wasOptional) {
            // Optional -> nullish
            newShape[key] = transformedField.nullish()
        } else {
            // Required -> optional
            newShape[key] = transformedField.optional()
        }
    })

    return z.object(newShape)
}
