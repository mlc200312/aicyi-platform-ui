import { request } from '@/utils/request'

export function listPermissions(userId: number) {
  return request({ url: '/api/system/perm/list', method: 'get', params: { userId } })
}
export function assignPermissions(userId: number, permIds: number[]) {
  return request({ url: '/api/system/perm/assign', method: 'put', params: { userId }, data: { permIds } })
}
export function resetPermissions(userId: number) {
  return request({ url: '/api/system/perm/reset', method: 'post', params: { userId } })
}
