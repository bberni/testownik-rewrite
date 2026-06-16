<template>
  <Modal
    :open="open"
    title="Koniec quizu!"
    @close="$emit('close')"
  >
    <div class="finish">
      <div class="finish__icon">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="var(--primary-color)"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </div>
      <p class="finish__time">
        Czas: {{ formattedTime }}
      </p>
      <p class="finish__stats">
        Poprawne: {{ correctAnswers }} / Błędne: {{ badAnswers }} /
        Nauczone: {{ learnedQuestions }}
      </p>
      <button
        class="finish__btn"
        @click="$emit('close')"
      >
        Powrót
      </button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/ui/components/shared/Modal.vue'
import { formatDuration } from '@/domain/saveJsonCompat'

const props = defineProps<{
  open: boolean
  time: number
  correctAnswers: number
  badAnswers: number
  learnedQuestions: number
}>()

defineEmits<{
  close: []
}>()

const formattedTime = computed(() => formatDuration(props.time))
</script>

<style scoped>
.finish {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.finish__icon {
  margin-bottom: 8px;
}

.finish__time {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.finish__stats {
  font-size: 0.85rem;
  color: var(--secondary-text);
  margin: 0;
}

.finish__btn {
  margin-top: 8px;
  padding: 10px 32px;
  border: none;
  border-radius: 8px;
  background: var(--primary-color);
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
}

.finish__btn:hover {
  background: var(--primary-color-lighter);
}
</style>
