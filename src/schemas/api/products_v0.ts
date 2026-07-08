import { z } from 'zod'

/** A product-catalog file attachment (e.g. cut sheet, submittal). */
export const APIProductFileSchema_v0 = z
    .object({
        name: z.string().describe('File name.'),
        url: z.string().describe('Download URL.'),
    })
    .describe('A product file attachment.')

/**
 * A catalog product as returned by the v0 API. This is the read-only,
 * consumer-facing projection of a product — internal access control
 * (`organizations`, `public`, `active`) is never exposed.
 */
export const APIProductSchema_v0 = z
    .object({
        id: z.string().describe('Product id.'),
        name: z.string().describe('Product name.'),
        manufacturer: z.string().optional().describe('Manufacturer name.'),
        model: z.string().optional().describe('Model number or identifier.'),
        description: z.string().optional().describe('Product description.'),
        type: z
            .string()
            .optional()
            .describe(
                'Dry-side node type the product represents (e.g. terminal unit, central unit).'
            ),
        price: z.number().optional().describe('Product price in USD.'),
        imageUrl: z.string().optional().describe('Product image URL.'),
        specifications: z
            .record(z.string(), z.unknown())
            .optional()
            .describe('Manufacturer specifications (free-form key/value).'),
        files: z
            .record(z.string(), APIProductFileSchema_v0)
            .optional()
            .describe('Attached product files, keyed by id.'),
    })
    .describe('A catalog product.')

export type APIProduct_v0 = z.infer<typeof APIProductSchema_v0>

/**
 * Paginated response shape returned by the list-products endpoint. Mirrors
 * `ProjectListResponseSchema_v0`: `hasMore` signals another page, and
 * `nextCursor` is the opaque cursor to pass back as `cursor` (null on the
 * last page).
 */
export const ProductListResponseSchema_v0 = z
    .object({
        products: z.array(APIProductSchema_v0),
        hasMore: z.boolean(),
        nextCursor: z.string().nullable(),
    })
    .describe('A page of catalog products with pagination metadata.')

export type ProductListResponse_v0 = z.infer<
    typeof ProductListResponseSchema_v0
>
