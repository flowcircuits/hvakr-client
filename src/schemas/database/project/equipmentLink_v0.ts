import { z } from 'zod'

export const EquipmentLinkDataSchema_v0 = z.object({
    upstreamEquipment: z.object({ id: z.string(), outletId: z.string() }),
    downstreamEquipment: z.object({ id: z.string(), inletId: z.string() }),
})
export type EquipmentLinkData_v0 = z.infer<typeof EquipmentLinkDataSchema_v0>

export interface EquipmentLink_v0 extends EquipmentLinkData_v0 {
    id: string
}
