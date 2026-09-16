<template>
  <Transition name="loading-fade">
    <div v-if="loadingStore.visible" class="global-loading" role="status" aria-label="加载中">
      <div class="loading-spinner">
        <span class="ring ring-outer" />
        <span class="ring ring-inner" />
        <span class="ring-dot" />
      </div>
      <div class="loading-text">
        <span class="brand">aicyi-platform</span>
        <span class="hint">加载中…</span>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useLoadingStore } from '@/stores/loading'

const loadingStore = useLoadingStore()
</script>

<style lang="scss" scoped>
.global-loading {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background: rgba(240, 242, 245, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* ===== 双环旋转动画 ===== */
.loading-spinner {
  position: relative;
  width: 64px;
  height: 64px;
}

.ring {
  position: absolute;
  border-radius: 50%;
  border-style: solid;
  border-color: transparent;
}

.ring-outer {
  inset: 0;
  border-width: 3px;
  border-top-color: #3b82f6;
  border-right-color: rgba(59, 130, 246, 0.25);
  animation: spin 1s linear infinite;
}

.ring-inner {
  inset: 10px;
  border-width: 3px;
  border-bottom-color: #8b5cf6;
  border-left-color: rgba(139, 92, 246, 0.25);
  animation: spin-reverse 1.4s ease-in-out infinite;
}

.ring-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes spin-reverse {
  to { transform: rotate(-360deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.6; }
}

/* ===== 文字 ===== */
.loading-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.brand {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: 0.3px;
}

.hint {
  font-size: 12px;
  color: #9ca3af;
  letter-spacing: 1px;
}

/* ===== 淡入淡出 ===== */
.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.25s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}
</style>
