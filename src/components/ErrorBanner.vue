<template>
  <Transition name="error-toast">
    <div v-if="errorStore.visible" class="error-toast" role="alert">
      <div class="toast-card">
        <div class="toast-icon">
          <el-icon :size="18"><WarningFilled /></el-icon>
        </div>
        <span class="toast-message">{{ errorStore.message }}</span>
        <button class="toast-close" @click="errorStore.clearError()" aria-label="关闭">
          <el-icon :size="14"><Close /></el-icon>
        </button>
      </div>
      <div class="toast-progress">
        <div class="progress-bar" />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useErrorStore } from '@/stores/error'
import { WarningFilled, Close } from '@element-plus/icons-vue'

const errorStore = useErrorStore()
</script>

<style lang="scss" scoped>
.error-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: min(480px, calc(100vw - 32px));
}

.toast-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(254, 242, 242, 0.92);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(239, 68, 68, 0.18);
  border-radius: 14px;
  box-shadow:
    0 8px 32px rgba(239, 68, 68, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06);
}

.toast-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

.toast-message {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  color: #991B1B;
  word-break: break-all;
}

.toast-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #991B1B;
  opacity: 0.5;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    background: rgba(220, 38, 38, 0.08);
  }
}

/* 底部倒计时进度条 */
.toast-progress {
  height: 3px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 0 0 14px 14px;
  overflow: hidden;
  margin-top: -1px;
}

.progress-bar {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #EF4444, #F87171);
  border-radius: 0 0 14px 14px;
  animation: progress-shrink 5s linear forwards;
}

@keyframes progress-shrink {
  from { width: 100%; }
  to { width: 0%; }
}

/* 入场 / 出场动画 */
.error-toast-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.error-toast-leave-active {
  transition: all 0.25s ease-in;
}
.error-toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-24px) scale(0.96);
}
.error-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px) scale(0.98);
}
</style>
