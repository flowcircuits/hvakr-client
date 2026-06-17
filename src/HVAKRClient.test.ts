import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExpandedProjectPatch_v0, RevitData_v0 } from './schemas'
import { ExpandedProjectPostDataExample_v0 } from './fixtures'
import { HVAKRClient, HVAKRClientError } from './HVAKRClient'

const {
    HVAKR_ACCESS_TOKEN,
    HVAKR_CLIENT_API_URL,
    HVAKR_TEST_TARGET = 'mock-prod',
} = process.env

const isProdTarget = HVAKR_TEST_TARGET === 'prod'
const describeProdAvailable = describe.skipIf(
    isProdTarget && !HVAKR_ACCESS_TOKEN
)
const baseUrl = isProdTarget
    ? HVAKR_CLIENT_API_URL || undefined
    : 'https://api.mock-prod.test'
const accessToken = isProdTarget ? HVAKR_ACCESS_TOKEN! : 'mock-prod-token'

const createClient = () => new HVAKRClient({ baseUrl, accessToken })

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
const mockProjects = new Map<string, MockProject>()
let mockProjectCounter = 0

const jsonResponse = (
    body: unknown,
    init: { ok?: boolean; status?: number } = {}
) => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => JSON.parse(JSON.stringify(body)),
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

const readBody = (init?: RequestInit) =>
    init?.body ? JSON.parse(init.body as string) : {}

const createMockProject = (
    data: Record<string, any>,
    revitPayload: boolean
) => {
    const id = `mock-project-${++mockProjectCounter}`
    const project = withWeatherDefaults({
        ...data,
        id,
        name: data.name ?? data.projectName ?? 'Mock Project',
        spaces: revitPayload
            ? spacesFromRevit(data as RevitData_v0)
            : data.spaces,
    })
    mockProjects.set(id, project)
    return project
}

const mergeProject = (
    project: MockProject,
    data: Record<string, any>,
    revitPayload: boolean
) => {
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
            selectedStationId: stationIds[1],
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

const hasInvalidPatch = (data: Record<string, any>) =>
    data.name === null ||
    Object.values((data.spaces ?? {}) as Record<string, any>).some(
        (space) => space.level === undefined || space.level === null
    )

const installMockProd = () => {
    vi.stubGlobal(
        'fetch',
        vi.fn(async (input: string | URL, init?: RequestInit) => {
            const url = new URL(input.toString())
            const path = url.pathname.replace(/^\/v0/, '')
            const method = init?.method ?? 'GET'
            const revitPayload = url.searchParams.has('revitPayload')

            if (method === 'POST' && path === '/projects') {
                const project = createMockProject(readBody(init), revitPayload)
                return jsonResponse({ id: project.id })
            }

            if (method === 'GET' && path === '/projects') {
                const projects = [...mockProjects.values()]
                const limit = Number(
                    url.searchParams.get('limit') ?? projects.length
                )
                const cursor = Number(url.searchParams.get('cursor') ?? 0)
                const page = projects.slice(cursor, cursor + limit)
                const nextCursor =
                    cursor + limit < projects.length
                        ? String(cursor + limit)
                        : null
                return jsonResponse({
                    projects: page.map(({ id, name }) => ({ id, name })),
                    hasMore: nextCursor !== null,
                    nextCursor,
                })
            }

            const projectOutputMatch = path.match(
                /^\/projects\/([^/]+)\/outputs\/([^/]+)$/
            )
            if (method === 'GET' && projectOutputMatch) {
                const outputType = decodeURIComponent(projectOutputMatch[2]!)
                if (outputType === 'register_schedule') {
                    return jsonResponse({
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
                    return jsonResponse({
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
                    return jsonResponse({
                        drySideGraph: Object.fromEntries(
                            Array.from({ length: 776 }, (_, index) => [
                                `node-${index}`,
                                {},
                            ])
                        ),
                        errors: [],
                    })
                }
            }

            const projectMatch = path.match(/^\/projects\/([^/]+)$/)
            if (projectMatch) {
                const projectId = decodeURIComponent(projectMatch[1]!)
                const project = mockProjects.get(projectId)
                if (!project) {
                    return jsonResponse(
                        { error: 'Not found' },
                        { ok: false, status: 404 }
                    )
                }
                if (method === 'GET') {
                    return jsonResponse(project)
                }
                if (method === 'PATCH') {
                    const data = readBody(init)
                    if (hasInvalidPatch(data)) {
                        return jsonResponse(
                            { error: 'Invalid space patch' },
                            { ok: false, status: 422 }
                        )
                    }
                    mergeProject(project, data, revitPayload)
                    return jsonResponse({ id: projectId })
                }
                if (method === 'DELETE') {
                    mockProjects.delete(projectId)
                    return jsonResponse({ id: projectId, deleted: true })
                }
            }

            if (method === 'GET' && path === '/weather-stations') {
                return jsonResponse({ weatherStationIds: stationIds })
            }

            const weatherStationMatch = path.match(/^\/weather-stations\/(.+)$/)
            if (method === 'GET' && weatherStationMatch) {
                return jsonResponse({
                    station: {
                        id: decodeURIComponent(weatherStationMatch[1]!),
                    },
                })
            }

            return jsonResponse(
                { error: 'Unhandled mock-prod request' },
                { ok: false, status: 500 }
            )
        })
    )
}

beforeEach(() => {
    if (!isProdTarget) {
        installMockProd()
    }
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('HVAKRClient URL construction', () => {
    const client = new HVAKRClient({
        accessToken: 'token',
        baseUrl: 'https://api.example.test/',
    })

    it('normalizes a trailing base URL slash', () => {
        expect(client.createURL('/projects')).toBe(
            'https://api.example.test/v0/projects'
        )
    })

    it('URL-encodes query parameters and preserves flag parameters', () => {
        expect(
            client.createURL('/weather-stations', {
                latitude: '33.2353947',
                longitude: '-117.2149959',
                expand: true,
                revitPayload: false,
                label: 'A&B Building',
            })
        ).toBe(
            'https://api.example.test/v0/weather-stations?latitude=33.2353947&longitude=-117.2149959&expand&label=A%26B%20Building'
        )
    })
})

describe('HVAKRClient request building', () => {
    const requestClient = new HVAKRClient({
        accessToken: 'test-token',
        baseUrl: 'https://api.example.test',
    })

    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn().mockResolvedValue(jsonResponse({}))
        vi.stubGlobal('fetch', fetchMock)
    })

    const lastCall = () => {
        const [url, init] = fetchMock.mock.lastCall as [string, RequestInit]
        return { url, init }
    }

    it('createProject POSTs JSON with auth headers and the revitPayload flag', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'proj_1' }))

        const payload = { name: 'My Project' }
        const res = await requestClient.createProject(payload)

        expect(res).toEqual({ id: 'proj_1' })
        const { url, init } = lastCall()
        expect(url).toBe('https://api.example.test/v0/projects')
        expect(init.method).toBe('POST')
        expect(init.headers).toMatchObject({
            Authorization: 'Bearer test-token',
            Accept: 'application/json',
            'Content-Type': 'application/json',
        })
        expect(JSON.parse(init.body as string)).toEqual(payload)
    })

    it('createProject sets the revitPayload query flag when requested', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'proj_1' }))
        await requestClient.createProject({ name: 'r' }, true)
        expect(lastCall().url).toBe(
            'https://api.example.test/v0/projects?revitPayload'
        )
    })

    it('listProjects sends limit and cursor as query params', async () => {
        fetchMock.mockResolvedValueOnce(
            jsonResponse({ projects: [], hasMore: false, nextCursor: null })
        )
        await requestClient.listProjects({ limit: 25, cursor: 'abc def' })
        const { url, init } = lastCall()
        expect(url).toBe(
            'https://api.example.test/v0/projects?limit=25&cursor=abc%20def'
        )
        expect(init.method).toBe('GET')
    })

    it('getProject encodes the id and sets the expand flag', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'a/b' }))
        await requestClient.getProject('a/b', true)
        expect(lastCall().url).toBe(
            'https://api.example.test/v0/projects/a%2Fb?expand'
        )
    })

    it('throws HVAKRClientError carrying the status and response metadata', async () => {
        fetchMock.mockResolvedValueOnce(
            jsonResponse({ message: 'nope' }, { ok: false, status: 403 })
        )
        await expect(requestClient.getProject('p1')).rejects.toMatchObject({
            name: 'HVAKRClientError',
            message: 'Error 403',
            metadata: { message: 'nope' },
        })
    })

    it('getProjectOutputs throws a parse error when the body is not JSON', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => {
                throw new SyntaxError('Unexpected token')
            },
        })
        await expect(
            requestClient.getProjectOutputs('p1', 'loads')
        ).rejects.toThrow(/failed to parse json/)
    })
})

describeProdAvailable('HVAKR Client', () => {
    const hvakrClient = createClient()

    let id: string | undefined = undefined

    it('should create an expanded HVAKR Project', async () => {
        const res = await hvakrClient.createProject(
            ExpandedProjectPostDataExample_v0
        )
        id = res.id
        expect(id).toBeTruthy()
    }, 40000)

    it('should list HVAKR Projects', async () => {
        const { projects, hasMore, nextCursor } =
            await hvakrClient.listProjects()
        expect(projects.length).toBeGreaterThan(0)
        expect(typeof hasMore).toBe('boolean')
        expect(nextCursor === null || typeof nextCursor === 'string').toBe(true)
        if (id) {
            expect(projects.map((p) => p.id)).toContain(id)
        }
    }, 40000)

    it('should paginate HVAKR Projects', async () => {
        const firstPage = await hvakrClient.listProjects({ limit: 1 })
        expect(firstPage.projects.length).toBeLessThanOrEqual(1)
        expect(typeof firstPage.hasMore).toBe('boolean')

        if (firstPage.hasMore) {
            expect(firstPage.nextCursor).toBeTruthy()
            const secondPage = await hvakrClient.listProjects({
                limit: 1,
                cursor: firstPage.nextCursor!,
            })
            expect(secondPage.projects.length).toBeLessThanOrEqual(1)
            const firstIds = firstPage.projects.map((p) => p.id)
            for (const project of secondPage.projects) {
                expect(firstIds).not.toContain(project.id)
            }
        } else {
            expect(firstPage.nextCursor).toBeNull()
        }
    }, 40000)

    it('should get HVAKR Project', async () => {
        const fetchedProjectData = await hvakrClient.getProject(id!, true)
        expect(fetchedProjectData).toBeTruthy()
        expect(fetchedProjectData.latitude).toBeTruthy()
        expect(fetchedProjectData.longitude).toBeTruthy()
        expect(
            fetchedProjectData.weatherSpec?.nearestWeatherStationIds?.length
        ).toBe(5)
        expect(fetchedProjectData.weatherSpec?.selectedStationId).toBeTruthy()
    }, 10000)

    it('should find weather station data', async () => {
        const fetchedProjectData = await hvakrClient.getProject(id!, true)
        const weatherStationId =
            fetchedProjectData.weatherSpec!.selectedStationId!
        const weatherStation =
            await hvakrClient.getWeatherStation(weatherStationId)
        expect(weatherStation.station).toBeTruthy()
    }, 5000)

    it('should get HVAKR Project register schedule outputs', async () => {
        const outputs = await hvakrClient.getProjectOutputs(
            id!,
            'register_schedule'
        )
        expect(outputs.registerSchedule.length).toBe(246)
    }, 40000)

    it('should get HVAKR Project loads outputs', async () => {
        const outputs = await hvakrClient.getProjectOutputs(id!, 'loads')

        expect(Object.keys(outputs.spaceCoolingLoads).length).toBe(123)
        expect(Object.keys(outputs.spaceHeatingLoads).length).toBe(123)
        expect(Object.keys(outputs.zoneCoolingLoads).length).toBe(115)
        expect(Object.keys(outputs.zoneHeatingLoads).length).toBe(115)
        expect(Object.keys(outputs.systemCoolingLoads).length).toBe(6)
        expect(Object.keys(outputs.systemHeatingLoads).length).toBe(6)
        expect(outputs.errors.length).toBe(0)
    }, 40000)

    it('should get HVAKR Project dryside graph outputs', async () => {
        const outputs = await hvakrClient.getProjectOutputs(
            id!,
            'dryside_graph'
        )

        expect(Object.keys(outputs.drySideGraph).length).toBe(776)
        expect(outputs.errors.length).toBe(0)
    }, 40000)

    it('should update HVAKR Project with valid project data', async () => {
        const res = await hvakrClient.createProject({
            name: 'Project to Update',
            description: 'Test Description',
        })
        const projectId = res.id
        expect(projectId).toBeTruthy()

        const updatedDescription = 'Updated description for testing'
        const projectUpdate: ExpandedProjectPatch_v0 = {
            description: updatedDescription,
        }

        await hvakrClient.updateProject(projectId, projectUpdate)

        const updatedProject = await hvakrClient.getProject(projectId, false)
        expect(updatedProject.description).toBe(updatedDescription)
        await hvakrClient.deleteProject(projectId)
    }, 40000)

    it('should update HVAKR Project with valid side-effecting project data', async () => {
        const res = await hvakrClient.createProject({
            name: 'Project to Update',
            address: 'Mansfield, TX, USA',
        })
        const projectId = res.id
        expect(projectId).toBeTruthy()

        const oldProjectData = await hvakrClient.getProject(projectId, false)
        expect(oldProjectData).toBeTruthy()
        expect(oldProjectData.latitude).toBeTruthy()
        expect(oldProjectData.longitude).toBeTruthy()
        expect(
            oldProjectData.weatherSpec?.nearestWeatherStationIds?.length
        ).toBe(5)
        expect(oldProjectData.weatherSpec?.selectedStationId).toBeTruthy()

        const updatedAddress = 'Newhall, CA, USA'
        const projectUpdate: ExpandedProjectPatch_v0 = {
            address: updatedAddress,
        }

        await hvakrClient.updateProject(projectId, projectUpdate)

        const newProjectData = await hvakrClient.getProject(projectId, false)
        expect(newProjectData.address).toBe(updatedAddress)
        expect(newProjectData.latitude).toBeTruthy()
        expect(newProjectData.longitude).toBeTruthy()
        expect(
            newProjectData.weatherSpec?.nearestWeatherStationIds?.length
        ).toBe(5)
        expect(newProjectData.weatherSpec?.selectedStationId).toBeTruthy()

        expect(newProjectData.latitude).not.toBe(oldProjectData.latitude)
        expect(newProjectData.longitude).not.toBe(oldProjectData.longitude)
        expect(newProjectData.weatherSpec?.selectedStationId).not.toBe(
            oldProjectData.weatherSpec?.selectedStationId
        )
        await hvakrClient.deleteProject(projectId)
    }, 40000)

    it('should fail to update HVAKR Project with invalid project data (missing required name)', async () => {
        const res = await hvakrClient.createProject({
            name: 'Project to Fail Update',
        })
        const projectId = res.id
        expect(projectId).toBeTruthy()
        await expect(
            hvakrClient.updateProject(projectId, { name: null })
        ).rejects.toThrow()
        await hvakrClient.deleteProject(projectId)
    }, 40000)

    it('should update HVAKR Project with valid spaces subcollection data', async () => {
        const res = await hvakrClient.createProject({
            name: 'Project to Update',
            description: 'Test Description',
        })
        const projectId = res.id
        expect(projectId).toBeTruthy()

        const newSpaceId = 'test-space-123'
        const spaceName = 'Test Conference Room'
        const expandedProjectUpdate = {
            spaces: {
                [newSpaceId]: {
                    name: spaceName,
                    level: 1,
                    creationSource: 'API',
                    ceilingHeight: 108,
                    edges: {
                        edge1: { index: 0, x1: 0, y1: 0, x2: 120, y2: 0 },
                    },
                },
            },
        }

        await hvakrClient.updateProject(projectId, expandedProjectUpdate)

        const updatedProject = await hvakrClient.getProject(projectId, true)
        expect(updatedProject.spaces?.[newSpaceId]?.name).toBe(spaceName)
        expect(updatedProject.spaces?.[newSpaceId]?.level).toBe(1)
        expect(updatedProject.spaces?.[newSpaceId]?.ceilingHeight).toBe(108)
        await hvakrClient.deleteProject(projectId)
    }, 40000)

    it('should fail to update HVAKR Project when adding space without required level field', async () => {
        const res = await hvakrClient.createProject({
            name: 'Project to Fail Update - Invalid Space Subcollection Update',
        })
        const projectId = res.id
        expect(projectId).toBeTruthy()

        const invalidSpaceId = 'invalid-space-456'

        await expect(
            hvakrClient.updateProject(projectId, {
                spaces: {
                    [invalidSpaceId]: {
                        name: 'Invalid Space Without Level',
                        ceilingHeight: 96,
                        edges: {
                            edge1: { index: 0, x1: 0, y1: 0, x2: 100, y2: 0 },
                        },
                    } as any,
                },
            })
        ).rejects.toThrow()
        await hvakrClient.deleteProject(projectId)
    }, 40000)

    it('should fail to update HVAKR Project when removing level field from existing space', async () => {
        const spaceId = 'testSpace'
        const res = await hvakrClient.createProject({
            name: 'Project to Fail Update - Invalid Space Subcollection Update',
            spaces: {
                [spaceId]: {
                    name: 'Test Space',
                    level: 1,
                    creationSource: 'API',
                    edges: {
                        edge1: { index: 0, x1: 0, y1: 0, x2: 100, y2: 0 },
                    },
                },
            },
        })
        const projectId = res.id
        expect(projectId).toBeTruthy()

        await expect(
            hvakrClient.updateProject(projectId, {
                spaces: { [spaceId]: { level: null } },
            })
        ).rejects.toThrow()
        await hvakrClient.deleteProject(projectId)
    }, 40000)

    it('should delete HVAKR Project', async () => {
        await hvakrClient.deleteProject(id!)
        const { projects } = await hvakrClient.listProjects()
        expect(projects.map((p) => p.id)).not.toContain(id!)
    }, 40000)
})

describeProdAvailable('HVAKR Client Weather API', () => {
    const hvakrClient = createClient()

    it('should find weather stations by me', async () => {
        const { weatherStationIds } = await hvakrClient.searchWeatherStations(
            33.2353947,
            -117.2149959
        )
        expect(weatherStationIds).toHaveLength(5)
    })
})

const revitData: RevitData_v0 = {
    projectAddress: '24546 Golden Oak Lane, Newhall, CA, 91321',
    projectName: 'Test Project',
    projectRotationDegrees: 0,
    revitSpaces: [
        {
            area: 100,
            uniqueId: '123',
            levelElevation: 0,
            name: 'Test Space',
            number: '1',
            unboundedHeight: 10,
            volume: 1000,
            boundaries: [
                [
                    { x1: 0, y1: 0, x2: 100, y2: 0 },
                    { x1: 100, y1: 0, x2: 100, y2: 100 },
                    { x1: 100, y1: 100, x2: 0, y2: 100 },
                    { x1: 0, y1: 100, x2: 0, y2: 0 },
                ],
            ],
        },
        {
            area: 200,
            uniqueId: '456',
            levelElevation: 0,
            name: 'Test Space 2',
            number: '2',
            unboundedHeight: 20,
            volume: 2000,
            boundaries: [
                [
                    { x1: 100, y1: 100, x2: 200, y2: 100 },
                    { x1: 200, y1: 100, x2: 200, y2: 200 },
                    { x1: 200, y1: 200, x2: 100, y2: 200 },
                    { x1: 100, y1: 200, x2: 100, y2: 100 },
                ],
            ],
        },
        {
            area: 300,
            uniqueId: '789',
            levelElevation: 100,
            name: 'Test Space 3',
            number: '3',
            unboundedHeight: 30,
            volume: 3000,
            boundaries: [
                [
                    { x1: 0, y1: 0, x2: 100, y2: 0 },
                    { x1: 100, y1: 0, x2: 100, y2: 100 },
                    { x1: 100, y1: 100, x2: 0, y2: 100 },
                    { x1: 0, y1: 100, x2: 0, y2: 0 },
                ],
            ],
        },
    ],
}

describeProdAvailable('HVAKR Client Revit API', () => {
    const hvakrClient = createClient()

    it('should create a project from Revit data', async () => {
        const res = await hvakrClient.createProject(revitData, true)
        expect(res.id).toBeTruthy()

        const project = await hvakrClient.getProject(res.id, true)
        expect(project.spaces).toBeTruthy()
        expect(Object.keys(project.spaces!).length).toBe(3)
        const spaces = Object.values(project.spaces!)
        assert(spaces.some((space) => space.revitId === '123'))
        assert(spaces.some((space) => space.revitId === '456'))
        assert(spaces.some((space) => space.revitId === '789'))
        assert(spaces.some((space) => space.level === 0))
        assert(spaces.some((space) => space.level === 1))

        await hvakrClient.deleteProject(res.id)
    }, 40000)

    it('should update a project from Revit data', async () => {
        const res = await hvakrClient.createProject({})
        expect(res.id).toBeTruthy()

        await hvakrClient.updateProject(res.id, revitData, true)

        const project = await hvakrClient.getProject(res.id, true)
        expect(project.spaces).toBeTruthy()
        expect(Object.keys(project.spaces!).length).toBe(3)

        await hvakrClient.deleteProject(res.id)
    }, 40000)
})
