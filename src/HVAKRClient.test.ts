import {
    fetch as undiciFetch,
    getGlobalDispatcher,
    MockAgent,
    setGlobalDispatcher,
} from 'undici'
import type Dispatcher from 'undici/types/dispatcher'
import type { MockInterceptor } from 'undici/types/mock-interceptor'
import { afterEach, assert, beforeEach, describe, expect, it } from 'vitest'
import { ExpandedProjectPatch_v0, RevitData_v0 } from './schemas'
import { ExpandedProjectPostDataExample_v0 } from './fixtures'
import { HVAKRClient } from './HVAKRClient'
import { createClientTestTarget } from './test/clientTestTarget'

const { createClient, describeApi } = createClientTestTarget()

const exampleApiBaseUrl = 'https://api.example.test'

const mockResponse = (
    statusCode: number,
    data: Record<string, any> | string
) => ({
    statusCode,
    data,
    responseOptions: { headers: { 'content-type': 'application/json' } },
})

const bodyAsString = (
    body: MockInterceptor.MockResponseCallbackOptions['body']
) => (typeof body === 'string' ? body : String(body ?? ''))

const headerValue = (
    headers: MockInterceptor.MockResponseCallbackOptions['headers'],
    name: string
) => {
    const getHeader = (headers as { get?: unknown } | undefined)?.get
    if (typeof getHeader === 'function') {
        return getHeader.call(headers, name) as string | null
    }
    if (Array.isArray(headers)) {
        const headerIndex = headers.findIndex(
            (header, index) =>
                index % 2 === 0 &&
                String(header).toLowerCase() === name.toLowerCase()
        )
        return headerIndex >= 0 ? String(headers[headerIndex + 1]) : undefined
    }
    const headerMap = headers as Record<string, string> | undefined
    const headerKey = Object.keys(headerMap ?? {}).find(
        (key) => key.toLowerCase() === name.toLowerCase()
    )
    return headerKey ? headerMap?.[headerKey] : undefined
}

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
        baseUrl: exampleApiBaseUrl,
    })

    let agent: MockAgent
    let previousDispatcher: Dispatcher
    let previousFetch: typeof globalThis.fetch
    let replies: Array<{
        statusCode: number
        data: Record<string, any> | string
    }>
    let requests: MockInterceptor.MockResponseCallbackOptions[]

    beforeEach(() => {
        previousDispatcher = getGlobalDispatcher()
        previousFetch = globalThis.fetch
        agent = new MockAgent()
        agent.disableNetConnect()
        replies = []
        requests = []
        agent
            .get(exampleApiBaseUrl)
            .intercept({ path: /.*/, method: /.*/ })
            .reply((request) => {
                requests.push(request)
                const reply = replies.shift() ?? { statusCode: 200, data: {} }
                return mockResponse(reply.statusCode, reply.data)
            })
            .persist()
        setGlobalDispatcher(agent)
        globalThis.fetch = undiciFetch as typeof globalThis.fetch
    })

    afterEach(async () => {
        globalThis.fetch = previousFetch
        setGlobalDispatcher(previousDispatcher)
        await agent.close()
    })

    const enqueue = (
        statusCode: number,
        data: Record<string, any> | string
    ) => {
        replies.push({ statusCode, data })
    }

    it('createProject POSTs JSON with auth headers and the revitPayload flag', async () => {
        enqueue(200, { id: 'proj_1' })

        const payload = { name: 'My Project' }
        const res = await requestClient.createProject(payload)

        expect(res).toEqual({ id: 'proj_1' })
        const request = requests.at(-1)!
        expect(request.path).toBe('/v0/projects')
        expect(request.method).toBe('POST')
        expect(headerValue(request.headers, 'authorization')).toBe(
            'Bearer test-token'
        )
        expect(headerValue(request.headers, 'accept')).toBe('application/json')
        expect(headerValue(request.headers, 'content-type')).toBe(
            'application/json'
        )
        expect(JSON.parse(bodyAsString(request.body))).toEqual(payload)
    })

    it('createProject sets the revitPayload query flag when requested', async () => {
        enqueue(200, { id: 'proj_1' })
        await requestClient.createProject({ name: 'r' }, true)
        expect(requests.at(-1)?.path).toBe('/v0/projects?revitPayload')
    })

    it('listProjects sends limit and cursor as query params', async () => {
        enqueue(200, { projects: [], hasMore: false, nextCursor: null })
        await requestClient.listProjects({ limit: 25, cursor: 'abc def' })
        const request = requests.at(-1)!
        expect(request.path).toBe('/v0/projects?limit=25&cursor=abc%20def')
        expect(request.method).toBe('GET')
    })

    it('getProject encodes the id and sets the expand flag', async () => {
        enqueue(200, { id: 'a/b' })
        await requestClient.getProject('a/b', true)
        expect(requests.at(-1)?.path).toBe('/v0/projects/a%2Fb?expand')
    })

    it('throws HVAKRClientError carrying the status and response metadata', async () => {
        enqueue(403, { message: 'nope' })
        await expect(requestClient.getProject('p1')).rejects.toMatchObject({
            name: 'HVAKRClientError',
            message: 'Error 403',
            status: 403,
            metadata: { message: 'nope' },
        })
    })

    it('getProjectOutputs throws a parse error when the body is not JSON', async () => {
        enqueue(200, 'not json')
        await expect(
            requestClient.getProjectOutputs('p1', 'loads')
        ).rejects.toThrow(/failed to parse json/)
    })

    it('getProject expands specific subcollections when given an array', async () => {
        enqueue(200, { id: 'p1' })
        await requestClient.getProject('p1', ['spaces', 'zones'])
        expect(requests.at(-1)?.path).toBe(
            '/v0/projects/p1?expand=spaces%2Czones'
        )
    })

    it('getProject omits expand when not requested', async () => {
        enqueue(200, { id: 'p1' })
        await requestClient.getProject('p1')
        expect(requests.at(-1)?.path).toBe('/v0/projects/p1')
    })

    it('getProjectOutputs routes new output types to the right path', async () => {
        enqueue(200, { errors: [], flags: {} })
        await requestClient.getProjectOutputs('p1', 'ventilation')
        expect(requests.at(-1)?.path).toBe(
            '/v0/projects/p1/outputs/ventilation'
        )
    })

    it('createReport POSTs to the reports route and sends the idempotency key', async () => {
        enqueue(201, { id: 'rep_1', status: 'pending' })
        const res = await requestClient.createReport(
            'p1',
            { template: 'load-calculation' },
            { idempotencyKey: 'idem-123' }
        )
        expect(res).toEqual({ id: 'rep_1', status: 'pending' })
        const request = requests.at(-1)!
        expect(request.path).toBe('/v0/projects/p1/reports')
        expect(request.method).toBe('POST')
        expect(headerValue(request.headers, 'idempotency-key')).toBe('idem-123')
        expect(JSON.parse(bodyAsString(request.body))).toEqual({
            template: 'load-calculation',
        })
    })

    it('listReports and getReport hit the reports routes', async () => {
        enqueue(200, [])
        await requestClient.listReports('p1')
        expect(requests.at(-1)?.path).toBe('/v0/projects/p1/reports')

        enqueue(200, { id: 'rep_1', name: 'r', status: 'completed', date: 1 })
        await requestClient.getReport('p1', 'rep_1')
        expect(requests.at(-1)?.path).toBe('/v0/projects/p1/reports/rep_1')
    })

    it('autoGroup POSTs the scope to the actions route', async () => {
        enqueue(200, { created: 2, assigned: 10 })
        const res = await requestClient.autoGroup('p1', { scope: 'spaces' })
        expect(res).toEqual({ created: 2, assigned: 10 })
        const request = requests.at(-1)!
        expect(request.path).toBe('/v0/projects/p1/actions/auto-group')
        expect(request.method).toBe('POST')
        expect(JSON.parse(bodyAsString(request.body))).toEqual({
            scope: 'spaces',
        })
    })

    it('checkProject POSTs to the check action route', async () => {
        enqueue(200, {
            passed: true,
            summary: { errors: 0, warnings: 0, info: 0 },
            tiers: [],
        })
        const res = await requestClient.checkProject('p1')
        expect(res.passed).toBe(true)
        expect(requests.at(-1)?.path).toBe('/v0/projects/p1/actions/check')
        expect(requests.at(-1)?.method).toBe('POST')
    })

    it('createAutoTakeoffJob and getAutoTakeoffJob hit the auto-takeoff routes', async () => {
        enqueue(202, { jobId: 'job_1', status: 'queued' })
        const created = await requestClient.createAutoTakeoffJob('p1', {
            levels: [1, 2],
        })
        expect(created).toEqual({ jobId: 'job_1', status: 'queued' })
        expect(requests.at(-1)?.path).toBe(
            '/v0/projects/p1/actions/auto-takeoff'
        )
        expect(requests.at(-1)?.method).toBe('POST')

        enqueue(200, { jobId: 'job_1', status: 'completed', result: {} })
        const job = await requestClient.getAutoTakeoffJob('p1', 'job_1')
        expect(job.status).toBe('completed')
        expect(requests.at(-1)?.path).toBe(
            '/v0/projects/p1/actions/auto-takeoff/job_1'
        )
        expect(requests.at(-1)?.method).toBe('GET')
    })

    it('exportGbXML returns the raw XML body', async () => {
        enqueue(200, '<?xml version="1.0"?><gbXML></gbXML>')
        const xml = await requestClient.exportGbXML('p1')
        expect(xml.startsWith('<?xml')).toBe(true)
        expect(requests.at(-1)?.path).toBe('/v0/projects/p1/exports/gbxml')
    })
})

describeApi('HVAKR Client', () => {
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

describeApi('HVAKR Client Weather API', () => {
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

describeApi('HVAKR Client Revit API', () => {
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
