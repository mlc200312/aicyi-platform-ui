import { request } from '@/utils/request'

/** 消息模板分页查询 */
export function listMessageTemplates(params: { page: number; size: number; [key: string]: any }) {
  return request({ url: '/api/system/message-template/list', method: 'get', params })
}

/** 消息模板详情 */
export function getMessageTemplate(id: number | string) {
  return request({ url: `/api/system/message-template/${id}`, method: 'get' })
}

/** 新增消息模板 */
export function addMessageTemplate(data: any) {
  return request({ url: '/api/system/message-template/add', method: 'post', data })
}

/** 编辑消息模板 */
export function editMessageTemplate(id: number | string, data: any) {
  return request({ url: `/api/system/message-template/edit/${id}`, method: 'put', data })
}

/** 删除消息模板 */
export function deleteMessageTemplate(id: number | string) {
  return request({ url: '/api/system/message-template/delete', method: 'post', params: { id } })
}

/** 启用/禁用消息模板 */
export function changeTemplateStatus(id: number | string, status: number) {
  return request({ url: `/api/system/message-template/status/${id}`, method: 'put', params: { status } })
}
