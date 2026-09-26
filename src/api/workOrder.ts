import { request } from '@/utils/request'

/** 工单类型枚举映射 */
export const WorkOrderTypeMap: Record<number, string> = {
  1: '问题反馈', 2: '功能建议', 3: '故障报修', 4: '其他',
}

/** 工单状态枚举映射 */
export const WorkOrderStatusMap: Record<number, string> = {
  1: '待处理', 2: '处理中', 3: '已解决', 4: '已驳回', 5: '已关闭',
}

/** 优先级枚举映射 */
export const WorkOrderPriorityMap: Record<number, string> = {
  1: '低', 2: '中', 3: '高', 4: '紧急',
}

/** 状态对应 el-tag type */
export const WorkOrderStatusTag: Record<number, string> = {
  1: 'warning', 2: 'primary', 3: 'success', 4: 'danger', 5: 'info',
}

/** 优先级对应 el-tag type */
export const WorkOrderPriorityTag: Record<number, string> = {
  1: 'info', 2: 'primary', 3: 'warning', 4: 'danger',
}

// ======================== 用户端 ========================

/** 提交工单 */
export function createWorkOrder(data: { title: string; type: number; content: string; priority?: number }) {
  return request({ url: '/api/work-order', method: 'post', data })
}

/** 我的工单分页 */
export function myWorkOrderPage(params: { page: number; size: number; status?: number | null }) {
  return request({ url: '/api/work-order/page', method: 'get', params })
}

/** 工单详情 */
export function getWorkOrderDetail(id: string | number) {
  return request({ url: `/api/work-order/${id}`, method: 'get' })
}

/** 工单回复记录 */
export function getWorkOrderReplies(id: string | number) {
  return request({ url: `/api/work-order/replies/${id}`, method: 'get' })
}

// ======================== 管理端 ========================

/** 全部工单分页 */
export function adminWorkOrderPage(params: {
  page: number; size: number; status?: number | null
  type?: number | null; priority?: number | null; keyword?: string
}) {
  return request({ url: '/api/work-order/manager/page', method: 'get', params })
}

/** 管理端工单详情 */
export function adminGetWorkOrderDetail(id: string | number) {
  return request({ url: `/api/work-order/manager/${id}`, method: 'get' })
}

/** 处理工单 */
export function processWorkOrder(id: string | number, data: { result: number; opinion: string }) {
  return request({ url: `/api/work-order/manager/process/${id}`, method: 'post', data })
}

/** 回复工单 */
export function replyWorkOrder(id: string | number, data: { content: string }) {
  return request({ url: `/api/work-order/manager/reply/${id}`, method: 'post', data })
}
