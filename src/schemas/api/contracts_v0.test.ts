import { assert, describe, expect, it } from 'vitest'
import { getJSONSchema } from '../getJSONSchema'
import {
    APIProjectCalculationsSchema_v0,
    CalculatorFlagsSchema_v0,
} from '../outputs'
import { APIErrorSchema_v0 } from './error_v0'
import {
    APIAutoGroupResultSchema_v0,
    APICheckReportSchema_v0,
    APIJobCreateSchema_v0,
    APIJobSchema_v0,
} from './jobs_v0'
import { APIProductSchema_v0 } from './products_v0'
import { APIReportSchema_v0 } from './reports_v0'

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

describe('calculations contract', () => {
    it('accepts a response with only the requested sections', () => {
        const parsed = APIProjectCalculationsSchema_v0.parse({
            errors: [],
            flags: {},
            registerSchedule: [],
        })
        expect(parsed.registerSchedule).toEqual([])
        expect(parsed.loads).toBeUndefined()
        expect(parsed.ventilation).toBeUndefined()
    })

    it('accepts the IAQP "not achievable" minimum outside airflow literal', () => {
        const parsed = APIProjectCalculationsSchema_v0.parse({
            errors: [],
            flags: {},
            ventilation: {
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
            },
        })
        expect(
            parsed.ventilation?.spaces.sp_1?.iaqp?.minimumOutsideAirflow
        ).toBe('not achievable')
    })
})

describe('report schema', () => {
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

describe('job schemas', () => {
    it('requires a job type on create and a known report template', () => {
        expect(APIJobCreateSchema_v0.safeParse({}).success).toBe(false)
        expect(
            APIJobCreateSchema_v0.safeParse({
                type: 'report',
                template: 'nope',
            }).success
        ).toBe(false)
        expect(
            APIJobCreateSchema_v0.safeParse({
                type: 'report',
                template: 'load-calculation',
            }).success
        ).toBe(true)
        expect(
            APIJobCreateSchema_v0.safeParse({
                type: 'auto-group',
                scope: 'spaces',
            }).success
        ).toBe(true)
    })

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

    it('parses a completed sync job with a result', () => {
        const parsed = APIJobSchema_v0.parse({
            jobId: 'job_1',
            type: 'auto-group',
            status: 'completed',
            result: { created: 2, assigned: 5 },
        })
        expect(parsed.status).toBe('completed')
    })

    it('parses a failed async job', () => {
        const parsed = APIJobSchema_v0.parse({
            jobId: 'job_2',
            type: 'auto-takeoff',
            status: 'failed',
            error: 'boom',
        })
        expect(parsed.error).toBe('boom')
    })

    it('parses a report job bridged to its report doc', () => {
        const parsed = APIJobSchema_v0.parse({
            jobId: 'job_3',
            type: 'report',
            status: 'completed',
            result: {
                reportId: 'rep_1',
                report: {
                    id: 'rep_1',
                    name: 'Loads Report',
                    status: 'completed',
                    downloadUrl: 'https://example.test/report.pdf',
                    date: 1,
                    outputFileType: 'PDF',
                },
            },
        })
        const { result } = parsed
        assert(result && 'reportId' in result)
        expect(result.reportId).toBe('rep_1')
        expect(result.report?.downloadUrl).toBe(
            'https://example.test/report.pdf'
        )
    })
})

describe('product schema', () => {
    it('parses a product and drops nothing required', () => {
        const parsed = APIProductSchema_v0.parse({
            id: 'prod_1',
            name: 'RTU-5',
            manufacturer: 'Acme',
            price: 1200,
            specifications: { tonnage: 5 },
            files: { f1: { name: 'cut-sheet.pdf', url: 'https://x/f.pdf' } },
        })
        expect(parsed.name).toBe('RTU-5')
        expect(parsed.files?.f1?.url).toBe('https://x/f.pdf')
    })

    it('requires id and name', () => {
        expect(APIProductSchema_v0.safeParse({ id: 'p' }).success).toBe(false)
    })
})

describe('OpenAPI JSON Schema generation', () => {
    const schemas = {
        APIErrorSchema_v0,
        APIProjectCalculationsSchema_v0,
        APIJobCreateSchema_v0,
        APIJobSchema_v0,
        APIProductSchema_v0,
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
