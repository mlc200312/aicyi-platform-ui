<template>
  <div class="login-page">
    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- 头部深色区 -->
      <div class="card-header">
        <div class="logo">
          <el-icon :size="28"><Platform /></el-icon>
        </div>
        <h1 class="title">aicyi-platform</h1>
        <p class="subtitle">统一授权认证后台管理系统</p>
      </div>

      <!-- 表单区 -->
      <div class="card-body">
        <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleLogin">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="admin" size="large" :prefix-icon="User" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password :prefix-icon="Lock" @keyup.enter="handleLogin" />
          </el-form-item>
          <div class="form-options">
            <el-checkbox v-model="form.remember">记住我</el-checkbox>
            <a class="forgot-link" href="javascript:;">忘记密码？</a>
          </div>
          <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form>
      </div>

      <!-- 底部版权 -->
      <div class="card-footer">
        Copyright © 2026 aicyi-platform All Rights Reserved.
      </div>
    </div>

    <!-- 初始密码修改弹窗 -->
    <el-dialog v-model="showPwdDialog" title="修改初始密码" width="420px" :close-on-click-modal="false">
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="90px">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="handleChangePwd">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Platform } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { changePassword } from '@/api/auth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ username: 'admin', password: '', remember: false })
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度需为 6-32 位', trigger: 'blur' },
  ],
}

const showPwdDialog = ref(false)
const pwdFormRef = ref<FormInstance>()
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdRules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度需为 6-32 位', trigger: 'blur' },
  ],
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

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const res: any = await userStore.login(form.username, form.password)
      if (res.needChangePassword) {
        showPwdDialog.value = true
      } else {
        ElMessage.success('Success')
        router.push((route.query.redirect as string) || '/dashboard')
      }
    } finally {
      loading.value = false
    }
  })
}

async function handleChangePwd() {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate(async (valid) => {
    if (!valid) return
    await changePassword(pwdForm.oldPassword, pwdForm.newPassword)
    ElMessage.success('Success')
    showPwdDialog.value = false
    userStore.logout()
    router.push('/login')
  })
}
</script>

<style lang="scss" scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $gradient-start 0%, $gradient-end 100%);
}

.login-card {
  width: 420px;
  background: $bg-card;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.card-header {
  background: $header-dark;
  padding: 36px 40px 28px;
  text-align: center;
  color: #fff;

  .logo {
    width: 56px;
    height: 56px;
    margin: 0 auto 14px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }

  .title {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 6px;
    letter-spacing: 0.02em;
  }

  .subtitle {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
  }
}

.card-body {
  padding: 28px 40px 20px;

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: $ink;
  }

  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: -4px 0 18px;

    .forgot-link {
      font-size: 13px;
      color: $primary;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  }

  .login-btn {
    width: 100%;
    height: 44px;
    font-size: 15px;
    letter-spacing: 0.15em;
    border-radius: 6px;
  }
}

.card-footer {
  padding: 16px 40px;
  text-align: center;
  font-size: 12px;
  color: $ink-muted;
  border-top: 1px solid $ink-line;
}
</style>
