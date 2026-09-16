<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="16">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <el-card shadow="never" class="stat-card">
          <div class="stat-icon" :style="{ background: stat.color }">
            <el-icon :size="24"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表 + 日志 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <span class="card-title">用户登录趋势（近7天）</span>
          </template>
          <div class="chart-wrap">
            <div class="chart-bars">
              <div class="bar-col" v-for="(bar, i) in chartData" :key="i">
                <div class="bar" :style="{ height: bar.height + '%', background: bar.color }"></div>
                <span class="bar-label">{{ bar.day }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>
            <span class="card-title">最近操作日志</span>
          </template>
          <ul class="log-list">
            <li v-for="(log, i) in logs" :key="i">
              <span class="log-dot" :class="{ fail: log.success === 0 }" />
              <span class="log-text">{{ log.text }}</span>
              <span class="log-time">{{ log.time }}</span>
            </li>
            <li v-if="logs.length === 0" class="log-empty">暂无操作日志</li>
          </ul>
        </el-card>
      </el-col>
    </el-row>

    <!-- 用户管理预览 -->
    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <div class="table-header">
          <span class="card-title">用户管理</span>
          <div class="table-actions">
            <el-button type="primary" size="small" @click="$router.push('/system/user')">+ 新增用户</el-button>
            <el-button type="success" size="small">+ 批量导入</el-button>
            <el-button type="danger" size="small">- 批量删除</el-button>
          </div>
        </div>
      </template>
      <div class="search-bar">
        <el-input v-model="userQuery.username" placeholder="搜索用户名/昵称" size="default" style="width: 200px" clearable @keyup.enter="loadUsers" />
        <el-select v-model="userQuery.status" placeholder="全部状态" size="default" style="width: 120px; margin-left: 12px" clearable>
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="primary" style="margin-left: 12px" @click="handleSearch">搜索</el-button>
      </div>
      <el-table :data="userList" v-loading="userLoading" style="width: 100%; margin-top: 12px">
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="mobile" label="手机号" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small" effect="light">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="120">
          <template #default>
            <el-button link type="primary" size="small" @click="$router.push('/system/user')">管理</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <span>共 {{ userTotal }} 条</span>
        <el-pagination
          layout="prev, pager, next"
          :total="userTotal"
          :page-size="userQuery.size"
          :current-page="userQuery.page"
          small
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { listUsers } from '@/api/user'
import { listOperLogs } from '@/api/operLog'

const stats = [
  { label: '总用户数', value: '1,286', icon: 'User', color: '#3B82F6' },
  { label: '在线用户', value: '56', icon: 'CircleCheck', color: '#22C55E' },
  { label: '角色数量', value: '18', icon: 'Star', color: '#F59E0B' },
  { label: '菜单数量', value: '42', icon: 'Warning', color: '#EF4444' },
]

const chartData = [
  { day: '周一', height: 55, color: '#3B82F6' },
  { day: '周二', height: 72, color: '#22C55E' },
  { day: '周三', height: 45, color: '#F59E0B' },
  { day: '周四', height: 85, color: '#EF4444' },
  { day: '周五', height: 68, color: '#3B82F6' },
  { day: '周六', height: 50, color: '#22C55E' },
  { day: '周日', height: 60, color: '#3B82F6' },
]

const logs = ref<any[]>([])

async function loadLogs() {
  try {
    const res: any = await listOperLogs({ page: 1, size: 5 })
    logs.value = (res.list || res.records || []).map((item: any) => ({
      text: `${item.username || '系统'} ${item.operDesc || item.operModule || ''}`,
      time: formatTime(item.operateTime),
      success: item.success,
    }))
  } catch {
    logs.value = []
  }
}

/** 操作时间格式化：今天的显示"刚刚/x分钟前"，更早的显示日期 */
function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  const t = new Date(timeStr.replace(/-/g, '/'))
  if (isNaN(t.getTime())) return timeStr
  const diff = Date.now() - t.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}小时前`
  return timeStr.slice(0, 16)
}

// ===== 用户列表（真实接口） =====
const userList = ref<any[]>([])
const userTotal = ref(0)
const userLoading = ref(false)
const userQuery = reactive({ page: 1, size: 10, username: '', status: null as number | null })

async function loadUsers() {
  userLoading.value = true
  try {
    const params: any = { page: userQuery.page, size: userQuery.size }
    if (userQuery.username) params.username = userQuery.username
    if (userQuery.status !== null) params.status = userQuery.status
    const res: any = await listUsers(params)
    userList.value = res.list || res.records || []
    userTotal.value = res.total || 0
  } finally {
    userLoading.value = false
  }
}

function handleSearch() {
  userQuery.page = 1
  loadUsers()
}

function handlePageChange(page: number) {
  userQuery.page = page
  loadUsers()
}

onMounted(() => {
  loadUsers()
  loadLogs()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-card {
    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }
    .stat-info {
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: $ink;
        line-height: 1.2;
      }
      .stat-label {
        font-size: 13px;
        color: $ink-muted;
        margin-top: 2px;
      }
    }
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $ink;
  }

  // 柱状图
  .chart-wrap {
    height: 220px;
    background: #F9FAFB;
    border-radius: 6px;
    padding: 20px 24px 8px;
    display: flex;
    align-items: flex-end;
    .chart-bars {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      width: 100%;
      height: 100%;
      .bar-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        height: 100%;
        justify-content: flex-end;
        .bar {
          width: 32px;
          border-radius: 4px 4px 0 0;
          min-height: 4px;
          transition: height 0.3s;
        }
        .bar-label {
          font-size: 12px;
          color: $ink-muted;
        }
      }
    }
  }

  // 日志列表
  .log-list {
    list-style: none;
    padding: 0;
    margin: 0;
    li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 12px 0;
      border-bottom: 1px solid $ink-line;
      font-size: 13px;
      &:last-child { border-bottom: none; }
      .log-dot {
        flex-shrink: 0;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #22c55e;
        &.fail { background: #ef4444; }
      }
      .log-text { color: $ink; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .log-time { color: $ink-muted; font-size: 12px; flex-shrink: 0; }
    }
    .log-empty {
      justify-content: center;
      color: $ink-muted;
      padding: 24px 0;
    }
  }

  // 用户表格
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .search-bar {
    display: flex;
    align-items: center;
  }
  .pagination {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
    margin-top: 16px;
    font-size: 13px;
    color: $ink-muted;
  }
}
</style>
