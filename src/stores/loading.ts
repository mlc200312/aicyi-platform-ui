import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 全局 Loading 状态（请求拦截器统一驱动）。
 * 用计数器处理并发：多个请求同时进行时，最后一个响应后才关闭 loading。
 */
export const useLoadingStore = defineStore('loading', () => {
  const count = ref(0)
  const visible = ref(false)

  function start() {
    count.value++
    visible.value = true
  }

  function done() {
    if (count.value > 0) count.value--
    if (count.value === 0) visible.value = false
  }

  return { count, visible, start, done }
})
