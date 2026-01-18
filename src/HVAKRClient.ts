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

/**
 * Error thrown when the HVAKR API returns an unsuccessful response.
 * Contains the HTTP status code in the message and optional metadata with additional details.
 */
export class HVAKRClientError extends Error {
    /** Additional error details from the API response */
    metadata?: unknown

    constructor(message?: string, metadata?: unknown) {
        super(message)
        this.metadata = metadata
    }
}

/** Configuration options for initializing the HVAKR client */
export interface HVAKRClientProps {
    /** Access token for authentication. Obtain from your HVAKR account settings. */
    accessToken: string
    /** Base URL for the API. Defaults to "https://api.hvakr.com" */
    baseUrl?: string
    /** API version to use. Defaults to "v0" */
    version?: string
}

/**
 * Client for interacting with the HVAKR API.
 *
 * @example
 * ```ts
 * const client = new HVAKRClient({
 *   accessToken: process.env.HVAKR_ACCESS_TOKEN,
 * })
 *
 * const projects = await client.listProjects()
 * ```
 */
export class HVAKRClient {
    private baseUrl: string
    private version: string
    private accessToken: string

    /**
     * Creates a new HVAKR client instance.
     * @param options - Configuration options for the client
     */
    constructor({ accessToken, version, baseUrl }: HVAKRClientProps) {
        this.accessToken = accessToken
        this.baseUrl = baseUrl ?? 'https://api.hvakr.com'
        this.version = version ?? 'v0'
    }

    private getAuthHeaders = (): HeadersInit => {
        return { Authorization: `Bearer ${this.accessToken}` }
    }

    /**
     * Constructs a full API URL with optional query parameters.
     * @param path - API endpoint path (e.g., "/projects")
     * @param queryParams - Optional query parameters to append
     * @returns The full URL string
     */
    createURL = (
        path: string,
        queryParams?: Record<string, string | boolean>
    ) => {
        let url = `${this.baseUrl}/${this.version}${path}`
        if (queryParams) {
            const params = Object.entries(queryParams)
                .map(([k, v]) =>
                    typeof v === 'string' ? `${k}=${v}` : v ? k : null
                )
                .filter((a) => a)
                .join('&')
            if (params) {
                url += `?${params}`
            }
        }
        return url
    }

    /**
     * Creates a new HVAKR project.
     * @param projectData - The project data to create
     * @param revitPayload - Set to true if the data is in Revit format
     * @returns The ID of the newly created project
     * @throws {HVAKRClientError} If the API returns an error response
     */
    createProject = async (
        projectData: ExpandedProjectPost_v0 | RevitData_v0,
        revitPayload?: boolean
    ): Promise<{ id: string }> => {
        const res = await fetch(
            this.createURL(`/projects`, { revitPayload: !!revitPayload }),
            {
                method: 'POST',
                headers: {
                    ...this.getAuthHeaders(),
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

    /**
     * Lists all projects accessible to the authenticated user.
     * @returns An object containing an array of project IDs
     * @throws {HVAKRClientError} If the API returns an error response
     */
    listProjects = async () => {
        const res = await fetch(this.createURL(`/projects`), {
            method: 'GET',
            headers: this.getAuthHeaders(),
        })
        const data = await res.json()
        if (!res.ok) {
            throw new HVAKRClientError(`Error ${res.status}`, data)
        }
        return data as { ids: string[] }
    }

    /**
     * Retrieves a project by ID.
     * @param projectId - The ID of the project to retrieve
     * @param expand - If true, returns the full expanded project data
     * @returns The project data (expanded or basic depending on the expand parameter)
     * @throws {HVAKRClientError} If the API returns an error response
     */
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
        const res = await fetch(url, {
            method: 'GET',
            headers: this.getAuthHeaders(),
        })
        const data = await res.json()
        if (!res.ok) {
            throw new HVAKRClientError(`Error ${res.status}`, data)
        }
        return data
    }

    /**
     * Updates an existing HVAKR project.
     * @param projectId - The ID of the project to update
     * @param projectData - The updated project data
     * @param revitPayload - Set to true if the data is in Revit format
     * @returns The updated project data
     * @throws {HVAKRClientError} If the API returns an error response
     */
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
                    ...this.getAuthHeaders(),
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

    /**
     * Deletes an HVAKR project.
     * @param projectId - The ID of the project to delete
     * @returns The deletion confirmation response
     * @throws {HVAKRClientError} If the API returns an error response
     */
    deleteProject = async (projectId: string) => {
        const res = await fetch(this.createURL(`/projects/${projectId}`), {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        })
        const data = await res.json()
        if (!res.ok) {
            throw new HVAKRClientError(`Error ${res.status}`, data)
        }
        return data
    }

    /**
     * Retrieves calculated outputs for a project.
     * @param projectId - The ID of the project
     * @param outputType - The type of output to retrieve ("loads", "dryside_graph", or "register_schedule")
     * @returns The project output data for the specified type
     * @throws {HVAKRClientError} If the API returns an error response or JSON parsing fails
     */
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
            { method: 'GET', headers: this.getAuthHeaders() }
        )
        let data: unknown
        try {
            data = await res.json()
        } catch (error) {
            throw new HVAKRClientError(
                `Error ${res.status} - failed to parse json`,
                { error }
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

    /**
     * Searches for weather stations near a geographic location.
     * @param latitude - The latitude coordinate
     * @param longitude - The longitude coordinate
     * @returns An object containing an array of nearby weather station IDs
     * @throws {HVAKRClientError} If the API returns an error response
     */
    searchWeatherStations = async (latitude: number, longitude: number) => {
        const res = await fetch(
            this.createURL(`/weather-stations`, {
                latitude: latitude.toString(),
                longitude: longitude.toString(),
            }),
            { method: 'GET', headers: this.getAuthHeaders() }
        )
        const data = await res.json()
        if (!res.ok) {
            throw new HVAKRClientError(`Error ${res.status}`, data)
        }
        return data as { weatherStationIds: string[] }
    }

    /**
     * Retrieves detailed data for a specific weather station.
     * @param weatherStationId - The ID of the weather station
     * @returns The weather station data including climate information
     * @throws {HVAKRClientError} If the API returns an error response
     */
    getWeatherStation = async (weatherStationId: string) => {
        const res = await fetch(
            this.createURL(`/weather-stations/${weatherStationId}`),
            { method: 'GET', headers: this.getAuthHeaders() }
        )
        const data = await res.json()
        if (!res.ok) {
            throw new HVAKRClientError(`Error ${res.status}`, data)
        }
        return data as WeatherStationData_v0
    }
}
