<template>
  <Modal
    :open="open"
    title="Ustawienia"
    @close="$emit('close')"
  >
    <div class="settings">
      <section class="settings__section">
        <h3 class="settings__heading">
          Motyw
        </h3>
        <div class="settings__options">
          <label
            v-for="t in themes"
            :key="t.value"
            class="settings__radio"
          >
            <input
              type="radio"
              name="theme"
              :value="t.value"
              :checked="theme === t.value"
              @change="onThemeChange(t.value)"
            >
            <span class="settings__radio-indicator" />
            {{ t.label }}
          </label>
        </div>
      </section>

      <section class="settings__section">
        <h3 class="settings__heading">
          Quiz
        </h3>
        <div class="settings__field">
          <label
            class="settings__label"
            for="reoccurrences-if-bad"
          >
            Dodatkowe powtórki przy błędnej odpowiedzi
          </label>
          <input
            id="reoccurrences-if-bad"
            type="number"
            class="settings__input"
            min="0"
            max="10"
            :value="reoccurrencesIfBad"
            @change="onNumberChange('reoccurrencesIfBad', $event)"
          >
        </div>
        <div class="settings__field">
          <label
            class="settings__label"
            for="reoccurrences-on-start"
          >
            Początkowa liczba powtórek
          </label>
          <input
            id="reoccurrences-on-start"
            type="number"
            class="settings__input"
            min="1"
            max="10"
            :value="reoccurrencesOnStart"
            @change="onNumberChange('reoccurrencesOnStart', $event)"
          >
        </div>
        <div class="settings__field">
          <label
            class="settings__label"
            for="max-reoccurrences"
          >
            Maksymalna liczba powtórek
          </label>
          <input
            id="max-reoccurrences"
            type="number"
            class="settings__input"
            min="1"
            max="10"
            :value="maxReoccurrences"
            @change="onNumberChange('maxReoccurrences', $event)"
          >
        </div>
      </section>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Modal from '@/ui/components/shared/Modal.vue'
import { useSettingsStore } from '@/ui/stores/settings'

defineProps<{
  open: boolean
}>()

defineEmits<{
  close: []
}>()

const store = useSettingsStore()
const { theme, reoccurrencesIfBad, reoccurrencesOnStart, maxReoccurrences } =
  storeToRefs(store)

const themes = [
  { label: 'Ciemny', value: 'dark' as const },
  { label: 'Jasny', value: 'light' as const },
  { label: 'Klasyczny', value: 'legacy' as const },
]

function onThemeChange(theme: 'dark' | 'light' | 'legacy') {
  store.updateSettings({ theme })
}

function onNumberChange(
  key: 'reoccurrencesIfBad' | 'reoccurrencesOnStart' | 'maxReoccurrences',
  event: Event,
) {
  const input = event.target as HTMLInputElement
  let value = Number.parseInt(input.value, 10)
  if (Number.isNaN(value)) return
  const limits: Record<typeof key, [number, number]> = {
    reoccurrencesIfBad: [0, 10],
    reoccurrencesOnStart: [1, 10],
    maxReoccurrences: [1, 10],
  }
  const [min, max] = limits[key]
  value = Math.max(min, Math.min(max, value))
  input.value = String(value)
  store.updateSettings({ [key]: value })
}
</script>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.settings__heading {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.settings__options {
  display: flex;
  gap: 16px;
}

.settings__radio {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  cursor: pointer;
}

.settings__radio input {
  position: absolute;
  opacity: 0;
}

.settings__radio-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--secondary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease;
}

.settings__radio input:checked + .settings__radio-indicator {
  border-color: var(--primary-color);
}

.settings__radio input:checked + .settings__radio-indicator::after {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
}

.settings__field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.settings__label {
  font-size: 0.85rem;
  flex: 1;
}

.settings__input {
  width: 64px;
  padding: 4px 8px;
  border: 1px solid var(--background-3);
  border-radius: 4px;
  background: var(--background);
  color: var(--primary-text);
  font-size: 0.9rem;
  text-align: center;
  outline: none;
}

.settings__input:focus {
  border-color: var(--primary-color);
}
</style>
