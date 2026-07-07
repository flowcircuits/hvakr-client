import {
    APIAutoGroupRequest_v0,
    APIAutoGroupResult_v0,
    APIAutoTakeoffJob_v0,
    APIAutoTakeoffJobCreateResponse_v0,
    APIAutoTakeoffRequest_v0,
    APICheckReport_v0,
    APIOutputType_v0,
    APIProjectOutputAirflows_v0,
    APIProjectOutputChecksums_v0,
    APIProjectOutputDrySideGraph,
    APIProjectOutputEquipment_v0,
    APIProjectOutputLoads_v0,
    APIProjectOutputRegisterSchedule_v0,
    APIProjectOutputVentilation_v0,
    APIReport_v0,
    APIReportCreate_v0,
    APIReportCreateResponse_v0,
    ExpandedProjectPatch_v0,
    ExpandedProjectPost_v0,
    ExpandedProject_v0,
    ProjectListResponse_v0,
    ProjectSubcollections_v0,
    Project_v0,
    RevitData_v0,
    WeatherStationData_v0,
} from './schemas'

/** A subcollection key that can be requested via `expand`. */
export type ProjectSubcollectionKey_v0 = keyof ProjectSubcollections_v0

/**
 * Error thrown when the HVAKR API returns an unsuccessful response.
 * Contains the HTTP status code and optional metadata with the parsed
 * error body (the API's standard error envelope for v0 endpoints).
 */
export class HVAKRClientError extends Error {
    /** Additional error details from the API response (parsed JSON body). */
    metadata?: unknown
    /** HTTP status code of the response, when available. */
    status?: number

    constructor(message?: string, metadata?: unknown, status?: number) {
        super(message)
        this.name = 'HVAKRClientError'
        this.metadata = metadata
        this.status = status
    }
}

/** Options accepted by write (POST) methods. */
export interface WriteOptions {
    /**
     * Idempotency key sent as the `Idempotency-Key` header. Retrying a POST
     * with the same key returns the original result instead of performing
     * the action twice.
     */
    idempotencyKey?: string
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

    private encodePathSegment = (segment: string) => {
        return encodeURIComponent(segment)
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
        let url = `${this.baseUrl.replace(/\/$/, '')}/${this.version}${path}`
        if (queryParams) {
            const params = Object.entries(queryParams)
                .map(([k, v]) =>
                    typeof v === 'string'
                        ? `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
                        : v
                          ? encodeURIComponent(k)
                          : null
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
     * Performs a request and parses the JSON body, throwing an
     * {@link HVAKRClientError} (carrying the status and parsed error body)
     * on a non-2xx response.
     */
    private request = async <T>(url: string, init: RequestInit): Promise<T> => {
        const res = await fetch(url, init)
        const data = await res.json()
        if (!res.ok) {
            throw new HVAKRClientError(`Error ${res.status}`, data, res.status)
        }
        return data as T
    }

    /** Builds headers for a JSON POST/PATCH, including optional idempotency. */
    private writeHeaders = (opts?: WriteOptions): HeadersInit => {
        const headers: Record<string, string> = {
            ...(this.getAuthHeaders() as Record<string, string>),
            Accept: 'application/json',
            'Content-Type': 'application/json',
        }
        if (opts?.idempotencyKey) {
            headers['Idempotency-Key'] = opts.idempotencyKey
        }
        return headers
    }

    /**
     * Creates a new HVAKR project.
     * @param projectData - The project data to create
     * @param revitPayload - Set to true if the data is in Revit format
     * @param opts - Optional write options (e.g. idempotencyKey)
     * @returns The ID of the newly created project
     * @throws {HVAKRClientError} If the API returns an error response
     */
    createProject = async (
        projectData: ExpandedProjectPost_v0 | RevitData_v0,
        revitPayload?: boolean,
        opts?: WriteOptions
    ): Promise<{ id: string }> => {
        return this.request<{ id: string }>(
            this.createURL(`/projects`, { revitPayload: !!revitPayload }),
            {
                method: 'POST',
                headers: this.writeHeaders(opts),
                body: JSON.stringify(projectData),
            }
        )
    }

    /**
     * Lists projects accessible to the authenticated user.
     *
     * Results are paginated. When `hasMore` is true, pass the returned
     * `nextCursor` back as `cursor` to fetch the next page.
     *
     * @param params - Optional pagination parameters
     * @param params.limit - Maximum number of projects to return per page
     * @param params.cursor - Cursor from a previous response's `nextCursor`
     * @returns A page of project summaries with pagination metadata
     * @throws {HVAKRClientError} If the API returns an error response
     */
    listProjects = async (
        params: { limit?: number; cursor?: string } = {}
    ): Promise<ProjectListResponse_v0> => {
        const queryParams: Record<string, string> = {}
        if (params.limit !== undefined) {
            queryParams.limit = params.limit.toString()
        }
        if (params.cursor !== undefined) {
            queryParams.cursor = params.cursor
        }
        return this.request<ProjectListResponse_v0>(
            this.createURL(`/projects`, queryParams),
            { method: 'GET', headers: this.getAuthHeaders() }
        )
    }

    /**
     * Retrieves a project by ID.
     * @param projectId - The ID of the project to retrieve
     * @param expand - `true` to expand all subcollections, or an array of
     *   subcollection keys (e.g. `['spaces', 'zones']`) to expand only those.
     *   Omit or `false` to return the base project only.
     * @returns The project data (expanded or basic depending on `expand`)
     * @throws {HVAKRClientError} If the API returns an error response
     */
    getProject(projectId: string): Promise<Project_v0>

    getProject(projectId: string, expand: false): Promise<Project_v0>

    getProject(projectId: string, expand: true): Promise<ExpandedProject_v0>

    getProject(
        projectId: string,
        expand: ProjectSubcollectionKey_v0[]
    ): Promise<ExpandedProject_v0>

    getProject(
        projectId: string,
        expand?: boolean | ProjectSubcollectionKey_v0[]
    ): Promise<Project_v0 | ExpandedProject_v0>

    async getProject(
        projectId: string,
        expand?: boolean | ProjectSubcollectionKey_v0[]
    ) {
        const expandParam: string | boolean = Array.isArray(expand)
            ? expand.join(',')
            : !!expand
        const url = this.createURL(
            `/projects/${this.encodePathSegment(projectId)}`,
            { expand: expandParam }
        )
        return this.request(url, {
            method: 'GET',
            headers: this.getAuthHeaders(),
        })
    }

    /**
     * Updates an existing HVAKR project.
     * @param projectId - The ID of the project to update
     * @param projectData - The updated project data
     * @param revitPayload - Set to true if the data is in Revit format
     * @param opts - Optional write options (e.g. idempotencyKey)
     * @returns The ID of the updated project
     * @throws {HVAKRClientError} If the API returns an error response
     */
    updateProject = async (
        projectId: string,
        projectData: ExpandedProjectPatch_v0 | RevitData_v0,
        revitPayload?: boolean,
        opts?: WriteOptions
    ): Promise<{ id: string }> => {
        return this.request<{ id: string }>(
            this.createURL(`/projects/${this.encodePathSegment(projectId)}`, {
                revitPayload: !!revitPayload,
            }),
            {
                method: 'PATCH',
                headers: this.writeHeaders(opts),
                body: JSON.stringify(projectData),
            }
        )
    }

    /**
     * Deletes an HVAKR project.
     * @param projectId - The ID of the project to delete
     * @returns The deletion confirmation response
     * @throws {HVAKRClientError} If the API returns an error response
     */
    deleteProject = async (
        projectId: string
    ): Promise<{ id: string; deleted: true }> => {
        return this.request<{ id: string; deleted: true }>(
            this.createURL(`/projects/${this.encodePathSegment(projectId)}`),
            { method: 'DELETE', headers: this.getAuthHeaders() }
        )
    }

    /**
     * Retrieves calculated outputs for a project.
     * @param projectId - The ID of the project
     * @param outputType - The type of output to retrieve. One of `loads`,
     *   `dryside_graph`, `register_schedule`, `ventilation`, `equipment`,
     *   `checksums`, or `airflows`.
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
        outputType: 'ventilation'
    ): Promise<APIProjectOutputVentilation_v0>

    getProjectOutputs(
        projectId: string,
        outputType: 'equipment'
    ): Promise<APIProjectOutputEquipment_v0>

    getProjectOutputs(
        projectId: string,
        outputType: 'checksums'
    ): Promise<APIProjectOutputChecksums_v0>

    getProjectOutputs(
        projectId: string,
        outputType: 'airflows'
    ): Promise<APIProjectOutputAirflows_v0>

    getProjectOutputs(
        projectId: string,
        outputType: APIOutputType_v0
    ): Promise<
        | APIProjectOutputLoads_v0
        | APIProjectOutputDrySideGraph
        | APIProjectOutputRegisterSchedule_v0
        | APIProjectOutputVentilation_v0
        | APIProjectOutputEquipment_v0
        | APIProjectOutputChecksums_v0
        | APIProjectOutputAirflows_v0
    >

    async getProjectOutputs(projectId: string, outputType: APIOutputType_v0) {
        const res = await fetch(
            this.createURL(
                `/projects/${this.encodePathSegment(projectId)}/outputs/${this.encodePathSegment(outputType)}`
            ),
            { method: 'GET', headers: this.getAuthHeaders() }
        )
        let data: unknown
        try {
            data = await res.json()
        } catch (error) {
            throw new HVAKRClientError(
                `Error ${res.status} - failed to parse json`,
                { error },
                res.status
            )
        }

        if (!res.ok) {
            throw new HVAKRClientError(`Error ${res.status}`, data, res.status)
        }

        return data
    }

    /**
     * Creates a report for a project. Report generation runs asynchronously;
     * poll {@link getReport} until the status leaves `pending`.
     * @param projectId - The ID of the project
     * @param body - The report request (template + optional name/unit system)
     * @param opts - Optional write options (e.g. idempotencyKey)
     * @returns The created report id and initial status
     * @throws {HVAKRClientError} If the API returns an error response
     */
    createReport = async (
        projectId: string,
        body: APIReportCreate_v0,
        opts?: WriteOptions
    ): Promise<APIReportCreateResponse_v0> => {
        return this.request<APIReportCreateResponse_v0>(
            this.createURL(
                `/projects/${this.encodePathSegment(projectId)}/reports`
            ),
            {
                method: 'POST',
                headers: this.writeHeaders(opts),
                body: JSON.stringify(body),
            }
        )
    }

    /**
     * Lists the reports for a project.
     * @param projectId - The ID of the project
     * @returns The project's reports
     * @throws {HVAKRClientError} If the API returns an error response
     */
    listReports = async (projectId: string): Promise<APIReport_v0[]> => {
        return this.request<APIReport_v0[]>(
            this.createURL(
                `/projects/${this.encodePathSegment(projectId)}/reports`
            ),
            { method: 'GET', headers: this.getAuthHeaders() }
        )
    }

    /**
     * Retrieves a single report, including its download URL when completed.
     * @param projectId - The ID of the project
     * @param reportId - The ID of the report
     * @returns The report
     * @throws {HVAKRClientError} If the API returns an error response
     */
    getReport = async (
        projectId: string,
        reportId: string
    ): Promise<APIReport_v0> => {
        return this.request<APIReport_v0>(
            this.createURL(
                `/projects/${this.encodePathSegment(projectId)}/reports/${this.encodePathSegment(reportId)}`
            ),
            { method: 'GET', headers: this.getAuthHeaders() }
        )
    }

    /**
     * Automatically groups spaces into zones (or zones into systems).
     * @param projectId - The ID of the project
     * @param body - The grouping request (scope + optional entity ids)
     * @param opts - Optional write options (e.g. idempotencyKey)
     * @returns Counts of created groups and assigned entities
     * @throws {HVAKRClientError} If the API returns an error response
     */
    autoGroup = async (
        projectId: string,
        body: APIAutoGroupRequest_v0,
        opts?: WriteOptions
    ): Promise<APIAutoGroupResult_v0> => {
        return this.request<APIAutoGroupResult_v0>(
            this.createURL(
                `/projects/${this.encodePathSegment(projectId)}/actions/auto-group`
            ),
            {
                method: 'POST',
                headers: this.writeHeaders(opts),
                body: JSON.stringify(body),
            }
        )
    }

    /**
     * Runs validation checks against a project and returns a check report.
     * @param projectId - The ID of the project
     * @param opts - Optional write options (e.g. idempotencyKey)
     * @returns The check report (tiered findings + summary)
     * @throws {HVAKRClientError} If the API returns an error response
     */
    checkProject = async (
        projectId: string,
        opts?: WriteOptions
    ): Promise<APICheckReport_v0> => {
        return this.request<APICheckReport_v0>(
            this.createURL(
                `/projects/${this.encodePathSegment(projectId)}/actions/check`
            ),
            { method: 'POST', headers: this.writeHeaders(opts) }
        )
    }

    /**
     * Starts an asynchronous auto-takeoff job. Poll {@link getAutoTakeoffJob}
     * with the returned `jobId` until the status leaves `queued`/`running`.
     * @param projectId - The ID of the project
     * @param params - Auto-takeoff parameters
     * @param opts - Optional write options (e.g. idempotencyKey)
     * @returns The created job id and initial status
     * @throws {HVAKRClientError} If the API returns an error response
     */
    createAutoTakeoffJob = async (
        projectId: string,
        params: APIAutoTakeoffRequest_v0 = {},
        opts?: WriteOptions
    ): Promise<APIAutoTakeoffJobCreateResponse_v0> => {
        return this.request<APIAutoTakeoffJobCreateResponse_v0>(
            this.createURL(
                `/projects/${this.encodePathSegment(projectId)}/actions/auto-takeoff`
            ),
            {
                method: 'POST',
                headers: this.writeHeaders(opts),
                body: JSON.stringify(params),
            }
        )
    }

    /**
     * Retrieves the state of an auto-takeoff job.
     * @param projectId - The ID of the project
     * @param jobId - The ID of the job (from {@link createAutoTakeoffJob})
     * @returns The job status and, when completed, its result
     * @throws {HVAKRClientError} If the API returns an error response
     */
    getAutoTakeoffJob = async (
        projectId: string,
        jobId: string
    ): Promise<APIAutoTakeoffJob_v0> => {
        return this.request<APIAutoTakeoffJob_v0>(
            this.createURL(
                `/projects/${this.encodePathSegment(projectId)}/actions/auto-takeoff/${this.encodePathSegment(jobId)}`
            ),
            { method: 'GET', headers: this.getAuthHeaders() }
        )
    }

    /**
     * Exports a project as gbXML.
     * @param projectId - The ID of the project
     * @returns The gbXML document as a string
     * @throws {HVAKRClientError} If the API returns an error response
     */
    exportGbXML = async (projectId: string): Promise<string> => {
        const res = await fetch(
            this.createURL(
                `/projects/${this.encodePathSegment(projectId)}/exports/gbxml`
            ),
            { method: 'GET', headers: this.getAuthHeaders() }
        )
        if (!res.ok) {
            let data: unknown
            try {
                data = await res.json()
            } catch {
                data = await res.text().catch(() => undefined)
            }
            throw new HVAKRClientError(`Error ${res.status}`, data, res.status)
        }
        return res.text()
    }

    /**
     * Searches for weather stations near a geographic location.
     * @param latitude - The latitude coordinate
     * @param longitude - The longitude coordinate
     * @returns An object containing an array of nearby weather station IDs
     * @throws {HVAKRClientError} If the API returns an error response
     */
    searchWeatherStations = async (latitude: number, longitude: number) => {
        return this.request<{ weatherStationIds: string[] }>(
            this.createURL(`/weather-stations`, {
                latitude: latitude.toString(),
                longitude: longitude.toString(),
            }),
            { method: 'GET', headers: this.getAuthHeaders() }
        )
    }

    /**
     * Retrieves detailed data for a specific weather station.
     * @param weatherStationId - The ID of the weather station
     * @returns The weather station data including climate information
     * @throws {HVAKRClientError} If the API returns an error response
     */
    getWeatherStation = async (weatherStationId: string) => {
        return this.request<WeatherStationData_v0>(
            this.createURL(
                `/weather-stations/${this.encodePathSegment(weatherStationId)}`
            ),
            { method: 'GET', headers: this.getAuthHeaders() }
        )
    }
}
