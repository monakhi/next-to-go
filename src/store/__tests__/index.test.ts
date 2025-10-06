import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CATEGORIES } from '@/constants/categories'

vi.mock('@/api/neds', () => ({
  fetchNextRaces: vi.fn(),
}))
vi.mock('@/utils/time', () => ({
  nowSeconds: vi.fn(() => 1000),
  isExpired: vi.fn(() => false),
}))

import { fetchNextRaces } from '@/api/neds'
import { nowSeconds, isExpired } from '@/utils/time'

type RaceLite = { id: string }

async function freshStore() {
  vi.resetModules()
  const mod = await import('../index')
  return mod.default
}

describe('store/index.ts', () => {
  beforeEach(() => {
    // Clean mocks and storage before each test
    vi.clearAllMocks()
    localStorage.clear()
    ;(isExpired as unknown as vi.Mock).mockReturnValue(false)
    ;(nowSeconds as unknown as vi.Mock).mockReturnValue(1000)
  })

  it('bootstraps initial state using persisted selected category', async () => {
    localStorage.setItem('selectedCategory', CATEGORIES.HARNESS)

    const store = await freshStore()

    expect(store.state.selected).toBe(CATEGORIES.HARNESS)
    expect(store.state.loading).toBe(true)
    expect(store.state.refreshing).toBe(false)
    expect(store.state.error).toBeNull()
  })

  it('getter nextFive filters by selected, excludes expired, sorts by time then id, and limits to 5', async () => {
    const store = await freshStore()

    // Select HORSE
    store.commit('SET_CATEGORY', CATEGORIES.HORSE)

    // Make isExpired return true for one of them to prove filtering
    ;(isExpired as unknown as vi.Mock).mockImplementation((start: number) => start === 30)

    // Mix categories and times; duplicates on time to verify tie-break by id
    store.commit('SET_RACES', [
      // different category (should be filtered out)
      {
        id: 'x1',
        meeting_name: 'A',
        race_number: 1,
        category_id: CATEGORIES.GREYHOUND,
        advertised_start_seconds: 10,
      },
      // selected category; one expired (30)
      {
        id: 'h1',
        meeting_name: 'B',
        race_number: 1,
        category_id: CATEGORIES.HORSE,
        advertised_start_seconds: 30,
      },
      {
        id: 'h2',
        meeting_name: 'C',
        race_number: 1,
        category_id: CATEGORIES.HORSE,
        advertised_start_seconds: 20,
      },
      {
        id: 'h3',
        meeting_name: 'D',
        race_number: 1,
        category_id: CATEGORIES.HORSE,
        advertised_start_seconds: 20,
      },
      {
        id: 'h4',
        meeting_name: 'E',
        race_number: 1,
        category_id: CATEGORIES.HORSE,
        advertised_start_seconds: 40,
      },
      {
        id: 'h5',
        meeting_name: 'F',
        race_number: 1,
        category_id: CATEGORIES.HORSE,
        advertised_start_seconds: 50,
      },
      {
        id: 'h6',
        meeting_name: 'G',
        race_number: 1,
        category_id: CATEGORIES.HORSE,
        advertised_start_seconds: 60,
      },
    ])

    const nextFive = (store.getters as unknown as { nextFive: RaceLite[] }).nextFive

    expect(nextFive.map((r) => r.id)).toEqual(['h2', 'h3', 'h4', 'h5', 'h6'])
  })

  it('tick commits current time using nowSeconds()', async () => {
    const store = await freshStore()
    ;(nowSeconds as unknown as vi.Mock).mockReturnValue(12345)

    await store.dispatch('tick')
    expect(store.state.now).toBe(12345)
  })

  it('fetchRacesEnsuringFive escalates count 10→20 and toggles loading flags on first load', async () => {
    // First call returns 3 items (not enough), second call returns 6 (enough)
    const races10 = Array.from({ length: 3 }, (_, i) => ({
      id: `r${i + 1}`,
      meeting_name: 'M',
      race_number: i + 1,
      category_id: CATEGORIES.HORSE,
      advertised_start_seconds: 100 + i,
    }))
    const races20 = Array.from({ length: 6 }, (_, i) => ({
      id: `R${i + 1}`,
      meeting_name: 'M',
      race_number: i + 1,
      category_id: CATEGORIES.HORSE,
      advertised_start_seconds: 200 + i,
    }))

    ;(fetchNextRaces as unknown as vi.Mock)
      .mockResolvedValueOnce(races10)
      .mockResolvedValueOnce(races20)

    const store = await freshStore()
    // select HORSE to match our test data
    store.commit('SET_CATEGORY', CATEGORIES.HORSE)

    const loadingBefore = store.state.loading
    expect(loadingBefore).toBe(true)

    await store.dispatch('fetchRacesEnsuringFive')

    // Should have called with 10 then 20
    expect(fetchNextRaces).toHaveBeenNthCalledWith(1, 10)
    expect(fetchNextRaces).toHaveBeenNthCalledWith(2, 20)

    // Races set to last fetched array
    expect(store.state.races).toHaveLength(6)

    // loading turned off after first load; refreshing is false
    expect(store.state.loading).toBe(false)
    expect(store.state.refreshing).toBe(false)
    expect(store.state.error).toBeNull()
  })

  it('handles errors and sets error message, turning off loading/refreshing', async () => {
    ;(fetchNextRaces as unknown as vi.Mock).mockRejectedValue(new Error('error'))

    const store = await freshStore()

    await store.dispatch('fetchRacesEnsuringFive')

    expect(store.state.error).toMatch(/error/i)
    expect(store.state.loading).toBe(false)
    expect(store.state.refreshing).toBe(false)
  })

  it('SET_CATEGORY persists to localStorage', async () => {
    const store = await freshStore()

    store.commit('SET_CATEGORY', CATEGORIES.GREYHOUND)

    expect(localStorage.getItem('selectedCategory')).toBe(CATEGORIES.GREYHOUND)
  })
})
