import { defineStore } from 'pinia'
import {
  getSettings,
  saveSettings,
} from '@/platform/persistence/settingsRepository'
import type { AppSettings } from '@/domain/quizTypes'

export const useSettingsStore = defineStore('settings', {
  state: (): AppSettings => ({
    schemaVersion: 1,
    theme: 'dark',
    reoccurrencesIfBad: 0,
    reoccurrencesOnStart: 2,
    maxReoccurrences: 10,
  }),

  actions: {
    async load() {
      const saved = await getSettings()
      this.$patch(saved)
      this.applyTheme()
    },

    async updateSettings(partial: Partial<AppSettings>) {
      this.$patch(partial)
      await saveSettings(partial)
      if (partial.theme) {
        this.applyTheme()
      }
    },

    applyTheme() {
      document.documentElement.setAttribute('data-theme', this.theme)
    },
  },
})
