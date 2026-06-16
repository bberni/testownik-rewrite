<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-mask"
      @click.self="$emit('close')"
    >
      <div class="modal-wrapper">
        <div
          class="modal"
          @keydown.escape="$emit('close')"
        >
          <div class="modal__header">
            <slot name="header">
              <h2 class="modal__title">
                {{ title }}
              </h2>
            </slot>
          </div>
          <div class="modal__body">
            <slot />
          </div>
          <div
            v-if="$slots['footer']"
            class="modal__footer"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  title?: string
}>()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--modal-mask);
}

.modal-wrapper {
  max-height: 90vh;
  max-width: 90vw;
  overflow-y: auto;
}

.modal {
  background: var(--background);
  border-radius: 8px;
  padding: 24px 32px;
  min-width: 320px;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  color: var(--primary-text);
}

.modal__header {
  margin-bottom: 16px;
}

.modal__title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.modal__body {
  margin-bottom: 16px;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--background-2);
}
</style>
