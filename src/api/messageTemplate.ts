import { request } from '@/utils/request'

/** 消息模板分页查询 */
export function listMessageTemplates(params: { page: number; size: number; [key: string]: any }) {
  return request({ url: '/api/message/template/list', method: 'get', params })
}

/** 消息模板详情 */
export function getMessageTemplate(id: number | string) {
  return request({ url: `/api/message/template/${id}`, method: 'get' })
}

/** 新增消息模板 */
export function addMessageTemplate(data: any) {
  return request({ url: '/api/message/template/add', method: 'post', data })
}

/** 编辑消息模板 */
export function editMessageTemplate(id: number | string, data: any) {
  return request({ url: `/api/message/template/edit/${id}`, method: 'put', data })
}

/** 删除消息模板 */
export function deleteMessageTemplate(id: number | string) {
  return request({ url: '/api/message/template/delete', method: 'post', params: { id } })
}

/** 启用/禁用消息模板 */
export function changeTemplateStatus(id: number | string, status: number) {
  return request({ url: `/api/message/template/status/${id}`, method: 'put', params: { status } })
}

/** 测试发送消息（按消息类型校验接收者，渲染模板后真实发送） */
export function testSendMessageTemplate(
  id: number | string,
  data: { receiver: string; params?: Record<string, string> },
) {
  return request({
    url: `/api/message/template/test-send/${id}`,
    method: 'post',
    data,
    timeout: 30000,
  })
}
