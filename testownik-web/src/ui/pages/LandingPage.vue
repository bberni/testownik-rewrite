<template>
  <div class="landing">
    <header class="landing__header">
      <h1 class="landing__title">
        Testownik
      </h1>
      <div class="landing__header-actions">
        <button
          class="landing__icon-btn"
          title="Ustawienia"
          @click="showSettings = true"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
        <button
          class="landing__icon-btn"
          title="Informacje"
          @click="showInfo = true"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
            />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </button>
      </div>
    </header>

    <div
      v-if="error"
      class="landing__error"
      role="alert"
    >
      {{ error }}
      <button
        class="landing__error-close"
        @click="error = null"
      >
        &times;
      </button>
    </div>

    <template v-if="!library.hasQuizzes && !importing">
      <ImportArea
        @import="startFileSystemImport"
        @imported="handleImport"
        @error="handleImportError"
      />
      <p class="landing__empty">
        Zaimportuj quiz, aby rozpocząć naukę.
      </p>
    </template>

    <template v-else>
      <div class="landing__import-section">
        <ImportArea
          @import="startFileSystemImport"
          @imported="handleImport"
          @error="handleImportError"
        />
        <label class="landing__save-import">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line
              x1="16"
              y1="13"
              x2="8"
              y2="13"
            />
            <line
              x1="16"
              y1="17"
              x2="8"
              y2="17"
            />
            <polyline points="10,9 9,9 8,9" />
          </svg>
          Zaimportuj save.json
          <input
            type="file"
            accept=".json"
            class="landing__save-import-input"
            @change="onSaveFileSelected"
          >
        </label>
      </div>

      <div class="landing__library">
        <h2 class="landing__library-title">
          Twoje quizy
        </h2>
        <div
          v-if="library.loading"
          class="landing__loader"
        >
          Wczytywanie...
        </div>
        <div
          v-else-if="sortedItems.length === 0"
          class="landing__empty"
        >
          Brak quizów.
        </div>
        <div
          v-else
          class="landing__list"
        >
          <QuizCard
            v-for="item in sortedItems"
            :key="item.quiz.id"
            :item="item"
            @continue="continueItem($event)"
            @start-new="startNewItem($event)"
            @delete="promptDelete($event)"
          />
        </div>
      </div>
    </template>

    <p
      v-if="importing"
      class="landing__importing"
    >
      Importowanie...
    </p>

    <SettingsModal
      :open="showSettings"
      @close="showSettings = false"
    />

    <InfoModal
      :open="showInfo"
      @close="showInfo = false"
    />

    <DeleteQuizModal
      :open="deleteTarget !== null"
      :quiz-name="deleteTargetName"
      @close="deleteTarget = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useQuizLibraryStore } from '@/ui/stores/quizLibrary'
import { useSettingsStore } from '@/ui/stores/settings'
import { importViaFileSystemAccess } from '@/platform/files/fileSystemAccess'
import { runImportPipeline } from '@/platform/files/importPipeline'
import ImportArea from '@/ui/components/landing/ImportArea.vue'
import QuizCard from '@/ui/components/landing/QuizCard.vue'
import SettingsModal from '@/ui/components/landing/SettingsModal.vue'
import InfoModal from '@/ui/components/landing/InfoModal.vue'
import DeleteQuizModal from '@/ui/components/landing/DeleteQuizModal.vue'

const router = useRouter()
const library = useQuizLibraryStore()
const settingsStore = useSettingsStore()
const { sortedItems } = storeToRefs(library)

const showSettings = ref(false)
const showInfo = ref(false)
const importing = ref(false)
const error = ref<string | null>(null)
const deleteTarget = ref<string | null>(null)

const deleteTargetName = computed(() => {
  if (!deleteTarget.value) return ''
  const item = library.items.find((i) => i.quiz.id === deleteTarget.value)
  return item?.quiz.name ?? ''
})

onMounted(async () => {
  await settingsStore.load()
  await library.loadAll()
})

async function startFileSystemImport() {
  importing.value = true
  error.value = null
  try {
    const dir = await importViaFileSystemAccess()
    if (dir) {
      await handleImport(dir)
    }
  } catch (e) {
    handleImportError(e)
  } finally {
    importing.value = false
  }
}

async function handleImport(dir: Parameters<typeof runImportPipeline>[0]) {
  importing.value = true
  error.value = null
  try {
    const result = await runImportPipeline(dir)
    await library.importResult(result)
  } catch (e) {
    handleImportError(e)
  } finally {
    importing.value = false
  }
}

function handleImportError(e: unknown) {
  error.value = e instanceof Error ? e.message : 'Import nie powiódł się.'
}

async function onSaveFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const result = await library.matchAndImportSaveJson(file)
    error.value = null
    // Navigate to continue the restored quiz
    await router.push({
      name: 'quiz',
      params: { quizId: result.quizId },
      query: { mode: 'continue' },
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Import save.json nie powiódł się.'
  } finally {
    input.value = ''
  }
}

async function continueItem(quizId: string) {
  await library.markOpened(quizId)
  router.push({ name: 'quiz', params: { quizId }, query: { mode: 'continue' } })
}

async function startNewItem(quizId: string) {
  await library.markOpened(quizId)
  router.push({ name: 'quiz', params: { quizId }, query: { mode: 'new' } })
}

function promptDelete(quizId: string) {
  deleteTarget.value = quizId
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  const id = deleteTarget.value
  deleteTarget.value = null
  try {
    await library.deleteItem(id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Nie udało się usunąć quizu.'
  }
}
</script>

<style scoped>
.landing {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.landing__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.landing__title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.landing__header-actions {
  display: flex;
  gap: 4px;
}

.landing__icon-btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--secondary-text);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.landing__icon-btn:hover {
  background: var(--background-2);
  color: var(--primary-text);
}

.landing__error {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  background: var(--red-color);
  color: #fff;
  font-size: 0.85rem;
}

.landing__error-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.landing__empty {
  text-align: center;
  color: var(--secondary-text);
  font-size: 0.9rem;
  margin: 0;
}

.landing__import-section {
  margin-bottom: 8px;
}

.landing__importing {
  text-align: center;
  color: var(--secondary-text);
  font-size: 0.85rem;
  margin: 0;
}

.landing__library {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.landing__library-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.landing__loader {
  text-align: center;
  color: var(--secondary-text);
  font-size: 0.85rem;
}

.landing__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 480px) {
  .landing {
    padding: 16px 12px 32px;
    gap: 16px;
  }

  .landing__title {
    font-size: 1.25rem;
  }
}

.landing__save-import {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--secondary-text);
  cursor: pointer;
  transition: color 0.15s ease;
}

.landing__save-import:hover {
  color: var(--primary-text);
}

.landing__save-import-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
