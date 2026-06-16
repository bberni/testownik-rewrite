<template>
  <div class="progress-bar">
    <div
      class="progress-bar__fill"
      :style="fillStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  progress: number
  color?: string
  color2?: string
}>()

const fillStyle = computed(() => {
  const clamped = Math.min(Math.max(props.progress, 0), 1) * 100

  if (props.color2) {
    const pct = `${clamped}%`
    return {
      width: '100%',
      background: `linear-gradient(to right, ${props.color ?? 'var(--primary-color)'} 0%, ${props.color ?? 'var(--primary-color)'} ${pct}, ${props.color2} ${pct})`,
      transition: 'background 0.3s ease',
    }
  }

  return {
    width: `${clamped}%`,
    backgroundColor: props.color ?? 'var(--primary-color)',
    transition: 'width 0.3s ease, background-color 0.3s ease',
  }
})
</script>

<style scoped>
.progress-bar {
  width: 100%;
  height: 6px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--background-3);
}

.progress-bar__fill {
  height: 100%;
  border-radius: 4px;
}
</style>
