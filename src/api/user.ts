import { request, download } from '@/utils/request'

export function listUsers(params: any) {
  return request({ url: '/api/system/user/list', method: 'get', params })
}
/** 按当前查询条件导出用户列表 Excel，返回实际保存的文件名 */
export function exportUsers(params: { username?: string; status?: number | null }) {
  return download(
    { url: '/api/system/user/export', method: 'post', data: params },
    '用户列表.xlsx',
  )
}
export function addUser(data: any) {
  return request({ url: '/api/system/user/add', method: 'post', data })
}
export function editUser(id: number, data: any) {
  return request({ url: `/api/system/user/edit/${id}`, method: 'put', data })
}
export function deleteUser(id: number) {
  return request({ url: '/api/system/user/delete', method: 'post', params: { id } })
}
/** 批量删除用户（admin 账号后端自动跳过），返回实际删除数量 */
export function batchDeleteUsers(ids: number[]) {
  return request({ url: '/api/system/user/batch-delete', method: 'post', data: { ids } })
}
export function changeUserStatus(id: number, status: number) {
  return request({ url: `/api/system/user/status/${id}`, method: 'put', params: { status } })
}
export function resetUserPassword(id: number, newPassword: string) {
  return request({ url: `/api/system/user/reset-password/${id}`, method: 'put', data: { newPassword } })
}
export function assignUserRoles(id: number, roleIds: number[]) {
  return request({ url: `/api/system/user/assign-role/${id}`, method: 'put', data: { roleIds } })
}
export function getUserRoles(id: number) {
  return request({ url: `/api/system/user/roles/${id}`, method: 'get' })
}
