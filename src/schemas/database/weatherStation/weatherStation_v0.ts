import { z } from 'zod'

// ASHRAE design-condition percentiles referenced by a project's weatherSpec.
// (The full weather-station dataset is not exposed through the v0 API.)
export const CoolingPercentSchema_v0 = z.enum(['0.4', '2', '5', '10'])
export const HeatingPercentSchema_v0 = z.enum(['99', '99.6'])
