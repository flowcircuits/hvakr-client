import {
    fetch as undiciFetch,
    getGlobalDispatcher,
    MockAgent,
    setGlobalDispatcher,
} from 'undici'
import type Dispatcher from 'undici/types/dispatcher'
import type { MockInterceptor } from 'undici/types/mock-interceptor'
import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExpandedProjectPatch_v0 } from './schemas'
import { ExpandedProjectPostDataExample_v0 } from './fixtures'
import { HVAKRClient, MAX_API_SHEET_UPLOAD_BYTES } from './HVAKRClient'
import { createClientTestTarget } from './test/clientTestTarget'

const { createClient, describeApi } = createClientTestTarget()

const exampleApiBaseUrl = 'https://api.example.test'

const mockResponse = (
    statusCode: number,
    data: Record<string, any> | string,
    headers: Record<string, string> = {}
) => ({
    statusCode,
    data,
    responseOptions: {
        headers: { 'content-type': 'application/json', ...headers },
    },
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
            client.createURL('/products', {
                search: 'A&B Building',
                active: true,
                draft: false,
            })
        ).toBe(
            'https://api.example.test/v0/products?search=A%26B%20Building&active'
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
        headers?: Record<string, string>
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
                return mockResponse(reply.statusCode, reply.data, reply.headers)
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
        data: Record<string, any> | string,
        headers?: Record<string, string>
    ) => {
        replies.push({ statusCode, data, headers })
    }

    it('createProject POSTs JSON to /projects with auth headers', async () => {
        enqueue(201, { id: 'proj_1' })

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
        expect(headerValue(request.headers, 'x-hvakr-client')).toMatch(
            /^hvakr-client-ts\/\d+\.\d+\.\d+/
        )
        expect(JSON.parse(bodyAsString(request.body))).toEqual(payload)
    })

    it('sends the X-HVAKR-Client SDK version header on reads', async () => {
        enqueue(200, { projects: [], hasMore: false, nextCursor: null })
        await requestClient.listProjects()
        expect(headerValue(requests.at(-1)!.headers, 'x-hvakr-client')).toMatch(
            /^hvakr-client-ts\/\d+\.\d+\.\d+/
        )
    })

    it('logs the server client-upgrade warning once per distinct message', async () => {
        const warning =
            'hvakr-client-ts 0.4.0 is outdated; upgrade to >=9.9.9-test'
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const body = { projects: [], hasMore: false, nextCursor: null }
        enqueue(200, body, { 'x-hvakr-client-warning': warning })
        enqueue(200, body, { 'x-hvakr-client-warning': warning })

        await requestClient.listProjects()
        await requestClient.listProjects()

        expect(warn).toHaveBeenCalledTimes(1)
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(warning))
        warn.mockRestore()
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

    it('getProjectCalculations hits /calculations with no include by default', async () => {
        enqueue(200, { errors: [], flags: {} })
        await requestClient.getProjectCalculations('p1')
        expect(requests.at(-1)?.path).toBe('/v0/projects/p1/calculations')
        expect(requests.at(-1)?.method).toBe('GET')
    })

    it('getProjectCalculations joins the include array into a query', async () => {
        enqueue(200, { errors: [], flags: {} })
        await requestClient.getProjectCalculations('p1', {
            include: ['loads', 'ventilation'],
        })
        expect(requests.at(-1)?.path).toBe(
            '/v0/projects/p1/calculations?include=loads%2Cventilation'
        )
    })

    it('createSheetFile POSTs PDF multipart data without a JSON content type', async () => {
        const response = {
            jobId: 'job_sheet_1',
            type: 'sheet-upload',
            status: 'queued',
            result: {
                sheetFileId: 'sheet_file_1',
                sourceFileName: 'A-Plans.pdf',
                name: 'Architectural Plans',
                pagesProcessed: 0,
                placedSheets: 0,
                pages: [],
            },
        }
        const fetchMock = vi
            .fn()
            .mockResolvedValue(
                new Response(JSON.stringify(response), { status: 202 })
            )
        globalThis.fetch = fetchMock

        const result = await requestClient.createSheetFile(
            'p1',
            {
                file: new Blob(['%PDF-1.7']),
                fileName: 'A-Plans.pdf',
                name: 'Architectural Plans',
            },
            { idempotencyKey: 'idem-sheet-1' }
        )

        expect(result.type).toBe('sheet-upload')
        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.example.test/v0/projects/p1/sheet-files',
            expect.objectContaining({ method: 'POST' })
        )
        const init = fetchMock.mock.calls[0]?.[1] as RequestInit
        expect(init.headers).toMatchObject({
            Accept: 'application/json',
            'Idempotency-Key': 'idem-sheet-1',
        })
        expect(init.headers).not.toHaveProperty('Content-Type')
        expect(init.body).toBeInstanceOf(FormData)
        const formData = init.body as FormData
        expect(formData.get('name')).toBe('Architectural Plans')
        const uploadedFile = formData.get('file') as File
        expect(uploadedFile.name).toBe('A-Plans.pdf')
        expect(uploadedFile.type).toBe('application/pdf')
        expect(await uploadedFile.text()).toBe('%PDF-1.7')
    })

    it('createSheetFile accepts a Blob-like value from another realm', async () => {
        const response = {
            jobId: 'job_sheet_cross_realm',
            type: 'sheet-upload',
            status: 'queued',
        }
        const fetchMock = vi
            .fn()
            .mockResolvedValue(
                new Response(JSON.stringify(response), { status: 202 })
            )
        globalThis.fetch = fetchMock

        const source = new Blob(['%PDF-cross-realm'])
        const crossRealmBlob = {
            size: source.size,
            type: source.type,
            arrayBuffer: source.arrayBuffer.bind(source),
        } as unknown as Blob

        await requestClient.createSheetFile('p1', {
            file: crossRealmBlob,
            fileName: 'cross-realm.pdf',
        })

        const init = fetchMock.mock.calls[0]?.[1] as RequestInit
        const uploadedFile = (init.body as FormData).get('file') as File
        expect(uploadedFile.type).toBe('application/pdf')
        expect(await uploadedFile.text()).toBe('%PDF-cross-realm')
    })

    it('createSheetFile preflights the API upload limit before requesting', async () => {
        await expect(
            requestClient.createSheetFile('p1', {
                file: new Uint8Array(MAX_API_SHEET_UPLOAD_BYTES + 1),
                fileName: 'too-large.pdf',
            })
        ).rejects.toThrow('30 MiB API upload limit')
        expect(requests).toHaveLength(0)
    })

    it('createJob POSTs to the jobs route and sends the idempotency key', async () => {
        enqueue(202, { jobId: 'job_1', type: 'report', status: 'queued' })
        const res = await requestClient.createJob(
            'p1',
            { type: 'report', template: 'load-calculation' },
            { idempotencyKey: 'idem-123' }
        )
        expect(res).toEqual({
            jobId: 'job_1',
            type: 'report',
            status: 'queued',
        })
        const request = requests.at(-1)!
        expect(request.path).toBe('/v0/projects/p1/jobs')
        expect(request.method).toBe('POST')
        expect(headerValue(request.headers, 'idempotency-key')).toBe('idem-123')
        expect(JSON.parse(bodyAsString(request.body))).toEqual({
            type: 'report',
            template: 'load-calculation',
        })
    })

    it('createJob returns a completed sync job inline', async () => {
        enqueue(200, {
            jobId: 'job_2',
            type: 'auto-group',
            status: 'completed',
            result: { created: 2, assigned: 10 },
        })
        const res = await requestClient.createJob('p1', {
            type: 'auto-group',
            scope: 'spaces',
        })
        expect(res.status).toBe('completed')
        expect(requests.at(-1)?.path).toBe('/v0/projects/p1/jobs')
    })

    it('getJob GETs the job by id', async () => {
        enqueue(200, {
            jobId: 'job_1',
            type: 'auto-takeoff',
            status: 'completed',
            result: {},
        })
        const job = await requestClient.getJob('p1', 'job_1')
        expect(job.status).toBe('completed')
        expect(requests.at(-1)?.path).toBe('/v0/projects/p1/jobs/job_1')
        expect(requests.at(-1)?.method).toBe('GET')
    })

    it('listProducts GETs /products and returns the pagination envelope', async () => {
        enqueue(200, {
            products: [{ id: 'prod_1', name: 'RTU-5' }],
            hasMore: true,
            nextCursor: 'prod_1',
        })
        const page = await requestClient.listProducts({
            search: 'RTU',
            limit: 1,
            cursor: 'prod_0',
        })
        expect(page).toEqual({
            products: [{ id: 'prod_1', name: 'RTU-5' }],
            hasMore: true,
            nextCursor: 'prod_1',
        })
        expect(requests.at(-1)?.path).toBe(
            '/v0/products?search=RTU&limit=1&cursor=prod_0'
        )
        expect(requests.at(-1)?.method).toBe('GET')
    })

    it('listProjects forwards search/status/projectType filters', async () => {
        enqueue(200, { projects: [], hasMore: false, nextCursor: null })
        await requestClient.listProjects({
            search: 'tower',
            status: 'inProgress',
            projectType: 'commercial',
        })
        expect(requests.at(-1)?.path).toBe(
            '/v0/projects?search=tower&status=inProgress&projectType=commercial'
        )
        expect(requests.at(-1)?.method).toBe('GET')
    })

    it('me GETs /me and returns the caller identity envelope', async () => {
        const body = {
            user: { id: 'u1', email: 'eng@firm.com', license: 'team' },
            organizations: [
                { id: 'org1', name: 'Acme MEP', domain: 'acme.com', role: 10 },
            ],
            plan: { license: 'team', apiAccess: true },
            rateLimit: { limitPerMinute: 120 },
        }
        enqueue(200, body)
        const me = await requestClient.me()
        expect(me).toEqual(body)
        expect(requests.at(-1)?.path).toBe('/v0/me')
        expect(requests.at(-1)?.method).toBe('GET')
    })

    it('getProduct GETs /products/{id}', async () => {
        enqueue(200, { id: 'prod_1', name: 'RTU-5' })
        const product = await requestClient.getProduct('prod_1')
        expect(product).toEqual({ id: 'prod_1', name: 'RTU-5' })
        expect(requests.at(-1)?.path).toBe('/v0/products/prod_1')
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

    it('should list catalog products', async () => {
        const page = await hvakrClient.listProducts()
        expect(Array.isArray(page.products)).toBe(true)
        expect(typeof page.hasMore).toBe('boolean')
        expect(
            page.nextCursor === null || typeof page.nextCursor === 'string'
        ).toBe(true)
    }, 5000)

    it('should return the caller identity from /me', async () => {
        const me = await hvakrClient.me()
        expect(me.user.email).toBeTruthy()
        expect(me.user.license).toBeTruthy()
        expect(Array.isArray(me.organizations)).toBe(true)
        expect(typeof me.plan.apiAccess).toBe('boolean')
        expect(typeof me.rateLimit.limitPerMinute).toBe('number')
    }, 10000)

    it('should get HVAKR Project register schedule calculations', async () => {
        const calc = await hvakrClient.getProjectCalculations(id!, {
            include: ['register_schedule'],
        })
        expect(calc.registerSchedule?.length).toBe(246)
        expect(calc.loads).toBeUndefined()
    }, 40000)

    it('should get HVAKR Project loads calculations', async () => {
        const calc = await hvakrClient.getProjectCalculations(id!, {
            include: ['loads'],
        })
        const loads = calc.loads!

        expect(Object.keys(loads.spaceCoolingLoads).length).toBe(123)
        expect(Object.keys(loads.spaceHeatingLoads).length).toBe(123)
        expect(Object.keys(loads.zoneCoolingLoads).length).toBe(115)
        expect(Object.keys(loads.zoneHeatingLoads).length).toBe(115)
        expect(Object.keys(loads.systemCoolingLoads).length).toBe(6)
        expect(Object.keys(loads.systemHeatingLoads).length).toBe(6)
        expect(calc.errors.length).toBe(0)
    }, 40000)

    it('should get multiple calculation sections from one call', async () => {
        const calc = await hvakrClient.getProjectCalculations(id!, {
            include: ['loads', 'dryside_graph'],
        })
        expect(Object.keys(calc.loads!.spaceCoolingLoads).length).toBe(123)
        expect(Object.keys(calc.drySideGraph!).length).toBe(776)
    }, 40000)

    it('runs sync jobs inline and polls async jobs', async () => {
        const check = await hvakrClient.createJob(id!, { type: 'check' })
        expect(check.type).toBe('check')
        expect(check.status).toBe('completed')

        const reportJob = await hvakrClient.createJob(id!, {
            type: 'report',
            template: 'load-calculation',
        })
        expect(reportJob.status).toBe('queued')

        const polled = await hvakrClient.getJob(id!, reportJob.jobId)
        expect(polled.status).toBe('completed')
        assert(polled.result && 'reportId' in polled.result)
        expect(polled.result.report?.downloadUrl).toBeTruthy()
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
