<template>
  <el-popover
    v-model:visible="panelVisible"
    placement="bottom-end"
    :width="380"
    trigger="click"
    :teleported="false"
    :show-arrow="false"
    popper-class="nb-popper"
    @show="onPanelShow"
  >
    <template #reference>
      <span class="nb-trigger" aria-label="消息通知">
        <el-badge
          :value="notificationStore.unreadCount"
          :hidden="notificationStore.unreadCount === 0"
          :max="99"
        >
          <el-icon :size="20" class="nb-bell"><Bell /></el-icon>
        </el-badge>
      </span>
    </template>

    <div class="nb-panel">
      <!-- 面板头 -->
      <div class="nb-panel-header">
        <span class="nb-panel-title">消息通知</span>
        <el-tag v-if="notificationStore.unreadCount > 0" type="danger" size="small" effect="light" round>
          {{ notificationStore.unreadCount }} 条未读
        </el-tag>
        <el-button
          link
          type="primary"
          size="small"
          class="nb-read-all"
          :disabled="notificationStore.unreadCount === 0"
          @click="handleMarkAllRead"
        >
          全部已读
        </el-button>
      </div>

      <!-- 消息列表 -->
      <div v-loading="notificationStore.loading" class="nb-panel-body">
        <ul v-if="notificationStore.messages.length > 0" class="nb-list">
          <li
            v-for="(msg, i) in notificationStore.messages"
            :key="msg.id"
            class="nb-item"
            :class="{ 'is-unread': msg.readFlag === 0 }"
            :style="{ animationDelay: `${Math.min(i, 8) * 45}ms` }"
            @click="handlePanelRead(msg)"
          >
            <span class="nb-dot" />
            <div class="nb-item-main">
              <div class="nb-item-top">
                <span class="nb-item-title" :title="msg.title">{{ msg.title }}</span>
                <el-tag :type="typeMeta(msg.notifyType).tag" size="small" effect="plain">
                  {{ typeMeta(msg.notifyType).label }}
                </el-tag>
              </div>
              <p class="nb-item-content">{{ msg.content || '（无正文）' }}</p>
              <div class="nb-item-meta">
                <span>{{ formatRelativeTime(msg.createTime) }}</span>
                <span>{{ msg.senderName }}</span>
              </div>
            </div>
          </li>
        </ul>
        <el-empty v-else-if="!notificationStore.loading" description="暂无消息" :image-size="60" />
      </div>

      <!-- 面板脚 -->
      <div class="nb-panel-footer" @click="openDrawer">
        <span>仅显示最近 10 条，点击查看全部</span>
        <el-icon :size="12"><ArrowRight /></el-icon>
      </div>
    </div>
  </el-popover>

  <!-- 全部消息抽屉 -->
  <el-drawer v-model="drawerVisible" size="460px" :append-to-body="false" class="nb-drawer">
    <template #header>
      <div class="nb-drawer-header">
        <span class="nb-drawer-title">全部消息</span>
        <el-button
          link
          type="primary"
          size="small"
          :disabled="notificationStore.unreadCount === 0"
          @click="handleMarkAllRead"
        >
          全部已读
        </el-button>
      </div>
    </template>

    <div class="nb-drawer-filter">
      <el-radio-group v-model="drawerFilter" size="small" @change="handleFilterChange">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="unread">未读</el-radio-button>
        <el-radio-button value="read">已读</el-radio-button>
      </el-radio-group>
    </div>

    <div v-loading="drawerLoading" class="nb-drawer-body">
      <ul v-if="drawerMessages.length > 0" class="nb-list">
        <li
          v-for="msg in drawerMessages"
          :key="msg.id"
          class="nb-item"
          :class="{ 'is-unread': msg.readFlag === 0 }"
          @click="handleDrawerRead(msg)"
        >
          <span class="nb-dot" />
          <div class="nb-item-main">
            <div class="nb-item-top">
              <span class="nb-item-title" :title="msg.title">{{ msg.title }}</span>
              <el-tag :type="typeMeta(msg.notifyType).tag" size="small" effect="plain">
                {{ typeMeta(msg.notifyType).label }}
              </el-tag>
            </div>
            <p class="nb-item-content">{{ msg.content || '（无正文）' }}</p>
            <div class="nb-item-meta">
              <span>{{ msg.createTime }}</span>
              <span>{{ msg.senderName }}</span>
            </div>
          </div>
        </li>
      </ul>
      <el-empty v-else-if="!drawerLoading" description="暂无消息" :image-size="80" />
    </div>

    <template #footer>
      <el-pagination
        v-model:current-page="drawerQuery.page"
        :page-size="drawerQuery.size"
        :total="drawerTotal"
        layout="prev, pager, next"
        :pager-count="5"
        small
        @current-change="loadDrawer"
      />
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useNotificationStore } from '@/stores/notification'
import { listMessages, markMessageRead, type MessageItem } from '@/api/message'
import { formatRelativeTime } from '@/utils/datetime'

const notificationStore = useNotificationStore()

const panelVisible = ref(false)
const drawerVisible = ref(false)

// ==================== 铃铛下拉面板 ====================

function onPanelShow() {
  notificationStore.refresh()
}

async function handlePanelRead(msg: MessageItem) {
  if (msg.readFlag !== 0) return
  await notificationStore.markRead(msg.id)
}

async function handleMarkAllRead() {
  await notificationStore.markAllRead()
  ElMessage.success('已全部标记为已读')
  if (drawerVisible.value) await loadDrawer()
}

// ==================== 全部消息抽屉 ====================

const drawerLoading = ref(false)
const drawerMessages = ref<MessageItem[]>([])
const drawerTotal = ref(0)
const drawerFilter = ref<'all' | 'unread' | 'read'>('all')
const drawerQuery = reactive({ page: 1, size: 20 })

async function loadDrawer() {
  drawerLoading.value = true
  try {
    const readFlag = drawerFilter.value === 'all' ? undefined : drawerFilter.value === 'unread' ? 0 : 1
    const res = await listMessages({ ...drawerQuery, readFlag })
    drawerMessages.value = res.list || []
    drawerTotal.value = res.total || 0
  } finally {
    drawerLoading.value = false
  }
}

function openDrawer() {
  panelVisible.value = false
  drawerVisible.value = true
  drawerQuery.page = 1
  loadDrawer()
}

function handleFilterChange() {
  drawerQuery.page = 1
  loadDrawer()
}

async function handleDrawerRead(msg: MessageItem) {
  if (msg.readFlag !== 0) return
  await markMessageRead(msg.id)
  msg.readFlag = 1
  await notificationStore.fetchUnreadCount()
}

// ==================== 展示辅助 ====================

function typeMeta(type: number): { label: string; tag: 'primary' | 'warning' | 'success' | 'info' } {
  switch (type) {
    case 2:
      return { label: '业务提醒', tag: 'warning' }
    case 3:
      return { label: '平台公告', tag: 'success' }
    default:
      return { label: '系统通知', tag: 'primary' }
  }
}
</script>

<style lang="scss" scoped>
// ===== 铃铛触发器 =====
.nb-trigger {
  display: inline-flex;
  cursor: pointer;
  outline: none;

  .nb-bell {
    color: $ink-soft;
    transition: color 0.2s ease, transform 0.2s ease;
  }
  &:hover .nb-bell {
    color: $primary;
    transform: translateY(-1px);
  }
}

// ===== 下拉面板 =====
.nb-panel {
  display: flex;
  flex-direction: column;
  margin: -12px -12px;

  .nb-panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 16px 10px;
    border-bottom: 1px solid $ink-line;

    .nb-panel-title {
      font-size: 14px;
      font-weight: 600;
      color: $ink;
    }
    .nb-read-all {
      margin-left: auto;
    }
  }

  .nb-panel-body {
    min-height: 120px;
    max-height: 400px;
    overflow-y: auto;
  }

  .nb-panel-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px;
    border-top: 1px solid $ink-line;
    font-size: 12px;
    color: $primary;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s ease;

    &:hover {
      background: rgba($primary, 0.04);
    }
  }
}

// ===== 消息条目（面板 / 抽屉共用） =====
.nb-list {
  list-style: none;
  margin: 0;
  padding: 6px 0;
}

.nb-item {
  display: flex;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
  animation: nb-slide-in 0.28s ease both;

  &:hover {
    background: rgba($primary, 0.05);
  }

  .nb-dot {
    flex-shrink: 0;
    width: 7px;
    height: 7px;
    margin-top: 7px;
    border-radius: 50%;
    background: $ink-line;
    transition: background 0.2s ease, box-shadow 0.2s ease;
  }
  &.is-unread .nb-dot {
    background: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.15);
  }

  .nb-item-main {
    flex: 1;
    min-width: 0;
  }

  .nb-item-top {
    display: flex;
    align-items: center;
    gap: 8px;

    .nb-item-title {
      flex: 1;
      min-width: 0;
      font-size: 13px;
      color: $ink-soft;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  &.is-unread .nb-item-title {
    color: $ink;
    font-weight: 600;
  }

  .nb-item-content {
    margin: 4px 0 6px;
    font-size: 12px;
    line-height: 1.55;
    color: $ink-soft;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .nb-item-meta {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: fade-out($ink-soft, 0.35);
  }
}

@keyframes nb-slide-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

// ===== 抽屉 =====
.nb-drawer-header {
  display: flex;
  align-items: center;
  gap: 12px;

  .nb-drawer-title {
    font-size: 16px;
    font-weight: 600;
    color: $ink;
  }
}

.nb-drawer-filter {
  padding-bottom: 12px;
  border-bottom: 1px solid $ink-line;
}

.nb-drawer-body {
  min-height: 200px;
  margin: 0 -16px;
}
</style>
