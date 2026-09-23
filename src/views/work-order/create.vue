<template>
  <div class="create-page">
    <el-card shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">提交工单</span>
          <span class="header-desc">遇到问题？在此提交，我们会尽快响应处理</span>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="work-order-form">
        <el-form-item label="工单标题" prop="title">
          <el-input v-model="form.title" placeholder="简要描述您的问题（100字以内）" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="工单类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio-button v-for="(label, val) in WorkOrderTypeMap" :key="val" :value="Number(val)">
              {{ label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-segmented v-model="form.priority" :options="priorityOptions" />
        </el-form-item>

        <el-form-item label="详细描述" prop="content">
          <el-input
            v-model="form.content" type="textarea" :rows="8"
            placeholder="请详细描述您遇到的问题、期望的解决方案、复现步骤等..."
            maxlength="2000" show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
            提交工单
          </el-button>
          <el-button size="large" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { createWorkOrder, WorkOrderTypeMap } from '@/api/workOrder'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const priorityOptions = [
  { label: '低', value: 1 },
  { label: '中', value: 2 },
  { label: '高', value: 3 },
  { label: '紧急', value: 4 },
]

const form = reactive({
  title: '',
  type: undefined as number | undefined,
  priority: 2,
  content: '',
})

const rules: FormRules = {
  title: [
    { required: true, message: '请输入工单标题', trigger: 'blur' },
    { max: 100, message: '标题不能超过 100 字', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
  content: [
    { required: true, message: '请详细描述您的问题', trigger: 'blur' },
    { min: 5, message: '描述至少 5 个字', trigger: 'blur' },
  ],
}

function handleReset() {
  formRef.value?.resetFields()
  form.priority = 2
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await createWorkOrder({
        title: form.title,
        type: form.type!,
        content: form.content,
        priority: form.priority,
      })
      ElMessage.success('工单提交成功，请等待处理')
      router.push('/work-order/my')
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.create-page {
  max-width: 780px;
  margin: 0 auto;
}

.form-card {
  .card-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    .header-title {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a2e;
    }
    .header-desc {
      font-size: 13px;
      color: #6b7280;
    }
  }
}

.work-order-form {
  padding-top: 8px;
}
</style>
