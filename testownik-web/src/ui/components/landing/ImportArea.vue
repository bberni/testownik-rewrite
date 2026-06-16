<template>
  <div
    class="import-area"
    :class="{ 'import-area--drag-over': isDragOver }"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
    @click="openFileInput"
  >
    <div class="import-area__icon">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M12 16V4m0 0L8 8m4-4l4 4" />
        <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      </svg>
    </div>
    <p class="import-area__text">
      Wybierz folder lub upuść go tutaj
    </p>
    <button
      class="import-area__button"
      @click.stop="openFileInput"
    >
      Wybierz folder
    </button>
    <input
      ref="fileInputRef"
      type="file"
      hidden
      webkitdirectory=""
      multiple
      @change="onFileInput"
    >
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { isFileSystemAccessSupported } from '@/platform/files/fileSystemAccess'
import { buildTreeFromFileList } from '@/platform/files/fileInputFallback'
import { handleDrop } from '@/platform/files/dragDrop'
import type { VirtualDirectory } from '@/platform/files/importedFileTree'

const emit = defineEmits<{
  import: []
  imported: [dir: VirtualDirectory]
  error: [message: string]
}>()

const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function onDragOver() {
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

async function onDrop(event: DragEvent) {
  isDragOver.value = false
  try {
    const dir = await handleDrop(event)
    if (dir) {
      emit('imported', dir)
    }
  } catch (e) {
    emit(
      'error',
      e instanceof Error ? e.message : 'Nie udało się zaimportować folderu.',
    )
  }
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  try {
    const dir = buildTreeFromFileList(input.files)
    if (dir) {
      emit('imported', dir)
    }
  } catch (e) {
    emit(
      'error',
      e instanceof Error ? e.message : 'Nie udało się zaimportować folderu.',
    )
  } finally {
    input.value = ''
  }
}

async function openFileInput() {
  if (isFileSystemAccessSupported()) {
    // Use the FSAA import in the parent component
    emit('import')
  } else {
    fileInputRef.value?.click()
  }
}

defineExpose({ openFileInput })
</script>

<style scoped>
.import-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 24px;
  border: 2px dashed var(--drag-border-color);
  border-radius: 12px;
  background: var(--drag-background);
  color: var(--distant-text);
  transition: border-color 0.2s ease, background-color 0.2s ease;
  cursor: pointer;
  min-height: 200px;
}

.import-area--drag-over {
  border-color: var(--primary-color);
  background: var(--drag-over-background);
  color: var(--primary-text);
}

.import-area__icon {
  color: var(--secondary-text);
  opacity: 0.7;
}

.import-area__text {
  font-size: 0.95rem;
  margin: 0;
}

.import-area__button {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: var(--primary-color);
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.import-area__button:hover {
  background: var(--primary-color-lighter);
}

@media (max-width: 480px) {
  .import-area {
    padding: 24px 16px;
    min-height: 160px;
    gap: 8px;
  }

  .import-area__icon svg {
    width: 36px;
    height: 36px;
  }

  .import-area__text {
    font-size: 0.85rem;
  }

  .import-area__button {
    padding: 8px 20px;
    font-size: 0.85rem;
  }
}
</style>
