<template>
  <Transition name="banner">
    <div v-if="errorStore.visible" class="error-banner">
      <div class="banner-inner">
        <el-icon class="banner-icon"><CircleCloseFilled /></el-icon>
        <span class="banner-text">{{ errorStore.message }}</span>
        <el-icon class="banner-close" @click="errorStore.clearError()"><Close /></el-icon>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useErrorStore } from '@/stores/error'
import { CircleCloseFilled, Close } from '@element-plus/icons-vue'

const errorStore = useErrorStore()
</script>

<style lang="scss" scoped>
.error-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(90deg, #DC2626, #EF4444);
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.35);

  .banner-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #fff;
    font-size: 14px;
  }

  .banner-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .banner-text {
    flex: 1;
    line-height: 1.5;
  }

  .banner-close {
    cursor: pointer;
    font-size: 16px;
    opacity: 0.8;
    &:hover { opacity: 1; }
  }
}

.banner-enter-active,
.banner-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.banner-enter-from,
.banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
