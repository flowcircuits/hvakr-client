import { describe, expect, it } from 'vitest'
import {
    GraphSchema_v0,
    NodeTypes_v0,
    RegisterNodeDataSchema_v0,
} from './graph_v0'
import { SpaceTypeDataSchema_v0 } from './spaceType_v0'
import { SpaceRegisterScheduleRowSchema_v0 } from '../../outputs/misc_v0'

describe('register productId', () => {
    it('parses a register node carrying the catalog productId', () => {
        const node = {
            nodeType: NodeTypes_v0.REGISTER,
            flowType: 'SUPPLY',
            placementType: 'CEILING',
            size: { height: 24, width: 24 },
            productId: 'price-smx-amx',
            inletSize: '12x12',
        }

        expect(RegisterNodeDataSchema_v0.parse(node)).toEqual(node)
        const storedNode = {
            ...node,
            id: 'reg_1',
            level: 0,
            adjacencies: [],
            point: { x: 0, y: 0 },
        }
        expect(GraphSchema_v0.parse({ reg_1: storedNode })).toEqual({
            reg_1: storedNode,
        })
    })

    it('parses registerSpec entries keyed by productId', () => {
        const spaceType = {
            registerSpec: {
                SUPPLY: { productId: 'price-smx-amx', maxCFM: 380 },
                RETURN: { productId: 'price-smd-amd' },
            },
        }

        expect(SpaceTypeDataSchema_v0.parse(spaceType).registerSpec).toEqual(
            spaceType.registerSpec
        )
    })

    it('requires productId on register schedule rows', () => {
        const row = {
            configuration: '4A',
            flowType: 'SUPPLY',
            inletSize: '12x12',
            manufacturer: 'Price',
            model: 'SMX/AMX',
            modelType: 'ceilingSquare',
            productId: 'price-smx-amx',
            quantity: 2,
            registerCFM: 300,
            registerFPM: 400,
            registerNC: 19,
            registerSize: '24x24',
            spaceName: 'Lobby',
            spaceNumber: '101',
            totalCFM: 600,
        }

        expect(SpaceRegisterScheduleRowSchema_v0.parse(row)).toEqual(row)

        const { productId: _productId, ...withoutProductId } = row
        expect(
            SpaceRegisterScheduleRowSchema_v0.safeParse(withoutProductId)
                .success
        ).toBe(false)
    })
})
