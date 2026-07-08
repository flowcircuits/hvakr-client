import {
    fetch as undiciFetch,
    getGlobalDispatcher,
    MockAgent,
    setGlobalDispatcher,
} from 'undici'
import type Dispatcher from 'undici/types/dispatcher'
import type { MockInterceptor } from 'undici/types/mock-interceptor'
import { RevitData_v0 } from '../schemas'

export const MOCK_PROD_BASE_URL = 'https://api.mock-prod.test'
export const MOCK_PROD_ACCESS_TOKEN = 'mock-prod-token'

type MockProject = Record<string, any> & {
    id: string
    name?: string
    description?: string
    latitude?: number
    longitude?: number
    weatherSpec?: {
        nearestWeatherStationIds: string[]
        selectedStationId: string
    }
    spaces?: Record<string, any>
}

type MockJob = {
    jobId: string
    type: string
    status: string
    reportId?: string
    result?: Record<string, any>
}

const ALL_CALCULATION_SECTIONS = [
    'loads',
    'register_schedule',
    'dryside_graph',
    'ventilation',
    'equipment',
    'checksums',
    'airflows',
]

const stationIds = ['CA001', 'CA002', 'CA003', 'CA004', 'CA005']

const readBody = (body: unknown) =>
    typeof body === 'string' && body ? JSON.parse(body) : {}

const response = (statusCode: number, data: Record<string, any> | string) => ({
    statusCode,
    data,
    responseOptions: { headers: { 'content-type': 'application/json' } },
})

const withWeatherDefaults = <T extends Record<string, any>>(project: T): T => ({
    ...project,
    latitude: project.latitude ?? 33.2353947,
    longitude: project.longitude ?? -117.2149959,
    weatherSpec: {
        ...project.weatherSpec,
        nearestWeatherStationIds:
            project.weatherSpec?.nearestWeatherStationIds ?? stationIds,
        selectedStationId:
            project.weatherSpec?.selectedStationId ?? stationIds[0],
    },
})

const spacesFromRevit = (data: RevitData_v0) =>
    Object.fromEntries(
        data.revitSpaces.map((space, index) => [
            `revit-space-${space.uniqueId}`,
            {
                name: space.name,
                level: index === 2 ? 1 : 0,
                revitId: space.uniqueId,
                creationSource: 'API_REVIT',
            },
        ])
    )

const hasInvalidPatch = (data: Record<string, any>) =>
    data.name === null ||
    Object.values((data.spaces ?? {}) as Record<string, any>).some(
        (space) => space.level === undefined || space.level === null
    )

export class MockProdService {
    private agent: MockAgent | undefined
    private previousDispatcher: Dispatcher | undefined
    private previousFetch: typeof globalThis.fetch | undefined
    private projects = new Map<string, MockProject>()
    private projectCounter = 0
    private jobs = new Map<string, MockJob>()
    private jobCounter = 0

    install() {
        this.previousDispatcher = getGlobalDispatcher()
        this.previousFetch = globalThis.fetch
        this.agent = new MockAgent()
        this.agent.disableNetConnect()
        this.agent
            .get(MOCK_PROD_BASE_URL)
            .intercept({ path: /.*/, method: /.*/ })
            .reply((request) => this.handle(request))
            .persist()
        setGlobalDispatcher(this.agent)
        globalThis.fetch = undiciFetch as typeof globalThis.fetch
    }

    async uninstall() {
        if (this.previousFetch) {
            globalThis.fetch = this.previousFetch
        }
        if (this.previousDispatcher) {
            setGlobalDispatcher(this.previousDispatcher)
        }
        await this.agent?.close()
        this.agent = undefined
        this.previousDispatcher = undefined
        this.previousFetch = undefined
    }

    private handle(request: MockInterceptor.MockResponseCallbackOptions) {
        const url = new URL(request.path, MOCK_PROD_BASE_URL)
        const method = request.method

        // Revit ingestion namespace — versioned independently of `/v0`.
        if (url.pathname.startsWith('/revit/v0')) {
            const revitPath = url.pathname.replace(/^\/revit\/v0/, '')
            if (method === 'POST' && revitPath === '/projects') {
                const project = this.createProjectFromRevit(
                    readBody(request.body)
                )
                return response(201, { id: project.id })
            }
            const revitProjectMatch = revitPath.match(/^\/projects\/([^/]+)$/)
            if (method === 'PATCH' && revitProjectMatch) {
                return this.updateProjectFromRevit(
                    decodeURIComponent(revitProjectMatch[1]!),
                    readBody(request.body)
                )
            }
            return response(500, { error: 'Unhandled mock prod revit request' })
        }

        const path = url.pathname.replace(/^\/v0/, '')

        if (method === 'POST' && path === '/projects') {
            const project = this.createProject(readBody(request.body))
            return response(201, { id: project.id })
        }

        if (method === 'GET' && path === '/projects') {
            return this.listProjects(url)
        }

        const calculationsMatch = path.match(
            /^\/projects\/([^/]+)\/calculations$/
        )
        if (method === 'GET' && calculationsMatch) {
            return this.calculations(url)
        }

        const jobsMatch = path.match(/^\/projects\/([^/]+)\/jobs$/)
        if (method === 'POST' && jobsMatch) {
            return this.createJob(
                decodeURIComponent(jobsMatch[1]!),
                readBody(request.body)
            )
        }

        const jobMatch = path.match(/^\/projects\/([^/]+)\/jobs\/([^/]+)$/)
        if (method === 'GET' && jobMatch) {
            return this.getJob(decodeURIComponent(jobMatch[2]!))
        }

        const projectMatch = path.match(/^\/projects\/([^/]+)$/)
        if (projectMatch) {
            return this.projectRequest({
                method,
                projectId: decodeURIComponent(projectMatch[1]!),
                data: readBody(request.body),
            })
        }

        if (method === 'GET' && path.startsWith('/products')) {
            const productMatch = path.match(/^\/products\/(.+)$/)
            if (productMatch) {
                return response(200, {
                    id: decodeURIComponent(productMatch[1]!),
                    name: 'Mock Product',
                })
            }
            return response(200, [
                { id: 'mock-product-1', name: 'Mock Product' },
            ])
        }

        return response(500, { error: 'Unhandled mock prod request' })
    }

    private createProject(data: Record<string, any>) {
        const id = `mock-project-${++this.projectCounter}`
        const project = withWeatherDefaults({
            ...data,
            id,
            name: data.name ?? 'Mock Project',
            spaces: data.spaces,
        })
        this.projects.set(id, project)
        return project
    }

    private createProjectFromRevit(data: RevitData_v0) {
        const id = `mock-project-${++this.projectCounter}`
        const project = withWeatherDefaults({
            id,
            name: data.projectName ?? 'Mock Project',
            address: data.projectAddress ?? undefined,
            spaces: spacesFromRevit(data),
        })
        this.projects.set(id, project)
        return project
    }

    private updateProjectFromRevit(projectId: string, data: RevitData_v0) {
        const project = this.projects.get(projectId)
        if (!project) {
            return response(404, { error: 'Not found' })
        }
        project.spaces = spacesFromRevit(data)
        return response(200, { id: projectId })
    }

    private listProjects(url: URL) {
        const projects = [...this.projects.values()]
        const limit = Number(url.searchParams.get('limit') ?? projects.length)
        const cursor = Number(url.searchParams.get('cursor') ?? 0)
        const page = projects.slice(cursor, cursor + limit)
        const nextCursor =
            cursor + limit < projects.length ? String(cursor + limit) : null

        return response(200, {
            projects: page.map(({ id, name }) => ({ id, name })),
            hasMore: nextCursor !== null,
            nextCursor,
        })
    }

    private calculations(url: URL) {
        const includeParam = url.searchParams.get('include')
        const include = includeParam
            ? includeParam.split(',').map((s) => s.trim())
            : ALL_CALCULATION_SECTIONS

        const entries = (count: number) =>
            Object.fromEntries(
                Array.from({ length: count }, (_, index) => [
                    `item-${index}`,
                    {},
                ])
            )

        const result: Record<string, any> = { errors: [], flags: {} }

        if (include.includes('register_schedule')) {
            result.registerSchedule = Array.from({ length: 246 })
        }
        if (include.includes('loads')) {
            result.loads = {
                spaceCoolingLoads: entries(123),
                spaceHeatingLoads: entries(123),
                zoneCoolingLoads: entries(115),
                zoneHeatingLoads: entries(115),
                systemCoolingLoads: entries(6),
                systemHeatingLoads: entries(6),
            }
        }
        if (include.includes('dryside_graph')) {
            result.drySideGraph = Object.fromEntries(
                Array.from({ length: 776 }, (_, index) => [`node-${index}`, {}])
            )
        }
        if (include.includes('ventilation')) {
            result.ventilation = {
                spaces: {},
                systems: {},
                zones: {},
                equipment: {},
            }
        }
        if (include.includes('equipment')) {
            result.equipment = {}
        }
        if (include.includes('checksums')) {
            result.checksums = {
                spaces: {},
                systems: {},
                zones: {},
                equipment: {},
            }
        }
        if (include.includes('airflows')) {
            result.airflows = { spaces: {}, systems: {}, zones: {} }
        }

        return response(200, result)
    }

    private createJob(projectId: string, data: Record<string, any>) {
        if (!this.projects.get(projectId)) {
            return response(404, { error: 'Not found' })
        }
        const jobId = `mock-job-${++this.jobCounter}`
        const type = data.type

        if (type === 'auto-group') {
            const job: MockJob = {
                jobId,
                type,
                status: 'completed',
                result: { created: 2, assigned: 10 },
            }
            this.jobs.set(jobId, job)
            return response(200, job)
        }
        if (type === 'check') {
            const job: MockJob = {
                jobId,
                type,
                status: 'completed',
                result: {
                    passed: true,
                    summary: { errors: 0, warnings: 0, info: 0 },
                    tiers: [],
                },
            }
            this.jobs.set(jobId, job)
            return response(200, job)
        }
        if (type === 'report') {
            const reportId = `mock-report-${jobId}`
            this.jobs.set(jobId, { jobId, type, status: 'queued', reportId })
            return response(202, {
                jobId,
                type,
                status: 'queued',
                result: { reportId },
            })
        }
        if (type === 'auto-takeoff') {
            this.jobs.set(jobId, { jobId, type, status: 'queued' })
            return response(202, { jobId, type, status: 'queued' })
        }
        return response(422, { error: 'Unknown job type' })
    }

    private getJob(jobId: string) {
        const job = this.jobs.get(jobId)
        if (!job) {
            return response(404, { error: 'Not found' })
        }
        // Async jobs settle to `completed` once polled; the report job bridges
        // to its linked report doc (with a download URL).
        if (job.type === 'report') {
            return response(200, {
                jobId,
                type: 'report',
                status: 'completed',
                result: {
                    reportId: job.reportId,
                    report: {
                        id: job.reportId,
                        name: 'Mock Report',
                        status: 'completed',
                        downloadUrl: 'https://mock-prod.test/report.pdf',
                        date: 0,
                        outputFileType: 'PDF',
                    },
                },
            })
        }
        if (job.type === 'auto-takeoff') {
            return response(200, {
                jobId,
                type: 'auto-takeoff',
                status: 'completed',
                result: {},
            })
        }
        return response(200, job)
    }

    private projectRequest({
        method,
        projectId,
        data,
    }: {
        method: string
        projectId: string
        data: Record<string, any>
    }) {
        const project = this.projects.get(projectId)
        if (!project) {
            return response(404, { error: 'Not found' })
        }

        if (method === 'GET') {
            return response(200, project)
        }

        if (method === 'PATCH') {
            if (hasInvalidPatch(data)) {
                return response(422, { error: 'Invalid project patch' })
            }
            this.mergeProject(project, data)
            return response(200, { id: projectId })
        }

        if (method === 'DELETE') {
            this.projects.delete(projectId)
            return response(200, { id: projectId, deleted: true })
        }

        return response(405, { error: 'Method not allowed' })
    }

    private mergeProject(project: MockProject, data: Record<string, any>) {
        if (data.address) {
            project.address = data.address
            project.latitude = 34.3794
            project.longitude = -118.523
            project.weatherSpec = {
                nearestWeatherStationIds: stationIds,
                selectedStationId: stationIds[1]!,
            }
        }

        for (const [key, value] of Object.entries(data)) {
            if (key === 'spaces') {
                project.spaces ??= {}
                for (const [spaceId, spacePatch] of Object.entries(
                    value as Record<string, any>
                )) {
                    project.spaces[spaceId] = {
                        ...(project.spaces[spaceId] ?? {}),
                        ...spacePatch,
                    }
                }
            } else {
                project[key] = value
            }
        }
    }
}
