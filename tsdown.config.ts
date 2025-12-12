import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['./src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    outDir: 'dist',
    sourcemap: process.env.DEV === 'true',
    minify: process.env.DEV !== 'true',
})
