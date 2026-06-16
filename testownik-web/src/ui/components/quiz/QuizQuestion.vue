<template>
  <div class="question-body">
    <img
      v-if="question.contentType === 'image'"
      :src="imgSrc ?? ''"
      :alt="String(question.content)"
      class="question-body__image"
      @error="imgFailed = true"
    >
    <template v-else-if="isSingleContent">
      <p class="question-body__text">
        {{ question.content }}
      </p>
    </template>
    <template v-else>
      <p class="question-body__text">
        <template
          v-for="(part, i) in contentParts"
          :key="i"
        >
          <span
            v-if="typeof part === 'object'"
            class="question-body__select"
            :class="{
              'question-body__select--filled': !!selectValues[part.selectId],
              'question-body__select--correct': isCorrectSelect(part.selectId),
              'question-body__select--wrong': isWrongSelect(part.selectId),
            }"
            @click="$emit('openSelect', part.selectId)"
          >
            {{ selectValues[part.selectId] || `(${part.selectId})` }}
          </span>
          <span v-else>{{ part }}</span>
        </template>
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Question, SelectPlaceholder } from '@/domain/quizTypes'

const props = defineProps<{
  question: Question
  imgSrc: string | null
  selectValues: Record<number, string>
  selectResults?: { selectId: number; isCorrect: boolean }[]
}>()

defineEmits<{
  openSelect: [selectId: number]
}>()

const imgFailed = computed(() => false)

const isSingleContent = computed(
  () => typeof props.question.content === 'string',
)

const contentParts = computed(() => {
  if (typeof props.question.content !== 'string') {
    return props.question.content as (string | SelectPlaceholder)[]
  }
  return [props.question.content]
})

function isCorrectSelect(selectId: number): boolean {
  return props.selectResults?.some(
    (s) => s.selectId === selectId && s.isCorrect,
  ) ?? false
}

function isWrongSelect(selectId: number): boolean {
  return props.selectResults?.some(
    (s) => s.selectId === selectId && !s.isCorrect,
  ) ?? false
}
</script>

<style scoped>
.question-body {
  margin-bottom: 20px;
}

.question-body__text {
  font-size: 1.15rem;
  line-height: 1.6;
  margin: 0;
}

.question-body__image {
  max-width: 100%;
  max-height: 320px;
  object-fit: contain;
  border-radius: 8px;
}

.question-body__select {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--background-2);
  border: 1px solid var(--background-3);
  cursor: pointer;
  color: var(--secondary-text);
  min-width: 32px;
  text-align: center;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.question-body__select:hover {
  background: var(--background-3);
}

.question-body__select--filled {
  color: var(--primary-text);
  border-color: var(--primary-color);
}

.question-body__select--correct {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}

.question-body__select--wrong {
  background: var(--red-color);
  color: #fff;
  border-color: var(--red-color);
}
</style>
