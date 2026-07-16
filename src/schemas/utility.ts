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

interface UserWritableSchemaOptions {
    /** Reject unknown keys at every projected object boundary. */
    strict?: boolean
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
    schema.meta({ disableUserWrite: true }) as UserWriteDisabledSchema<Schema>

type IsUserWriteDisabledSchema<Schema extends z.core.SomeType> =
    Schema extends UserWriteDisabled
        ? true
        : Schema extends z.ZodOptional<infer Inner>
          ? IsUserWriteDisabledSchema<Inner>
          : Schema extends z.ZodNullable<infer Inner>
            ? IsUserWriteDisabledSchema<Inner>
            : Schema extends z.ZodDefault<infer Inner>
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

type UnwrapUserWritePolicy<Schema extends z.core.SomeType> =
    Schema extends z.ZodOptional<infer Inner>
        ? UnwrapUserWritePolicy<Inner>
        : Schema extends z.ZodNullable<infer Inner>
          ? UnwrapUserWritePolicy<Inner>
          : Schema extends z.ZodDefault<infer Inner>
            ? UnwrapUserWritePolicy<Inner>
            : Schema extends z.ZodLazy<infer Inner>
              ? UnwrapUserWritePolicy<Inner>
              : Schema

type ProjectedUserWriteChild<
    Schema extends z.core.SomeType,
    PolicySchema extends z.core.SomeType,
> = [UserWritableSchema<Schema, PolicySchema>] extends [never]
    ? z.ZodNever
    : Extract<UserWritableSchema<Schema, PolicySchema>, z.ZodType>

type ProjectedUserWriteShape<
    Shape extends z.ZodRawShape,
    PolicyShape extends z.ZodRawShape,
> = {
    [
        Key in keyof Shape as Key extends keyof PolicyShape
            ? [UserWritableSchema<Shape[Key], PolicyShape[Key]>] extends [never]
                ? never
                : Key
            : never
    ]: Key extends keyof PolicyShape
        ? ProjectedUserWriteChild<Shape[Key], PolicyShape[Key]>
        : never
}

type ProjectedUserWriteOptions<
    Options extends readonly z.core.SomeType[],
    PolicyOptions extends readonly z.core.SomeType[],
> = {
    [Index in keyof Options]: Index extends keyof PolicyOptions
        ? ProjectedUserWriteChild<Options[Index], PolicyOptions[Index]>
        : z.ZodNever
}

/** The statically inferred schema produced by writable-schema projection. */
export type UserWritableSchema<
    Schema extends z.core.SomeType,
    PolicySchema extends z.core.SomeType,
> =
    IsUserWriteDisabledSchema<PolicySchema> extends true
        ? never
        : Schema extends z.ZodOptional<infer Inner>
          ? z.ZodOptional<
                ProjectedUserWriteChild<
                    Inner,
                    UnwrapUserWritePolicy<PolicySchema>
                >
            >
          : Schema extends z.ZodNullable<infer Inner>
            ? z.ZodNullable<
                  ProjectedUserWriteChild<
                      Inner,
                      UnwrapUserWritePolicy<PolicySchema>
                  >
              >
            : Schema extends z.ZodDefault<infer Inner>
              ? z.ZodDefault<
                    ProjectedUserWriteChild<
                        Inner,
                        UnwrapUserWritePolicy<PolicySchema>
                    >
                >
              : Schema extends z.ZodLazy<infer Inner>
                ? z.ZodLazy<
                      ProjectedUserWriteChild<
                          Inner,
                          UnwrapUserWritePolicy<PolicySchema>
                      >
                  >
                : Schema extends z.ZodObject<infer Shape, infer Config>
                  ? UnwrapUserWritePolicy<PolicySchema> extends z.ZodObject<
                        infer PolicyShape
                    >
                      ? z.ZodObject<
                            ProjectedUserWriteShape<Shape, PolicyShape>,
                            Config
                        >
                      : never
                  : Schema extends z.ZodRecord<infer Key, infer Value>
                    ? UnwrapUserWritePolicy<PolicySchema> extends z.ZodRecord<
                          infer _PolicyKey,
                          infer PolicyValue
                      >
                        ? z.ZodRecord<
                              Key,
                              ProjectedUserWriteChild<Value, PolicyValue>
                          >
                        : never
                    : Schema extends z.ZodArray<infer Element>
                      ? UnwrapUserWritePolicy<PolicySchema> extends z.ZodArray<
                            infer PolicyElement
                        >
                          ? z.ZodArray<
                                ProjectedUserWriteChild<Element, PolicyElement>
                            >
                          : never
                      : Schema extends z.ZodUnion<infer Options>
                        ? UnwrapUserWritePolicy<PolicySchema> extends z.ZodUnion<
                              infer PolicyOptions
                          >
                            ? z.ZodUnion<
                                  ProjectedUserWriteOptions<
                                      Options,
                                      PolicyOptions
                                  >
                              >
                            : never
                        : Schema extends z.ZodIntersection<
                                infer Left,
                                infer Right
                            >
                          ? UnwrapUserWritePolicy<PolicySchema> extends z.ZodIntersection<
                                infer PolicyLeft,
                                infer PolicyRight
                            >
                              ? z.ZodIntersection<
                                    ProjectedUserWriteChild<Left, PolicyLeft>,
                                    ProjectedUserWriteChild<Right, PolicyRight>
                                >
                              : never
                          : Schema

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
    options: UserWritableSchemaOptions,
    cache: WeakMap<z.ZodType, WeakMap<z.ZodType, z.ZodType | undefined>>
): z.ZodType | undefined => {
    const cachedByPolicy = cache.get(schema)
    if (cachedByPolicy?.has(policySchema)) {
        return cachedByPolicy.get(policySchema)
    }

    const cacheProjection = (projected: z.ZodType | undefined) => {
        const projections = cachedByPolicy ?? new WeakMap()
        projections.set(policySchema, projected)
        if (!cachedByPolicy) cache.set(schema, projections)
        return projected
    }

    if (isUserWriteDisabled(policySchema)) return undefined

    const unwrappedPolicy = unwrapPolicySchema(policySchema)

    if (schema instanceof z.ZodOptional) {
        const inner = projectUserWritableSchema(
            schema.unwrap() as z.ZodType,
            unwrappedPolicy,
            options,
            cache
        )
        if (!inner) return undefined
        return cacheProjection(
            cloneSchema(schema, { ...schema._zod.def, innerType: inner })
        )
    }

    if (schema instanceof z.ZodNullable) {
        const inner = projectUserWritableSchema(
            schema.unwrap() as z.ZodType,
            unwrappedPolicy,
            options,
            cache
        )
        if (!inner) return undefined
        return cacheProjection(
            cloneSchema(schema, { ...schema._zod.def, innerType: inner })
        )
    }

    if (schema instanceof z.ZodDefault) {
        const inner = projectUserWritableSchema(
            getZodDefaultInnerType(schema),
            unwrappedPolicy,
            options,
            cache
        )
        if (!inner) return undefined
        return cacheProjection(
            cloneSchema(schema, { ...schema._zod.def, innerType: inner })
        )
    }

    if (schema instanceof z.ZodLazy) {
        const projected = cloneSchema(schema, {
            ...schema._zod.def,
            getter: () =>
                projectUserWritableSchema(
                    getZodLazySchema(schema),
                    unwrappedPolicy,
                    options,
                    cache
                ) ?? z.never(),
        })
        return cacheProjection(projected)
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
                    options,
                    cache
                )
                return projected ? [[key, projected]] : []
            })
        ) as Record<string, z.ZodType>
        const projected = cloneSchema(schema, { ...schema._zod.def, shape })
        return cacheProjection(options.strict ? projected.strict() : projected)
    }

    if (schema instanceof z.ZodRecord) {
        if (!(unwrappedPolicy instanceof z.ZodRecord)) return undefined

        const valueType = projectUserWritableSchema(
            schema.valueType as z.ZodType,
            unwrappedPolicy.valueType as z.ZodType,
            options,
            cache
        )
        if (!valueType) return undefined
        return cacheProjection(
            cloneSchema(schema, { ...schema._zod.def, valueType })
        )
    }

    if (schema instanceof z.ZodArray) {
        if (!(unwrappedPolicy instanceof z.ZodArray)) return undefined

        const element = projectUserWritableSchema(
            schema.element as z.ZodType,
            unwrappedPolicy.element as z.ZodType,
            options,
            cache
        )
        if (!element) return undefined
        return cacheProjection(
            cloneSchema(schema, { ...schema._zod.def, element })
        )
    }

    if (schema instanceof z.ZodUnion) {
        if (!(unwrappedPolicy instanceof z.ZodUnion)) return undefined

        const projectedOptions = schema.options.flatMap((option, index) => {
            const policyOption = unwrappedPolicy.options[index]
            if (!policyOption) return []

            const projected = projectUserWritableSchema(
                option as z.ZodType,
                policyOption as z.ZodType,
                options,
                cache
            )
            return projected ? [projected] : []
        })
        if (projectedOptions.length === 0) return cacheProjection(undefined)
        if (projectedOptions.length === 1) {
            return cacheProjection(projectedOptions[0])
        }
        return cacheProjection(
            cloneSchema(schema, {
                ...schema._zod.def,
                options: projectedOptions,
            })
        )
    }

    if (schema instanceof z.ZodIntersection) {
        if (!(unwrappedPolicy instanceof z.ZodIntersection)) return undefined

        const [left, right] = getZodIntersectionSides(schema)
        const [policyLeft, policyRight] =
            getZodIntersectionSides(unwrappedPolicy)
        let projectedLeft = projectUserWritableSchema(
            left,
            policyLeft,
            options,
            cache
        )
        let projectedRight = projectUserWritableSchema(
            right,
            policyRight,
            options,
            cache
        )
        if (!projectedLeft || !projectedRight) {
            return cacheProjection(undefined)
        }

        if (
            options.strict &&
            projectedLeft instanceof z.ZodObject &&
            projectedRight instanceof z.ZodObject
        ) {
            const leftShape = projectedLeft.shape
            const rightShape = projectedRight.shape
            projectedLeft = cloneSchema(projectedLeft, {
                ...projectedLeft._zod.def,
                shape: {
                    ...Object.fromEntries(
                        Object.keys(rightShape)
                            .filter((key) => !(key in leftShape))
                            .map((key) => [key, z.unknown().optional()])
                    ),
                    ...leftShape,
                },
            })
            projectedRight = cloneSchema(projectedRight, {
                ...projectedRight._zod.def,
                shape: {
                    ...Object.fromEntries(
                        Object.keys(leftShape)
                            .filter((key) => !(key in rightShape))
                            .map((key) => [key, z.unknown().optional()])
                    ),
                    ...rightShape,
                },
            })
        }

        return cacheProjection(
            cloneSchema(schema, {
                ...schema._zod.def,
                left: projectedLeft,
                right: projectedRight,
            })
        )
    }

    if (
        unwrappedPolicy instanceof z.ZodObject ||
        unwrappedPolicy instanceof z.ZodRecord ||
        unwrappedPolicy instanceof z.ZodArray ||
        unwrappedPolicy instanceof z.ZodUnion ||
        unwrappedPolicy instanceof z.ZodIntersection
    ) {
        return undefined
    }

    return cacheProjection(schema)
}

/** Projects a schema through `disableUserWrite` metadata on a policy schema. */
export function getUserWritableSchema<Schema extends z.ZodObject>(
    schema: Schema,
    policySchema?: undefined,
    options?: UserWritableSchemaOptions
): Extract<UserWritableSchema<Schema, Schema>, z.ZodObject>
export function getUserWritableSchema<
    Schema extends z.ZodObject,
    PolicySchema extends z.ZodObject,
>(
    schema: Schema,
    policySchema: PolicySchema,
    options?: UserWritableSchemaOptions
): Extract<UserWritableSchema<Schema, PolicySchema>, z.ZodObject>
export function getUserWritableSchema(
    schema: z.ZodObject,
    policySchema?: z.ZodObject,
    options: UserWritableSchemaOptions = {}
): z.ZodObject {
    return projectUserWritableSchema(
        schema,
        policySchema ?? schema,
        options,
        new WeakMap()
    ) as z.ZodObject
}

interface PatchSchemaOptions {
    /** Reject unknown keys at every transformed object boundary. */
    strict?: boolean
}

const transformField = (
    schema: z.ZodType,
    options: PatchSchemaOptions,
    cache: WeakMap<z.ZodType, z.ZodType>
): z.ZodType => {
    const cached = cache.get(schema)
    if (cached) return cached

    const cacheTransform = (transformed: z.ZodType) => {
        cache.set(schema, transformed)
        return transformed
    }

    if (schema instanceof z.ZodOptional) {
        return cacheTransform(
            cloneSchema(schema, {
                ...schema._zod.def,
                innerType: transformField(
                    schema.unwrap() as z.ZodType,
                    options,
                    cache
                ),
            })
        )
    }

    if (schema instanceof z.ZodNullable) {
        return cacheTransform(
            cloneSchema(schema, {
                ...schema._zod.def,
                innerType: transformField(
                    schema.unwrap() as z.ZodType,
                    options,
                    cache
                ),
            })
        )
    }

    if (schema instanceof z.ZodDefault) {
        return cacheTransform(
            cloneSchema(schema, {
                ...schema._zod.def,
                innerType: transformField(
                    getZodDefaultInnerType(schema),
                    options,
                    cache
                ),
            })
        )
    }

    if (schema instanceof z.ZodLazy) {
        return cacheTransform(
            cloneSchema(schema, {
                ...schema._zod.def,
                getter: () =>
                    transformField(getZodLazySchema(schema), options, cache),
            })
        )
    }

    if (isZodObject(schema)) {
        return getPatchSchemaInternal(schema, options, cache)
    }

    if (isZodRecord(schema)) {
        const valueSchema = schema.valueType as z.ZodType
        // Transform the value schema and make it nullish so entries can be deleted
        const transformedValue = transformField(
            valueSchema,
            options,
            cache
        ).nullish()
        return cacheTransform(
            cloneSchema(schema, {
                ...schema._zod.def,
                valueType: transformedValue,
            })
        )
    }

    if (schema instanceof z.ZodUnion) {
        const transformedOptions = schema.options.map((option) =>
            transformField(option as z.ZodType, options, cache)
        )
        return cacheTransform(
            cloneSchema(schema, {
                ...schema._zod.def,
                options: transformedOptions,
            })
        )
    }

    if (schema instanceof z.ZodIntersection) {
        const [left, right] = getZodIntersectionSides(schema)
        return cacheTransform(
            cloneSchema(schema, {
                ...schema._zod.def,
                left: transformField(left, options, cache),
                right: transformField(right, options, cache),
            })
        )
    }

    return cacheTransform(schema)
}

const getPatchSchemaInternal = (
    schema: z.ZodObject,
    options: PatchSchemaOptions,
    cache: WeakMap<z.ZodType, z.ZodType>
): z.ZodObject => {
    const cached = cache.get(schema)
    if (cached instanceof z.ZodObject) return cached

    const newShape: Record<string, z.ZodType> = {}

    Object.entries(schema.shape).forEach(([key, fieldSchema]) => {
        if (!fieldSchema) return

        const wasOptional = isOptional(fieldSchema)
        const transformedField = transformField(
            fieldSchema as z.ZodType,
            options,
            cache
        )

        if (wasOptional) {
            // Optional -> nullish
            newShape[key] = transformedField.nullish()
        } else {
            // Required -> optional
            newShape[key] = transformedField.optional()
        }
    })

    const transformed = options.strict
        ? z.strictObject(newShape)
        : z.object(newShape)
    cache.set(schema, transformed)
    return transformed
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
): z.ZodObject => getPatchSchemaInternal(schema, options, new WeakMap())
