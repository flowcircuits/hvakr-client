import { existsSync } from 'node:fs'
import { join } from 'node:path'

const envLocalPath = join(process.cwd(), '.env.local')

if (existsSync(envLocalPath)) {
    process.loadEnvFile(envLocalPath)
}
