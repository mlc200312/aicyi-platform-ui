<template>
  <div class="layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon"><el-icon :size="20"><Platform /></el-icon></div>
        <span class="logo-text">aicyi-platform</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="sidebar-menu"
        :collapse="false"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>首页仪表盘</span>
        </el-menu-item>
        <template v-for="menu in menuStore.menuTree" :key="menu.id">
          <!-- 目录 -->
          <el-sub-menu v-if="menu.menuType === 1" :index="`dir-${menu.id}`">
            <template #title>
              <el-icon v-if="menuStore.resolveIcon(menu.icon)"><component :is="menuStore.resolveIcon(menu.icon)" /></el-icon>
              <span>{{ menu.menuName }}</span>
            </template>
            <el-menu-item v-for="child in menu.children" :key="child.id" :index="child.path">
              {{ child.menuName }}
            </el-menu-item>
          </el-sub-menu>
          <!-- 菜单 -->
          <el-menu-item v-else-if="menu.menuType === 2" :index="menu.path">
            <el-icon v-if="menuStore.resolveIcon(menu.icon)"><component :is="menuStore.resolveIcon(menu.icon)" /></el-icon>
            <span>{{ menu.menuName }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </aside>

    <!-- 主区域 -->
    <div class="main">
      <header class="header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <NotificationBell />
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <span class="avatar">{{ userInitial }}</span>
              <span class="username">{{ userStore.userInfo?.username || 'Admin' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useMenuStore } from '@/stores/menu'
import { useNotificationStore } from '@/stores/notification'
import NotificationBell from '@/components/NotificationBell.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const menuStore = useMenuStore()
const notificationStore = useNotificationStore()

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => (route.meta.title as string) || '仪表盘')
const userInitial = computed(() => (userStore.userInfo?.username || 'A').charAt(0).toUpperCase())

onMounted(() => {
  if (!userStore.userInfo) userStore.fetchUserInfo().catch(() => {})
  if (!menuStore.loaded) menuStore.loadMenus().catch(() => {})
  notificationStore.startPolling()
})

onBeforeUnmount(() => {
  notificationStore.stopPolling()
})

function handleCommand(cmd: string) {
  if (cmd === 'profile') router.push('/profile')
  if (cmd === 'logout') {
    notificationStore.reset()
    menuStore.reset()
    userStore.logout().then(() => router.push('/login'))
  }
}
</script>

<style lang="scss" scoped>
.layout {
  display: flex;
  height: 100vh;
  background: $bg-page;
}

// ===== 侧边栏 =====
.sidebar {
  width: 220px;
  background: $header-dark;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .logo-icon {
      width: 32px;
      height: 32px;
      background: $primary;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .logo-text {
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
  }

  .sidebar-menu {
    flex: 1;
    border-right: none;
    background: transparent;
    padding-top: 8px;

    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      height: 48px;
      line-height: 48px;
      color: rgba(255, 255, 255, 0.75);
      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
      }
    }
    :deep(.el-menu-item.is-active) {
      background: $primary !important;
      color: #fff !important;
    }
    :deep(.el-menu--inline) {
      background: rgba(0, 0, 0, 0.25) !important;
    }
    :deep(.el-sub-menu .el-menu-item) {
      background: transparent !important;
      color: rgba(255, 255, 255, 0.8) !important;
      padding-left: 52px !important;
      &:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #fff !important;
      }
      &.is-active {
        background: $primary !important;
        color: #fff !important;
      }
    }
  }
}

// ===== 主区域 =====
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;

  .header {
    height: 60px;
    background: #fff;
    border-bottom: 1px solid $ink-line;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;

    .breadcrumb {
      :deep(.el-breadcrumb__inner) {
        color: $ink-soft;
        font-size: 14px;
      }
      :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
        color: $ink;
        font-weight: 600;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 24px;

      .notice-icon {
        color: $ink-soft;
        cursor: pointer;
        &:hover { color: $primary; }
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8B5CF6, #6366F1);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
        }
        .username {
          font-size: 14px;
          color: $ink;
          font-weight: 500;
        }
      }
    }
  }

  .content {
    flex: 1;
    padding: 20px 24px;
    overflow-y: auto;
  }
}
</style>
