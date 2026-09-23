import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getUnreadCount,
  listMessages,
  markAllMessagesRead,
  markMessageRead,
  type MessageItem,
} from '@/api/message'

/** 铃铛下拉面板展示的最近消息条数 */
const RECENT_SIZE = 10
/** 未读数量轮询间隔（30s） */
const POLL_INTERVAL = 30_000

/**
 * 站内消息通知 Store：未读徽标 + 最近消息 + 已读操作 + 轮询。
 *
 * - startPolling / stopPolling 在布局挂载 / 卸载时调用；
 * - markRead / markAllRead 本地先行更新，保证 UI 即时反馈；
 * - 未读数轮询失败静默（不打断用户操作），面板数据失败由调用方提示。
 */
export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)
  const messages = ref<MessageItem[]>([])
  const loaded = ref(false)
  const loading = ref(false)
  let timer: number | null = null

  /** 拉取未读数量（轮询/刷新共用） */
  async function fetchUnreadCount() {
    try {
      unreadCount.value = await getUnreadCount()
    } catch {
      // 静默：徽标轮询失败不打断用户
    }
  }

  /** 拉取最近消息（铃铛下拉面板） */
  async function fetchRecent() {
    loading.value = true
    try {
      const res = await listMessages({ page: 1, size: RECENT_SIZE })
      messages.value = res.list || []
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  /** 面板打开时整体刷新（未读数 + 最近消息） */
  async function refresh() {
    await Promise.all([fetchUnreadCount(), fetchRecent()])
  }

  /** 标记单条已读：成功后本地即时更新列表与徽标 */
  async function markRead(id: string) {
    await markMessageRead(id)
    const item = messages.value.find((m) => m.id === id)
    if (item && item.readFlag === 0) {
      item.readFlag = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  /** 全部已读：成功后本地即时清零徽标 */
  async function markAllRead() {
    await markAllMessagesRead()
    messages.value.forEach((m) => {
      m.readFlag = 1
    })
    unreadCount.value = 0
  }

  /** 启动未读数轮询（幂等） */
  function startPolling() {
    if (timer !== null) return
    fetchUnreadCount()
    timer = window.setInterval(fetchUnreadCount, POLL_INTERVAL)
  }

  /** 停止轮询 */
  function stopPolling() {
    if (timer !== null) {
      window.clearInterval(timer)
      timer = null
    }
  }

  /** 退出登录等场景清空状态并停轮询 */
  function reset() {
    stopPolling()
    unreadCount.value = 0
    messages.value = []
    loaded.value = false
  }

  return {
    unreadCount,
    messages,
    loaded,
    loading,
    fetchUnreadCount,
    fetchRecent,
    refresh,
    markRead,
    markAllRead,
    startPolling,
    stopPolling,
    reset,
  }
})
