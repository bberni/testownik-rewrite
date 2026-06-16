<template>
  <div
    class="quiz-page"
    tabindex="0"
    @keydown="onKeyDown"
  >
    <div class="quiz-page__main">
      <div class="quiz-page__header">
        <router-link
          to="/"
          class="quiz-page__back"
        >
          &larr; {{ quizName }}
        </router-link>
      </div>

      <template v-if="phase === 'finished'">
        <div class="quiz-page__finished">
          <p class="quiz-page__finished-text">
            Koniec quizu!
          </p>
        </div>
      </template>

      <template v-if="phase !== 'finished' && currentQuestion">
        <QuizQuestion
          :question="currentQuestion"
          :img-src="getQuestionImgUrl()"
          :select-values="selectValues"
          :select-results="revealedSelectResults"
          :phase="phase"
          @open-select="openSelectModal"
        />

        <SingleAnswerList
          v-if="currentQuestion.type === 'single'"
          :answers="singleAnswers"
          :selected-ids="selectedIds"
          :phase="phase"
          :correct-ids="revealedCorrectIds"
          :get-img-url="getAssetUrl"
        />
      </template>

      <div class="quiz-page__footer">
        <span class="quiz-page__tag">
          {{ currentTag }}
          <template v-if="currentReoccurrences > 0">
            &times;{{ currentReoccurrences }}
          </template>
        </span>

        <button
          v-if="phase === 'answering'"
          class="quiz-page__action quiz-page__action--accept"
          aria-label="Sprawdź odpowiedź"
          @click="checkAnswer"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </button>
        <button
          v-else-if="phase === 'revealed'"
          class="quiz-page__action quiz-page__action--next"
          aria-label="Następne pytanie"
          @click="nextQuestion"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </div>

    <aside class="quiz-page__sidebar">
      <StatsSidebar
        :progress="progress"
        :current-tag="currentTag"
        :current-reoccurrences="currentReoccurrences"
        :time="time"
        :correct-answers="correctAnswers"
        :bad-answers="badAnswers"
        :learned-questions="learnedQuestions"
        @open-settings="showSettings = true"
        @open-info="showInfo = true"
        @save-exit="showSaveExit = true"
      />
    </aside>

    <SelectOptionsModal
      :open="selectModalId !== null"
      :current-select="currentSelectData"
      :select-results="revealedSelectResults"
      :get-img-url="getAssetUrl"
      @close="closeSelectModal"
      @select="selectOption"
    />

    <SettingsModal
      :open="showSettings"
      @close="showSettings = false"
    />

    <InfoModal
      :open="showInfo"
      @close="showInfo = false"
    />

    <Modal
      :open="showSaveExit"
      title="Zapisać postęp?"
      @close="showSaveExit = false"
    >
      <div class="save-exit">
        <p class="save-exit__text">
          Czy chcesz zapisać postęp przed wyjściem?
        </p>
        <div class="save-exit__actions">
          <button
            class="save-exit__btn"
            @click="saveAndExit"
          >
            Zapisz i wyjdź
          </button>
          <button
            class="save-exit__btn save-exit__btn--secondary"
            @click="goHome"
          >
            Wyjdź bez zapisu
          </button>
        </div>
      </div>
    </Modal>

    <FinishQuizModal
      :open="phase === 'finished'"
      :time="time"
      :correct-answers="correctAnswers"
      :bad-answers="badAnswers"
      :learned-questions="learnedQuestions"
      @close="goHome"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useQuizSessionStore } from '@/ui/stores/quizSession'
import { useQuizLibraryStore } from '@/ui/stores/quizLibrary'
import { useAssetUrls } from '@/ui/composables/useAssetUrls'
import type { SelectQuestionAnswer, SelectOption } from '@/domain/quizTypes'
import QuizQuestion from '@/ui/components/quiz/QuizQuestion.vue'
import SingleAnswerList from '@/ui/components/quiz/SingleAnswerList.vue'
import StatsSidebar from '@/ui/components/quiz/StatsSidebar.vue'
import SelectOptionsModal from '@/ui/components/quiz/SelectOptionsModal.vue'
import Modal from '@/ui/components/shared/Modal.vue'
import SettingsModal from '@/ui/components/landing/SettingsModal.vue'
import InfoModal from '@/ui/components/landing/InfoModal.vue'
import FinishQuizModal from '@/ui/components/quiz/FinishQuizModal.vue'

const route = useRoute()
const router = useRouter()
const store = useQuizSessionStore()
const library = useQuizLibraryStore()

const quizId = computed(() => route.params['quizId'] as string)
const mode = computed(() =>
  (route.query['mode'] as string) === 'new' ? 'new' : 'continue',
)

const {
  quizName,
  currentQuestion,
  currentTag,
  currentReoccurrences,
  phase,
  selectedIds,
  selectSelections,
  revealedCorrectIds,
  revealedSelectResults,
  progress,
  singleAnswers,
  selectAnswers,
} = storeToRefs(store)

const time = computed(() => store.session?.time ?? 0)
const correctAnswers = computed(() => store.session?.numberOfCorrectAnswers ?? 0)
const badAnswers = computed(() => store.session?.numberOfBadAnswers ?? 0)
const learnedQuestions = computed(() => store.session?.numberOfLearnedQuestions ?? 0)

const { load: loadAssets, getUrl: getAssetUrl } = useAssetUrls(quizId.value)

const selectModalId = ref<number | null>(null)
const showSettings = ref(false)
const showInfo = ref(false)
const showSaveExit = ref(false)

const currentSelectData = computed<SelectQuestionAnswer | null>(() => {
  if (selectModalId.value === null || !currentQuestion.value) return null
  const answers = currentQuestion.value.answers as SelectQuestionAnswer[]
  return answers.find((a) => a.id === selectModalId.value) ?? null
})

const selectValues = computed(() => {
  const result: Record<number, string> = {}
  for (const answer of selectAnswers.value) {
    const optId = selectSelections.value[answer.id]
    if (optId !== undefined) {
      const option = answer.options.find((o: SelectOption) => o.id === optId)
      if (option && option.type === 'text') {
        result[answer.id] = option.content
      }
    }
  }
  return result
})

async function init() {
  try {
    await loadAssets()
    await store.init(quizId.value, mode.value)
    library.markOpened(quizId.value)
  } catch (e) {
    console.error('Failed to init quiz:', e)
    router.replace('/')
  }
}

onMounted(init)

onUnmounted(() => {
  store.stopTimer()
  store.saveSession()
})

function getQuestionImgUrl(): string | null {
  if (
    !currentQuestion.value ||
    currentQuestion.value.contentType !== 'image' ||
    typeof currentQuestion.value.content !== 'string'
  ) {
    return null
  }
  return getAssetUrl(currentQuestion.value.content)
}

function openSelectModal(selectId: number) {
  selectModalId.value = selectId
}

function closeSelectModal() {
  selectModalId.value = null
}

function selectOption(selectId: number, optionId: number) {
  store.selectOption(selectId, optionId)
}

function checkAnswer() {
  store.checkAnswer()
}

function nextQuestion() {
  store.nextQuestion()
}

function onKeyDown(event: KeyboardEvent) {
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement ||
    event.target instanceof HTMLSelectElement
  ) {
    return
  }

  if (event.key === ' ') {
    if (showSettings.value || showInfo.value || showSaveExit.value) return
    event.preventDefault()
    if (phase.value === 'answering') {
      checkAnswer()
    } else if (phase.value === 'revealed') {
      nextQuestion()
    }
    return
  }

  if (event.key === 'Escape') {
    if (selectModalId.value !== null) {
      closeSelectModal()
      return
    }
    if (showSaveExit.value) {
      showSaveExit.value = false
      return
    }
    if (showSettings.value) {
      showSettings.value = false
      return
    }
    if (showInfo.value) {
      showInfo.value = false
      return
    }
    return
  }

  if (phase.value !== 'answering' || currentQuestion.value?.type !== 'single') {
    return
  }

  const key = event.code
  const numMatch = key.match(/^(Digit|Numpad)([1-9])$/)
  if (numMatch) {
    event.preventDefault()
    const idx = Number.parseInt(numMatch[2]!, 10) - 1
    const answers = singleAnswers.value
    if (idx < answers.length) {
      store.toggleAnswer(answers[idx]!.id)
    }
  }
}

function goHome() {
  store.stopTimer()
  router.replace('/')
}

function saveAndExit() {
  store.saveSession()
  showSaveExit.value = false
  goHome()
}
</script>

<style scoped>
.quiz-page {
  display: flex;
  height: 100vh;
  overflow: hidden;
  outline: none;
}

.quiz-page__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  overflow-y: auto;
  min-width: 0;
  position: relative;
}

.quiz-page__header {
  margin-bottom: 24px;
}

.quiz-page__back {
  color: var(--secondary-text);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.15s ease;
}

.quiz-page__back:hover {
  color: var(--primary-text);
}

.quiz-page__footer {
  margin-top: auto;
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quiz-page__tag {
  font-size: 0.8rem;
  color: var(--distant-text);
}

.quiz-page__action {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.quiz-page__action:active {
  transform: scale(0.95);
}

.quiz-page__action--accept {
  background: var(--primary-color);
  color: #fff;
}

.quiz-page__action--accept:hover {
  background: var(--primary-color-lighter);
}

.quiz-page__action--next {
  background: var(--primary-color);
  color: #fff;
}

.quiz-page__action--next:hover {
  background: var(--primary-color-lighter);
}

.quiz-page__sidebar {
  width: 260px;
  padding: 20px 16px;
  background: var(--sidebar-background);
  border-left: 1px solid var(--background-3);
  overflow-y: auto;
}

.quiz-page__finished {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  text-align: center;
}

.quiz-page__finished-text {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.quiz-page__finished-sub {
  font-size: 0.9rem;
  color: var(--secondary-text);
  margin: 0;
}

.quiz-page__finished-btn {
  margin-top: 12px;
  padding: 10px 32px;
  border: none;
  border-radius: 8px;
  background: var(--primary-color);
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
}

.quiz-page__finished-btn:hover {
  background: var(--primary-color-lighter);
}

.save-exit {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.save-exit__text {
  font-size: 0.9rem;
  margin: 0;
}

.save-exit__actions {
  display: flex;
  gap: 8px;
}

.save-exit__btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: var(--primary-color);
  color: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  text-align: center;
}

.save-exit__btn:hover {
  background: var(--primary-color-lighter);
}

.save-exit__btn--secondary {
  background: transparent;
  color: var(--primary-text);
  border: 1px solid var(--background-3);
}

.save-exit__btn--secondary:hover {
  background: var(--background-2);
}

@media (max-width: 768px) {
  .quiz-page {
    flex-direction: column;
  }

  .quiz-page__sidebar {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--background-3);
    padding: 12px 16px;
    overflow-y: visible;
    max-height: 40vh;
  }

  .quiz-page__main {
    padding: 16px;
  }

  .quiz-page__action {
    width: 48px;
    height: 48px;
  }
}
</style>
