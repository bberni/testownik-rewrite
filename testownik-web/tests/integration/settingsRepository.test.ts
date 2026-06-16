import { describe, it, expect, beforeEach } from 'vitest'
import {
  getSettings,
  saveSettings,
} from '@/platform/persistence/settingsRepository'
import { closeDB } from '@/platform/persistence/db'

beforeEach(async () => {
  closeDB()
  await new Promise((resolve) => {
    const req = indexedDB.deleteDatabase('testownik-db')
    req.onsuccess = () => resolve(undefined)
  })
})

describe('settingsRepository', () => {
  it('returns defaults when no settings are stored', async () => {
    const settings = await getSettings()
    expect(settings.theme).toBe('dark')
    expect(settings.reoccurrencesOnStart).toBe(2)
    expect(settings.maxReoccurrences).toBe(10)
  })

  it('saves and retrieves settings', async () => {
    await saveSettings({ theme: 'light', reoccurrencesOnStart: 3 })
    const settings = await getSettings()
    expect(settings.theme).toBe('light')
    expect(settings.reoccurrencesOnStart).toBe(3)
  })

  it('merges partial updates with existing settings', async () => {
    await saveSettings({ theme: 'light' })
    await saveSettings({ reoccurrencesOnStart: 5 })
    const settings = await getSettings()
    expect(settings.theme).toBe('light')
    expect(settings.reoccurrencesOnStart).toBe(5)
    expect(settings.maxReoccurrences).toBe(10)
  })

  it('persists after multiple saves', async () => {
    await saveSettings({ theme: 'legacy' })
    await saveSettings({ maxReoccurrences: 20 })
    await saveSettings({ reoccurrencesIfBad: 2 })
    const settings = await getSettings()
    expect(settings.theme).toBe('legacy')
    expect(settings.maxReoccurrences).toBe(20)
    expect(settings.reoccurrencesIfBad).toBe(2)
    expect(settings.reoccurrencesOnStart).toBe(2)
  })
})
