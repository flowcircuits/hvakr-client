import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const envLocalPath = join(process.cwd(), '.env.local')

if (existsSync(envLocalPath)) {
    process.loadEnvFile(envLocalPath)
}

// The bundled client inlines `__CLIENT_VERSION__` via the tsdown `define`.
// Under Vitest the source runs untransformed, so provide the same value as a
// global (package.json stays the single source of truth).
const { version } = JSON.parse(
    readFileSync(join(process.cwd(), 'package.json'), 'utf8')
)
;(globalThis as Record<string, unknown>).__CLIENT_VERSION__ = version
