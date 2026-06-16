<template>
  <div class="stats-sidebar">
    <div class="stats__item">
      <span class="stats__label">Poprawne</span>
      <ProgressBar
        :progress="progress.correctRatio"
        :color="progress.correctRatio >= 0.7 ? 'var(--primary-color)' : 'var(--yellow-color)'"
      />
    </div>
    <div class="stats__item">
      <span class="stats__label">Nauczone</span>
      <ProgressBar :progress="progress.learnedRatio" />
    </div>
    <div class="stats__item">
      <span class="stats__label">Liczba pytań</span>
      <span class="stats__value">{{ progress.totalQuestions }}</span>
    </div>
    <div class="stats__item">
      <span class="stats__label">Czas nauki</span>
      <span class="stats__value">{{ formattedTime }}</span>
    </div>

    <div class="stats__separator" />

    <div class="stats__item stats__item--tag">
      <span class="stats__label">{{ currentTag }}</span>
      <span class="stats__value">×{{ currentReoccurrences }}</span>
    </div>

    <div class="stats__spacer" />

    <div class="stats__actions">
      <button
        class="stats__action-btn"
        title="Ustawienia"
        @click="$emit('openSettings')"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>
      <button
        class="stats__action-btn"
        title="Informacje"
        @click="$emit('openInfo')"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
          />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </button>
      <button
        class="stats__action-btn"
        title="Zapisz i wyjdź"
        @click="$emit('saveExit')"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProgressBar from '@/ui/components/shared/ProgressBar.vue'
import { formatDuration } from '@/domain/saveJsonCompat'

const props = defineProps<{
  progress: { correctRatio: number; learnedRatio: number; totalQuestions: number }
  currentTag: string | null
  currentReoccurrences: number
  time: number
}>()

defineEmits<{
  openSettings: []
  openInfo: []
  saveExit: []
}>()

const formattedTime = computed(() => formatDuration(props.time))
</script>

<style scoped>
.stats-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--sidebar-background);
  border-radius: 10px;
  min-width: 200px;
  max-width: 260px;
  height: fit-content;
}

.stats__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stats__item--tag {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.stats__label {
  font-size: 0.8rem;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stats__value {
  font-size: 0.9rem;
  color: var(--primary-text);
  font-weight: 600;
}

.stats__separator {
  height: 1px;
  background: var(--background-3);
  margin: 4px 0;
}

.stats__spacer {
  flex: 1;
}

.stats__actions {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.stats__action-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--secondary-text);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.stats__action-btn:hover {
  background: var(--background-2);
  color: var(--primary-text);
}
</style>
