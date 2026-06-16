<template>
  <div class="single-answers">
    <label
      v-for="answer in answers"
      :key="answer.id"
      class="single-answer"
      :class="answerClasses(answer)"
    >
      <input
        type="checkbox"
        class="single-answer__checkbox"
        :checked="isSelected(answer.id)"
        :disabled="phase !== 'answering'"
        @change="$emit('toggle', answer.id)"
      >
      <span class="single-answer__indicator" />
      <img
        v-if="answer.type === 'image'"
        :src="getImgUrl(answer.content) ?? ''"
        :alt="answer.content"
        class="single-answer__image"
      >
      <span
        v-else
        class="single-answer__text"
      >{{ answer.content }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import type { SingleQuestionAnswer } from '@/domain/quizTypes'
import type { QuizPhase } from '@/ui/stores/quizSession'

const props = defineProps<{
  answers: SingleQuestionAnswer[]
  selectedIds: number[]
  phase: QuizPhase
  correctIds: number[]
  getImgUrl: (path: string) => string | null
}>()

defineEmits<{
  toggle: [id: number]
}>()

function isSelected(id: number): boolean {
  return props.selectedIds.includes(id)
}

function answerClasses(answer: SingleQuestionAnswer) {
  if (props.phase !== 'revealed') return {}
  return {
    'single-answer--correct': answer.isCorrect,
    'single-answer--wrong': isSelected(answer.id) && !answer.isCorrect,
    'single-answer--missed': !isSelected(answer.id) && answer.isCorrect,
    'single-answer--checked': isSelected(answer.id),
  }
}
</script>

<style scoped>
.single-answers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.single-answer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--answer-single-type-background);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
  border: 2px solid transparent;
}

.single-answer:hover {
  background: var(--background-3);
}

.single-answer__checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.single-answer__indicator {
  width: 20px;
  height: 20px;
  min-width: 20px;
  border-radius: 4px;
  border: 2px solid var(--secondary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.single-answer--checked .single-answer__indicator {
  border-color: var(--primary-color);
  background: var(--primary-color);
}

.single-answer--checked .single-answer__indicator::after {
  content: '';
  width: 8px;
  height: 4px;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(-45deg) translate(1px, -1px);
}

.single-answer--correct {
  border-color: var(--primary-color);
  background: rgba(var(--green-color), 0.1);
}

.single-answer--wrong {
  border-color: var(--red-color);
  background: rgba(var(--red-color), 0.1);
}

.single-answer--missed {
  border-color: var(--yellow-color);
  background: rgba(var(--yellow-color), 0.1);
}

.single-answer__text {
  font-size: 0.95rem;
  line-height: 1.4;
}

.single-answer__image {
  max-height: 80px;
  max-width: 120px;
  object-fit: contain;
  border-radius: 4px;
}

@media (max-width: 960px) {
  .single-answers {
    grid-template-columns: 1fr;
  }
}
</style>
