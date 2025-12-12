type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
    ? R
    : _TupleOf<T, N, [T, ...R]>

export type Tuple<T, N extends number> = N extends N
    ? number extends N
        ? T[]
        : _TupleOf<T, N, []>
    : never

export interface Adjacency {
    id: string
}

export type EdgeIds = Tuple<string, 2>

export type AssociatedAdjacencyData<AdjacencyData> = Omit<
    AdjacencyData,
    keyof Adjacency
>
export type GraphAdjacency<AdjacencyData> = Adjacency &
    AssociatedAdjacencyData<AdjacencyData>

export interface Node<AdjacencyData = unknown> {
    adjacencies: GraphAdjacency<AdjacencyData>[]
    id: string
}

export type AssociatedNodeData<NodeData> = Omit<NodeData, keyof Node>

export type GraphNode<NodeData, AdjacencyData> = Node<AdjacencyData> &
    AssociatedNodeData<NodeData>

export type Graph<
    NodeData extends Record<string, any> = Record<never, never>,
    AdjacencyData extends Record<string, any> = Record<never, never>,
> = Record<string, GraphNode<NodeData, AdjacencyData>>

export type Edge<AdjacencyData = unknown> = Omit<
    AssociatedAdjacencyData<AdjacencyData>,
    'ids'
> & { ids: EdgeIds }

export type GraphTraversalOrder = 'PRE' | 'POST'
