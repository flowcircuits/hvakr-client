import { z } from 'zod'
import { ErrorSchema_v0 } from './ErrorSchema_v0'
import { SpaceRegisterScheduleRowSchema_v0 } from './misc_v0'

export const APIProjectOutputRegisterScheduleSchema_v0 = z.object({
    errors: z.array(ErrorSchema_v0),
    registerSchedule: z.array(SpaceRegisterScheduleRowSchema_v0),
})

export type APIProjectOutputRegisterSchedule_v0 = z.infer<
    typeof APIProjectOutputRegisterScheduleSchema_v0
>
