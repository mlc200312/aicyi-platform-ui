<template>
  <div class="template-page">
    <!-- 查询条件 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="模板编码">
          <el-input v-model="query.templateCode" placeholder="请输入编码" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="模板名称">
          <el-input v-model="query.templateName" placeholder="请输入名称" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="消息类型">
          <el-select v-model="query.messageType" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="t in messageTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.enabled" placeholder="全部" clearable style="width: 100px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 模板列表 -->
    <el-card shadow="never">
      <div class="table-header">
        <el-button type="primary" @click="openAdd">新增模板</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="templateCode" label="模板编码" width="180" />
        <el-table-column prop="templateName" label="模板名称" width="150" />
        <el-table-column label="消息类型" width="100">
          <template #default="{ row }">
            <el-tag :type="messageTypeTag(row.messageType)" size="small">{{ messageTypeLabel(row.messageType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="格式" width="70">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.format || 'text' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="引擎" width="100">
          <template #default="{ row }">
            <span class="engine-text">{{ row.engineType || 'Simple' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="主题" width="140" show-overflow-tooltip />
        <el-table-column label="变量" min-width="140">
          <template #default="{ row }">
            <el-tag v-for="v in (row.variables || [])" :key="v" size="small" class="var-tag" effect="plain">{{ v }}</el-tag>
            <span v-if="!row.variables || row.variables.length === 0" class="empty-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" :active-value="1" :inactive-value="0" @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="query.page" v-model:page-size="query.size" :total="total"
        :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData" @current-change="loadData" style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑模板' : '新增模板'" width="680px" top="4vh">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="模板编码" prop="templateCode">
              <el-input v-model="form.templateCode" placeholder="如 user_welcome_mail" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模板名称" prop="templateName">
              <el-input v-model="form.templateName" placeholder="请输入模板名称" maxlength="128" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="消息类型" prop="messageType">
              <el-select v-model="form.messageType" placeholder="请选择" style="width: 100%">
                <el-option v-for="t in messageTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="消息格式" prop="format">
              <el-select v-model="form.format" placeholder="text" clearable style="width: 100%">
                <el-option label="纯文本 text" value="text" />
                <el-option label="HTML" value="html" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="模板引擎" prop="engineType">
              <el-select v-model="form.engineType" placeholder="Simple" clearable style="width: 100%">
                <el-option label="Simple" value="Simple" />
                <el-option label="FreeMarker" value="FreeMarker" />
                <el-option label="Thymeleaf" value="Thymeleaf" />
                <el-option label="Mustache" value="Mustache" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="模板主题">
              <el-input v-model="form.subject" placeholder="邮件标题等" maxlength="256" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="短信签名">
              <el-input v-model="form.signature" placeholder="如 【aicyi】" maxlength="64" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="模板变量">
          <div class="variables-editor">
            <el-tag
              v-for="(v, i) in form.variables" :key="i"
              closable size="large" class="var-tag-edit"
              @close="removeVariable(i)"
            >{{ v }}</el-tag>
            <el-input
              v-if="variableInputVisible" v-model="variableInput" ref="variableInputRef"
              size="small" class="variable-input" @keyup.enter="confirmVariable" @blur="confirmVariable"
            />
            <el-button v-else size="small" @click="showVariableInput">+ 添加变量</el-button>
          </div>
          <div class="form-tip">变量名在模板内容中用 ${变量名} 引用</div>
        </el-form-item>
        <el-form-item label="模板内容" prop="content">
          <el-input
            v-model="form.content" type="textarea" :rows="5"
            placeholder="变量用 ${name} 占位，如：您好 ${username}，欢迎加入 ${appName}！"
            maxlength="5000" show-word-limit
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="512" show-word-limit />
        </el-form-item>
        <el-form-item label="启用状态" v-if="isEdit">
          <el-radio-group v-model="form.enabled">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  listMessageTemplates, addMessageTemplate, editMessageTemplate,
  deleteMessageTemplate, changeTemplateStatus,
} from '@/api/messageTemplate'

const messageTypeOptions = [
  { label: '邮件 mail', value: 'mail' },
  { label: '短信 sms', value: 'sms' },
  { label: '推送 push', value: 'push' },
  { label: '消息队列 mq', value: 'mq' },
  { label: '公众号 wechat_mp', value: 'wechat_mp' },
]

function messageTypeLabel(t: string): string {
  return messageTypeOptions.find(o => o.value === t)?.label?.split(' ')[0] || t
}
function messageTypeTag(t: string): string {
  return { mail: 'primary', sms: 'success', push: 'warning', mq: 'info', wechat_mp: 'danger' }[t] || 'info'
}

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const query = reactive({
  page: 1,
  size: 10,
  templateCode: '',
  templateName: '',
  messageType: '',
  enabled: null as number | null,
})

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: query.page, size: query.size }
    if (query.templateCode) params.templateCode = query.templateCode
    if (query.templateName) params.templateName = query.templateName
    if (query.messageType) params.messageType = query.messageType
    if (query.enabled !== null) params.enabled = query.enabled
    const res: any = await listMessageTemplates(params)
    tableData.value = res.list || res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.templateCode = ''
  query.templateName = ''
  query.messageType = ''
  query.enabled = null
  query.page = 1
  loadData()
}

// ===== 新增/编辑 =====
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  id: '',
  templateCode: '',
  templateName: '',
  messageType: '',
  format: '',
  engineType: '',
  subject: '',
  signature: '',
  variables: [] as string[],
  content: '',
  remark: '',
  enabled: 1,
})

const rules: FormRules = {
  templateCode: [
    { required: true, message: '请输入模板编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/, message: '以字母开头，仅含字母/数字/下划线，最长64位', trigger: 'blur' },
  ],
  templateName: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  messageType: [{ required: true, message: '请选择消息类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }],
}

// 变量动态编辑
const variableInputVisible = ref(false)
const variableInput = ref('')
const variableInputRef = ref()

function showVariableInput() {
  variableInputVisible.value = true
  nextTick(() => variableInputRef.value?.focus())
}
function confirmVariable() {
  const val = variableInput.value.trim()
  if (val && !form.variables.includes(val)) {
    form.variables.push(val)
  }
  variableInput.value = ''
  variableInputVisible.value = false
}
function removeVariable(index: number) {
  form.variables.splice(index, 1)
}

function openAdd() {
  isEdit.value = false
  Object.assign(form, { id: '', templateCode: '', templateName: '', messageType: '', format: '', engineType: '', subject: '', signature: '', variables: [], content: '', remark: '', enabled: 1 })
  dialogVisible.value = true
}

function openEdit(row: any) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id, templateCode: row.templateCode, templateName: row.templateName,
    messageType: row.messageType, format: row.format || '', engineType: row.engineType || '',
    subject: row.subject || '', signature: row.signature || '',
    variables: [...(row.variables || [])], content: row.content,
    remark: row.remark || '', enabled: row.enabled,
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload: any = {
        templateName: form.templateName,
        messageType: form.messageType,
        content: form.content,
        variables: form.variables.length > 0 ? form.variables : undefined,
        remark: form.remark,
      }
      if (form.format) payload.format = form.format
      if (form.engineType) payload.engineType = form.engineType
      if (form.subject) payload.subject = form.subject
      if (form.signature) payload.signature = form.signature

      if (isEdit.value) {
        payload.enabled = form.enabled
        await editMessageTemplate(form.id, payload)
      } else {
        payload.templateCode = form.templateCode
        await addMessageTemplate(payload)
      }
      ElMessage.success('Success')
      dialogVisible.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

// ===== 删除 =====
async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定删除模板「${row.templateName}」吗？`, '删除确认', {
    type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消',
    customClass: 'center-message-box',
  })
  await deleteMessageTemplate(row.id)
  ElMessage.success('Success')
  loadData()
}

// ===== 状态切换 =====
async function handleStatusChange(row: any) {
  try {
    await changeTemplateStatus(row.id, row.enabled)
    ElMessage.success('Success')
  } catch {
    row.enabled = row.enabled === 1 ? 0 : 1
  }
}

loadData()
</script>

<style lang="scss" scoped>
.template-page {
  .search-card { margin-bottom: 16px; }
  .table-header { margin-bottom: 12px; }

  .engine-text {
    font-size: 12px;
    color: #6b7280;
  }
  .empty-text {
    color: #c0c4cc;
  }
  .var-tag {
    margin: 2px 4px 2px 0;
  }

  .variables-editor {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    width: 100%;
  }
  .var-tag-edit {
    height: 28px;
    line-height: 26px;
  }
  .variable-input {
    width: 140px;
  }
  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
</style>
