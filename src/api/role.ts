import { request } from '@/utils/request'

export function listRoles(params: any) {
  return request({ url: '/api/system/role/list', method: 'get', params })
}
export function listAllRoles() {
  return request({ url: '/api/system/role/all', method: 'get' })
}
export function addRole(data: any) {
  return request({ url: '/api/system/role/add', method: 'post', data })
}
export function editRole(id: number, data: any) {
  return request({ url: `/api/system/role/edit/${id}`, method: 'put', data })
}
export function deleteRole(id: number) {
  return request({ url: '/api/system/role/delete', method: 'post', params: { id } })
}
export function changeRoleStatus(id: number, status: number) {
  return request({ url: `/api/system/role/status/${id}`, method: 'put', params: { status } })
}
export function assignRoleMenus(id: number, menuIds: number[]) {
  return request({ url: `/api/system/role/assign-perm/${id}`, method: 'put', data: { menuIds } })
}
export function getRoleMenuIds(id: number) {
  return request({ url: `/api/system/role/menu-ids/${id}`, method: 'get' })
}
