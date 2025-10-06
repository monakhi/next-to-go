<script setup lang="ts">
defineProps<{
  active?: boolean
  label: string
}>()

defineEmits<{
  (e: 'select'): void
}>()
</script>

<template>
  <button
    type="button"
    role="radio"
    :aria-checked="!!active"
    @click="$emit('select')"
    @keyup.enter="$emit('select')"
    class="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
    :class="[
      active
        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
        : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 hover:border-gray-300',
    ]"
  >
    <span>{{ label }}</span>
  </button>
</template>
