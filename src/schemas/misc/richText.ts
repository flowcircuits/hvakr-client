import { z } from 'zod'

export const MentionableUserSchema = z.object({
    email: z
        .string()
        .meta({
            id: 'mentionableUser.email',
            title: 'Mentionable User Email',
            description: "User's email address",
        }),
    firstName: z
        .string()
        .optional()
        .meta({
            id: 'mentionableUser.firstName',
            title: 'Mentionable User First Name',
            description: "User's first name",
        }),
    lastName: z
        .string()
        .optional()
        .meta({
            id: 'mentionableUser.lastName',
            title: 'Mentionable User Last Name',
            description: "User's last name",
        }),
    profilePicture: z
        .string()
        .optional()
        .meta({
            id: 'mentionableUser.profilePicture',
            title: 'Mentionable User Profile Picture',
            description: "URL to user's profile picture",
        }),
})
export type MentionableUser = z.infer<typeof MentionableUserSchema>

export const TextElementSchema = z.object({
    text: z
        .string()
        .meta({
            id: 'textElement.text',
            title: 'Text Element Text',
            description: 'Text content',
        }),
    type: z
        .literal('text')
        .meta({
            id: 'textElement.type',
            title: 'Text Element Type',
            description: 'Element type for text',
        }),
})
export type TextElement = z.infer<typeof TextElementSchema>

export const MentionElementSchema = z.object({
    children: z
        .array(TextElementSchema)
        .meta({
            id: 'mentionElement.children',
            title: 'Mention Element Children',
            description: 'Child text elements',
        }),
    type: z
        .literal('mention')
        .meta({
            id: 'mentionElement.type',
            title: 'Mention Element Type',
            description: 'Element type for mention',
        }),
    user: MentionableUserSchema.meta({
        id: 'mentionElement.user',
        title: 'Mention Element User',
        description: 'User being mentioned',
    }),
})
export type MentionElement = z.infer<typeof MentionElementSchema>

export const ParagraphElementSchema = z.object({
    children: z
        .array(z.union([TextElementSchema, MentionElementSchema]))
        .meta({
            id: 'paragraphElement.children',
            title: 'Paragraph Element Children',
            description: 'Child elements (text or mentions)',
        }),
    type: z
        .literal('paragraph')
        .meta({
            id: 'paragraphElement.type',
            title: 'Paragraph Element Type',
            description: 'Element type for paragraph',
        }),
})
export type ParagraphElement = z.infer<typeof ParagraphElementSchema>

export const RichTextElementSchema = z.union([
    ParagraphElementSchema,
    MentionElementSchema,
])
export type RichTextElement = z.infer<typeof RichTextElementSchema>

export const RichTextSchema = z.union([
    z.string(),
    z.array(RichTextElementSchema),
])
export type RichText = z.infer<typeof RichTextSchema>
