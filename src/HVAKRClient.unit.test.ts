import { describe, expect, it } from 'vitest'
import { HVAKRClient } from './HVAKRClient'

describe('HVAKRClient URL construction', () => {
    const client = new HVAKRClient({
        accessToken: 'token',
        baseUrl: 'https://api.example.test/',
    })

    it('normalizes a trailing base URL slash', () => {
        expect(client.createURL('/projects')).toBe(
            'https://api.example.test/v0/projects'
        )
    })

    it('URL-encodes query parameters and preserves flag parameters', () => {
        expect(
            client.createURL('/weather-stations', {
                latitude: '33.2353947',
                longitude: '-117.2149959',
                expand: true,
                revitPayload: false,
                label: 'A&B Building',
            })
        ).toBe(
            'https://api.example.test/v0/weather-stations?latitude=33.2353947&longitude=-117.2149959&expand&label=A%26B%20Building'
        )
    })
})
