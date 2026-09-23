import { request } from '@/utils/request'

/** 站内消息项（后端 Long 序列化为字符串） */
export interface MessageItem {
  id: string
  title: string
  content: string | null
  /** 通知类型：1 系统通知 / 2 业务提醒 / 3 平台公告 */
  notifyType: number
  /** 已读状态：0 未读 / 1 已读 */
  readFlag: number
  readTime: string | null
  senderName: string
  createTime: string
}

/** 站内消息分页查询参数 */
export interface MessageQueryParams {
  page: number
  size: number
  notifyType?: number
  readFlag?: number
}

/** 站内消息分页查询（当前登录用户） */
export function listMessages(params: MessageQueryParams) {
  return request<{ list: MessageItem[]; total: number; page: number; size: number }>({
    url: '/api/system/message/list',
    method: 'get',
    params,
  })
}

/** 未读消息数量（导航栏铃铛徽标数据源） */
export function getUnreadCount() {
  return request<number>({ url: '/api/system/message/unread-count', method: 'get' })
}

/** 标记单条消息已读（幂等） */
export function markMessageRead(id: string | number) {
  return request<null>({ url: `/api/system/message/read/${id}`, method: 'put' })
}

/** 全部未读消息标记已读（幂等） */
export function markAllMessagesRead() {
  return request<null>({ url: '/api/system/message/read-all', method: 'put' })
}
