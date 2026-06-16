import { defineStore } from 'pinia'
import {
  listQuizzes,
  deleteQuiz as deleteQuizFromDb,
  saveQuiz,
  getQuizByFingerprint,
} from '@/platform/persistence/quizRepository'
import { getLatestSession, saveSession } from '@/platform/persistence/sessionRepository'
import { saveAssets } from '@/platform/assets/assetRepository'
import { listRecents, upsertRecent } from '@/platform/persistence/recentRepository'
import type { QuizPackage, StoredAssetRef, QuizSession } from '@/domain/quizTypes'
import type { ImportResult } from '@/platform/files/importPipeline'
import { deserializeSaveJson } from '@/domain/saveJsonCompat'

export interface LibraryItem {
  quiz: QuizPackage
  hasSession: boolean
  isComplete: boolean
  lastOpenedAt: number | null
  correctRatio: number
  learnedRatio: number
}

export const useQuizLibraryStore = defineStore('quizLibrary', {
  state: () => ({
    items: [] as LibraryItem[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    hasQuizzes: (state) => state.items.length > 0,

    sortedItems(state): LibraryItem[] {
      return [...state.items].sort((a, b) => {
        const aTime = a.lastOpenedAt ?? a.quiz.importedAt
        const bTime = b.lastOpenedAt ?? b.quiz.importedAt
        return bTime - aTime
      })
    },
  },

  actions: {
    async loadAll() {
      this.loading = true
      this.error = null
      try {
        const [quizzes, recents] = await Promise.all([
          listQuizzes(),
          listRecents(),
        ])
        const recentMap = new Map(recents.map((r) => [r.quizId, r.lastOpenedAt]))
        const items: LibraryItem[] = await Promise.all(
          quizzes.map(async (quiz) => {
            let hasSession = false
            let isComplete = false
            let correctRatio = 0
            let learnedRatio = 0
            try {
              const session = await getLatestSession(quiz.id)
              if (session) {
                hasSession = true
                isComplete = session.completedAt !== null
                const total =
                  session.numberOfCorrectAnswers + session.numberOfBadAnswers
                correctRatio =
                  total > 0 ? session.numberOfCorrectAnswers / total : 0
                learnedRatio =
                  quiz.questionCount > 0
                    ? session.numberOfLearnedQuestions / quiz.questionCount
                    : 0
              }
            } catch {
              // keep defaults
            }
            return {
              quiz,
              hasSession,
              isComplete,
              lastOpenedAt: recentMap.get(quiz.id) ?? null,
              correctRatio,
              learnedRatio,
            }
          }),
        )
        this.items = items
      } catch (e) {
        this.error =
          e instanceof Error ? e.message : 'Nie udało się wczytać quizów.'
      } finally {
        this.loading = false
      }
    },

    async importResult(result: ImportResult) {
      const existing = await getQuizByFingerprint(result.fingerprint)
      if (existing) {
        throw new Error(
          `Quiz "${result.name}" jest już zaimportowany jako "${existing.name}".`,
        )
      }

      const now = Date.now()
      const id = crypto.randomUUID()
      const assetRefs: StoredAssetRef[] = result.assets.map((a) => ({
        relativePath: a.relativePath,
        mimeType: a.mimeType,
        size: a.size,
      }))

      const quiz: QuizPackage = {
        schemaVersion: 1,
        id,
        name: result.name,
        fingerprint: result.fingerprint,
        importedAt: now,
        updatedAt: now,
        questionCount: result.questions.length,
        questions: result.questions,
        assets: assetRefs,
      }

      await saveQuiz(quiz)
      if (result.assets.length > 0) {
        await saveAssets(
          result.assets.map((a) => ({
            quizId: id,
            relativePath: a.relativePath,
            blob: a.blob,
            mimeType: a.mimeType,
            size: a.size,
          })),
        )
      }
      await upsertRecent(id)

      this.items.push({
        quiz,
        hasSession: false,
        isComplete: false,
        lastOpenedAt: now,
        correctRatio: 0,
        learnedRatio: 0,
      })
    },

    async deleteItem(quizId: string) {
      await deleteQuizFromDb(quizId)
      this.items = this.items.filter((item) => item.quiz.id !== quizId)
    },

    async markOpened(quizId: string) {
      await upsertRecent(quizId)
      const item = this.items.find((i) => i.quiz.id === quizId)
      if (item) {
        item.lastOpenedAt = Date.now()
      }
    },

    async matchAndImportSaveJson(
      file: File,
    ): Promise<{ quizId: string; quizName: string; matchPercent: number }> {
      const text = await file.text()
      const data = deserializeSaveJson(text)

      const saveTags = new Set(data.reoccurrences.map((r) => r.tag))
      if (saveTags.size === 0) {
        throw new Error('Plik save.json nie zawiera tagów pytań.')
      }

      await this.loadAll()
      let bestMatch: {
        quiz: QuizPackage
        matchCount: number
        matchPercent: number
      } | null = null

      for (const item of this.items) {
        const quizTags = new Set(item.quiz.questions.map((q) => q.tag))
        let matchCount = 0
        for (const tag of saveTags) {
          if (quizTags.has(tag)) matchCount++
        }
        if (matchCount === 0) continue
        const matchPercent = Math.round((matchCount / saveTags.size) * 100)
        if (!bestMatch || matchCount > bestMatch.matchCount) {
          bestMatch = { quiz: item.quiz, matchCount, matchPercent }
        }
      }

      if (!bestMatch) {
        throw new Error(
          'Nie znaleziono quizu pasującego do pliku save.json. Najpierw zaimportuj odpowiedni quiz.',
        )
      }

      if (bestMatch.matchPercent < 50) {
        throw new Error(
          `Znaleziono niskie dopasowanie (${bestMatch.matchPercent}%) do quizu "${bestMatch.quiz.name}". Sprawdź, czy to właściwy plik save.json.`,
        )
      }

      const existingSession = await getLatestSession(bestMatch.quiz.id)
      if (existingSession?.completedAt === null) {
        throw new Error(
          `Quiz "${bestMatch.quiz.name}" ma już aktywną sesję. Zakończ lub usuń bieżącą sesję przed zaimportowaniem save.json.`,
        )
      }

      const now = Date.now()
      const session: QuizSession = {
        schemaVersion: 1,
        id: crypto.randomUUID(),
        quizId: bestMatch.quiz.id,
        startedAt: now,
        updatedAt: now,
        completedAt: null,
        numberOfLearnedQuestions: data.numberOfLearnedQuestions,
        numberOfCorrectAnswers: data.numberOfCorrectAnswers,
        numberOfBadAnswers: data.numberOfBadAnswers,
        time: data.time,
        reoccurrences: data.reoccurrences,
      }

      await saveSession(session)

      const item = this.items.find((i) => i.quiz.id === bestMatch.quiz.id)
      if (item) {
        item.hasSession = true
        item.isComplete = session.completedAt !== null
        const total = session.numberOfCorrectAnswers + session.numberOfBadAnswers
        item.correctRatio = total > 0 ? session.numberOfCorrectAnswers / total : 0
        item.learnedRatio =
          bestMatch.quiz.questionCount > 0
            ? session.numberOfLearnedQuestions / bestMatch.quiz.questionCount
            : 0
      }

      return {
        quizId: bestMatch.quiz.id,
        quizName: bestMatch.quiz.name,
        matchPercent: bestMatch.matchPercent,
      }
    },
  },
})
