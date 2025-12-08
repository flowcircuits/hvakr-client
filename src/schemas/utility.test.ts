import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { getPatchSchema } from './utility'

describe('getUpdateSchema', () => {
    it('should make required properties optional', () => {
        const schema = z.object({ name: z.string(), age: z.number() })

        const updateSchema = getPatchSchema(schema)

        expect(updateSchema.safeParse({}).success).toBe(true)
        expect(updateSchema.safeParse({ name: 'John' }).success).toBe(true)
        expect(updateSchema.safeParse({ age: 25 }).success).toBe(true)
        expect(updateSchema.safeParse({ name: 'John', age: 25 }).success).toBe(
            true
        )
    })

    it('should make optional properties nullish', () => {
        const schema = z.object({ bio: z.string().optional() })

        const updateSchema = getPatchSchema(schema)

        expect(updateSchema.safeParse({}).success).toBe(true)
        expect(updateSchema.safeParse({ bio: undefined }).success).toBe(true)
        expect(updateSchema.safeParse({ bio: null }).success).toBe(true)
        expect(updateSchema.safeParse({ bio: 'Hello' }).success).toBe(true)
    })

    it('should not make required properties nullable', () => {
        const schema = z.object({ id: z.string() })

        const updateSchema = getPatchSchema(schema)

        expect(updateSchema.safeParse({ id: null }).success).toBe(false)
        expect(updateSchema.safeParse({ id: 'abc' }).success).toBe(true)
        expect(updateSchema.safeParse({}).success).toBe(true)
    })

    it('should handle nested objects recursively', () => {
        const schema = z.object({
            user: z
                .object({ name: z.string(), email: z.string().optional() })
                .optional(),
        })

        const updateSchema = getPatchSchema(schema)

        // Nested object becomes optional
        expect(updateSchema.safeParse({}).success).toBe(true)

        // Nested required property becomes optional
        expect(updateSchema.safeParse({ user: null }).success).toBe(true)
        expect(updateSchema.safeParse({ user: {} }).success).toBe(true)
        expect(updateSchema.safeParse({ user: { name: 'John' } }).success).toBe(
            true
        )

        // Nested optional property becomes nullish
        expect(updateSchema.safeParse({ user: { email: null } }).success).toBe(
            true
        )
        expect(
            updateSchema.safeParse({ user: { email: undefined } }).success
        ).toBe(true)
    })

    it('should preserve non-object field types', () => {
        const schema = z.object({
            tags: z.array(z.string()),
            count: z.number(),
            active: z.boolean(),
        })

        const updateSchema = getPatchSchema(schema)

        expect(updateSchema.safeParse({ tags: ['a', 'b'] }).success).toBe(true)
        expect(updateSchema.safeParse({ tags: 'not-an-array' }).success).toBe(
            false
        )
        expect(updateSchema.safeParse({ count: 5 }).success).toBe(true)
        expect(updateSchema.safeParse({ count: 'five' }).success).toBe(false)
        expect(updateSchema.safeParse({ active: true }).success).toBe(true)
        expect(updateSchema.safeParse({ active: 'yes' }).success).toBe(false)
    })

    it('should transform record values to allow partial updates', () => {
        const schema = z.object({
            settings: z.record(
                z.string(),
                z.object({ enabled: z.boolean(), value: z.number().optional() })
            ),
        })

        const updateSchema = getPatchSchema(schema)

        // Can omit the record entirely
        expect(updateSchema.safeParse({}).success).toBe(true)

        // Can update a single entry with partial object
        expect(
            updateSchema.safeParse({ settings: { theme: { enabled: true } } })
                .success
        ).toBe(true)
        expect(
            updateSchema.safeParse({ settings: { theme: {} } }).success
        ).toBe(true)

        // Can delete an entry by setting to null
        expect(
            updateSchema.safeParse({ settings: { theme: null } }).success
        ).toBe(true)

        // Nested optional becomes nullish
        expect(
            updateSchema.safeParse({ settings: { theme: { value: null } } })
                .success
        ).toBe(true)
    })
})
