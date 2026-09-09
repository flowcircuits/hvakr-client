import { z } from 'zod'
import { UsageScheduleSchema_v0 } from '../../misc'
import { FlowTypeSchema_v0 } from '../../outputs'
import { disableUserWrite } from '../../utility'

export const RegisterSpecConstraintsSchema_v0 = z.object({
    maxCFM: z.number().optional(),
    maxFPM: z.number().optional(),
    maxNC: z.number().optional(),
    registerModelId: z.string().optional(),
})

export const RegisterSpecSchema_v0 = z.partialRecord(
    FlowTypeSchema_v0,
    RegisterSpecConstraintsSchema_v0
)

export const SpaceTypeDataSchema_v0 = z.object({
    coolingTemp: z.number().optional(),
    equipmentLoad: z.number().optional(),
    exhaustAch: z.number().optional(),
    exhaustAreaReq: z.number().optional(),
    ez: z.number().optional(),
    heatingTemp: z.number().optional(),
    infiltrationAchReq: z.number().optional(),
    infiltrationAreaReq: z.number().optional(),
    infiltrationPerimeterReq: z.number().optional(),
    infiltrationUseSeparateWinterReqs: z.boolean().optional(),
    infiltrationWinterAchReq: z.number().optional(),
    infiltrationWinterAreaReq: z.number().optional(),
    infiltrationWinterPerimeterReq: z.number().optional(),
    lightingCeilingLoadPercent: z.number().optional(),
    lightingLoad: z.number().optional(),
    name: z.string().optional(),
    nameSynonyms: z.array(z.string()).optional(),
    nc: z.number().optional(),
    peopleDensity: z.number().optional(),
    peopleLatentLoad: z.number().optional(),
    peopleSensibleLoad: z.number().optional(),
    registerSpec: RegisterSpecSchema_v0.optional(),
    relativeHumidity: z.number().optional(),
    supplyAreaReq: z.number().optional(),
    supplyReq: z.number().optional(),
    temperatureRange: z.number().optional(),
    createdAt: disableUserWrite(z.number().optional()),
    unitExhaustRate: z.number().optional(),
    usageSchedule: UsageScheduleSchema_v0.optional(),
    ventilationAchReq: z.number().optional(),
    ventilationAreaReq: z.number().optional(),
    ventilationPeopleReq: z.number().optional(),
})
export type SpaceTypeData_v0 = z.infer<typeof SpaceTypeDataSchema_v0>
