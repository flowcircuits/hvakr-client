import { describe, expect, it } from 'vitest'
import { getJSONSchema } from '../getJSONSchema'
import {
    APIProjectOutputAirflowsSchema_v0,
    APIProjectOutputChecksumsSchema_v0,
    APIProjectOutputEquipmentSchema_v0,
    APIProjectOutputLoadsSchema_v0,
    APIProjectOutputVentilationSchema_v0,
    CalculatorFlagsSchema_v0,
} from '../outputs'
import { APIErrorSchema_v0 } from './error_v0'
import { APIReportCreateSchema_v0, APIReportSchema_v0 } from './reports_v0'
import {
    APIAutoGroupResultSchema_v0,
    APIAutoTakeoffJobSchema_v0,
    APICheckReportSchema_v0,
} from './actions_v0'

describe('APIErrorSchema_v0', () => {
    it('accepts a valid error envelope', () => {
        const parsed = APIErrorSchema_v0.parse({
            error: { code: 'not_found', message: 'missing' },
            requestId: 'req_1',
        })
        expect(parsed.error.code).toBe('not_found')
    })

    it('rejects an unknown error code', () => {
        expect(
            APIErrorSchema_v0.safeParse({
                error: { code: 'nonsense', message: 'x' },
                requestId: 'req_1',
            }).success
        ).toBe(false)
    })
})

describe('calculator flags', () => {
    it('parses project and entity flag targets', () => {
        const parsed = CalculatorFlagsSchema_v0.parse({
            NO_WEATHER_STATION_SELECTED: [{ entityType: 'project' }],
            COOLING_LOAD_FAILED: [{ entityType: 'space', id: 'sp_1' }],
        })
        expect(parsed.COOLING_LOAD_FAILED?.[0]).toEqual({
            entityType: 'space',
            id: 'sp_1',
        })
    })
})

describe('ventilation output IAQP sentinel', () => {
    it('accepts the "not achievable" minimum outside airflow literal', () => {
        const parsed = APIProjectOutputVentilationSchema_v0.parse({
            errors: [],
            flags: {},
            spaces: {
                sp_1: {
                    iaqp: {
                        airCleanerCount: 0,
                        cleaningAirflow: 0,
                        minimumOutsideAirflow: 'not achievable',
                    },
                },
            },
            systems: {},
            zones: {},
            equipment: {},
        })
        expect(parsed.spaces.sp_1.iaqp?.minimumOutsideAirflow).toBe(
            'not achievable'
        )
    })
})

describe('report schemas', () => {
    it('requires a known template on create', () => {
        expect(
            APIReportCreateSchema_v0.safeParse({ template: 'nope' }).success
        ).toBe(false)
        expect(
            APIReportCreateSchema_v0.safeParse({ template: 'load-calculation' })
                .success
        ).toBe(true)
    })

    it('parses a completed report with a download URL', () => {
        const parsed = APIReportSchema_v0.parse({
            id: 'rep_1',
            name: 'Loads Report',
            status: 'completed',
            downloadUrl: 'https://example.test/report.pdf',
            date: 1,
            outputFileType: 'PDF',
        })
        expect(parsed.status).toBe('completed')
    })
})

describe('action schemas', () => {
    it('parses an auto-group result', () => {
        expect(
            APIAutoGroupResultSchema_v0.parse({ created: 1, assigned: 2 })
        ).toEqual({ created: 1, assigned: 2 })
    })

    it('parses a check report', () => {
        const parsed = APICheckReportSchema_v0.parse({
            passed: false,
            summary: { errors: 1, warnings: 0, info: 2 },
            tiers: [
                {
                    tier: 1,
                    label: 'Structure',
                    passed: false,
                    findings: [
                        { tier: 1, severity: 'error', message: 'No spaces' },
                    ],
                },
            ],
        })
        expect(parsed.tiers[0].findings[0].severity).toBe('error')
    })

    it('parses an auto-takeoff job', () => {
        const parsed = APIAutoTakeoffJobSchema_v0.parse({
            jobId: 'job_1',
            status: 'failed',
            error: 'boom',
        })
        expect(parsed.status).toBe('failed')
    })
})

describe('OpenAPI JSON Schema generation', () => {
    const schemas = {
        APIErrorSchema_v0,
        APIProjectOutputLoadsSchema_v0,
        APIProjectOutputVentilationSchema_v0,
        APIProjectOutputEquipmentSchema_v0,
        APIProjectOutputChecksumsSchema_v0,
        APIProjectOutputAirflowsSchema_v0,
    }

    for (const [name, schema] of Object.entries(schemas)) {
        it(`serializes ${name} to JSON Schema`, () => {
            const jsonSchema = getJSONSchema(schema)
            expect(jsonSchema).toBeTypeOf('object')
            // Must be JSON-serializable (no cycles / unrepresentable nodes).
            expect(() => JSON.stringify(jsonSchema)).not.toThrow()
        })
    }
})
