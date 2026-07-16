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

type UserWritableShape<Shape extends z.ZodRawShape> = {
    [Key in keyof Shape as IsUserWriteDisabledSchema<Shape[Key]> extends true
        ? never
        : Key]: Shape[Key]
}

interface UserWritableSchemaOptions {
    /** Reject unknown keys at every projected object boundary. */
    strict?: boolean
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

const projectUserWritableField = (
    schema: z.ZodType,
    options: UserWritableSchemaOptions
): z.ZodType | undefined => {
    if (isUserWriteDisabled(schema)) return undefined

    if (schema instanceof z.ZodOptional) {
        const inner = projectUserWritableField(
            schema.unwrap() as z.ZodType,
            options
        )
        return inner?.optional()
    }

    if (schema instanceof z.ZodNullable) {
        const inner = projectUserWritableField(
            schema.unwrap() as z.ZodType,
            options
        )
        return inner?.nullable()
    }

    if (isZodObject(schema)) {
        return getUserWritableSchema(schema, options)
    }

    if (isZodRecord(schema)) {
        const valueType = projectUserWritableField(
            schema.valueType as z.ZodType,
            options
        )
        if (!valueType) return undefined
        return z.record(schema.keyType as z.ZodType, valueType)
    }

    return schema
}

/** Omits fields marked with `disableUserWrite` metadata, recursively. */
export const getUserWritableSchema = <Shape extends z.ZodRawShape>(
    schema: z.ZodObject<Shape>,
    options: UserWritableSchemaOptions = {}
): z.ZodObject<UserWritableShape<Shape>> => {
    const shape = Object.fromEntries(
        Object.entries(schema.shape).flatMap(([key, child]) => {
            const projected = projectUserWritableField(
                child as z.ZodType,
                options
            )
            return projected ? [[key, projected]] : []
        })
    ) as UserWritableShape<Shape>

    return (
        options.strict ? z.strictObject(shape) : z.object(shape)
    ) as z.ZodObject<UserWritableShape<Shape>>
}

interface PatchSchemaOptions {
    /** Reject unknown keys at every transformed object boundary. */
    strict?: boolean
}

const transformField = (
    schema: z.ZodType,
    options: PatchSchemaOptions
): z.ZodType => {
    const unwrapped = unwrapOptional(schema)

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
    const newShape: Record<string, z.ZodType> = {}

    Object.entries(schema.shape).forEach(([key, fieldSchema]) => {
        if (!fieldSchema) return

        const wasOptional = isOptional(fieldSchema as z.ZodType)
        const transformedField = transformField(
            fieldSchema as z.ZodType,
            options
        )

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
