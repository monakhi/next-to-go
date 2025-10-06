<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import CategoryChip from '@/components/CategoryChip.vue'
import CategoryIcon from '@/components/CategoryIcon.vue'
import { useClockAndPoll } from '@/composables/useClockAndPoll'
import type { Race } from '@/api/neds'
import { CATEGORY_LIST, type CategoryId } from '@/constants/categories'
import { localTimeWithUserTz } from '@/utils/formatLocalTime'
import type { RootState } from '@/store'

const store = useStore<RootState>()

type RootGetters = {
  nextFive: Race[]
}

const loading = computed(() => store.state.loading)
const refreshing = computed(() => store.state.refreshing)
const error = computed(() => store.state.error)
const selected = computed(() => store.state.selected)
const now = computed(() => store.state.now)

const getters = store.getters as unknown as RootGetters
const races = computed<Race[]>(() => getters.nextFive)

async function onCategory(id: CategoryId) {
  store.commit('SET_CATEGORY', id)
  await store.dispatch('fetchRacesEnsuringFive')
}

function remainingSec(start: number) {
  return start - now.value
}

function pillStyle(start: number) {
  const rem = remainingSec(start)
  if (rem > 600) {
    return { backgroundColor: 'rgb(206, 216, 246)', color: 'rgb(5, 35, 127)' }
  }
  return { backgroundColor: 'rgb(226, 33, 90)', color: '#fff' }
}

function counterText(start: number) {
  const diff = start - now.value
  const sign = diff < 0 ? '-' : ''
  const abs = Math.abs(diff)
  const m = Math.floor(abs / 60)
  const s = abs % 60
  return `${sign}${m}m ${s}s`
}

const getExpiryThreshold = (): number | null => {
  const all: Race[] = store.state.races.filter((r) => r.category_id === store.state.selected)
  if (!all.length) return null
  all.sort((a, b) => {
    if (a.advertised_start_seconds !== b.advertised_start_seconds) {
      return a.advertised_start_seconds - b.advertised_start_seconds
    }
    return a.id.localeCompare(b.id)
  })
  const earliest = all[0]?.advertised_start_seconds
  return typeof earliest === 'number' ? earliest + 60 : null
}

useClockAndPoll({
  tick: () => store.dispatch('tick'),
  poll: () => store.dispatch('fetchRacesEnsuringFive'),
  getExpiryThreshold,
  getVisibleCount: () => races.value.length,
})

onMounted(() => {
  store.dispatch('fetchRacesEnsuringFive')
})
</script>

<template>
  <div class="grid gap-4">
    <div class="flex flex-wrap items-center gap-3" role="radiogroup" aria-label="Race Category">
      <CategoryChip
        v-for="c in CATEGORY_LIST"
        :key="c.id"
        :active="selected === c.id"
        :label="c.label"
        @select="onCategory(c.id)"
      />
      <span v-if="error" class="text-sm text-red-600 ml-2">
        {{ error }}
        <button class="underline ml-2" @click="store.dispatch('fetchRacesEnsuringFive')">
          Retry
        </button>
      </span>

      <div
        v-if="!loading && refreshing"
        class="flex items-center gap-2 text-xs text-gray-500 ml-auto"
        aria-live="polite"
      >
        <div
          class="w-3 h-3 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"
        ></div>
        Updating…
      </div>
    </div>

    <!-- Spinner on load -->
    <div v-if="loading" class="flex justify-center py-8">
      <div
        class="w-8 h-8 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"
      ></div>
    </div>

    <TransitionGroup v-else name="list" tag="ul" class="grid gap-3">
      <li
        v-for="race in races"
        :key="race.id"
        class="rounded-2xl border border-gray-200 p-4 shadow-sm bg-white flex flex-col gap-1"
      >
        <div class="flex items-center gap-2">
          <CategoryIcon :category-id="race.category_id" :size="20" />
          <div class="font-semibold truncate">
            {{ race.meeting_name }}
            <span class="mx-1 text-gray-400">•</span>
            <span>Race {{ race.race_number }}</span>
          </div>
          <div class="ml-auto">
            <span
              class="inline-block rounded-full px-3 py-1 font-semibold"
              style="font-variant-numeric: tabular-nums"
              :style="pillStyle(race.advertised_start_seconds)"
            >
              {{ counterText(race.advertised_start_seconds) }}
            </span>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          {{ localTimeWithUserTz(race.advertised_start_seconds) }}
        </div>
      </li>
    </TransitionGroup>

    <div v-if="!loading && !races.length" class="text-gray-500 text-sm">
      No races match the current category.
    </div>
  </div>
</template>
