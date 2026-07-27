import {
    APICalculationSection_v0,
    APIErrorCode_v0,
    APIErrorSchema_v0,
    APIJob_v0,
    APIJobCreate_v0,
    APIMe_v0,
    APIProduct_v0,
    APIProjectCalculations_v0,
    ExpandedProjectPatch_v0,
    ExpandedProjectPost_v0,
    ExpandedProject_v0,
    ProductListResponse_v0,
    ProjectListResponse_v0,
    ProjectStatus_v0,
    ProjectSubcollections_v0,
    ProjectType_v0,
    Project_v0,
} from './schemas'

/** Firebase HTTP functions reserve request overhead within their 32 MiB limit. */
export const MAX_API_SHEET_UPLOAD_BYTES = 30 * 1024 * 1024

const isBlobLike = (value: Blob | Uint8Array): value is Blob =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Blob).size === 'number' &&
    typeof (value as Blob).arrayBuffer === 'function'

export interface CreateSheetFileInput {
    /** PDF bytes to upload. */
    file: Blob | Uint8Array
    /** Filename preserved as the upload identity. */
    fileName: string
    /** Optional display name; it never replaces `fileName`. */
    name?: string
}

/**
 * Package version, inlined at build time by the `__CLIENT_VERSION__` define in
 * `tsdown.config.ts` (and mirrored in `vitest.config.ts`). package.json is the
 * single source of truth.
 */
declare const __CLIENT_VERSION__: string

/** SDK identifier sent on every request as `X-HVAKR-Client`. */
const CLIENT_ID = `hvakr-client-ts/${__CLIENT_VERSION__}`

/**
 * Upgrade warnings already surfaced, so a stale-version notice is logged once
 * per distinct message per process rather than on every request.
 */
const warnedClientMessages = new Set<string>()

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
    /**
     * Stable machine-readable error code from the v0 error envelope
     * (`error.code`), when the response body matched {@link APIErrorSchema_v0}.
     * Prefer this over `status` for branching and analytics: it distinguishes,
     * for example, an `internal` server failure from a `rate_limited` one that
     * share a status class, so callers can tag failures without parsing
     * `metadata` by hand.
     */
    code?: APIErrorCode_v0
    /**
     * Request correlation id from the v0 error envelope, mirroring the
     * `X-Request-Id` response header. Useful for correlating a captured
     * failure with server-side logs.
     */
    requestId?: string

    constructor(
        message?: string,
        metadata?: unknown,
        status?: number,
        envelope?: { code?: APIErrorCode_v0; requestId?: string }
    ) {
        super(message)
        this.name = 'HVAKRClientError'
        this.metadata = metadata
        this.status = status
        this.code = envelope?.code
        this.requestId = envelope?.requestId
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
        return {
            Authorization: `Bearer ${this.accessToken}`,
            // Identifies the SDK + version so the API can attribute usage and
            // warn (via `X-HVAKR-Client-Warning`) when a version is outdated.
            'X-HVAKR-Client': CLIENT_ID,
        }
    }

    private encodePathSegment = (segment: string) => {
        return encodeURIComponent(segment)
    }

    /**
     * Serializes query params: `string` values become `k=v`, a truthy boolean
     * becomes a bare flag (`k`), and a falsy boolean is omitted. Returns the
     * `?...` suffix, or `''` when there is nothing to append.
     */
    private buildQuery = (
        queryParams?: Record<string, string | boolean>
    ): string => {
        if (!queryParams) return ''
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
        return params ? `?${params}` : ''
    }

    /**
     * Constructs a full API URL under the core version prefix (e.g. `/v0`).
     * @param path - API endpoint path (e.g., "/projects")
     * @param queryParams - Optional query parameters to append
     * @returns The full URL string
     */
    createURL = (
        path: string,
        queryParams?: Record<string, string | boolean>
    ) => {
        const base = `${this.baseUrl.replace(/\/$/, '')}/${this.version}${path}`
        return base + this.buildQuery(queryParams)
    }

    /**
     * If the API flagged this client as outdated (`X-HVAKR-Client-Warning`),
     * log the advisory once per distinct message. The header is set on every
     * response — success or error — so the notice surfaces regardless of outcome.
     */
    private warnIfOutdated = (res: Response) => {
        const warning = res.headers.get('X-HVAKR-Client-Warning')
        if (warning && !warnedClientMessages.has(warning)) {
            warnedClientMessages.add(warning)
            console.warn(`[hvakr-client] ${warning}`)
        }
    }

    /**
     * Performs a request and parses the JSON body, throwing an
     * {@link HVAKRClientError} (carrying the status and parsed error body)
     * on a non-2xx response.
     */
    private request = async <T>(url: string, init: RequestInit): Promise<T> => {
        const res = await fetch(url, init)
        this.warnIfOutdated(res)
        const data = await res.json()
        if (!res.ok) {
            // Surface the standard v0 error envelope's machine-readable `code`
            // (and `requestId`) as first-class fields when the body matches, so
            // callers can branch on and instrument failures — e.g. tag an
            // `internal` server error — without reaching into `metadata`.
            const parsed = APIErrorSchema_v0.safeParse(data)
            throw new HVAKRClientError(
                `Error ${res.status}`,
                data,
                res.status,
                parsed.success
                    ? {
                          code: parsed.data.error.code,
                          requestId: parsed.data.requestId,
                      }
                    : undefined
            )
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

    /** Builds headers for a multipart POST without overriding FormData's boundary. */
    private multipartWriteHeaders = (opts?: WriteOptions): HeadersInit => {
        const headers: Record<string, string> = {
            ...(this.getAuthHeaders() as Record<string, string>),
            Accept: 'application/json',
        }
        if (opts?.idempotencyKey) {
            headers['Idempotency-Key'] = opts.idempotencyKey
        }
        return headers
    }

    /**
     * Creates a new HVAKR project.
     * @param projectData - The project data to create
     * @param opts - Optional write options (e.g. idempotencyKey)
     * @returns The ID of the newly created project
     * @throws {HVAKRClientError} If the API returns an error response
     */
    createProject = async (
        projectData: ExpandedProjectPost_v0,
        opts?: WriteOptions
    ): Promise<{ id: string }> => {
        return this.request<{ id: string }>(this.createURL(`/projects`), {
            method: 'POST',
            headers: this.writeHeaders(opts),
            body: JSON.stringify(projectData),
        })
    }

    /**
     * Lists projects accessible to the authenticated user.
     *
     * Results are paginated. When `hasMore` is true, pass the returned
     * `nextCursor` back as `cursor` to fetch the next page.
     *
     * @param params - Optional pagination and filter parameters
     * @param params.limit - Maximum number of projects to return per page
     * @param params.cursor - Cursor from a previous response's `nextCursor`
     * @param params.search - Case-insensitive filter over name/number/address
     * @param params.status - Only return projects with this status
     * @param params.projectType - Only return projects of this type
     * @returns A page of project summaries with pagination metadata
     * @throws {HVAKRClientError} If the API returns an error response
     */
    listProjects = async (
        params: {
            limit?: number
            cursor?: string
            search?: string
            status?: ProjectStatus_v0
            projectType?: ProjectType_v0
        } = {}
    ): Promise<ProjectListResponse_v0> => {
        const queryParams: Record<string, string> = {}
        if (params.limit !== undefined) {
            queryParams.limit = params.limit.toString()
        }
        if (params.cursor !== undefined) {
            queryParams.cursor = params.cursor
        }
        if (params.search !== undefined) {
            queryParams.search = params.search
        }
        if (params.status !== undefined) {
            queryParams.status = params.status
        }
        if (params.projectType !== undefined) {
            queryParams.projectType = params.projectType
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
     * @param opts - Optional write options (e.g. idempotencyKey)
     * @returns The ID of the updated project
     * @throws {HVAKRClientError} If the API returns an error response
     */
    updateProject = async (
        projectId: string,
        projectData: ExpandedProjectPatch_v0,
        opts?: WriteOptions
    ): Promise<{ id: string }> => {
        return this.request<{ id: string }>(
            this.createURL(`/projects/${this.encodePathSegment(projectId)}`),
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
     * Runs the calculator once and returns the requested calculation sections.
     * Airflow, checksum, and equipment contents are keyed by the project's
     * equipment mode ids.
     * @param projectId - The ID of the project
     * @param opts.include - Sections to compute and return (`loads`,
     *   `register_schedule`, `dryside_graph`, `ventilation`, `equipment`,
     *   `checksums`, `airflows`). Omit to return every section (one calc run;
     *   the response can be large).
     * @returns `errors`, `flags`, and each requested section
     * @throws {HVAKRClientError} If the API returns an error response
     */
    getProjectCalculations = async (
        projectId: string,
        opts?: { include?: APICalculationSection_v0[] }
    ): Promise<APIProjectCalculations_v0> => {
        const include = opts?.include
        const queryParams =
            include && include.length > 0
                ? { include: include.join(',') }
                : undefined
        return this.request<APIProjectCalculations_v0>(
            this.createURL(
                `/projects/${this.encodePathSegment(projectId)}/calculations`,
                queryParams
            ),
            { method: 'GET', headers: this.getAuthHeaders() }
        )
    }

    /**
     * Uploads one PDF sheet file and returns its queued `sheet-upload` job.
     * Poll {@link getJob} with the returned `jobId` until it completes, then
     * patch `sheets` if pages need placement before running project-wide
     * `createJob(projectId, { type: 'auto-takeoff' })`.
     */
    createSheetFile = async (
        projectId: string,
        { file, fileName, name }: CreateSheetFileInput,
        opts?: WriteOptions
    ): Promise<APIJob_v0> => {
        const isBlob = isBlobLike(file)
        const fileSize = isBlob ? file.size : file.byteLength
        if (fileSize > MAX_API_SHEET_UPLOAD_BYTES) {
            throw new RangeError(
                `Sheet PDF exceeds the ${MAX_API_SHEET_UPLOAD_BYTES / (1024 * 1024)} MiB API upload limit.`
            )
        }

        const blob = isBlob
            ? new Blob([await file.arrayBuffer()], { type: 'application/pdf' })
            : new Blob([new Uint8Array(file)], { type: 'application/pdf' })

        const formData = new FormData()
        formData.append('file', blob, fileName)
        if (name !== undefined) {
            formData.append('name', name)
        }

        return this.request<APIJob_v0>(
            this.createURL(
                `/projects/${this.encodePathSegment(projectId)}/sheet-files`
            ),
            {
                method: 'POST',
                headers: this.multipartWriteHeaders(opts),
                body: formData,
            }
        )
    }

    /**
     * Creates a job. One uniform resource covers every job kind (set `body.type`
     * to `export`, `auto-group`, `check`, or `auto-takeoff`). Sync jobs
     * (`auto-group`, `check`) return `status:"completed"` with `result`
     * populated; async jobs (`export`, `auto-takeoff`) return `status:"queued"`
     * — poll {@link getJob} with the returned `jobId` until the status settles.
     * @param projectId - The ID of the project
     * @param body - The job request (`type` + the fields that kind consumes)
     * @param opts - Optional write options (e.g. idempotencyKey)
     * @returns The created job
     * @throws {HVAKRClientError} If the API returns an error response
     */
    createJob = async (
        projectId: string,
        body: APIJobCreate_v0,
        opts?: WriteOptions
    ): Promise<APIJob_v0> => {
        return this.request<APIJob_v0>(
            this.createURL(
                `/projects/${this.encodePathSegment(projectId)}/jobs`
            ),
            {
                method: 'POST',
                headers: this.writeHeaders(opts),
                body: JSON.stringify(body),
            }
        )
    }

    /**
     * Retrieves the current state of a job. For `export`/`auto-takeoff` jobs,
     * poll this until `status` leaves `queued`/`running`; the settled `result`
     * (or `error`) is then populated.
     * @param projectId - The ID of the project
     * @param jobId - The ID of the job (from {@link createJob})
     * @returns The job
     * @throws {HVAKRClientError} If the API returns an error response
     */
    getJob = async (projectId: string, jobId: string): Promise<APIJob_v0> => {
        return this.request<APIJob_v0>(
            this.createURL(
                `/projects/${this.encodePathSegment(projectId)}/jobs/${this.encodePathSegment(jobId)}`
            ),
            { method: 'GET', headers: this.getAuthHeaders() }
        )
    }

    /**
     * Lists products from the catalog accessible to the authenticated user
     * (the organization's products plus public products).
     *
     * Results are paginated. When `hasMore` is true, pass the returned
     * `nextCursor` back as `cursor` to fetch the next page.
     *
     * @param params - Optional filter and pagination parameters
     * @param params.search - Case-insensitive filter over name/manufacturer/model
     * @param params.limit - Maximum number of products to return per page
     * @param params.cursor - Cursor from a previous response's `nextCursor`
     * @returns A page of products with pagination metadata
     * @throws {HVAKRClientError} If the API returns an error response
     */
    listProducts = async (
        params: { search?: string; limit?: number; cursor?: string } = {}
    ): Promise<ProductListResponse_v0> => {
        const queryParams: Record<string, string> = {}
        if (params.search !== undefined) {
            queryParams.search = params.search
        }
        if (params.limit !== undefined) {
            queryParams.limit = params.limit.toString()
        }
        if (params.cursor !== undefined) {
            queryParams.cursor = params.cursor
        }
        return this.request<ProductListResponse_v0>(
            this.createURL(`/products`, queryParams),
            { method: 'GET', headers: this.getAuthHeaders() }
        )
    }

    /**
     * Retrieves a single product by ID.
     * @param productId - The ID of the product
     * @returns The product
     * @throws {HVAKRClientError} If the API returns an error response
     */
    getProduct = async (productId: string): Promise<APIProduct_v0> => {
        return this.request<APIProduct_v0>(
            this.createURL(`/products/${this.encodePathSegment(productId)}`),
            { method: 'GET', headers: this.getAuthHeaders() }
        )
    }

    /**
     * Returns the authenticated caller's identity, organization memberships,
     * plan entitlements, and rate-limit budget. Recommended first call for any
     * integration — confirms the token is valid and reports what it can do.
     * @returns The caller's identity, orgs, plan, and rate limit
     * @throws {HVAKRClientError} If the API returns an error response
     */
    me = async (): Promise<APIMe_v0> => {
        return this.request<APIMe_v0>(this.createURL(`/me`), {
            method: 'GET',
            headers: this.getAuthHeaders(),
        })
    }
}
