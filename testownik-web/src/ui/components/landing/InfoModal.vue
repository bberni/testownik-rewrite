<template>
  <Modal
    :open="open"
    title="Informacje"
    @close="$emit('close')"
  >
    <div class="info">
      <h2 class="info__title">
        Testownik
      </h2>
      <p class="info__detail">
        v{{ version }}
      </p>
      <p class="info__detail">
        Autor:
        <a
          href="https://github.com/bberni"
          target="_blank"
          rel="noopener noreferrer"
          class="info__link"
        >
          bberni
        </a>
      </p>
      <p class="info__detail">
        Dane quizów przechowywane są lokalnie w przeglądarce.
      </p>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import Modal from '@/ui/components/shared/Modal.vue'

defineProps<{
  open: boolean
}>()

defineEmits<{
  close: []
}>()

const version = __APP_VERSION__
</script>

<style scoped>
.info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.info__title {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
}

.info__detail {
  font-size: 0.85rem;
  color: var(--secondary-text);
  margin: 0;
}

.info__link {
  color: var(--primary-color);
  text-decoration: none;
}

.info__link:hover {
  text-decoration: underline;
}
</style>
