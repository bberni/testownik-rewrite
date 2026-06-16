<template>
  <Modal
    :open="open"
    title="Odpowiedź"
    @close="$emit('close')"
  >
    <div
      v-if="currentSelect"
      class="select-options"
    >
      <button
        v-for="option in currentSelect.options"
        :key="option.id"
        class="select-options__item"
        :class="optionClasses(option)"
        @click="selectAndClose(option.id)"
      >
        <img
          v-if="option.type === 'image'"
          :src="getImgUrl(option.content) ?? ''"
          :alt="option.content"
          class="select-options__image"
        >
        <span
          v-else
          class="select-options__text"
        >{{ option.content }}</span>
      </button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import Modal from '@/ui/components/shared/Modal.vue'
import type { SelectQuestionAnswer, SelectOption } from '@/domain/quizTypes'

const props = defineProps<{
  open: boolean
  currentSelect: SelectQuestionAnswer | null
  selectResults?: { selectId: number; isCorrect: boolean }[]
  getImgUrl: (path: string) => string | null
}>()

const emit = defineEmits<{
  close: []
  select: [selectId: number, optionId: number]
}>()

function selectAndClose(optionId: number) {
  if (!props.currentSelect) return
  emit('select', props.currentSelect.id, optionId)
  emit('close')
}

function optionClasses(option: SelectOption) {
  if (!props.selectResults || !props.currentSelect) return {}
  const isRelevant = props.selectResults.some(
    (r) => r.selectId === props.currentSelect!.id,
  )
  if (!isRelevant) return {}
  return {
    'select-options__item--correct': option.isCorrect,
    'select-options__item--wrong': !option.isCorrect,
  }
}
</script>

<style scoped>
.select-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.select-options__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border: 1px solid var(--background-3);
  border-radius: 8px;
  background: var(--background-2);
  color: var(--primary-text);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
  text-align: left;
  width: 100%;
}

.select-options__item:hover {
  background: var(--background-3);
}

.select-options__item--correct {
  border-color: var(--primary-color);
  background: rgba(var(--green-color), 0.1);
}

.select-options__item--wrong {
  border-color: var(--red-color);
  background: rgba(var(--red-color), 0.1);
}

.select-options__image {
  max-height: 60px;
  max-width: 100px;
  object-fit: contain;
  border-radius: 4px;
}
</style>
