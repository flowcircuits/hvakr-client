import { z } from 'zod'

export const DisplayUnitSystemIdSchema = z.enum(['IMPERIAL', 'METRIC'])

export type DisplayUnitSystemId = z.infer<typeof DisplayUnitSystemIdSchema>
