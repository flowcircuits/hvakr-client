import { afterEach, beforeEach, describe } from 'vitest'
import { HVAKRClient } from '../HVAKRClient'
import {
    MOCK_PROD_ACCESS_TOKEN,
    MOCK_PROD_BASE_URL,
    MockProdService,
} from './mockProd'

interface ClientTestTarget {
    createClient: () => HVAKRClient
    describeApi: (name: string, factory: () => void) => unknown
}

export const createClientTestTarget = (): ClientTestTarget => {
    const {
        HVAKR_ACCESS_TOKEN,
        HVAKR_CLIENT_API_URL,
        HVAKR_TEST_TARGET = 'mock-prod',
    } = process.env
    const isProdTarget = HVAKR_TEST_TARGET === 'prod'
    const mockProd = new MockProdService()

    beforeEach(() => {
        if (!isProdTarget) {
            mockProd.install()
        }
    })

    afterEach(async () => {
        if (!isProdTarget) {
            await mockProd.uninstall()
        }
    })

    return {
        describeApi: describe.skipIf(isProdTarget && !HVAKR_ACCESS_TOKEN),
        createClient: () =>
            new HVAKRClient({
                baseUrl: isProdTarget
                    ? HVAKR_CLIENT_API_URL || undefined
                    : MOCK_PROD_BASE_URL,
                accessToken: isProdTarget
                    ? HVAKR_ACCESS_TOKEN!
                    : MOCK_PROD_ACCESS_TOKEN,
            }),
    }
}
