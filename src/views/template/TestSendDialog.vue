<template>
  <el-dialog
    v-model="visible"
    title="测试发送"
    width="640px"
    top="6vh"
    :close-on-click-modal="false"
    @open="resetForm"
  >
    <!-- 模板摘要条 -->
    <div class="tpl-brief" v-if="template">
      <span class="tpl-name">{{ template.templateName }}</span>
      <el-tag :type="tagType(template.messageType)" size="small">{{ typeLabel(template.messageType) }}</el-tag>
      <el-tag size="small" effect="plain">{{ template.engineType || 'Simple' }}</el-tag>
      <el-tag v-if="template.format" size="small" effect="plain">{{ template.format }}</el-tag>
      <span class="tpl-code">{{ template.templateCode }}</span>
    </div>

    <el-form ref="formRef" :model="form" label-width="96px" @submit.prevent>
      <el-form-item :label="receiverLabel" prop="receiver" :rules="receiverRules">
        <el-input
          v-model="form.receiver"
          :placeholder="receiverPlaceholder"
          maxlength="256"
          clearable
          @keyup.enter="handleSend"
        />
      </el-form-item>

      <el-form-item
        v-for="v in variables"
        :key="v"
        :label="v"
        :prop="`params.${v}`"
        :rules="[{ required: true, message: `请输入变量 ${v} 的值`, trigger: 'blur' }]"
      >
        <el-input v-model="form.params[v]" :placeholder="`变量 ${v} 的值`" maxlength="500" clearable />
      </el-form-item>

      <el-form-item v-if="!variables.length">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="该模板未声明变量，填写接收者后即可直接发送"
        />
      </el-form-item>
    </el-form>

    <!-- 测试结论面板 -->
    <div v-if="result" class="result-panel" :class="`is-${resultState}`">
      <div class="result-head">
        <span class="result-title">
          <template v-if="resultState === 'success'">✅ 发送成功</template>
          <template v-else-if="resultState === 'unwired'">⚠️ 通道未装配（渲染预览如下）</template>
          <template v-else>❌ 发送失败</template>
        </span>
        <span v-if="result.completeTime" class="result-time">{{ result.completeTime }}</span>
      </div>

      <el-alert
        v-if="resultState === 'unwired' && result.errorMsg"
        type="warning"
        :closable="false"
        show-icon
        :title="result.errorMsg"
        class="result-alert"
      />
      <el-alert
        v-else-if="resultState === 'failed' && result.errorMsg"
        type="error"
        :closable="false"
        show-icon
        :title="result.errorMsg"
        class="result-alert"
      />

      <dl class="result-meta">
        <template v-if="resultState === 'success'">
          <div v-if="result.messageId"><dt>消息 ID</dt><dd>{{ result.messageId }}</dd></div>
          <div v-if="result.channelMessageId"><dt>渠道回执</dt><dd>{{ result.channelMessageId }}</dd></div>
        </template>
        <div v-if="result.missingParams?.length">
          <dt>缺失变量</dt><dd class="miss">{{ result.missingParams.join('、') }}</dd>
        </div>
      </dl>

      <div v-if="result.renderedSubject !== null && result.renderedSubject !== undefined" class="rendered">
        <span class="rendered-label">渲染主题</span>
        <p class="rendered-text">{{ result.renderedSubject }}</p>
      </div>
      <div class="rendered">
        <span class="rendered-label">渲染内容</span>
        <pre class="rendered-pre">{{ result.renderedContent }}</pre>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" :loading="sending" @click="handleSend">发送测试</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import { testSendMessageTemplate } from '@/api/messageTemplate'

const props = defineProps<{
  modelValue: boolean
  template: any | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const messageTypeOptions: Record<string, { label: string; tag: TagType }> = {
  mail: { label: '邮件', tag: 'primary' },
  sms: { label: '短信', tag: 'success' },
  push: { label: '推送', tag: 'warning' },
  mq: { label: '消息队列', tag: 'info' },
  wechat_mp: { label: '公众号', tag: 'danger' },
}

function typeLabel(t: string): string {
  return messageTypeOptions[t]?.label || t
}
function tagType(t: string): TagType {
  return messageTypeOptions[t]?.tag || 'info'
}

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const MOBILE_RE = /^1[3-9]\d{9}$/

const variables = computed<string[]>(() => props.template?.variables || [])

const receiverLabels: Record<string, string> = {
  mail: '接收邮箱', sms: '接收手机号', push: '设备标识', mq: 'Topic / Queue', wechat_mp: 'OpenID',
}
const receiverPlaceholders: Record<string, string> = {
  mail: 'user@example.com', sms: '13800138000', push: '设备 / 用户标识', mq: 'topicName', wechat_mp: '用户 OpenID',
}

const receiverLabel = computed(() => receiverLabels[props.template?.messageType] || '接收者')

const receiverPlaceholder = computed(() => receiverPlaceholders[props.template?.messageType] || '请输入接收者')

const receiverRules = computed(() => {
  const base = [{ required: true, message: `请输入${receiverLabel.value}`, trigger: 'blur' }]
  if (props.template?.messageType === 'mail') {
    return [...base, { pattern: EMAIL_RE, message: '邮箱格式不正确', trigger: 'blur' }]
  }
  if (props.template?.messageType === 'sms') {
    return [...base, { pattern: MOBILE_RE, message: '手机号格式不正确', trigger: 'blur' }]
  }
  return base
})

const formRef = ref<FormInstance>()
const sending = ref(false)
const form = reactive({
  receiver: '',
  params: {} as Record<string, string>,
})

const result = ref<any>(null)

const resultState = computed<'success' | 'unwired' | 'failed' | null>(() => {
  if (!result.value) return null
  if (result.value.success) return 'success'
  if (result.value.senderAvailable === false) return 'unwired'
  return 'failed'
})

function resetForm() {
  form.receiver = ''
  form.params = {}
  variables.value.forEach((v) => {
    form.params[v] = ''
  })
  result.value = null
  sending.value = false
}

async function handleSend() {
  if (!formRef.value || !props.template) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  sending.value = true
  result.value = null
  try {
    const res: any = await testSendMessageTemplate(props.template.id, {
      receiver: form.receiver.trim(),
      params: { ...form.params },
    })
    result.value = res
  } finally {
    sending.value = false
  }
}
</script>

<style lang="scss" scoped>
.tpl-brief {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 12px;
  margin-bottom: 16px;
  background: #f5f7fa;
  border-left: 3px solid var(--el-color-primary);
  border-radius: 4px;

  .tpl-name {
    font-weight: 600;
    color: #303133;
  }
  .tpl-code {
    margin-left: auto;
    font-size: 12px;
    color: #909399;
    font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
  }
}

.result-panel {
  margin-top: 8px;
  border-radius: 6px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  background: #fafafa;

  &.is-success {
    border-color: var(--el-color-success-light-5);
    background: var(--el-color-success-light-9);
  }
  &.is-failed {
    border-color: var(--el-color-danger-light-5);
    background: var(--el-color-danger-light-9);
  }
  &.is-unwired {
    border-color: var(--el-color-warning-light-5);
    background: var(--el-color-warning-light-9);
  }

  .result-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    .result-title {
      font-weight: 600;
      font-size: 14px;
      color: #303133;
    }
    .result-time {
      font-size: 12px;
      color: #909399;
    }
  }

  .result-alert {
    margin-bottom: 8px;
  }

  .result-meta {
    margin: 0 0 8px;
    font-size: 12px;

    div {
      display: flex;
      gap: 8px;
      line-height: 20px;
    }
    dt {
      color: #909399;
      flex-shrink: 0;
    }
    dd {
      margin: 0;
      color: #606266;
      word-break: break-all;
      font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
    }
    dd.miss {
      color: var(--el-color-danger);
    }
  }

  .rendered {
    margin-top: 6px;

    .rendered-label {
      display: inline-block;
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
    }
    .rendered-text {
      margin: 0;
      color: #303133;
      font-size: 13px;
    }
    .rendered-pre {
      margin: 0;
      padding: 10px 12px;
      background: #fff;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.7;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 220px;
      overflow: auto;
      color: #303133;
      font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
    }
  }
}
</style>
