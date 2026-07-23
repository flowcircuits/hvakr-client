import { z } from 'zod'

/** A 24-hour usage schedule shared by space types and equipment energy config. */
export const UsageScheduleSchema_v0 = z
    .array(z.number())
    .length(24, { error: 'Usage schedule must be an array of 24 numbers' })
export type UsageSchedule_v0 = z.infer<typeof UsageScheduleSchema_v0>
