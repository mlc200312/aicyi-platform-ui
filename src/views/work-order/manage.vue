<template>
  <div class="manage-page">
    <!-- 筛选 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="(label, val) in WorkOrderStatusMap" :key="val" :label="label" :value="Number(val)" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.type" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="(label, val) in WorkOrderTypeMap" :key="val" :label="label" :value="Number(val)" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="query.priority" placeholder="全部" clearable style="width: 100px">
            <el-option v-for="(label, val) in WorkOrderPriorityMap" :key="val" :label="label" :value="Number(val)" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" placeholder="搜索标题" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="orderNo" label="工单编号" width="180" />
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">{{ WorkOrderTypeMap[row.type] }}</template>
        </el-table-column>
        <el-table-column label="优先级" width="85">
          <template #default="{ row }">
            <el-tag :type="(WorkOrderPriorityTag[row.priority] as any) || 'info'" size="small" effect="plain">
              {{ WorkOrderPriorityMap[row.priority] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="(WorkOrderStatusTag[row.status] as any) || 'info'" size="small">
              {{ WorkOrderStatusMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitterName" label="提交人" width="100" />
        <el-table-column prop="createTime" label="提交时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 1 || row.status === 2"
              link type="success" @click="openProcess(row)"
            >处理</el-button>
            <el-button
              v-if="row.status === 1 || row.status === 2"
              link type="warning" @click="openReply(row)"
            >回复</el-button>
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
          <el-descriptions-item label="提交人">{{ detail.submitterName }}</el-descriptions-item>
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

    <!-- 处理弹窗 -->
    <el-dialog v-model="processVisible" title="处理工单" width="520px" destroy-on-close>
      <div class="process-header">
        <span class="process-title-text">{{ processingOrder?.title }}</span>
        <el-tag :type="(WorkOrderStatusTag[processingOrder?.status] as any) || 'info'" size="small">
          {{ WorkOrderStatusMap[processingOrder?.status] }}
        </el-tag>
      </div>
      <el-form ref="processFormRef" :model="processForm" :rules="processRules" label-width="90px">
        <el-form-item label="处理结果" prop="result">
          <el-radio-group v-model="processForm.result">
            <el-radio :value="2">受理（处理中）</el-radio>
            <el-radio :value="3">已解决</el-radio>
            <el-radio :value="4">已驳回</el-radio>
            <el-radio :value="5">已关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理意见" prop="opinion">
          <el-input
            v-model="processForm.opinion" type="textarea" :rows="4"
            placeholder="请填写处理意见（解决/驳回/关闭时必填）"
            maxlength="500" show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processVisible = false">取消</el-button>
        <el-button type="primary" :loading="processSubmitting" @click="submitProcess">确认处理</el-button>
      </template>
    </el-dialog>

    <!-- 回复弹窗 -->
    <el-dialog v-model="replyVisible" title="回复工单" width="480px" destroy-on-close>
      <el-form ref="replyFormRef" :model="replyForm" :rules="replyRules" label-width="0">
        <el-form-item prop="content">
          <el-input
            v-model="replyForm.content" type="textarea" :rows="5"
            placeholder="请输入回复内容..."
            maxlength="500" show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" :loading="replySubmitting" @click="submitReply">发送回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  adminWorkOrderPage, adminGetWorkOrderDetail, getWorkOrderReplies,
  processWorkOrder, replyWorkOrder,
  WorkOrderTypeMap, WorkOrderStatusMap, WorkOrderPriorityMap,
  WorkOrderStatusTag, WorkOrderPriorityTag,
} from '@/api/workOrder'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const query = reactive({
  page: 1, size: 10,
  status: null as number | null,
  type: null as number | null,
  priority: null as number | null,
  keyword: '',
})

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: query.page, size: query.size }
    if (query.status !== null) params.status = query.status
    if (query.type !== null) params.type = query.type
    if (query.priority !== null) params.priority = query.priority
    if (query.keyword) params.keyword = query.keyword
    const res: any = await adminWorkOrderPage(params)
    tableData.value = res.records || res.list || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.status = null
  query.type = null
  query.priority = null
  query.keyword = ''
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
      adminGetWorkOrderDetail(row.id),
      getWorkOrderReplies(row.id),
    ])
    detail.value = d
    replies.value = (r as any) || []
  } finally {
    detailLoading.value = false
  }
}

// ===== 处理 =====
const processVisible = ref(false)
const processSubmitting = ref(false)
const processFormRef = ref<FormInstance>()
const processingOrder = ref<any>(null)
const processForm = reactive({ result: 3, opinion: '' })

const processRules: FormRules = {
  result: [{ required: true, message: '请选择处理结果', trigger: 'change' }],
  opinion: [
    {
      validator: (_rule, value, callback) => {
        if ([3, 4, 5].includes(processForm.result) && !String(value || '').trim()) {
          callback(new Error('解决/驳回/关闭时必须填写处理意见'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

function openProcess(row: any) {
  processingOrder.value = row
  processForm.result = row.status === 1 ? 2 : 3
  processForm.opinion = ''
  processVisible.value = true
}

async function submitProcess() {
  if (!processFormRef.value) return
  await processFormRef.value.validate(async (valid) => {
    if (!valid) return
    processSubmitting.value = true
    try {
      await processWorkOrder(processingOrder.value.id, {
        result: processForm.result,
        opinion: processForm.opinion,
      })
      ElMessage.success('处理成功')
      processVisible.value = false
      loadData()
    } finally {
      processSubmitting.value = false
    }
  })
}

// ===== 回复 =====
const replyVisible = ref(false)
const replySubmitting = ref(false)
const replyFormRef = ref<FormInstance>()
const replyingOrder = ref<any>(null)
const replyForm = reactive({ content: '' })

const replyRules: FormRules = {
  content: [
    { required: true, message: '请输入回复内容', trigger: 'blur' },
    { max: 500, message: '不超过 500 字', trigger: 'blur' },
  ],
}

function openReply(row: any) {
  replyingOrder.value = row
  replyForm.content = ''
  replyVisible.value = true
}

async function submitReply() {
  if (!replyFormRef.value) return
  await replyFormRef.value.validate(async (valid) => {
    if (!valid) return
    replySubmitting.value = true
    try {
      await replyWorkOrder(replyingOrder.value.id, { content: replyForm.content })
      ElMessage.success('回复成功')
      replyVisible.value = false
      loadData()
    } finally {
      replySubmitting.value = false
    }
  })
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.manage-page {
  .filter-card { margin-bottom: 16px; }
}

.process-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  .process-title-text {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
      display: flex; align-items: center; gap: 12px; margin-bottom: 4px;
      .reply-sender { font-size: 13px; font-weight: 600; color: #1f2937; }
      .reply-time { font-size: 12px; color: #9ca3af; }
    }
    .reply-content { font-size: 13px; color: #4b5563; line-height: 1.6; }
  }
}
</style>
