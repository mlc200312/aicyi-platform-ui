import { request } from '@/utils/request'

export function login(username: string, password: string) {
  return request({ url: '/api/auth/login', method: 'post', data: { username, password } })
}

export function logout(refreshToken: string) {
  return request({ url: '/api/auth/logout', method: 'post', data: { refreshToken } })
}

export function refreshToken(refreshToken: string) {
  return request({ url: '/api/auth/refresh', method: 'post', data: { refreshToken } })
}

export function changePassword(oldPassword: string, newPassword: string) {
  return request({ url: '/api/auth/change-password', method: 'post', data: { oldPassword, newPassword } })
}

export function getUserInfo() {
  return request({ url: '/api/system/profile/info', method: 'get' })
}
