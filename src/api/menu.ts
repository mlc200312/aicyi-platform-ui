import { request } from '@/utils/request'

export function listMenus() {
  return request({ url: '/api/system/menu/list', method: 'get' })
}
export function listAllMenus() {
  return request({ url: '/api/system/menu/all', method: 'get' })
}
export function addMenu(data: any) {
  return request({ url: '/api/system/menu/add', method: 'post', data })
}
export function editMenu(data: any) {
  return request({ url: '/api/system/menu/edit', method: 'put', data })
}
export function deleteMenu(id: number) {
  return request({ url: '/api/system/menu/delete', method: 'post', params: { id } })
}
