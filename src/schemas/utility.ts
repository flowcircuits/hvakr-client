import { z } from 'zod'
import {
    getZodDefaultInnerType,
    getZodIntersectionSides,
    getZodLazySchema,
} from './zodInternals'

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

interface UserWritableSchemaOptions {
    /** Reject unknown keys at every projected object boundary. */
    strict?: boolean
}

const cloneSchema = <Schema extends z.ZodType>(
    schema: Schema,
    definition: Schema['_zod']['def']
): Schema => {
    const clone = schema.clone(definition)
    const meta = schema.meta()
    return meta ? clone.meta(meta) : clone
}

const unwrapPolicySchema = (schema: z.ZodType): z.ZodType => {
    let current = schema

    while (true) {
        if (current instanceof z.ZodOptional) {
            current = current.unwrap() as z.ZodType
            continue
        }
        if (current instanceof z.ZodNullable) {
            current = current.unwrap() as z.ZodType
            continue
        }
        if (current instanceof z.ZodDefault) {
            current = getZodDefaultInnerType(current)
            continue
        }
        if (current instanceof z.ZodLazy) {
            current = getZodLazySchema(current)
            continue
        }
        return current
    }
}

const isUserWriteDisabled = (schema: z.ZodType): boolean => {
    let current = schema

    while (true) {
        if (current.meta()?.disableUserWrite) return true

        if (current instanceof z.ZodOptional) {
            current = current.unwrap() as z.ZodType
            continue
        }
        if (current instanceof z.ZodNullable) {
            current = current.unwrap() as z.ZodType
            continue
        }
        if (current instanceof z.ZodDefault) {
            current = getZodDefaultInnerType(current)
            continue
        }
        if (current instanceof z.ZodLazy) {
            current = getZodLazySchema(current)
            continue
        }
        return false
    }
}

const projectUserWritableSchema = (
    schema: z.ZodType,
    policySchema: z.ZodType,
    options: UserWritableSchemaOptions
): z.ZodType | undefined => {
    if (isUserWriteDisabled(policySchema)) return undefined

    const unwrappedPolicy = unwrapPolicySchema(policySchema)

    if (schema instanceof z.ZodOptional) {
        const inner = projectUserWritableSchema(
            schema.unwrap() as z.ZodType,
            unwrappedPolicy,
            options
        )
        if (!inner) return undefined
        return cloneSchema(schema, { ...schema._zod.def, innerType: inner })
    }

    if (schema instanceof z.ZodNullable) {
        const inner = projectUserWritableSchema(
            schema.unwrap() as z.ZodType,
            unwrappedPolicy,
            options
        )
        if (!inner) return undefined
        return cloneSchema(schema, { ...schema._zod.def, innerType: inner })
    }

    if (schema instanceof z.ZodDefault) {
        const inner = projectUserWritableSchema(
            getZodDefaultInnerType(schema),
            unwrappedPolicy,
            options
        )
        if (!inner) return undefined
        return cloneSchema(schema, { ...schema._zod.def, innerType: inner })
    }

    if (schema instanceof z.ZodLazy) {
        const inner = projectUserWritableSchema(
            getZodLazySchema(schema),
            unwrappedPolicy,
            options
        )
        if (!inner) return undefined
        return inner
    }

    if (schema instanceof z.ZodObject) {
        if (!(unwrappedPolicy instanceof z.ZodObject)) return undefined

        const shape = Object.fromEntries(
            Object.entries(schema.shape).flatMap(([key, child]) => {
                const policyChild = unwrappedPolicy.shape[key]
                if (!policyChild) return []

                const projected = projectUserWritableSchema(
                    child as z.ZodType,
                    policyChild,
                    options
                )
                return projected ? [[key, projected]] : []
            })
        ) as Record<string, z.ZodType>
        const projected = cloneSchema(schema, { ...schema._zod.def, shape })
        return options.strict ? projected.strict() : projected
    }

    if (schema instanceof z.ZodRecord) {
        if (!(unwrappedPolicy instanceof z.ZodRecord)) return undefined

        const valueType = projectUserWritableSchema(
            schema.valueType as z.ZodType,
            unwrappedPolicy.valueType as z.ZodType,
            options
        )
        if (!valueType) return undefined
        return cloneSchema(schema, { ...schema._zod.def, valueType })
    }

    if (schema instanceof z.ZodArray) {
        if (!(unwrappedPolicy instanceof z.ZodArray)) return undefined

        const element = projectUserWritableSchema(
            schema.element as z.ZodType,
            unwrappedPolicy.element as z.ZodType,
            options
        )
        if (!element) return undefined
        return cloneSchema(schema, { ...schema._zod.def, element })
    }

    if (
        unwrappedPolicy instanceof z.ZodObject ||
        unwrappedPolicy instanceof z.ZodRecord ||
        unwrappedPolicy instanceof z.ZodArray
    ) {
        return undefined
    }

    return schema
}

/** Projects a schema through `disableUserWrite` metadata on a policy schema. */
export const getUserWritableSchema = <Schema extends z.ZodObject>(
    schema: Schema,
    policySchema: z.ZodObject = schema,
    options: UserWritableSchemaOptions = {}
): Schema => projectUserWritableSchema(schema, policySchema, options) as Schema

interface PatchSchemaOptions {
    /** Reject unknown keys at every transformed object boundary. */
    strict?: boolean
}

const transformField = (
    schema: z.ZodType,
    options: PatchSchemaOptions
): z.ZodType => {
    const unwrapped = unwrapSchema(schema)

    if (isZodObject(unwrapped)) {
        return getPatchSchema(unwrapped, options)
    }

    if (isZodRecord(unwrapped)) {
        const keySchema = unwrapped.keyType as z.ZodString
        const valueSchema = unwrapped.valueType as z.ZodType
        // Transform the value schema and make it nullish so entries can be deleted
        const transformedValue = transformField(valueSchema, options).nullish()
        return z.record(keySchema, transformedValue)
    }

    if (unwrapped instanceof z.ZodUnion) {
        const transformedOptions = unwrapped.options.map((option) =>
            transformField(option as z.ZodType, options)
        ) as [z.ZodType, z.ZodType, ...z.ZodType[]]
        return z.union(transformedOptions)
    }

    if (unwrapped instanceof z.ZodIntersection) {
        const [left, right] = getZodIntersectionSides(unwrapped)
        return z.intersection(
            transformField(left, options),
            transformField(right, options)
        )
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
export const getPatchSchema = (
    schema: z.ZodObject,
    options: PatchSchemaOptions = {}
): z.ZodObject => {
    const shape = schema.shape
    const newShape: Record<string, z.ZodType> = {}

    Object.keys(shape).forEach((key) => {
        const fieldSchema = shape[key]
        if (!fieldSchema) return

        const wasOptional = isOptional(fieldSchema)
        const transformedField = transformField(fieldSchema, options)

        if (wasOptional) {
            // Optional -> nullish
            newShape[key] = transformedField.nullish()
        } else {
            // Required -> optional
            newShape[key] = transformedField.optional()
        }
    })

    return options.strict ? z.strictObject(newShape) : z.object(newShape)
}
