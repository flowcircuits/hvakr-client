import { z } from 'zod'
import { RichTextSchema } from '../../misc'

export const ProjectCommentDataSchema_v0 = z.object({
    confirmed: z.boolean().optional(),
    content: RichTextSchema,
    minimal: z.boolean().optional(),
    path: z.string(),
    reactions: z
        .record(z.string(), z.record(z.string(), z.boolean()))
        .optional(),
    readBy: z.record(z.string(), z.boolean()).optional(),
    senderEmail: z.string(),
    senderId: z.string(),
    slackMessageTs: z.string().optional(),
    timestamp: z.number(),
})
export type ProjectCommentData_v0 = z.infer<typeof ProjectCommentDataSchema_v0>
