import { z } from 'zod'
import {
    DuctAdjacencyDataSchema_v0,
    FlowTypes_v0,
    FlowTypeSchema_v0,
    LinkAdjacencyDataSchema_v0,
    NodeDataSchema_v0,
} from '../database/project/graph_v0'

export { FlowTypes_v0, FlowTypeSchema_v0 }

// CoolingLoads and HeatingLoads type definitions for v0 API

export const HourlyLoadsSchema_v0 = z.array(z.number())

export const MonthlyLoadsSchema_v0 = z.array(HourlyLoadsSchema_v0)

export const CoolingLoadsSchema_v0 = z.object({
    external: z.object({
        doors: MonthlyLoadsSchema_v0,
        roof: z.object({
            ceilingPlenum: MonthlyLoadsSchema_v0,
            space: MonthlyLoadsSchema_v0,
        }),
        skylights: MonthlyLoadsSchema_v0,
        slab: MonthlyLoadsSchema_v0,
        walls: z.object({
            ceilingPlenum: MonthlyLoadsSchema_v0,
            space: MonthlyLoadsSchema_v0,
        }),
        windows: MonthlyLoadsSchema_v0,
    }),
    infiltration: z.object({
        latent: z.object({
            doors: MonthlyLoadsSchema_v0,
            general: MonthlyLoadsSchema_v0,
            windows: MonthlyLoadsSchema_v0,
        }),
        sensible: z.object({
            doors: MonthlyLoadsSchema_v0,
            general: MonthlyLoadsSchema_v0,
            windows: MonthlyLoadsSchema_v0,
        }),
    }),
    internal: z.object({
        equipment: HourlyLoadsSchema_v0,
        lighting: z.object({
            ceilingPlenum: HourlyLoadsSchema_v0,
            space: HourlyLoadsSchema_v0,
        }),
        misc: z.object({
            latent: HourlyLoadsSchema_v0,
            sensible: HourlyLoadsSchema_v0,
        }),
        people: z.object({
            latent: HourlyLoadsSchema_v0,
            sensible: HourlyLoadsSchema_v0,
        }),
    }),
    ventilation: z.object({
        latent: MonthlyLoadsSchema_v0,
        sensible: MonthlyLoadsSchema_v0,
    }),
})

export const HeatingLoadsSchema_v0 = z.object({
    external: z.object({
        doors: z.number(),
        roof: z.number(),
        skylights: z.number(),
        slab: z.number(),
        total: z.number(),
        walls: z.number(),
        windows: z.number(),
    }),
    infiltration: z.object({
        sensible: z.object({
            doors: z.number(),
            general: z.number(),
            total: z.number(),
            windows: z.number(),
        }),
        total: z.number(),
    }),
    internal: z.object({ misc: z.number(), total: z.number() }),
    total: z.number(),
    ventilation: z.object({ sensible: z.number(), total: z.number() }),
})

// RegisterModelType definition for v0 API

export const RegisterModelTypes_v0 = {
    CEILING_SQUARE: 'ceilingSquare',
    CEILING_LINEAR: 'ceilingLinear',
    SIDEWALL: 'sidewall',
} as const

export const RegisterModelTypeSchema_v0 = z.enum(
    Object.values(RegisterModelTypes_v0)
)

// FlowType definition for v0 API - re-exported from graph_v0.ts

// SpaceRegisterScheduleRow definition for v0 API

export const SpaceRegisterScheduleRowSchema_v0 = z.object({
    configuration: z.string(),
    flowType: FlowTypeSchema_v0,
    inletSize: z.string(),
    manufacturer: z.string(),
    model: z.string(),
    modelType: RegisterModelTypeSchema_v0,
    quantity: z.number(),
    registerCFM: z.number(),
    registerFPM: z.number(),
    registerNC: z.number(),
    registerSize: z.string(),
    spaceName: z.string(),
    spaceNumber: z.string(),
    totalCFM: z.number(),
})

// Graph types for v0 API

export const MetaGraphNodeDataSchema_v0 = NodeDataSchema_v0.and(
    z.object({ pressure: z.number().optional() })
)
export type MetaGraphNodeData_v0 = z.infer<typeof MetaGraphNodeDataSchema_v0>

export const MetaGraphDuctAdjacencySchema_v0 = z
    .object({ id: z.string() })
    .and(DuctAdjacencyDataSchema_v0)
    .and(z.object({ flowRate: z.number().optional() }))

export const MetaGraphLinkAdjacencySchema_v0 = z
    .object({ id: z.string() })
    .and(LinkAdjacencyDataSchema_v0)

export const MetaGraphAdjacencyDataSchema_v0 = z.union([
    MetaGraphDuctAdjacencySchema_v0,
    MetaGraphLinkAdjacencySchema_v0,
])
export type MetaGraphAdjacencyData_v0 = z.infer<
    typeof MetaGraphAdjacencyDataSchema_v0
>

export const MetaGraphNodeSchema_v0 = z
    .object({
        adjacencies: z.array(MetaGraphAdjacencyDataSchema_v0),
        id: z.string(),
    })
    .and(MetaGraphNodeDataSchema_v0)
export type MetaGraphNode_v0 = z.infer<typeof MetaGraphNodeSchema_v0>

export const MetaGraphSchema_v0 = z.record(z.string(), MetaGraphNodeSchema_v0)
export type MetaGraph_v0 = z.infer<typeof MetaGraphSchema_v0>
