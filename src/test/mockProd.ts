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
        const path = url.pathname.replace(/^\/v0/, '')
        const method = request.method
        const revitPayload = url.searchParams.has('revitPayload')

        if (method === 'POST' && path === '/projects') {
            const project = this.createProject(
                readBody(request.body),
                revitPayload
            )
            return response(200, { id: project.id })
        }

        if (method === 'GET' && path === '/projects') {
            return this.listProjects(url)
        }

        const projectOutputMatch = path.match(
            /^\/projects\/([^/]+)\/outputs\/([^/]+)$/
        )
        if (method === 'GET' && projectOutputMatch) {
            return this.projectOutput(
                decodeURIComponent(projectOutputMatch[2]!)
            )
        }

        const projectMatch = path.match(/^\/projects\/([^/]+)$/)
        if (projectMatch) {
            return this.projectRequest({
                method,
                projectId: decodeURIComponent(projectMatch[1]!),
                data: readBody(request.body),
                revitPayload,
            })
        }

        if (method === 'GET' && path === '/weather-stations') {
            return response(200, { weatherStationIds: stationIds })
        }

        const weatherStationMatch = path.match(/^\/weather-stations\/(.+)$/)
        if (method === 'GET' && weatherStationMatch) {
            return response(200, {
                station: { id: decodeURIComponent(weatherStationMatch[1]!) },
            })
        }

        return response(500, { error: 'Unhandled mock prod request' })
    }

    private createProject(data: Record<string, any>, revitPayload: boolean) {
        const id = `mock-project-${++this.projectCounter}`
        const project = withWeatherDefaults({
            ...data,
            id,
            name: data.name ?? data.projectName ?? 'Mock Project',
            spaces: revitPayload
                ? spacesFromRevit(data as RevitData_v0)
                : data.spaces,
        })
        this.projects.set(id, project)
        return project
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

    private projectOutput(outputType: string) {
        if (outputType === 'register_schedule') {
            return response(200, {
                registerSchedule: Array.from({ length: 246 }),
            })
        }

        if (outputType === 'loads') {
            const entries = (count: number) =>
                Object.fromEntries(
                    Array.from({ length: count }, (_, index) => [
                        `item-${index}`,
                        {},
                    ])
                )
            return response(200, {
                spaceCoolingLoads: entries(123),
                spaceHeatingLoads: entries(123),
                zoneCoolingLoads: entries(115),
                zoneHeatingLoads: entries(115),
                systemCoolingLoads: entries(6),
                systemHeatingLoads: entries(6),
                errors: [],
            })
        }

        if (outputType === 'dryside_graph') {
            return response(200, {
                drySideGraph: Object.fromEntries(
                    Array.from({ length: 776 }, (_, index) => [
                        `node-${index}`,
                        {},
                    ])
                ),
                errors: [],
            })
        }

        return response(404, { error: 'Unknown output type' })
    }

    private projectRequest({
        method,
        projectId,
        data,
        revitPayload,
    }: {
        method: string
        projectId: string
        data: Record<string, any>
        revitPayload: boolean
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
            this.mergeProject(project, data, revitPayload)
            return response(200, { id: projectId })
        }

        if (method === 'DELETE') {
            this.projects.delete(projectId)
            return response(200, { id: projectId, deleted: true })
        }

        return response(405, { error: 'Method not allowed' })
    }

    private mergeProject(
        project: MockProject,
        data: Record<string, any>,
        revitPayload: boolean
    ) {
        if (revitPayload) {
            project.spaces = spacesFromRevit(data as RevitData_v0)
            return
        }

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
