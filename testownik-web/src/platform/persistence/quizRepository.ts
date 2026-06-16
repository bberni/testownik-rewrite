import { transaction, objectStore, StorageError } from '../persistence/db'
import type { QuizPackage } from '@/domain/quizTypes'

export async function saveQuiz(quiz: QuizPackage): Promise<void> {
  await transaction(['quizPackages'], 'readwrite', (tx) => {
    const store = objectStore(tx, 'quizPackages')
    return store.put(quiz)
  })
}

export async function getQuiz(id: string): Promise<QuizPackage | undefined> {
  return transaction(['quizPackages'], 'readonly', (tx) => {
    const store = objectStore(tx, 'quizPackages')
    return store.get(id)
  }) as Promise<QuizPackage | undefined>
}

export async function getQuizByFingerprint(
  fingerprint: string,
): Promise<QuizPackage | undefined> {
  return transaction(['quizPackages'], 'readonly', (tx) => {
    const store = objectStore(tx, 'quizPackages')
    return new Promise<QuizPackage | undefined>((resolve) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const quizzes = request.result as QuizPackage[]
        for (const q of quizzes) {
          if (q.fingerprint === fingerprint) {
            resolve(q)
            return
          }
        }
        resolve(undefined)
      }
      request.onerror = () => resolve(undefined)
    })
  })
}

export async function listQuizzes(): Promise<QuizPackage[]> {
  return transaction(['quizPackages'], 'readonly', (tx) => {
    const store = objectStore(tx, 'quizPackages')
    return store.getAll()
  }) as Promise<QuizPackage[]>
}

export async function updateQuiz(quiz: QuizPackage): Promise<void> {
  await transaction(['quizPackages'], 'readwrite', (tx) => {
    const store = objectStore(tx, 'quizPackages')
    return store.put(quiz)
  })
}

export async function deleteQuiz(id: string): Promise<void> {
  await transaction(
    ['quizPackages', 'assets', 'sessions', 'recents'],
    'readwrite',
    (tx) => {
      const quizStore = objectStore(tx, 'quizPackages')
      quizStore.delete(id)

      const assetStore = objectStore(tx, 'assets')
      const assetIndex = assetStore.index('quizId')
      const assetKeysRequest = assetIndex.getAllKeys()
      assetKeysRequest.onsuccess = () => {
        for (const key of assetKeysRequest.result) {
          assetStore.delete(key)
        }
      }

      const sessionStore = objectStore(tx, 'sessions')
      const sessionIndex = sessionStore.index('quizId')
      const sessionKeysRequest = sessionIndex.getAllKeys()
      sessionKeysRequest.onsuccess = () => {
        for (const key of sessionKeysRequest.result) {
          sessionStore.delete(key)
        }
      }

      const recentStore = objectStore(tx, 'recents')
      return recentStore.delete(id)
    },
  )
}

export async function quizExists(id: string): Promise<boolean> {
  const quiz = await getQuiz(id)
  return quiz !== undefined
}

export { StorageError }
