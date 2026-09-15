<template>
  <div class="log-page">
    <el-card shadow="never">
      <template #header>
        <span style="font-size: 15px; font-weight: 600">操作日志</span>
      </template>
      <el-table :data="logs" style="width: 100%">
        <el-table-column prop="time" label="操作时间" width="180" />
        <el-table-column prop="user" label="操作人" width="120" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="action" label="操作内容" />
        <el-table-column prop="ip" label="IP" width="160" />
        <el-table-column label="结果" width="80">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">{{ row.success ? '成功' : '失败' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
const logs = [
  { time: '2026-09-14 10:23:15', user: 'admin', module: '登录认证', action: '登录系统', ip: '192.168.1.10', success: true },
  { time: '2026-09-14 09:48:02', user: 'zhangsan', module: '用户管理', action: '修改个人信息', ip: '192.168.1.22', success: true },
  { time: '2026-09-13 16:30:44', user: 'admin', module: '用户管理', action: '新增用户 lisi', ip: '192.168.1.10', success: true },
  { time: '2026-09-13 14:12:08', user: 'admin', module: '角色管理', action: '分配角色权限', ip: '192.168.1.10', success: true },
  { time: '2026-09-13 11:05:33', user: 'lisi', module: '登录认证', action: '登录失败（密码错误）', ip: '192.168.1.30', success: false },
]
</script>

<style lang="scss" scoped>
.log-page {
  .el-card {
    border-radius: 8px;
  }
}
</style>
