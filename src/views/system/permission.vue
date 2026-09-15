<template>
  <div class="page">
    <el-card shadow="never">
      <el-form :inline="true">
        <el-form-item label="选择用户">
          <el-select v-model="selectedUserId" placeholder="请选择用户" filterable style="width: 240px" @change="loadPerms">
            <el-option v-for="u in userList" :key="u.id" :label="u.username" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAssign">保存权限</el-button>
          <el-button @click="handleReset">重置权限</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px" v-loading="loading">
      <template #header>
        <span class="display-title" style="font-size: 18px; font-weight: 700">权限分配（角色权限 + 用户单独权限）</span>
      </template>
      <el-alert type="info" :closable="false" style="margin-bottom: 16px">
        勾选的权限将作为该用户的单独权限追加（优先级高于角色权限）；取消勾选则扣除对应权限。
      </el-alert>
      <el-tree
        ref="treeRef" :data="permTree" show-checkbox node-key="id"
        default-expand-all
        :default-checked-keys="checkedPermIds" :props="{ label: 'menuName', children: 'children' }"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { confirm } from '@/utils/confirm'
import { listUsers } from '@/api/user'
import { listPermissions, assignPermissions, resetPermissions } from '@/api/permission'
import { listMenus } from '@/api/menu'

const loading = ref(false)
const userList = ref<any[]>([])
const selectedUserId = ref<number | null>(null)
const permTree = ref<any[]>([])
const checkedPermIds = ref<number[]>([])
const treeRef = ref()

async function loadUsers() {
  const res: any = await listUsers({ page: 1, size: 100 })
  userList.value = res.records || res.list || []
}
async function loadPerms() {
  if (!selectedUserId.value) return
  loading.value = true
  try {
    const data: any = await listPermissions(selectedUserId.value)
    // 菜单树（树形结构，含层级）
    permTree.value = await listMenus()
    // 根据有效权限标识集合，匹配菜单 ID 进行勾选
    const perms: string[] = data.permissions || []
    checkedPermIds.value = collectCheckedIds(permTree.value, perms)
  } finally { loading.value = false }
}

/** 遍历菜单树，收集 permCode 在有效权限集合中的节点 ID */
function collectCheckedIds(nodes: any[], codes: string[]): number[] {
  const ids: number[] = []
  function walk(list: any[]) {
    for (const n of list) {
      if (n.permCode && codes.includes(n.permCode)) {
        ids.push(n.id)
      }
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return ids
}
async function handleAssign() {
  if (!selectedUserId.value) { ElMessage.warning('请先选择用户'); return }
  const keys = treeRef.value.getCheckedKeys()
  await assignPermissions(selectedUserId.value, keys)
  ElMessage.success('Success')
}
async function handleReset() {
  if (!selectedUserId.value) { ElMessage.warning('请先选择用户'); return }
  await confirm('确定重置该用户权限为默认？')
  await resetPermissions(selectedUserId.value)
  ElMessage.success('Success')
  loadPerms()
}
onMounted(loadUsers)
</script>
