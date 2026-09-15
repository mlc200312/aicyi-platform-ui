<template>
  <div class="page">
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="角色名称">
          <el-input v-model="query.roleName" placeholder="请输入角色名称" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="toolbar">
      <el-button type="primary" @click="openAdd">新增角色</el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="roleName" label="角色名称" width="160" />
        <el-table-column prop="roleKey" label="角色标识" width="160" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="plain">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="row.roleKey === 'super_admin'" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openAssignMenu(row)">分配权限</el-button>
            <el-button link :type="row.status === 1 ? 'warning' : 'success'" :disabled="row.roleKey === 'super_admin'" @click="toggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" :disabled="row.roleKey === 'super_admin'" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="query.page" v-model:page-size="query.size" :total="total"
        :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData" @current-change="loadData" style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '新增角色'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="角色名称" prop="roleName"><el-input v-model="form.roleName" /></el-form-item>
        <el-form-item label="角色标识" prop="roleKey"><el-input v-model="form.roleKey" :disabled="isEdit" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
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

    <el-dialog v-model="menuDialogVisible" title="分配菜单权限" width="500px">
      <el-tree
        ref="treeRef" :data="menuTree" show-checkbox node-key="id"
        default-expand-all
        :default-checked-keys="checkedMenuIds" :props="{ label: 'menuName', children: 'children' }"
      />
      <template #footer>
        <el-button @click="menuDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignMenu">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { confirm } from '@/utils/confirm'
import { listRoles, addRole, editRole, deleteRole, changeRoleStatus, assignRoleMenus, getRoleMenuIds } from '@/api/role'
import { listMenus } from '@/api/menu'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 10, roleName: '' })

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ id: null as number | null, roleName: '', roleKey: '', description: '', status: 1 })
const rules: FormRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleKey: [{ required: true, message: '请输入角色标识', trigger: 'blur' }],
}

const menuDialogVisible = ref(false)
const menuTree = ref<any[]>([])
const checkedMenuIds = ref<number[]>([])
const currentRoleId = ref<number | null>(null)
const treeRef = ref()

async function loadData() {
  loading.value = true
  try {
    const res: any = await listRoles(query)
    tableData.value = res.records || res.list || []
    total.value = res.total || 0
  } finally { loading.value = false }
}
function resetQuery() { query.roleName = ''; query.page = 1; loadData() }

function openAdd() {
  isEdit.value = false
  Object.assign(form, { id: null, roleName: '', roleKey: '', description: '', status: 1 })
  dialogVisible.value = true
}
function openEdit(row: any) {
  isEdit.value = true
  Object.assign(form, { id: row.id, roleName: row.roleName, roleKey: row.roleKey, description: row.description, status: row.status })
  dialogVisible.value = true
}
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (isEdit.value) await editRole(form.id!, { roleName: form.roleName, description: form.description, status: form.status })
    else await addRole({ roleName: form.roleName, roleKey: form.roleKey, description: form.description })
    ElMessage.success('Success')
    dialogVisible.value = false
    loadData()
  })
}
async function toggleStatus(row: any) {
  await changeRoleStatus(row.id, row.status === 1 ? 0 : 1)
  ElMessage.success('Success')
  loadData()
}
async function handleDelete(row: any) {
  await confirm(`确定删除角色「${row.roleName}」？`)
  await deleteRole(row.id)
  ElMessage.success('Success')
  loadData()
}
async function openAssignMenu(row: any) {
  currentRoleId.value = row.id
  menuTree.value = (await listMenus()) as any
  checkedMenuIds.value = (await getRoleMenuIds(row.id)) as any
  menuDialogVisible.value = true
}
async function handleAssignMenu() {
  const keys = treeRef.value.getCheckedKeys()
  await assignRoleMenus(currentRoleId.value!, keys)
  ElMessage.success('Success')
  menuDialogVisible.value = false
}
onMounted(loadData)
</script>

<style lang="scss" scoped>
.page { .search-card { margin-bottom: 16px; } .toolbar { margin-bottom: 16px; } }
</style>
