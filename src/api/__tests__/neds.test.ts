import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import sampleJson from './fixtures/neds_sample.json'
import { fetchNextRaces, type Race } from '../../api/neds'

type RaceSummary = {
  race_id: string
  meeting_name: string
  race_number: number
  category_id: string
  advertised_start: { seconds: number }
}

type Fixture = {
  status: number
  data: {
    next_to_go_ids: string[]
    race_summaries: Record<string, RaceSummary>
  }
  message?: string
}

const sample: Fixture = sampleJson as unknown as Fixture


function projectExpectedFromFixture(): Race[] {
  const { next_to_go_ids, race_summaries } = sample.data

  return next_to_go_ids
    .map((id) => {
      const r = race_summaries[id]
      if (!r) return null
      const secs = Number(r.advertised_start?.seconds ?? Number.NaN)
      if (!Number.isFinite(secs)) return null

      return {
        id: r.race_id,
        meeting_name: r.meeting_name,
        race_number: r.race_number,
        category_id: r.category_id,
        advertised_start_seconds: secs,
      } satisfies Race
    })
    .filter((x): x is Race => x !== null)
}

describe('fetchNextRaces adapter', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('VITE_NEDS_API_URL', 'https://api.neds.com.au/rest/v1/racing/')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('calls the correct URL with count and maps the payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sample,
    })

    globalThis.fetch = fetchMock as unknown as typeof fetch

    const result = await fetchNextRaces(10)


    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = (fetchMock.mock.calls[0]?.[0] ?? '') as string
    expect(url).toContain('https://api.neds.com.au/rest/v1/racing/')
    expect(url).toContain('method=nextraces')
    expect(url).toContain('count=10')


    const expected = projectExpectedFromFixture()
    expect(result).toEqual(expected)


    for (const r of result) {
      expect(typeof r.id).toBe('string')
      expect(typeof r.meeting_name).toBe('string')
      expect(typeof r.race_number).toBe('number')
      expect(typeof r.category_id).toBe('string')
      expect(typeof r.advertised_start_seconds).toBe('number')
    }
  })

  it('returns exactly 10 races when count=10', async () => {
    // Build a trimmed payload with exactly 10 races
    const allIds = sample.data.next_to_go_ids
    if (allIds.length < 10) {
      throw new Error('Fixture needs at least 10 races')
    }
    const first10 = allIds.slice(0, 10)

    const trimmed: Fixture = {
      status: sample.status,
      data: {
        next_to_go_ids: first10,
        race_summaries: first10.reduce<Record<string, RaceSummary>>((acc, id) => {
          const s = sample.data.race_summaries[id]
          if (!s) throw new Error(`Fixture missing summary for id: ${id}`)
          acc[id] = s
          return acc
        }, {}),
      },
      message: sample.message,
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => trimmed,
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const result = await fetchNextRaces(10)
    expect(result.length).toBe(10)
  })

  it('throws when API shape is missing keys', async () => {
    const bad: unknown = { not: 'expected' }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => bad,
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    await expect(fetchNextRaces(10)).rejects.toThrow(/Invalid API shape/i)
  })
})
