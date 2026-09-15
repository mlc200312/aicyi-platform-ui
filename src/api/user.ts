import { request } from '@/utils/request'

export function listUsers(params: any) {
  return request({ url: '/api/system/user/list', method: 'get', params })
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
