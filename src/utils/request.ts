import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import router from '@/router'
import { useErrorStore } from '@/stores/error'

const service: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 15000,
})

// ===== Token 刷新并发控制 =====
// 多个请求同时 40102 时，只触发一次 refresh，其余请求排队等新 token 后重试
let isRefreshing = false
let pendingQueue: Array<(token: string) => void> = []

/** 调用后端刷新令牌，成功后更新本地存储并返回新 accessToken */
function doRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    return Promise.reject(new Error('no refresh token'))
  }
  // 用原生 axios 避免走本文件的请求/响应拦截器（refresh 本身不需要 accessToken）
  return axios
    .post('/api/auth/refresh', { refreshToken })
    .then((res) => {
      const body = res.data
      if (body.code !== 0) {
        throw new Error(body.message || 'refresh failed')
      }
      const { accessToken, refreshToken: newRefreshToken } = body.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', newRefreshToken)
      return accessToken
    })
}

/** 刷新失败兜底：清空令牌并跳转登录 */
function handleRefreshFail() {
  pendingQueue = []
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  const errorStore = useErrorStore()
  errorStore.showError('登录已过期，请重新登录')
  router.push('/login')
}

// 请求拦截：携带 Token
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截：统一处理业务码
service.interceptors.response.use(
  (response) => {
    const res = response.data
    const errorStore = useErrorStore()
    // 后端统一返回 { code, data, message }
    if (res.code !== undefined && res.code !== 0) {
      // 40101 未登录 → 直接跳登录页
      if (res.code === 40101) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        errorStore.showError(res.message || '请先登录')
        router.push('/login')
        return Promise.reject(new Error(res.message || '未登录'))
      }

      // 40102 Token 过期 → 自动刷新令牌并重试原请求，不跳登录页
      if (res.code === 40102) {
        const config = response.config as AxiosRequestConfig
        if (!isRefreshing) {
          isRefreshing = true
          doRefresh()
            .then((newToken) => {
              // 刷新成功：唤醒所有排队请求，用新 token 重试
              pendingQueue.forEach((cb) => cb(newToken))
              pendingQueue = []
            })
            .catch(() => {
              // 刷新失败（refreshToken 也过期等）：兜底跳登录
              handleRefreshFail()
            })
            .finally(() => {
              isRefreshing = false
            })
        }
        // 当前请求挂起，等 refresh 完成后用新 token 重试
        return new Promise((resolve) => {
          pendingQueue.push((newToken) => {
            config.headers = config.headers || {}
            config.headers.Authorization = `Bearer ${newToken}`
            resolve(service.request(config))
          })
        })
      }

      // 其他业务错误：顶部 banner 提示
      errorStore.showError(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    const errorStore = useErrorStore()
    errorStore.showError(error.message || '网络异常，请稍后重试')
    return Promise.reject(error)
  },
)

export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  return service.request(config).then((res) => res.data as T)
}

export default service
