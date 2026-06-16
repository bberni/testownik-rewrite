import { transaction, objectStore, StorageError } from './db'

export interface RecentEntry {
  schemaVersion: 1
  quizId: string
  lastOpenedAt: number
}

export async function upsertRecent(quizId: string): Promise<void> {
  const entry: RecentEntry = {
    schemaVersion: 1,
    quizId,
    lastOpenedAt: Date.now(),
  }

  await transaction(['recents'], 'readwrite', (tx) => {
    const store = objectStore(tx, 'recents')
    return store.put(entry)
  })
}

export async function listRecents(): Promise<RecentEntry[]> {
  return transaction(['recents'], 'readonly', (tx) => {
    const store = objectStore(tx, 'recents')
    return store.getAll()
  }).then((entries) =>
    (entries as RecentEntry[]).sort(
      (a, b) => b.lastOpenedAt - a.lastOpenedAt,
    ),
  )
}

export async function deleteRecent(quizId: string): Promise<void> {
  await transaction(['recents'], 'readwrite', (tx) => {
    const store = objectStore(tx, 'recents')
    return store.delete(quizId)
  })
}

export { StorageError }
