<template>
  <Modal
    :open="open"
    title="Usuń quiz?"
    @close="$emit('close')"
  >
    <p class="delete-modal__text">
      Czy na pewno chcesz usunąć quiz <strong>{{ quizName }}</strong>?
      Spowoduje to usunięcie wszystkich danych, postępów i zasobów.
    </p>
    <template #footer>
      <button
        class="delete-modal__btn delete-modal__btn--cancel"
        @click="$emit('close')"
      >
        Anuluj
      </button>
      <button
        class="delete-modal__btn delete-modal__btn--confirm"
        @click="$emit('confirm')"
      >
        Usuń
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import Modal from '@/ui/components/shared/Modal.vue'

defineProps<{
  open: boolean
  quizName: string
}>()

defineEmits<{
  close: []
  confirm: []
}>()
</script>

<style scoped>
.delete-modal__text {
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
}

.delete-modal__btn {
  padding: 8px 20px;
  border: 1px solid var(--background-3);
  border-radius: 6px;
  background: transparent;
  color: var(--primary-text);
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.delete-modal__btn:hover {
  background: var(--background-2);
}

.delete-modal__btn--confirm {
  background: var(--red-color);
  color: #fff;
  border-color: var(--red-color);
}

.delete-modal__btn--confirm:hover {
  opacity: 0.85;
}
</style>
