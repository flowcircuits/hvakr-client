import { z } from 'zod'
import type { Graphs } from '../../misc'
import { PointSchema, SizeSchema } from '../../misc'
import { FlowTypeSchema_v0 } from '../../outputs/misc_v0'

export const NodeTypes_v0 = {
    REGISTER: 'REGISTER',
    TERMINAL_UNIT: 'TERMINAL_UNIT',
    CENTRAL_UNIT: 'CENTRAL_UNIT',
    PORTAL: 'PORTAL',
    FITTING: 'FITTING',
} as const

export const DuctSizeTypes_v0 = {
    CIRCLE: 'CIRCLE',
    RECTANGLE: 'RECTANGLE',
} as const

export const CircleDuctSizeSchema_v0 = z.object({
    ductSizeType: z.literal(DuctSizeTypes_v0.CIRCLE),
    height: z.number(),
})

export const RectangleDuctSizeSchema_v0 = z.object({
    ductSizeType: z.literal(DuctSizeTypes_v0.RECTANGLE),
    height: z.number(),
    width: z.number(),
})

export const DuctSizeSchema_v0 = z.union([
    CircleDuctSizeSchema_v0,
    RectangleDuctSizeSchema_v0,
])

export const RegisterPlacementTypes_v0 = {
    CEILING: 'CEILING',
    SIDEWALL: 'SIDEWALL',
} as const

export const RegisterPlacementTypeSchema_v0 = z.enum(
    Object.values(RegisterPlacementTypes_v0)
)

export const RegisterSpecificDataSchema_v0 = z.object({
    flowRate: z.number().optional(),
    flowType: FlowTypeSchema_v0,
    placementType: RegisterPlacementTypeSchema_v0,
    pressureLoss: z.number().optional(),
    size: SizeSchema,
    tag: z.string().optional(),
    throw: z.number().optional(),
})

const HasPressureLossSchema_v0 = z.object({
    pressureLoss: z.number().optional(),
})

const HasRotationSchema_v0 = z.object({ rotation: z.number().optional() })

export const RegisterNodeDataSchema_v0 = z.object({
    ...RegisterSpecificDataSchema_v0.shape,
    ...HasPressureLossSchema_v0.shape,
    ...HasRotationSchema_v0.shape,
    nodeType: z.literal(NodeTypes_v0.REGISTER),
    spaceIds: z.array(z.string()).optional(),
})

export const FittingNodeDataSchema_v0 = z.object({
    customLossCoefficients: z.record(z.string(), z.number()).optional(),
    customPressureLosses: z.record(z.string(), z.number()).optional(),
    nodeType: z.literal(NodeTypes_v0.FITTING),
})

export const SelectionSchema_v0 = z.object({
    leavingAirTemp: z.number().optional(),
    productId: z.string(),
    quantity: z.number(),
})

export const TerminalUnitNodeDataSchema_v0 = z.object({
    ...HasPressureLossSchema_v0.shape,
    ...HasRotationSchema_v0.shape,
    nodeType: z.literal(NodeTypes_v0.TERMINAL_UNIT),
    selections: z.record(z.string(), SelectionSchema_v0).optional(),
    zoneId: z.string(),
})

export const CentralUnitNodeDataSchema_v0 = z.object({
    ...HasPressureLossSchema_v0.shape,
    ...HasRotationSchema_v0.shape,
    nodeType: z.literal(NodeTypes_v0.CENTRAL_UNIT),
    selections: z.record(z.string(), SelectionSchema_v0).optional(),
    systemId: z.string(),
})

export const PortalNodeDataSchema_v0 = z.object({
    ...HasPressureLossSchema_v0.shape,
    flowType: FlowTypeSchema_v0,
    nodeType: z.literal(NodeTypes_v0.PORTAL),
})

export const AssociatedNodeDataSchema_v0 = z.union([
    RegisterNodeDataSchema_v0,
    TerminalUnitNodeDataSchema_v0,
    CentralUnitNodeDataSchema_v0,
    FittingNodeDataSchema_v0,
    PortalNodeDataSchema_v0,
])
export type AssociatedNodeData_v0 = z.infer<typeof AssociatedNodeDataSchema_v0>

export const CoordinateNodeDataSchema_v0 = z.object({
    level: z.number(),
    point: PointSchema,
})
export type CoordinateNodeData_v0 = z.infer<typeof CoordinateNodeDataSchema_v0>

export type NodeData_v0 = AssociatedNodeData_v0 & CoordinateNodeData_v0

export const AdjacencyTypes_v0 = { DUCT: 'DUCT', LINK: 'LINK' } as const

export const DuctAdjacencyDataSchema_v0 = z.object({
    adjacencyType: z.literal(AdjacencyTypes_v0.DUCT),
    ductSize: DuctSizeSchema_v0.optional(),
    ductTypeId: z.string().optional(),
})
export type DuctAdjacencyData_v0 = z.infer<typeof DuctAdjacencyDataSchema_v0>

export const LinkAdjacencyDataSchema_v0 = z.object({
    adjacencyType: z.literal(AdjacencyTypes_v0.LINK),
})
export type LinkAdjacencyData_v0 = z.infer<typeof LinkAdjacencyDataSchema_v0>

export const AssociatedAdjacencyDataSchema_v0 = z.union([
    DuctAdjacencyDataSchema_v0,
    LinkAdjacencyDataSchema_v0,
])
export type AssociatedAdjacencyData_v0 = z.infer<
    typeof AssociatedAdjacencyDataSchema_v0
>
export type AdjacencyData_v0 = AssociatedAdjacencyData_v0

export type Graph_v0 = Graphs.Graph<NodeData_v0, AdjacencyData_v0>
