import { z } from 'zod'

const isZodObject = (schema: z.ZodType): schema is z.ZodObject => {
    return schema instanceof z.ZodObject
}

const isZodRecord = (schema: z.ZodType): schema is z.ZodRecord => {
    return schema instanceof z.ZodRecord
}

const isZodArray = (schema: z.ZodType): schema is z.ZodArray => {
    return schema instanceof z.ZodArray
}

const isOptional = (schema: z.ZodType): schema is z.ZodOptional<z.ZodType> => {
    return schema instanceof z.ZodOptional
}

const unwrapOptional = (schema: z.ZodType): z.ZodType => {
    if (isOptional(schema)) {
        return schema.unwrap() as z.ZodType
    }
    return schema
}

declare const userWriteDisabled: unique symbol

interface UserWriteDisabled {
    readonly [userWriteDisabled]: true
}

/** A schema marked as unavailable to normal user-controlled writes. */
export type UserWriteDisabledSchema<Schema extends z.ZodType> = Schema &
    UserWriteDisabled

/** Marks a schema as unavailable to normal user-controlled writes. */
export const disableUserWrite = <Schema extends z.ZodType>(
    schema: Schema
): UserWriteDisabledSchema<Schema> =>
    schema.meta({
        ...schema.meta(),
        disableUserWrite: true,
    }) as UserWriteDisabledSchema<Schema>

type IsUserWriteDisabledSchema<Schema extends z.core.SomeType> =
    Schema extends UserWriteDisabled
        ? true
        : Schema extends z.ZodOptional<infer Inner>
          ? IsUserWriteDisabledSchema<Inner>
          : Schema extends z.ZodNullable<infer Inner>
            ? IsUserWriteDisabledSchema<Inner>
            : false

/** Keys marked as unavailable to normal user-controlled writes. */
export type UserWriteDisabledKeys<Schema extends z.ZodObject> = {
    [Key in keyof Schema['shape']]: IsUserWriteDisabledSchema<
        Schema['shape'][Key]
    > extends true
        ? Key
        : never
}[keyof Schema['shape']]

const cloneSchema = <Schema extends z.ZodType>(
    schema: Schema,
    definition: Schema['_zod']['def']
): Schema => {
    const clone = schema.clone(definition)
    const meta = schema.meta()
    return meta ? clone.meta(meta) : clone
}

type UserWritableShape<Shape extends z.ZodRawShape> = {
    [
        Key in keyof Shape as IsUserWriteDisabledSchema<Shape[Key]> extends true
            ? never
            : Key
    ]: Shape[Key]
}

const isUserWriteDisabled = (schema: z.ZodType): boolean => {
    let current = schema
    while (true) {
        if (current.meta()?.disableUserWrite) return true
        if (
            current instanceof z.ZodOptional ||
            current instanceof z.ZodNullable
        ) {
            current = current.unwrap() as z.ZodType
            continue
        }
        return false
    }
}

const projectUserWritableField = (schema: z.ZodType): z.ZodType | undefined => {
    if (isUserWriteDisabled(schema)) return undefined

    if (schema instanceof z.ZodOptional) {
        const inner = projectUserWritableField(schema.unwrap() as z.ZodType)
        return inner?.optional()
    }

    if (schema instanceof z.ZodNullable) {
        const inner = projectUserWritableField(schema.unwrap() as z.ZodType)
        return inner?.nullable()
    }

    if (isZodObject(schema)) {
        return getUserWritableSchema(schema)
    }

    if (isZodRecord(schema)) {
        const valueType = projectUserWritableField(
            schema.valueType as z.ZodType
        )
        if (!valueType) return undefined
        return z.record(schema.keyType as z.ZodType, valueType)
    }

    return schema
}

/** Omits fields marked with `disableUserWrite` metadata, recursively. */
export const getUserWritableSchema = <Shape extends z.ZodRawShape>(
    schema: z.ZodObject<Shape>
): z.ZodObject<UserWritableShape<Shape>> => {
    const shape = Object.fromEntries(
        Object.entries(schema.shape).flatMap(([key, child]) => {
            const projected = projectUserWritableField(child as z.ZodType)
            return projected ? [[key, projected]] : []
        })
    ) as UserWritableShape<Shape>

    return z.object(shape) as z.ZodObject<UserWritableShape<Shape>>
}

const transformField = (schema: z.ZodType): z.ZodType => {
    const unwrapped = unwrapOptional(schema)

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
    const newShape: Record<string, z.ZodType> = {}

    Object.entries(schema.shape).forEach(([key, fieldSchema]) => {
        if (!fieldSchema) return

        const wasOptional = isOptional(fieldSchema as z.ZodType)
        const transformedField = transformField(fieldSchema as z.ZodType)

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

const strictifySchema = (schema: z.ZodType): z.ZodType => {
    if (schema instanceof z.ZodOptional) {
        return cloneSchema(schema, {
            ...schema._zod.def,
            innerType: strictifySchema(schema.unwrap() as z.ZodType),
        })
    }

    if (schema instanceof z.ZodNullable) {
        return cloneSchema(schema, {
            ...schema._zod.def,
            innerType: strictifySchema(schema.unwrap() as z.ZodType),
        })
    }

    if (isZodObject(schema)) {
        const shape = Object.fromEntries(
            Object.entries(schema.shape).map(([key, child]) => [
                key,
                strictifySchema(child as z.ZodType),
            ])
        )
        return cloneSchema(schema, { ...schema._zod.def, shape }).strict()
    }

    if (isZodRecord(schema)) {
        return cloneSchema(schema, {
            ...schema._zod.def,
            valueType: strictifySchema(schema.valueType as z.ZodType),
        })
    }

    if (isZodArray(schema)) {
        return cloneSchema(schema, {
            ...schema._zod.def,
            element: strictifySchema(schema.element as z.ZodType),
        })
    }

    if (schema instanceof z.ZodUnion) {
        const options = schema.options.map((option) =>
            strictifySchema(option as z.ZodType)
        ) as [z.ZodType, z.ZodType, ...z.ZodType[]]
        return cloneSchema(schema, { ...schema._zod.def, options })
    }

    if (schema instanceof z.ZodIntersection) {
        const { left, right } = schema._zod.def
        return cloneSchema(schema, {
            ...schema._zod.def,
            left: strictifySchema(left as z.ZodType),
            right: strictifySchema(right as z.ZodType),
        })
    }

    return schema
}

/** Applies strict unknown-key handling recursively to object schemas. */
export const getStrictSchema = <Schema extends z.ZodType>(
    schema: Schema
): Schema => strictifySchema(schema) as Schema
