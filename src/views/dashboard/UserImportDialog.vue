<template>
  <el-dialog
    v-model="visible"
    title="批量导入用户"
    width="640px"
    top="6vh"
    :close-on-click-modal="false"
    @open="resetState"
  >
    <!-- 三步引导 -->
    <div class="import-steps">
      <span class="step"><i>1</i>下载模板</span>
      <span class="step-arrow">→</span>
      <span class="step"><i>2</i>按表头填写</span>
      <span class="step-arrow">→</span>
      <span class="step"><i>3</i>上传导入</span>
      <el-button link type="primary" :loading="templateLoading" @click="handleDownloadTemplate">
        <el-icon style="margin-right: 4px"><Download /></el-icon>下载导入模板
      </el-button>
    </div>

    <!-- 上传区（导入完成前显示） -->
    <template v-if="!result">
      <el-upload
        ref="uploadRef"
        drag
        accept=".xlsx"
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
        :on-remove="() => (file = null)"
        :on-exceed="handleExceed"
        class="import-upload"
      >
        <el-icon :size="42" class="upload-icon"><UploadFilled /></el-icon>
        <div class="upload-text">将 .xlsx 文件拖到此处，或<em>点击选择</em></div>
        <template #tip>
          <div class="upload-tip">仅支持 .xlsx 格式，大小不超过 5MB；失败行不影响其他行</div>
        </template>
      </el-upload>
    </template>

    <!-- 导入结果面板 -->
    <template v-else>
      <div class="import-result">
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-num">{{ result.totalRows }}</span>
            <span class="stat-label">总行数</span>
          </div>
          <div class="stat-item success">
            <span class="stat-num">{{ result.successCount }}</span>
            <span class="stat-label">成功</span>
          </div>
          <div class="stat-item danger">
            <span class="stat-num">{{ result.failCount }}</span>
            <span class="stat-label">失败</span>
          </div>
        </div>

        <el-alert
          v-if="result.failCount > 0"
          type="warning"
          :closable="false"
          :title="`有 ${result.failCount} 行导入失败，修正后可重新导入`"
          style="margin-top: 12px"
        />
        <el-alert
          v-else
          type="success"
          :closable="false"
          title="全部导入成功"
          style="margin-top: 12px"
        />

        <el-table v-if="result.failures?.length" :data="result.failures" size="small" style="margin-top: 12px" max-height="220">
          <el-table-column prop="rowNo" label="行号" width="70" />
          <el-table-column prop="username" label="用户名" width="140" />
          <el-table-column prop="reason" label="失败原因" min-width="180" />
        </el-table>
      </div>
    </template>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button v-if="result" @click="resetState">继续导入</el-button>
      <el-button v-else type="primary" :disabled="!file" :loading="importing" @click="handleImport">
        开始导入
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, type UploadFile, type UploadInstance, type UploadRawFile } from 'element-plus'
import { Download, UploadFilled } from '@element-plus/icons-vue'
import { importUsers, downloadImportTemplate } from '@/api/user'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'imported'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const MAX_SIZE_MB = 5

const uploadRef = ref<UploadInstance>()
const file = ref<File | null>(null)
const templateLoading = ref(false)
const importing = ref(false)
const result = ref<any | null>(null)

function handleFileChange(uploadFile: UploadFile) {
  const raw = uploadFile.raw as UploadRawFile | undefined
  if (!raw) return
  if (!raw.name.toLowerCase().endsWith('.xlsx')) {
    ElMessage.error('仅支持 .xlsx 格式文件')
    uploadRef.value?.clearFiles()
    file.value = null
    return
  }
  if (raw.size > MAX_SIZE_MB * 1024 * 1024) {
    ElMessage.error(`文件大小不能超过 ${MAX_SIZE_MB}MB`)
    uploadRef.value?.clearFiles()
    file.value = null
    return
  }
  file.value = raw
}

/** limit=1 时再次选择替换原文件 */
function handleExceed(files: File[]) {
  uploadRef.value?.clearFiles()
  if (files[0]) {
    uploadRef.value?.handleStart(files[0] as UploadRawFile)
  }
}

async function handleDownloadTemplate() {
  templateLoading.value = true
  try {
    const filename = await downloadImportTemplate()
    ElMessage.success(`模板已下载：${filename}`)
  } finally {
    templateLoading.value = false
  }
}

async function handleImport() {
  if (!file.value) return
  importing.value = true
  try {
    const res: any = await importUsers(file.value)
    result.value = res
    if (res.successCount > 0) {
      emit('imported')
      ElMessage.success(`成功导入 ${res.successCount} 个用户`)
    }
  } finally {
    importing.value = false
  }
}

function resetState() {
  file.value = null
  result.value = null
  uploadRef.value?.clearFiles()
}
</script>

<style lang="scss" scoped>
.import-steps {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 14px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);

  .step {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    i {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--el-color-primary);
      color: #fff;
      font-size: 12px;
      font-style: normal;
    }
  }

  .step-arrow {
    color: var(--el-text-color-placeholder);
  }

  .el-button {
    margin-left: auto;
  }
}

.import-upload {
  width: 100%;

  :deep(.el-upload-dragger) {
    width: 100%;
  }

  .upload-icon {
    color: var(--el-color-primary);
    margin-top: 12px;
  }

  .upload-text {
    color: var(--el-text-color-regular);
    font-size: 14px;

    em {
      color: var(--el-color-primary);
      font-style: normal;
    }
  }

  .upload-tip {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
    margin-top: 8px;
  }
}

.import-result {
  .result-stats {
    display: flex;
    gap: 12px;
  }

  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 14px 0;
    border-radius: 6px;
    background: var(--el-fill-color-light);

    .stat-num {
      font-size: 22px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .stat-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    &.success .stat-num {
      color: var(--el-color-success);
    }

    &.danger .stat-num {
      color: var(--el-color-danger);
    }
  }
}
</style>
