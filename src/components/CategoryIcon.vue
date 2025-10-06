<script setup lang="ts">
import horse from '@/assets/icons/horse.svg'
import greyhound from '@/assets/icons/greyhound.svg'
import harness from '@/assets/icons/harness.svg'
import { CATEGORIES, type CategoryId } from '@/constants/categories'

const props = defineProps<{
  categoryId: CategoryId
  size?: number
  alt?: string
}>()

const SIZE = props.size

function srcFor(id: CategoryId) {
  if (id === CATEGORIES.HORSE) return horse
  if (id === CATEGORIES.GREYHOUND) return greyhound
  if (id === CATEGORIES.HARNESS) return harness
  return horse
}

function altFor(id: CategoryId) {
  if (props.alt) return props.alt
  if (id === CATEGORIES.HORSE) return 'Horse racing'
  if (id === CATEGORIES.GREYHOUND) return 'Greyhound racing'
  if (id === CATEGORIES.HARNESS) return 'Harness racing'
  return 'Racing'
}
</script>

<template>
  <img
    :src="srcFor(categoryId)"
    :alt="altFor(categoryId)"
    :width="SIZE"
    :height="SIZE"
    class="inline-block align-middle"
    loading="lazy"
    decoding="async"
  />
</template>
