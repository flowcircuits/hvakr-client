import { describe, expect, it } from 'vitest'
import {
    SpaceAirflowRequirementsSchema_v0,
    SpaceTypeDataSchema_v0,
    WindowTypeDataSchema_v0,
} from '.'

describe('canonical v0 perimeter infiltration fields', () => {
    it('keeps the space perimeter requirement with its method', () => {
        expect(
            SpaceAirflowRequirementsSchema_v0.parse({
                infiltrationPerimeterReq: 0.6,
                infiltrationReqMethod: 'PERIMETER',
            })
        ).toEqual({
            infiltrationPerimeterReq: 0.6,
            infiltrationReqMethod: 'PERIMETER',
        })
    })

    it('keeps the space type summer and winter perimeter requirements', () => {
        expect(
            SpaceTypeDataSchema_v0.parse({
                name: 'Office',
                infiltrationPerimeterReq: 0.4,
                infiltrationUseSeparateWinterReqs: true,
                infiltrationWinterPerimeterReq: 0.8,
            })
        ).toEqual({
            name: 'Office',
            infiltrationPerimeterReq: 0.4,
            infiltrationUseSeparateWinterReqs: true,
            infiltrationWinterPerimeterReq: 0.8,
        })
    })

    it('keeps the window type summer and winter perimeter requirements', () => {
        expect(
            WindowTypeDataSchema_v0.parse({
                name: 'Fixed double pane',
                infiltrationPerimeterReq: 0.25,
                infiltrationUseSeparateWinterReqs: true,
                infiltrationWinterPerimeterReq: 0.5,
            })
        ).toEqual({
            name: 'Fixed double pane',
            infiltrationPerimeterReq: 0.25,
            infiltrationUseSeparateWinterReqs: true,
            infiltrationWinterPerimeterReq: 0.5,
        })
    })
})
