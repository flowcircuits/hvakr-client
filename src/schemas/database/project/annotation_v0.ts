import { z } from 'zod'

export const AnnotationSizeSchema_v0 = z.enum(['small', 'medium', 'large'])
export type AnnotationSize_v0 = z.infer<typeof AnnotationSizeSchema_v0>

export const AnnotationAlignSchema_v0 = z.enum(['left', 'center', 'right'])
export type AnnotationAlign_v0 = z.infer<typeof AnnotationAlignSchema_v0>

export const AnnotationShapeSchema_v0 = z.enum([
    'none',
    'box',
    'cloud',
    'hexagon',
])
export type AnnotationShape_v0 = z.infer<typeof AnnotationShapeSchema_v0>

export const AnnotationDataSchema_v0 = z.object({
    x: z.number(),
    y: z.number(),
    arrowX: z.number().optional(),
    arrowY: z.number().optional(),
    text: z.string(),
    width: z.number().positive().optional(),
    author: z.string(),
    level: z.number(),
    color: z.string().optional(),
    size: AnnotationSizeSchema_v0.optional(),
    align: AnnotationAlignSchema_v0.optional(),
    shape: AnnotationShapeSchema_v0.optional(),
})
export type AnnotationData_v0 = z.infer<typeof AnnotationDataSchema_v0>
