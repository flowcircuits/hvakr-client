import { z } from 'zod'
import type { Graphs } from '../misc'
import type {
    DuctAdjacencyData_v0,
    LinkAdjacencyData_v0,
    NodeData_v0,
} from '../database/project/graph_v0'

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
} as const

export const RegisterModelTypeSchema_v0 = z.enum(
    Object.values(RegisterModelTypes_v0)
)

// FlowType definition for v0 API

export const FlowTypes_v0 = {
    SUPPLY: 'SUPPLY',
    RETURN: 'RETURN',
    EXHAUST: 'EXHAUST',
} as const

export const FlowTypeSchema_v0 = z.enum(Object.values(FlowTypes_v0))

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

// APIOutputType definition for v0 API

export const APIOutputTypes_v0 = {
    dryside_graph: 'dryside_graph',
    register_schedule: 'register_schedule',
    loads: 'loads',
} as const

export const APIOutputTypeSchema_v0 = z.enum(Object.values(APIOutputTypes_v0))
export type APIOutputType_v0 = z.infer<typeof APIOutputTypeSchema_v0>

// DrySideGraph types for v0 API

export type MetaDrySideNodeData_v0 = NodeData_v0 & { pressure?: number }
export type MetaDrySideAdjacencyData_v0 =
    | Graphs.GraphAdjacency<DuctAdjacencyData_v0 & { flowRate?: number }>
    | Graphs.GraphAdjacency<LinkAdjacencyData_v0>
export type MetaDrySideGraph_v0 = Graphs.Graph<
    MetaDrySideNodeData_v0,
    MetaDrySideAdjacencyData_v0
>
