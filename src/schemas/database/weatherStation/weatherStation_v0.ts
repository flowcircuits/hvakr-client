import { z } from 'zod'

export const CoolingPercentSchema_v0 = z.enum(['0.4', '2', '5', '10'])
export const HeatingPercentSchema_v0 = z.enum(['99', '99.6'])

export const MonthlyBulbTempsSchema_v0 = z.object({
    db: z.array(z.number()),
    wb: z.array(z.number()),
})

export const WeatherStationDataSchema_v0 = z.object({
    averageDailyTemperature: z.array(z.number()),
    cdd50: z.array(z.number()),
    cdd65: z.array(z.number()),
    cdh74: z.array(z.number()),
    cdh80: z.array(z.number()),
    climateZone: z.string(),
    dbRange: z.array(z.number()),
    dbTempByHeatingPercent: z.record(HeatingPercentSchema_v0, z.number()),
    elevation: z.number(),
    hdd50: z.array(z.number()),
    hdd65: z.array(z.number()),
    id: z.string(),
    latitude: z.number(),
    localeClimateZone: z
        .object({
            climateZone: z.string(),
            locale: z.string(),
            source: z.string(),
        })
        .optional(),
    longitude: z.number(),
    monthlyBulbTempsByCoolingPercent: z.record(
        CoolingPercentSchema_v0,
        MonthlyBulbTempsSchema_v0
    ),
    station: z.string(),
    stdDevDailyTemperature: z.array(z.number()),
    taub: z.array(z.number()),
    taud: z.array(z.number()),
    timezoneOffset: z.number(),
    /** Cloud Storage download URL for TMY (Typical Meteorological Year) hourly data */
    tmyDataUrl: z.string().optional(),
    /** TMY data period, e.g. "2009-2023" */
    tmyPeriod: z.string().optional(),
    wbRange: z.array(z.number()),
})
export type WeatherStationData_v0 = z.infer<typeof WeatherStationDataSchema_v0>
