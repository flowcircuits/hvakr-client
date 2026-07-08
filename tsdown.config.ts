import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'

// Inline the package version at build time so the client can identify itself on
// every request (`X-HVAKR-Client`). package.json stays the single source of
// truth — no separate version constant to keep in sync.
const { version } = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf8')
)

export default defineConfig({
    entry: ['./src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    outDir: 'dist',
    sourcemap: process.env.DEV === 'true',
    minify: process.env.DEV !== 'true',
    define: { __CLIENT_VERSION__: JSON.stringify(version) },
})
