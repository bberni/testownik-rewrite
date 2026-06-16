import { transaction, objectStore, StorageError } from './db'
import type { AppSettings } from '@/domain/quizTypes'

const SETTINGS_KEY = 'appSettings'

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: 1,
  theme: 'dark',
  reoccurrencesIfBad: 0,
  reoccurrencesOnStart: 2,
  maxReoccurrences: 10,
}

export async function getSettings(): Promise<AppSettings> {
  const stored = (await transaction(['settings'], 'readonly', (tx) => {
    const store = objectStore(tx, 'settings')
    return store.get(SETTINGS_KEY)
  })) as { key: string; value: Partial<AppSettings> } | undefined

  if (stored) {
    return {
      ...DEFAULT_SETTINGS,
      ...stored.value,
    }
  }

  return { ...DEFAULT_SETTINGS }
}

export async function saveSettings(
  settings: Partial<AppSettings>,
): Promise<void> {
  const current = await getSettings()
  const merged: AppSettings = { ...current, ...settings }

  await transaction(['settings'], 'readwrite', (tx) => {
    const store = objectStore(tx, 'settings')
    return store.put({ key: SETTINGS_KEY, value: merged })
  })
}

export { StorageError }
