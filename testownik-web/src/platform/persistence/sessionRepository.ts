import { transaction, objectStore, StorageError } from '../persistence/db'
import type { QuizSession } from '@/domain/quizTypes'

export async function saveSession(session: QuizSession): Promise<void> {
  await transaction(['sessions'], 'readwrite', (tx) => {
    const store = objectStore(tx, 'sessions')
    return store.put({ ...session })
  })
}

export async function getSession(
  id: string,
): Promise<QuizSession | undefined> {
  return transaction(['sessions'], 'readonly', (tx) => {
    const store = objectStore(tx, 'sessions')
    return store.get(id)
  }) as Promise<QuizSession | undefined>
}

export async function getLatestSession(
  quizId: string,
): Promise<QuizSession | undefined> {
  return transaction(['sessions'], 'readonly', (tx) => {
    const store = objectStore(tx, 'sessions')
    const index = store.index('quizId')
    return new Promise<QuizSession | undefined>((resolve) => {
      const request = index.getAll(quizId)
      request.onsuccess = () => {
        const sessions = request.result as QuizSession[]
        if (sessions.length === 0) {
          resolve(undefined)
          return
        }
        resolve(
          sessions.reduce((latest, s) =>
            s.startedAt > latest.startedAt ? s : latest,
          ),
        )
      }
      request.onerror = () => resolve(undefined)
    })
  })
}

export async function listSessionsByQuiz(
  quizId: string,
): Promise<QuizSession[]> {
  return transaction(['sessions'], 'readonly', (tx) => {
    const store = objectStore(tx, 'sessions')
    const index = store.index('quizId')
    return index.getAll(quizId)
  }) as Promise<QuizSession[]>
}

export async function completeSession(
  id: string,
  completedAt: number,
): Promise<void> {
  await transaction(['sessions'], 'readwrite', (tx) => {
    const store = objectStore(tx, 'sessions')
    return new Promise<void>((resolve, reject) => {
      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const session = getRequest.result as QuizSession | undefined
        if (!session) {
          resolve()
          return
        }
        const completed: QuizSession = {
          ...session,
          completedAt,
          updatedAt: Date.now(),
        }
        const putRequest = store.put(completed)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () =>
          reject(putRequest.error ?? new Error('Failed to save session'))
      }
      getRequest.onerror = () =>
        reject(getRequest.error ?? new Error('Failed to read session'))
    })
  })
}

export async function deleteSession(id: string): Promise<void> {
  await transaction(['sessions'], 'readwrite', (tx) => {
    const store = objectStore(tx, 'sessions')
    return store.delete(id)
  })
}

export async function deleteSessionsByQuiz(
  quizId: string,
): Promise<void> {
  await transaction(['sessions'], 'readwrite', (tx) => {
    const store = objectStore(tx, 'sessions')
    const index = store.index('quizId')
    return new Promise<void>((resolve) => {
      const request = index.getAllKeys(quizId)
      request.onsuccess = () => {
        for (const key of request.result) {
          store.delete(key)
        }
        resolve()
      }
      request.onerror = () => resolve()
    })
  })
}

export { StorageError }
