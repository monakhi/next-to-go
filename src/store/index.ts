import { createStore } from 'vuex'
import type { Race } from '@/api/neds'
import { fetchNextRaces } from '@/api/neds'
import { nowSeconds, isExpired } from '@/utils/time'
import { CATEGORIES, CATEGORY_IDS, type CategoryId } from '@/constants/categories'

export type RootState = {
  loading: boolean
  refreshing: boolean
  error: string | null
  races: Race[]
  selected: CategoryId
  now: number
}

function saveSelected(id: CategoryId) {
  try {
    localStorage.setItem('selectedCategory', id)
  } catch {}
}
function loadSelected(): CategoryId | null {
  try {
    const v = localStorage.getItem('selectedCategory')
    if (!v) return null
    return CATEGORY_IDS.includes(v as CategoryId) ? (v as CategoryId) : null
  } catch {
    return null
  }
}

export default createStore<RootState>({
  state: (): RootState => ({
    loading: true,
    refreshing: false,
    error: null,
    races: [],
    selected: loadSelected() ?? CATEGORIES.HORSE,
    now: nowSeconds(),
  }),

  getters: {
    nextFive(state): Race[] {
      return state.races
        .filter((r) => r.category_id === state.selected)
        .filter((r) => !isExpired(r.advertised_start_seconds, state.now))
        .sort((a, b) => {
          if (a.advertised_start_seconds !== b.advertised_start_seconds) {
            return a.advertised_start_seconds - b.advertised_start_seconds
          }
          return a.id.localeCompare(b.id)
        })
        .slice(0, 5)
    },
  },

  mutations: {
    SET_RACES(state, races: Race[]) {
      state.races = races
    },
    SET_LOADING(state, v: boolean) {
      state.loading = v
    },
    SET_REFRESHING(state, v: boolean) {
      state.refreshing = v
    },
    SET_ERROR(state, msg: string | null) {
      state.error = msg
    },
    SET_CATEGORY(state, id: CategoryId) {
      state.selected = id
      saveSelected(id)
    },
    TICK(state, ts: number) {
      state.now = ts
    },
  },

  actions: {
    tick({ commit }) {
      commit('TICK', nowSeconds())
    },

    async fetchRacesEnsuringFive({ commit, state, getters }) {
      const firstLoad = state.loading
      try {
        commit('SET_ERROR', null)
        if (firstLoad) commit('SET_LOADING', true)
        else commit('SET_REFRESHING', true)

        let count = 10
        let all: Race[] = []
        for (let i = 0; i < 5; i++) {
          // up to 5 escalations: 10,20,30,40,50
          all = await fetchNextRaces(count)
          commit('SET_RACES', all)
          const visible = getters.nextFive as Race[]
          if (visible.length >= 5) break
          count += 10
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          commit('SET_ERROR', e.message)
        } else {
          commit('SET_ERROR', 'Failed to fetch races')
        }
      } finally {
        if (firstLoad) commit('SET_LOADING', false)
        commit('SET_REFRESHING', false)
      }
    },
  },
})
