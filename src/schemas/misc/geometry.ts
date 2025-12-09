import z from 'zod'

export const PointSchema = z.object({ x: z.number(), y: z.number() })
export type Point = z.infer<typeof PointSchema>

export const SizeSchema = z.object({ height: z.number(), width: z.number() })
export type Size = z.infer<typeof SizeSchema>

export const RectSchema = z.object({
    ...PointSchema.shape,
    ...SizeSchema.shape,
})

export type Rect = z.infer<typeof RectSchema>

export const PolygonSchema = z.array(PointSchema)
export type Polygon = z.infer<typeof PolygonSchema>

export const BoxSchema = z.object({
    x1: z.number(),
    x2: z.number(),
    y1: z.number(),
    y2: z.number(),
})

export type Box = z.infer<typeof BoxSchema>
