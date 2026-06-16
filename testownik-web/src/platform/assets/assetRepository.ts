import { transaction, objectStore, StorageError } from '../persistence/db'

export interface AssetRecord {
  id?: number
  quizId: string
  relativePath: string
  blob: Blob
  mimeType: string
  size: number
}

export async function saveAsset(asset: AssetRecord): Promise<number> {
  return transaction(['assets'], 'readwrite', (tx) => {
    const store = objectStore(tx, 'assets')
    return store.add(asset) as unknown as IDBRequest<number>
  })
}

export async function saveAssets(assets: AssetRecord[]): Promise<void> {
  await transaction(['assets'], 'readwrite', (tx) => {
    const store = objectStore(tx, 'assets')
    for (const asset of assets) {
      store.add(asset)
    }
    return Promise.resolve()
  })
}

export async function getAsset(
  quizId: string,
  relativePath: string,
): Promise<AssetRecord | undefined> {
  return transaction(['assets'], 'readonly', (tx) => {
    const store = objectStore(tx, 'assets')
    const index = store.index('quizId')
    return new Promise<AssetRecord | undefined>((resolve) => {
      const request = index.getAll(quizId)
      request.onsuccess = () => {
        const assets = request.result as AssetRecord[]
        for (const a of assets) {
          if (a.relativePath === relativePath) {
            resolve(a)
            return
          }
        }
        resolve(undefined)
      }
      request.onerror = () => resolve(undefined)
    })
  })
}

export async function getAssetsByQuiz(
  quizId: string,
): Promise<AssetRecord[]> {
  return transaction(['assets'], 'readonly', (tx) => {
    const store = objectStore(tx, 'assets')
    const index = store.index('quizId')
    return index.getAll(quizId)
  }) as Promise<AssetRecord[]>
}

export async function deleteAssetsByQuiz(quizId: string): Promise<void> {
  await transaction(['assets'], 'readwrite', (tx) => {
    const store = objectStore(tx, 'assets')
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
