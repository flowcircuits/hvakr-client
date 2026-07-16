import { z } from 'zod'

/** Isolates the few Zod internals needed by generic schema traversal. */
export const getZodDefaultInnerType = (schema: z.ZodDefault): z.ZodType =>
    schema._zod.def.innerType as z.ZodType

export const getZodLazySchema = (schema: z.ZodLazy): z.ZodType =>
    schema._zod.def.getter() as z.ZodType

export const getZodIntersectionSides = (
    schema: z.ZodIntersection
): [z.ZodType, z.ZodType] => [
    schema._zod.def.left as z.ZodType,
    schema._zod.def.right as z.ZodType,
]
