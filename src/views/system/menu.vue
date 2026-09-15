<template>
  <div class="page">
    <div class="toolbar">
      <el-button type="primary" @click="openAdd(null)">新增菜单</el-button>
    </div>
    <el-card shadow="never">
      <el-table :data="menuTree" v-loading="loading" row-key="id" :tree-props="{ children: 'children' }" default-expand-all>
        <el-table-column prop="menuName" label="菜单名称" min-width="200" />
        <el-table-column prop="path" label="路由地址" width="180" />
        <el-table-column prop="permCode" label="权限标识" width="180" />
        <el-table-column prop="apiPath" label="接口路径" width="180" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.menuType === 1 ? 'primary' : row.menuType === 2 ? 'success' : 'info'" effect="plain">
              {{ row.menuType === 1 ? '目录' : row.menuType === 2 ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="显示" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.visible === 1 ? 'success' : 'info'" effect="plain">
              {{ row.visible === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openAdd(row)">新增子级</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" :disabled="row.id <= 5" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑菜单' : (form.parentId ? '新增子菜单' : '新增菜单')" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="菜单名称" prop="menuName"><el-input v-model="form.menuName" /></el-form-item>
        <el-form-item label="类型" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio :value="1">目录</el-radio>
            <el-radio :value="2">菜单</el-radio>
            <el-radio :value="3">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="路由地址"><el-input v-model="form.path" placeholder="如 /system/user" /></el-form-item>
        <el-form-item label="权限标识"><el-input v-model="form.permCode" placeholder="如 system:user:list" /></el-form-item>
        <el-form-item label="接口路径"><el-input v-model="form.apiPath" placeholder="如 /api/system/user/list" /></el-form-item>
        <el-form-item label="图标"><el-input v-model="form.icon" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="是否显示">
          <el-switch v-model="form.visible" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { confirm } from '@/utils/confirm'
import { listMenus, addMenu, editMenu, deleteMenu } from '@/api/menu'

const loading = ref(false)
const menuTree = ref<any[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  id: null as number | null,
  parentId: 0,
  menuName: '',
  menuType: 2,
  path: '',
  permCode: '',
  apiPath: '',
  icon: '',
  sort: 0,
  visible: 1,
})
const rules: FormRules = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
}

async function loadData() {
  loading.value = true
  try { menuTree.value = (await listMenus()) as any } finally { loading.value = false }
}

function openAdd(row: any) {
  isEdit.value = false
  Object.assign(form, {
    id: null,
    parentId: row?.id ?? 0,
    menuName: '',
    menuType: row ? 2 : 1,
    path: '',
    permCode: '',
    apiPath: '',
    icon: '',
    sort: 0,
    visible: 1,
  })
  dialogVisible.value = true
}

function openEdit(row: any) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    parentId: row.parentId ?? 0,
    menuName: row.menuName,
    menuType: row.menuType,
    path: row.path,
    permCode: row.permCode,
    apiPath: row.apiPath,
    icon: row.icon,
    sort: row.sort,
    visible: row.visible,
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    const payload = { ...form, parentId: form.parentId ?? 0 }
    if (isEdit.value) await editMenu(payload)
    else await addMenu(payload)
    ElMessage.success('Success')
    dialogVisible.value = false
    loadData()
  })
}

async function handleDelete(row: any) {
  await confirm(`确定删除菜单「${row.menuName}」？`)
  await deleteMenu(row.id)
  ElMessage.success('Success')
  loadData()
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.page { .toolbar { margin-bottom: 16px; } }
</style>
