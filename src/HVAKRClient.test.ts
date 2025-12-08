import { describe, expect, it, assert } from 'vitest'
import { ExpandedProjectPatch_v0, RevitData_v0 } from './schemas'
import { ExpandedProjectPostDataExample_v0 } from './examples'
import { HVAKRClient } from './HVAKRClient'

describe('HVAKR Client', () => {
    const { HVAKR_ACCESS_TOKEN, HVAKR_CLIENT_API_URL } = process.env

    assert(HVAKR_ACCESS_TOKEN !== undefined, 'HVAKR_ACCESS_TOKEN should exist')

    const hvakrClient = new HVAKRClient({
        baseUrl: HVAKR_CLIENT_API_URL,
        accessToken: HVAKR_ACCESS_TOKEN,
    })

    let id: string | undefined = undefined

    it('should create an expanded HVAKR Project', async () => {
        const res = await hvakrClient.createProject(
            ExpandedProjectPostDataExample_v0
        )
        id = res.id
        expect(id).toBeTruthy()
    }, 40000)

    it('should list HVAKR Projects', async () => {
        const { ids } = await hvakrClient.listProjects()
        expect(ids.length).toBeGreaterThan(0)
        expect(ids).toContain(id)
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
        const weatherStation = await hvakrClient.getWeatherStation(
            weatherStationId
        )
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

        expect(true).toBe(true)
    }, 40000)

    it('should get HVAKR Project dryside graph outputs', async () => {
        const outputs = await hvakrClient.getProjectOutputs(
            id!,
            'dryside_graph'
        )

        expect(Object.keys(outputs.drySideGraph).length).toBe(776)
        expect(outputs.errors.length).toBe(2)

        expect(true).toBe(true)
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

    // TODO: Figure out why the lat/long are not updating. See the todo in the api projects controller.
    it.skip('should update HVAKR Project with valid side-effecting project data', async () => {
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
        console.log('oldProjectData', oldProjectData)
        console.log('newProjectData', newProjectData)
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
                        // Missing required 'level' field
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
        const { ids } = await hvakrClient.listProjects()
        expect(ids.includes(id!)).toBeFalsy()
    }, 40000)
})

describe('HVAKR Client Weather API', () => {
    const { HVAKR_ACCESS_TOKEN, HVAKR_CLIENT_API_URL } = process.env

    assert(HVAKR_ACCESS_TOKEN, 'HVAKR_ACCESS_TOKEN exists')

    const hvakrClient = new HVAKRClient({
        baseUrl: HVAKR_CLIENT_API_URL,
        accessToken: HVAKR_ACCESS_TOKEN,
    })

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

describe('HVAKR Client Revit API', () => {
    const { HVAKR_ACCESS_TOKEN, HVAKR_CLIENT_API_URL } = process.env

    assert(HVAKR_ACCESS_TOKEN, 'HVAKR_ACCESS_TOKEN exists')

    const hvakrClient = new HVAKRClient({
        baseUrl: HVAKR_CLIENT_API_URL,
        accessToken: HVAKR_ACCESS_TOKEN,
    })

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
