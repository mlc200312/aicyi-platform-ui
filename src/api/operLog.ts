import { request } from '@/utils/request'

/** 分页查询操作日志 */
export function listOperLogs(params: { page: number; size: number; [key: string]: any }) {
  return request({ url: '/api/system/oper-log/list', method: 'get', params })
}

/** 操作日志详情 */
export function getOperLogDetail(id: number | string) {
  return request({ url: `/api/system/oper-log/${id}`, method: 'get' })
}
