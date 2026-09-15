import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useErrorStore = defineStore('error', () => {
  const message = ref('')
  const visible = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  function showError(msg: string, duration = 5000) {
    message.value = msg || '接口请求失败'
    visible.value = true
    if (timer) clearTimeout(timer)
    if (duration > 0) {
      timer = setTimeout(() => {
        visible.value = false
      }, duration)
    }
  }

  function clearError() {
    visible.value = false
    message.value = ''
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return { message, visible, showError, clearError }
})
