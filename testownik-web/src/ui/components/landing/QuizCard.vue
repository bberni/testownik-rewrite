<template>
  <article class="quiz-card">
    <div class="quiz-card__header">
      <h3 class="quiz-card__name">
        {{ item.quiz.name }}
      </h3>
      <span class="quiz-card__count">{{ item.quiz.questionCount }} pytań</span>
    </div>

    <div class="quiz-card__stats">
      <template v-if="item.hasSession">
        <div class="quiz-card__stat">
          <span class="quiz-card__stat-label">Poprawne</span>
          <ProgressBar
            :progress="item.correctRatio"
            color="var(--primary-color)"
            color2="var(--red-color)"
          />
          <span class="quiz-card__stat-value">
            {{ Math.round(item.correctRatio * 100) }}%
          </span>
        </div>
        <div class="quiz-card__stat">
          <span class="quiz-card__stat-label">Nauczone</span>
          <ProgressBar
            :progress="item.learnedRatio"
            color="var(--primary-color)"
          />
          <span class="quiz-card__stat-value">
            {{ Math.round(item.learnedRatio * 100) }}%
          </span>
        </div>
      </template>
      <template v-else>
        <p class="quiz-card__fresh">
          Nie rozpoczęty
        </p>
      </template>
    </div>

    <div class="quiz-card__actions">
      <button
        v-if="item.hasSession && !item.isComplete"
        class="quiz-card__action quiz-card__action--primary"
        @click="$emit('continue', item.quiz.id)"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
        ><path d="M8 5v14l11-7z" /></svg>
        Kontynuuj
      </button>
      <button
        v-else
        class="quiz-card__action quiz-card__action--primary"
        @click="$emit('startNew', item.quiz.id)"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        ><path d="M12 4v16m8-8H4" /></svg>
        Nowy
      </button>
      <button
        class="quiz-card__action"
        title="Usuń quiz"
        @click="$emit('delete', item.quiz.id)"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        ><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14M10 11v6M14 11v6" /></svg>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import ProgressBar from '@/ui/components/shared/ProgressBar.vue'
import type { LibraryItem } from '@/ui/stores/quizLibrary'

defineProps<{
  item: LibraryItem
}>()

defineEmits<{
  continue: [quizId: string]
  startNew: [quizId: string]
  delete: [quizId: string]
}>()
</script>

<style scoped>
.quiz-card {
  background: var(--background-2);
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: background-color 0.2s ease;
}

.quiz-card:hover {
  background: var(--background-3);
}

.quiz-card__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.quiz-card__name {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.quiz-card__count {
  font-size: 0.8rem;
  color: var(--secondary-text);
  white-space: nowrap;
}

.quiz-card__stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quiz-card__fresh {
  font-size: 0.85rem;
  color: var(--distant-text);
  margin: 0;
}

.quiz-card__stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quiz-card__stat-label {
  font-size: 0.8rem;
  color: var(--secondary-text);
  min-width: 60px;
}

.quiz-card__stat-value {
  font-size: 0.8rem;
  color: var(--secondary-text);
  min-width: 36px;
  text-align: right;
}

.quiz-card__actions {
  display: flex;
  gap: 8px;
  padding-top: 4px;
}

.quiz-card__action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--background-3);
  border-radius: 6px;
  background: transparent;
  color: var(--primary-text);
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.quiz-card__action:hover {
  background: var(--background);
}

.quiz-card__action--primary {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}

.quiz-card__action--primary:hover {
  background: var(--primary-color-lighter);
}

@media (max-width: 480px) {
  .quiz-card {
    padding: 12px 14px;
    gap: 8px;
  }

  .quiz-card__name {
    font-size: 0.95rem;
  }

  .quiz-card__actions {
    flex-wrap: wrap;
  }
}
</style>
