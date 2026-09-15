<template>
  <div class="page">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="用户名">
          <el-input v-model="query.username" placeholder="请输入用户名" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
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

    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="openAdd">新增用户</el-button>
    </div>

    <!-- 表格 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="mobile" label="手机号" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="plain">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openAssignRole(row)">分配角色</el-button>
            <el-button link type="warning" @click="openResetPwd(row)">重置密码</el-button>
            <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" :disabled="row.username === 'admin'" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
        style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.mobile" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配角色弹窗 -->
    <el-dialog v-model="roleDialogVisible" title="分配角色" width="420px">
      <el-checkbox-group v-model="selectedRoleIds">
        <el-checkbox v-for="r in allRoles" :key="r.id" :value="r.id" style="display: block; margin: 8px 0">
          {{ r.roleName }}（{{ r.roleKey }}）
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignRole">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="pwdDialogVisible" title="重置密码" width="400px">
      <el-form ref="resetPwdFormRef" :model="resetPwdForm" :rules="resetPwdRules" label-width="90px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetPwdForm.password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleResetPwd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { confirm } from '@/utils/confirm'
import { listUsers, addUser, editUser, deleteUser, changeUserStatus, resetUserPassword, assignUserRoles, getUserRoles } from '@/api/user'
import { listAllRoles } from '@/api/role'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10, username: '', status: null as number | null })

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ id: null as number | null, username: '', password: '', nickname: '', mobile: '', email: '', status: 1 })
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度需为 6-32 位', trigger: 'blur' },
  ],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
}

const roleDialogVisible = ref(false)
const allRoles = ref<any[]>([])
const selectedRoleIds = ref<number[]>([])
const currentUserId = ref<number | null>(null)

const pwdDialogVisible = ref(false)
const resetPwdFormRef = ref<FormInstance>()
const resetPwdForm = reactive({ password: '' })
const resetPwdRules: FormRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度需为 6-32 位', trigger: 'blur' },
  ],
}

async function loadData() {
  loading.value = true
  try {
    const res: any = await listUsers(query)
    tableData.value = res.records || res.list || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.username = ''
  query.status = null
  query.page = 1
  loadData()
}

function openAdd() {
  isEdit.value = false
  Object.assign(form, { id: null, username: '', password: '', nickname: '', mobile: '', email: '', status: 1 })
  dialogVisible.value = true
}

function openEdit(row: any) {
  isEdit.value = true
  Object.assign(form, { id: row.id, username: row.username, password: '', nickname: row.nickname, mobile: row.mobile, email: row.email, status: row.status })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (isEdit.value) {
      await editUser(form.id!, { nickname: form.nickname, mobile: form.mobile, email: form.email, status: form.status })
      ElMessage.success('Success')
    } else {
      await addUser({ username: form.username, password: form.password, nickname: form.nickname, mobile: form.mobile, email: form.email })
      ElMessage.success('Success')
    }
    dialogVisible.value = false
    loadData()
  })
}

async function toggleStatus(row: any) {
  await changeUserStatus(row.id, row.status === 1 ? 0 : 1)
  ElMessage.success('Success')
  loadData()
}

async function handleDelete(row: any) {
  await confirm(`确定删除用户「${row.username}」？`)
  await deleteUser(row.id)
  ElMessage.success('Success')
  loadData()
}

async function openAssignRole(row: any) {
  currentUserId.value = row.id
  allRoles.value = (await listAllRoles()) as any
  const userRoles: any = await getUserRoles(row.id)
  selectedRoleIds.value = (userRoles || []).map((r: any) => r.id)
  roleDialogVisible.value = true
}

async function handleAssignRole() {
  await assignUserRoles(currentUserId.value!, selectedRoleIds.value)
  ElMessage.success('Success')
  roleDialogVisible.value = false
}

function openResetPwd(row: any) {
  currentUserId.value = row.id
  resetPwdForm.password = ''
  pwdDialogVisible.value = true
}

async function handleResetPwd() {
  if (!resetPwdFormRef.value) return
  await resetPwdFormRef.value.validate(async (valid) => {
    if (!valid) return
    await resetUserPassword(currentUserId.value!, resetPwdForm.password)
    ElMessage.success('Success')
    pwdDialogVisible.value = false
  })
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.page {
  .search-card {
    margin-bottom: 16px;
  }
  .toolbar {
    margin-bottom: 16px;
  }
}
</style>
