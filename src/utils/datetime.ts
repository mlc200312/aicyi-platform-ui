/**
 * 相对时间格式化：刚刚 / N 分钟前 / N 小时前 / 昨天 / MM-DD / yyyy-MM-DD
 * 入参为后端 "yyyy-MM-dd HH:mm:ss" 格式字符串
 */
export function formatRelativeTime(input: string | null | undefined): string {
  if (!input) return ''
  // iOS Safari 不识别 "yyyy-MM-dd HH:mm:ss"，统一替换为斜杠
  const time = new Date(input.replace(/-/g, '/')).getTime()
  if (Number.isNaN(time)) return input

  const diff = Date.now() - time
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 2 * day) return '昨天'

  const d = new Date(time)
  const pad = (n: number) => String(n).padStart(2, '0')
  const md = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return d.getFullYear() === new Date().getFullYear() ? md : `${d.getFullYear()}-${md}`
}
