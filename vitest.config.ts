import { configDefaults, defineConfig } from 'vitest/config'

const CLIENT_TEST_GLOB = 'src/HVAKRClient.test.ts'

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: 'unit',
                    globals: true,
                    env: { HVAKR_TEST_TARGET: 'mock-prod' },
                    setupFiles: ['./vitest.setup.ts'],
                    include: ['src/**/*.test.ts'],
                    exclude: [...configDefaults.exclude],
                },
            },
            {
                test: {
                    name: 'prod',
                    globals: true,
                    env: { HVAKR_TEST_TARGET: 'prod' },
                    setupFiles: ['./vitest.setup.ts'],
                    include: [CLIENT_TEST_GLOB],
                },
            },
        ],
    },
})
