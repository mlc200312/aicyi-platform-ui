<template>
  <div class="my-orders-page">
    <!-- 操作栏 -->
    <div class="toolbar">
      <h3 class="page-title">我的工单</h3>
      <el-button type="primary" @click="$router.push('/work-order/create')">
        <el-icon><Plus /></el-icon> 提交新工单
      </el-button>
    </div>

    <!-- 筛选 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true">
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="(label, val) in WorkOrderStatusMap" :key="val" :label="label" :value="Number(val)" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="orderNo" label="工单编号" width="180" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">{{ WorkOrderTypeMap[row.type] }}</template>
        </el-table-column>
        <el-table-column label="优先级" width="90">
          <template #default="{ row }">
            <el-tag :type="(WorkOrderPriorityTag[row.priority] as any) || 'info'" size="small" effect="plain">
              {{ WorkOrderPriorityMap[row.priority] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="(WorkOrderStatusTag[row.status] as any) || 'info'" size="small">
              {{ WorkOrderStatusMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="提交时间" width="170" />
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

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" title="工单详情" size="560px" direction="rtl">
      <div v-loading="detailLoading" class="detail-body">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="工单编号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ WorkOrderTypeMap[detail.type] }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="(WorkOrderPriorityTag[detail.priority] as any) || 'info'" size="small">
              {{ WorkOrderPriorityMap[detail.priority] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="(WorkOrderStatusTag[detail.status] as any) || 'info'" size="small">
              {{ WorkOrderStatusMap[detail.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ detail.createTime }}</el-descriptions-item>
          <el-descriptions-item label="问题描述">
            <div class="content-text">{{ detail.content }}</div>
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.handlerName" label="处理人">{{ detail.handlerName }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.handleTime" label="处理时间">{{ detail.handleTime }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.handleOpinion" label="处理意见">
            <div class="content-text opinion-text">{{ detail.handleOpinion }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="replies.length" class="replies-section">
          <h4 class="section-title">沟通记录</h4>
          <div class="reply-timeline">
            <div v-for="reply in replies" :key="reply.id" class="reply-item">
              <div class="reply-avatar">{{ (reply.senderName || '?').charAt(0) }}</div>
              <div class="reply-body">
                <div class="reply-meta">
                  <span class="reply-sender">{{ reply.senderName }}</span>
                  <span class="reply-time">{{ reply.createTime }}</span>
                </div>
                <div class="reply-content">{{ reply.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import {
  myWorkOrderPage, getWorkOrderDetail, getWorkOrderReplies,
  WorkOrderTypeMap, WorkOrderStatusMap, WorkOrderPriorityMap,
  WorkOrderStatusTag, WorkOrderPriorityTag,
} from '@/api/workOrder'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10, status: null as number | null })

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: query.page, size: query.size }
    if (query.status !== null) params.status = query.status
    const res: any = await myWorkOrderPage(params)
    tableData.value = res.records || res.list || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.status = null
  query.page = 1
  loadData()
}

// ===== 详情 =====
const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<any>({})
const replies = ref<any[]>([])

async function openDetail(row: any) {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = {}
  replies.value = []
  try {
    const [d, r] = await Promise.all([
      getWorkOrderDetail(row.id),
      getWorkOrderReplies(row.id),
    ])
    detail.value = d
    replies.value = (r as any) || []
  } finally {
    detailLoading.value = false
  }
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.my-orders-page {
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #1a1a2e;
    }
  }

  .filter-card {
    margin-bottom: 16px;
  }
}

.detail-body {
  padding: 0 4px;
}

.content-text {
  white-space: pre-wrap;
  line-height: 1.7;
  color: #374151;
}

.opinion-text {
  color: #059669;
  font-weight: 500;
}

.replies-section {
  margin-top: 24px;
  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
  }
}

.reply-timeline {
  .reply-item {
    display: flex;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px dashed #f0f0f0;
    &:last-child { border-bottom: none; }
  }

  .reply-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .reply-body {
    flex: 1;
    min-width: 0;
    .reply-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
      .reply-sender { font-size: 13px; font-weight: 600; color: #1f2937; }
      .reply-time { font-size: 12px; color: #9ca3af; }
    }
    .reply-content {
      font-size: 13px;
      color: #4b5563;
      line-height: 1.6;
    }
  }
}
</style>
