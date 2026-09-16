<template>
  <div class="page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="never" class="profile-card">
          <div class="avatar-wrap">
            <el-avatar :size="80" style="background: #C8302A; font-size: 32px">{{ initial }}</el-avatar>
            <h2 class="display-title" style="margin: 16px 0 4px">{{ userInfo?.nickname || userInfo?.username }}</h2>
            <p style="color: #8A8A8A; font-size: 14px; margin: 0">@{{ userInfo?.username }}</p>
          </div>
          <div class="profile-meta">
            <div class="meta-item"><span>手机号</span><strong>{{ userInfo?.mobile || '未设置' }}</strong></div>
            <div class="meta-item"><span>邮箱</span><strong>{{ userInfo?.email || '未设置' }}</strong></div>
            <div class="meta-item"><span>状态</span><strong style="color: #C8302A">{{ userInfo?.status === 1 ? '启用' : '禁用' }}</strong></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="never">
          <template #header><span class="display-title" style="font-size: 18px; font-weight: 700">修改个人信息</span></template>
          <el-form ref="formRef" :model="form" label-width="90px" style="max-width: 480px">
            <el-form-item label="昵称"><el-input v-model="form.nickname" /></el-form-item>
            <el-form-item label="手机号"><el-input v-model="form.mobile" /></el-form-item>
            <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSave">保存修改</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        <el-card shadow="never" style="margin-top: 16px">
          <template #header><span class="display-title" style="font-size: 18px; font-weight: 700">修改密码</span></template>
          <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="90px" style="max-width: 480px">
            <el-form-item label="原密码" prop="oldPassword"><el-input v-model="pwdForm.oldPassword" type="password" show-password /></el-form-item>
            <el-form-item label="新密码" prop="newPassword"><el-input v-model="pwdForm.newPassword" type="password" show-password /></el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword"><el-input v-model="pwdForm.confirmPassword" type="password" show-password /></el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangePwd">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { changePassword, updateProfile } from '@/api/auth'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const initial = computed(() => (userInfo.value?.username || 'A').charAt(0).toUpperCase())

const form = reactive({ nickname: '', mobile: '', email: '' })
const pwdFormRef = ref<FormInstance>()
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度需为 6-32 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== pwdForm.newPassword) callback(new Error('两次密码不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

onMounted(async () => {
  const info = await userStore.fetchUserInfo()
  Object.assign(form, { nickname: info?.nickname, mobile: info?.mobile, email: info?.email })
})

async function handleSave() {
  await updateProfile({ nickname: form.nickname, mobile: form.mobile, email: form.email })
  await userStore.fetchUserInfo()
  ElMessage.success('Success')
}
async function handleChangePwd() {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate(async (valid) => {
    if (!valid) return
    await changePassword(pwdForm.oldPassword, pwdForm.newPassword)
    ElMessage.success('Success')
    pwdForm.oldPassword = pwdForm.newPassword = pwdForm.confirmPassword = ''
  })
}
</script>

<style lang="scss" scoped>
.profile-card {
  .avatar-wrap {
    text-align: center;
    padding: 24px 0;
    border-bottom: 1px solid #D9D2C4;
  }
  .profile-meta {
    padding: 16px 0;
    .meta-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
      border-bottom: 1px solid #D9D2C4;
      &:last-child { border-bottom: none; }
      span { color: #8A8A8A; }
    }
  }
}
</style>
