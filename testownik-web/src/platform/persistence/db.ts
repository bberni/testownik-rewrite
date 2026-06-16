const DB_NAME = 'testownik-db'
const DB_VERSION = 1

export interface DBSchema {
  quizPackages: {
    key: string
    value: {
      schemaVersion: 1
      id: string
      name: string
      fingerprint: string
      importedAt: number
      updatedAt: number
      questionCount: number
      questions: unknown
      assets: unknown
    }
  }
  assets: {
    key: number
    value: {
      id?: number
      quizId: string
      relativePath: string
      blob: Blob
      mimeType: string
      size: number
    }
    indexes: { quizId: string }
  }
  sessions: {
    key: string
    value: {
      schemaVersion: 1
      id: string
      quizId: string
      startedAt: number
      updatedAt: number
      completedAt: number | null
      numberOfLearnedQuestions: number
      numberOfCorrectAnswers: number
      numberOfBadAnswers: number
      time: number
      reoccurrences: unknown
    }
    indexes: { quizId: string }
  }
  settings: {
    key: string
    value: {
      key: string
      value: unknown
    }
  }
  recents: {
    key: string
    value: {
      schemaVersion: 1
      quizId: string
      lastOpenedAt: number
    }
  }
}

type StoreName = keyof DBSchema

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: 'blocked' | 'quota' | 'upgrade' | 'unknown',
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

let dbPromise: Promise<IDBDatabase> | null = null

function upgrade(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains('quizPackages')) {
    db.createObjectStore('quizPackages', { keyPath: 'id' })
  }
  if (!db.objectStoreNames.contains('assets')) {
    const assetStore = db.createObjectStore('assets', {
      keyPath: 'id',
      autoIncrement: true,
    })
    assetStore.createIndex('quizId', 'quizId', { unique: false })
  }
  if (!db.objectStoreNames.contains('sessions')) {
    const sessionStore = db.createObjectStore('sessions', {
      keyPath: 'id',
    })
    sessionStore.createIndex('quizId', 'quizId', { unique: false })
  }
  if (!db.objectStoreNames.contains('settings')) {
    db.createObjectStore('settings', { keyPath: 'key' })
  }
  if (!db.objectStoreNames.contains('recents')) {
    db.createObjectStore('recents', { keyPath: 'quizId' })
  }
}

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      upgrade(db)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(new StorageError('Failed to open database', 'unknown'))
    }

    request.onblocked = () => {
      reject(
        new StorageError(
          'Database is blocked. Close other tabs using this app.',
          'blocked',
        ),
      )
    }
  })

  return dbPromise
}

export function closeDB(): void {
  if (dbPromise) {
    dbPromise.then((db) => db.close()).catch(() => undefined)
    dbPromise = null
  }
}

export async function transaction<T>(
  storeNames: StoreName[],
  mode: IDBTransactionMode,
  fn: (tx: IDBTransaction) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  const db = await openDB()
  const tx = db.transaction(storeNames, mode)

  return new Promise<T>((resolve, reject) => {
    tx.oncomplete = () => {
      // Completion is handled by the fn's request success
    }

    tx.onerror = () => {
      const error = tx.error
      if (error?.name === 'QuotaExceededError') {
        reject(
          new StorageError(
            'Storage full. Delete some quizzes to free space.',
            'quota',
          ),
        )
      } else if (error?.name === 'VersionError') {
        reject(
          new StorageError(
            'Database version mismatch. Refresh the page.',
            'upgrade',
          ),
        )
      } else {
        reject(
          new StorageError(
            error?.message ?? 'Transaction failed',
            'unknown',
          ),
        )
      }
    }

    try {
      const result = fn(tx)
      if (result instanceof IDBRequest) {
        result.onsuccess = () => resolve(result.result)
        result.onerror = () => {
          if (result.error?.name === 'QuotaExceededError') {
            reject(
              new StorageError(
                'Storage full. Delete some quizzes to free space.',
                'quota',
              ),
            )
          } else {
            reject(
              new StorageError(
                result.error?.message ?? 'Request failed',
                'unknown',
              ),
            )
          }
        }
      } else {
        resolve(result)
      }
    } catch (err) {
      reject(
        err instanceof Error
          ? err
          : new StorageError(
              String(err),
              'unknown',
            ),
      )
    }
  })
}

export function objectStore<S extends StoreName>(
  tx: IDBTransaction,
  name: S,
): IDBObjectStore {
  return tx.objectStore(name)
}
