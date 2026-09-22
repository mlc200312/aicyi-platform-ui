import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import router from '@/router'
import { useErrorStore } from '@/stores/error'
import { useLoadingStore } from '@/stores/loading'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/utils/token'

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
  const refreshToken = getRefreshToken()
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
      setTokens(accessToken, newRefreshToken)
      return accessToken
    })
}

/** 刷新失败兜底：清空令牌并跳转登录 */
function handleRefreshFail() {
  pendingQueue = []
  clearTokens()
  const errorStore = useErrorStore()
  errorStore.showError('登录已过期，请重新登录')
  router.push('/login')
}

// 请求拦截：携带 Token + 全局 loading
service.interceptors.request.use(
  (config) => {
    useLoadingStore().start()
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    useLoadingStore().done()
    return Promise.reject(error)
  },
)

// 响应拦截：统一处理业务码 + 关闭全局 loading
service.interceptors.response.use(
  (response) => {
    const loadingStore = useLoadingStore()
    // 文件流响应（blob / arraybuffer）：非 Result 包装，直接透传给下载工具处理
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      loadingStore.done()
      return response
    }
    const res = response.data
    const errorStore = useErrorStore()
    // 后端统一返回 { code, data, message }
    if (res.code !== undefined && res.code !== 0) {
      // 40101 未登录 → 直接跳登录页
      if (res.code === 40101) {
        loadingStore.done()
        clearTokens()
        errorStore.showError(res.message || '请先登录')
        router.push('/login')
        return Promise.reject(new Error(res.message || '未登录'))
      }

      // 40102 Token 过期 → 自动刷新令牌并重试原请求，不跳登录页
      if (res.code === 40102) {
        loadingStore.done() // 当前请求已响应，重试请求会重新 start
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
      loadingStore.done()
      errorStore.showError(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    loadingStore.done()
    return res
  },
  (error) => {
    useLoadingStore().done()
    const errorStore = useErrorStore()
    errorStore.showError(error.message || '网络异常，请稍后重试')
    return Promise.reject(error)
  },
)

export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  return service.request(config).then((res) => res.data as T)
}

/**
 * 文件下载：请求二进制流并触发浏览器保存，返回实际保存的文件名。
 *
 * 后端业务异常时仍返回 HTTP 200 + JSON 错误体（blob），
 * 此处识别后解析 message 并抛出，避免把错误 JSON 存成文件。
 */
export async function download(config: AxiosRequestConfig, fallbackName = '导出文件'): Promise<string> {
  const response = await service.request<Blob>({ ...config, responseType: 'blob' })
  const blob = response.data
  if (blob && typeof blob.type === 'string' && blob.type.includes('application/json')) {
    const body = JSON.parse(await blob.text())
    useErrorStore().showError(body.message || '下载失败')
    throw new Error(body.message || '下载失败')
  }

  const filename = resolveFilename(response.headers?.['content-disposition'], fallbackName)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
  return filename
}

/**
 * 解析 Content-Disposition 文件名（RFC 5987 filename* 优先，回退 filename，兜底默认名）
 */
function resolveFilename(disposition: string | undefined, fallback: string): string {
  if (!disposition) {
    return fallback
  }
  const encoded = disposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i)
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ''))
    } catch {
      // 编码异常时回退普通 filename
    }
  }
  const plain = disposition.match(/filename="?([^";]+)"?/i)
  return plain ? plain[1] : fallback
}

export default service
