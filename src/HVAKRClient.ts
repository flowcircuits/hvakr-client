import {
    APIOutputType_v0,
    APIProjectOutputDrySideGraph,
    APIProjectOutputLoads_v0,
    APIProjectOutputRegisterSchedule_v0,
    ExpandedProjectPatch_v0,
    ExpandedProjectPost_v0,
    ExpandedProject_v0,
    Project_v0,
    RevitData_v0,
    WeatherStationData_v0,
} from './schemas'

export class HVAKRClientError extends Error {
    metadata?: unknown

    constructor(message?: string, metadata?: unknown) {
        super(message)
        this.metadata = metadata
    }
}

export interface HVAKRClientProps {
    accessToken: string
    baseUrl?: string
    version?: string
}

export class HVAKRClient {
    private baseUrl: string
    private version: string
    private accessToken: string

    constructor({ accessToken, version, baseUrl }: HVAKRClientProps) {
        this.accessToken = accessToken
        this.baseUrl = baseUrl ?? 'https://api.hvakr.com'
        this.version = version ?? 'v0'
    }

    createURL = (
        path: string,
        queryParams?: Record<string, string | boolean>
    ) => {
        let url = `${this.baseUrl}/${this.version}${path}?accessToken=${this.accessToken}`
        if (queryParams) {
            url += `&${Object.entries(queryParams)
                .map(([k, v]) =>
                    typeof v === 'string' ? `${k}=${v}` : v ? k : null
                )
                .filter((a) => a)
                .join('&')}`
        }
        return url
    }

    createProject = async (
        projectData: ExpandedProjectPost_v0 | RevitData_v0,
        revitPayload?: boolean
    ): Promise<{ id: string }> => {
        const res = await fetch(
            this.createURL(`/projects`, { revitPayload: !!revitPayload }),
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData),
            }
        )
        const data = await res.json()
        if (!res.ok) {
            throw new HVAKRClientError(`Error ${res.status}`, data)
        }
        return data
    }

    listProjects = async () => {
        const res = await fetch(this.createURL(`/projects`), { method: 'GET' })
        const data = await res.json()
        return data as { ids: string[] }
    }

    getProject(projectId: string): Promise<Project_v0>

    getProject(projectId: string, expand: false): Promise<Project_v0>

    getProject(projectId: string, expand: true): Promise<ExpandedProject_v0>

    getProject(
        projectId: string,
        expand?: boolean
    ): Promise<Project_v0 | ExpandedProject_v0>

    async getProject(projectId: string, expand?: boolean) {
        const url = this.createURL(`/projects/${projectId}`, {
            expand: !!expand,
        })
        const res = await fetch(url, { method: 'GET' })
        const data = await res.json()
        if (!res.ok) {
            throw new HVAKRClientError(`Error ${res.status}`, data)
        }
        return data
    }

    updateProject = async (
        projectId: string,
        projectData: ExpandedProjectPatch_v0 | RevitData_v0,
        revitPayload?: boolean
    ) => {
        const res = await fetch(
            this.createURL(`/projects/${projectId}`, {
                revitPayload: !!revitPayload,
            }),
            {
                method: 'PATCH',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(projectData),
            }
        )
        const data = await res.json()
        if (!res.ok) {
            throw new HVAKRClientError(`Error ${res.status}`, data)
        }
        return data
    }

    deleteProject = async (projectId: string) => {
        const res = await fetch(this.createURL(`/projects/${projectId}`), {
            method: 'DELETE',
        })
        const data = await res.json()
        if (!res.ok) {
            throw new HVAKRClientError(`Error ${res.status}`, data)
        }
        return data
    }

    getProjectOutputs(
        projectId: string,
        outputType: 'loads'
    ): Promise<APIProjectOutputLoads_v0>

    getProjectOutputs(
        projectId: string,
        outputType: 'dryside_graph'
    ): Promise<APIProjectOutputDrySideGraph>

    getProjectOutputs(
        projectId: string,
        outputType: 'register_schedule'
    ): Promise<APIProjectOutputRegisterSchedule_v0>

    getProjectOutputs(
        projectId: string,
        outputType: string
    ): Promise<
        | APIProjectOutputLoads_v0
        | APIProjectOutputDrySideGraph
        | APIProjectOutputRegisterSchedule_v0
    >

    async getProjectOutputs(projectId: string, outputType: APIOutputType_v0) {
        const res = await fetch(
            this.createURL(`/projects/${projectId}/outputs/${outputType}`),
            { method: 'GET' }
        )
        let data: unknown
        try {
            data = await res.json()
        } catch (error) {
            throw new HVAKRClientError(
                `Error ${res.status} - failed to parse json`,
                {
                    error,
                }
            )
        }

        if (!res.ok) {
            throw new HVAKRClientError(`Error ${res.status}`, { data })
        }

        switch (outputType) {
            case 'loads':
                return data as APIProjectOutputLoads_v0
            case 'dryside_graph':
                return data as APIProjectOutputDrySideGraph
            case 'register_schedule':
                return data as APIProjectOutputRegisterSchedule_v0
        }
    }

    searchWeatherStations = async (latitude: number, longitude: number) => {
        const res = await fetch(
            this.createURL(`/weather-stations`, {
                latitude: latitude.toString(),
                longitude: longitude.toString(),
            }),
            { method: 'GET' }
        )
        const data = await res.json()
        if (!res.ok) {
            throw new HVAKRClientError(`Error ${res.status}`, data)
        }
        return data as { weatherStationIds: string[] }
    }

    getWeatherStation = async (weatherStationId: string) => {
        const res = await fetch(
            this.createURL(`/weather-stations/${weatherStationId}`),
            { method: 'GET' }
        )
        const data = await res.json()
        if (!res.ok) {
            throw new HVAKRClientError(`Error ${res.status}`, data)
        }
        return data as WeatherStationData_v0
    }
}
