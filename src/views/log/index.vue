<template>
  <div class="log-page">
    <!-- 查询条件 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="操作模块">
          <el-input v-model="query.module" placeholder="请输入模块" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="query.operType" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="t in operTypeOptions" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作用户">
          <el-input v-model="query.username" placeholder="请输入用户名" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="结果">
          <el-select v-model="query.success" placeholder="全部" clearable style="width: 100px">
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="dateRange" type="datetimerange" range-separator="至"
            start-placeholder="开始时间" end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss" style="width: 340px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="operateTime" label="操作时间" width="175" />
        <el-table-column prop="username" label="操作人" width="110" />
        <el-table-column prop="operModule" label="模块" width="110" />
        <el-table-column prop="operType" label="类型" width="95">
          <template #default="{ row }">
            <el-tag :type="operTypeTag(row.operType)" size="small">{{ row.operType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operDesc" label="操作描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="请求" width="170">
          <template #default="{ row }">
            <el-tag :type="methodTag(row.requestMethod)" size="small" effect="plain">{{ row.requestMethod }}</el-tag>
            <span class="request-uri" :title="row.requestUri">{{ row.requestUri }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="clientIp" label="客户端IP" width="130" />
        <el-table-column label="结果" width="75">
          <template #default="{ row }">
            <el-tag :type="row.success === 1 ? 'success' : 'danger'" size="small">{{ row.success === 1 ? '成功' : '失败' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="query.page" v-model:page-size="query.size" :total="total"
        :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData" @current-change="loadData" style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="操作日志详情" width="680px" top="5vh">
      <div v-loading="detailLoading" class="detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="日志ID">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="链路ID">{{ detail.traceId }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ detail.username }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ detail.userId }}</el-descriptions-item>
          <el-descriptions-item label="操作模块">{{ detail.operModule }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">{{ detail.operType }}</el-descriptions-item>
          <el-descriptions-item label="操作描述" :span="2">{{ detail.operDesc }}</el-descriptions-item>
          <el-descriptions-item label="请求方法">{{ detail.requestMethod }}</el-descriptions-item>
          <el-descriptions-item label="请求路径">{{ detail.requestUri }}</el-descriptions-item>
          <el-descriptions-item label="客户端IP">{{ detail.clientIp }}</el-descriptions-item>
          <el-descriptions-item label="服务端IP">{{ detail.serverIp }}</el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ detail.operateTime }}</el-descriptions-item>
          <el-descriptions-item label="结果">
            <el-tag :type="detail.success === 1 ? 'success' : 'danger'" size="small">{{ detail.success === 1 ? '成功' : '失败' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="User-Agent" :span="2">{{ detail.userAgent }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.errorMsg" label="异常信息" :span="2">
            <span style="color: #ef4444">{{ detail.errorMsg }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="detail.requestParam" class="detail-block">
          <div class="block-title">请求参数</div>
          <pre class="block-json">{{ formatJson(detail.requestParam) }}</pre>
        </div>
        <div v-if="detail.responseResult" class="detail-block">
          <div class="block-title">响应结果</div>
          <pre class="block-json">{{ formatJson(detail.responseResult) }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { listOperLogs, getOperLogDetail } from '@/api/operLog'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const dateRange = ref<string[]>([])
const query = reactive({
  page: 1,
  size: 10,
  module: '',
  operType: '',
  username: '',
  success: null as number | null,
})

const operTypeOptions = ['LOGIN', 'LOGOUT', 'PASSWORD', 'PERM', 'REFRESH', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'QUERY']

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

function operTypeTag(type: string): TagType {
  const map: Record<string, TagType> = {
    LOGIN: 'success', LOGOUT: 'info', PASSWORD: 'warning',
    PERM: 'primary', REFRESH: 'info', CREATE: 'success',
    UPDATE: 'warning', DELETE: 'danger', EXPORT: 'primary', QUERY: 'info',
  }
  return map[type] || 'info'
}

function methodTag(method: string): TagType {
  const map: Record<string, TagType> = { GET: 'info', POST: 'success', PUT: 'warning', DELETE: 'danger' }
  return map[method] || 'info'
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: query.page, size: query.size }
    if (query.module) params.module = query.module
    if (query.operType) params.operType = query.operType
    if (query.username) params.username = query.username
    if (query.success !== null) params.success = query.success
    if (dateRange.value?.length === 2) {
      params.beginTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    const res: any = await listOperLogs(params)
    tableData.value = res.list || res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.module = ''
  query.operType = ''
  query.username = ''
  query.success = null
  dateRange.value = []
  query.page = 1
  loadData()
}

// ===== 详情 =====
const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<any>({})

async function openDetail(row: any) {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = {}
  try {
    detail.value = await getOperLogDetail(row.id)
  } finally {
    detailLoading.value = false
  }
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}
</script>

<style lang="scss" scoped>
.log-page {
  .search-card { margin-bottom: 16px; }

  .request-uri {
    margin-left: 6px;
    font-size: 12px;
    color: #6b7280;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100px;
    display: inline-block;
    vertical-align: middle;
  }

  .detail-content {
    max-height: 70vh;
    overflow-y: auto;
  }

  .detail-block {
    margin-top: 16px;
    .block-title {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .block-json {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      font-size: 12px;
      line-height: 1.6;
      color: #374151;
      overflow-x: auto;
      max-height: 240px;
      margin: 0;
    }
  }
}
</style>
