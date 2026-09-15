import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, logout as logoutApi, getUserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('accessToken') || '')
  const userInfo = ref<any>(null)

  async function login(username: string, password: string) {
    const res: any = await loginApi(username, password)
    token.value = res.accessToken
    localStorage.setItem('accessToken', res.accessToken)
    localStorage.setItem('refreshToken', res.refreshToken)
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
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) await logoutApi(refreshToken)
    } finally {
      token.value = ''
      userInfo.value = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  return { token, userInfo, login, fetchUserInfo, logout }
})
