import { defineStore } from 'pinia'
import type {
  Question,
  QuizSession,
  SingleQuestionAnswer,
  SelectQuestionAnswer,
} from '@/domain/quizTypes'
import { getQuiz } from '@/platform/persistence/quizRepository'
import {
  saveSession,
  getLatestSession,
} from '@/platform/persistence/sessionRepository'
import { useSettingsStore } from './settings'
import { createQuizSession } from '@/domain/quizSession'
import {
  checkSingleAnswer,
  checkSelectAnswer,
  applyAnswerResult,
  isQuizComplete,
  pickRandomQuestion,
  computeProgress,
} from '@/domain/quizEngine'

export type QuizPhase = 'answering' | 'revealed' | 'finished'

export const useQuizSessionStore = defineStore('quizSession', {
  state: () => ({
    quizId: '',
    quizName: '',
    questions: [] as Question[],
    session: null as QuizSession | null,
    mode: 'new',

    currentTag: null as string | null,
    currentQuestion: null as Question | null,

    selectedIds: [] as number[],
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    selectSelections: {} as Record<number, number>,

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    phase: 'answering' as QuizPhase,
    timerRunning: false,
    timerInterval: null as ReturnType<typeof setInterval> | null,

    lastCorrect: false,
    revealedCorrectIds: [] as number[],
    revealedSelectResults: [] as {
      selectId: number
      selectedOptionId: number | null
      correctOptionId: number
      isCorrect: boolean
    }[],
    isAnswerCorrect: false,
  }),

  getters: {
    currentReoccurrences(state): number {
      if (!state.currentTag) return 0
      const rec = state.session?.reoccurrences.find(
        (r) => r.tag === state.currentTag,
      )
      return rec?.value ?? 0
    },

    progress(state) {
      if (!state.session) {
        return { correctRatio: 0, learnedRatio: 0, totalQuestions: 0 }
      }
      return computeProgress(state.session)
    },

    isSingle(state): boolean {
      return state.currentQuestion?.type === 'single'
    },

    singleAnswers(state): SingleQuestionAnswer[] {
      if (state.currentQuestion?.type !== 'single') {
        return []
      }
      const answers = state.currentQuestion.answers as SingleQuestionAnswer[]
      return [...answers].sort(() => Math.random() - 0.5)
    },

    selectAnswers(state): SelectQuestionAnswer[] {
      if (state.currentQuestion?.type !== 'select') {
        return []
      }
      return state.currentQuestion.answers as SelectQuestionAnswer[]
    },
  },

  actions: {
    async init(quizId: string, mode: 'continue' | 'new') {
      this.quizId = quizId
      this.mode = mode

      const quiz = await getQuiz(quizId)
      if (!quiz) throw new Error('Quiz nie został znaleziony.')

      this.questions = quiz.questions
      this.quizName = quiz.name

      const settings = useSettingsStore()
      let session: QuizSession

      if (mode === 'continue') {
        const existing = await getLatestSession(quizId)
        if (existing?.completedAt !== null) {
          // No valid session to continue, start fresh
          const created = createQuizSession({
            questions: quiz.questions,
            reoccurrencesOnStart: settings.reoccurrencesOnStart,
          })
          session = {
            schemaVersion: 1,
            id: crypto.randomUUID(),
            quizId,
            startedAt: Date.now(),
            updatedAt: Date.now(),
            completedAt: null,
            numberOfLearnedQuestions: created.numberOfLearnedQuestions,
            numberOfCorrectAnswers: created.numberOfCorrectAnswers,
            numberOfBadAnswers: created.numberOfBadAnswers,
            time: created.time,
            reoccurrences: created.reoccurrences,
          }
        } else {
          session = existing
        }
      } else {
        // Start new session
        const created = createQuizSession({
          questions: quiz.questions,
          reoccurrencesOnStart: settings.reoccurrencesOnStart,
        })
        session = {
          schemaVersion: 1,
          id: crypto.randomUUID(),
          quizId,
          startedAt: Date.now(),
          updatedAt: Date.now(),
          completedAt: null,
          numberOfLearnedQuestions: created.numberOfLearnedQuestions,
          numberOfCorrectAnswers: created.numberOfCorrectAnswers,
          numberOfBadAnswers: created.numberOfBadAnswers,
          time: created.time,
          reoccurrences: created.reoccurrences,
        }
        await saveSession(session)
      }

      this.session = session
      this.pickNext()
      this.startTimer()
    },

    pickNext() {
      const tag = pickRandomQuestion(
        this.session!.reoccurrences,
        Math.random,
      )
      if (!tag) {
        this.currentTag = null
        this.currentQuestion = null
        this.phase = 'finished'
        this.stopTimer()
        void this.finishQuiz()
        return
      }

      this.currentTag = tag
      this.currentQuestion =
        this.questions.find((q) => q.tag === tag) ?? null
      this.selectedIds = []
      this.selectSelections = {}
      this.phase = 'answering'
    },

    toggleAnswer(id: number) {
      if (this.phase !== 'answering') return
      const idx = this.selectedIds.indexOf(id)
      if (idx === -1) {
        this.selectedIds = [...this.selectedIds, id]
      } else {
        this.selectedIds = this.selectedIds.filter((i) => i !== id)
      }
    },

    selectOption(selectId: number, optionId: number) {
      this.selectSelections = {
        ...this.selectSelections,
        [selectId]: optionId,
      }
    },

    checkAnswer() {
      if (!this.currentQuestion || !this.session) return

      let isCorrect: boolean

      if (this.currentQuestion.type === 'single') {
        const answers = this.currentQuestion
          .answers as SingleQuestionAnswer[]
        const correctIds = answers
          .filter((a) => a.isCorrect)
          .map((a) => a.id)
        const result = checkSingleAnswer(correctIds, this.selectedIds)
        isCorrect = result.isCorrect
        this.revealedCorrectIds = result.correctIds
      } else {
        const answers = this.currentQuestion
          .answers as SelectQuestionAnswer[]
      const selections = answers.map((a) => ({
        selectId: a.id,
        selectedOptionId: (this.selectSelections as Record<number, number | null>)[a.id] ?? null,
        correctOptionId: a.correctOptionId,
      }))
        const result = checkSelectAnswer(selections)
        isCorrect = result.isCorrect
        this.revealedSelectResults = selections.map((s) => ({
          selectId: s.selectId,
          selectedOptionId: s.selectedOptionId,
          correctOptionId: s.correctOptionId,
          isCorrect: s.selectedOptionId === s.correctOptionId,
        }))
      }

      this.isAnswerCorrect = isCorrect
      this.phase = 'revealed'

      const settings = useSettingsStore()
      const newState = applyAnswerResult(
        this.session,
        this.currentTag!,
        isCorrect,
        {
          reoccurrencesIfBad: settings.reoccurrencesIfBad,
          maxReoccurrences: settings.maxReoccurrences,
        },
      )

      this.session = {
        ...this.session,
        ...newState,
        updatedAt: Date.now(),
      }

      void this.saveSession()

      if (isQuizComplete(this.session)) {
        this.phase = 'finished'
        this.stopTimer()
        void this.finishQuiz()
      }
    },

    nextQuestion() {
      this.pickNext()
    },

    startTimer() {
      if (this.timerInterval) return
      this.timerRunning = true
      this.timerInterval = setInterval(() => {
        if (this.session) {
          this.session = {
            ...this.session,
            time: this.session.time + 1000,
          }
        }
      }, 1000)
    },

    stopTimer() {
      this.timerRunning = false
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
    },

    async finishQuiz() {
      if (!this.session) return
      this.session = {
        ...this.session,
        completedAt: Date.now(),
        updatedAt: Date.now(),
      }
      this.stopTimer()
      await this.saveSession()
    },

    async saveSession() {
      if (!this.session) return
      try {
        await saveSession(this.session)
      } catch {
        // Fail silently for autosave
      }
    },
  },
})
