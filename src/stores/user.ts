import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, logout as logoutApi, getUserInfo } from '@/api/auth'
import { getAccessToken, setTokenMode, setTokens, clearTokens } from '@/utils/token'

export const useUserStore = defineStore('user', () => {
  const token = ref(getAccessToken() || '')
  const userInfo = ref<any>(null)

  async function login(username: string, password: string, remember = false) {
    setTokenMode(remember)
    const res: any = await loginApi(username, password)
    token.value = res.accessToken
    setTokens(res.accessToken, res.refreshToken)
    if (res.needChangePassword) {
      return { needChangePassword: true }
    }
    await fetchUserInfo()
    return { needChangePassword: false }
  }

  async function fetchUserInfo() {
    userInfo.value = await getUserInfo()
    return userInfo.value
  }

  async function logout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')
      if (refreshToken) await logoutApi(refreshToken)
    } finally {
      token.value = ''
      userInfo.value = null
      clearTokens()
    }
  }

  return { token, userInfo, login, fetchUserInfo, logout }
})
