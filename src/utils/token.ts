/**
 * Token 统一存取工具。
 * 记住我 → localStorage（持久化，关闭浏览器不丢失）
 * 不记住 → sessionStorage（关闭浏览器即失效）
 */

const ACCESS_KEY = 'accessToken'
const REFRESH_KEY = 'refreshToken'

type StorageMode = 'local' | 'session'

// 初始化时根据已有 token 判断当前模式
let storageMode: StorageMode = localStorage.getItem(ACCESS_KEY) ? 'local' : 'session'

function getStorage(): Storage {
  return storageMode === 'local' ? localStorage : sessionStorage
}

/** 设置存储模式（登录时根据"记住我"勾选调用） */
export function setTokenMode(remember: boolean) {
  storageMode = remember ? 'local' : 'session'
}

/** 读取 accessToken（两处都查，兼容历史数据） */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY)
}

/** 读取 refreshToken（两处都查） */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY)
}

/** 存入 token 对（按当前模式存入对应 storage） */
export function setTokens(accessToken: string, refreshToken: string) {
  const storage = getStorage()
  storage.setItem(ACCESS_KEY, accessToken)
  storage.setItem(REFRESH_KEY, refreshToken)
}

/** 清理所有 token（两处都清，登出/过期兜底用） */
export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  sessionStorage.removeItem(ACCESS_KEY)
  sessionStorage.removeItem(REFRESH_KEY)
}
