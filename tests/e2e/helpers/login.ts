import { expect, type Page } from '@playwright/test'

/**
 * 登录助手：等待登录 API 响应并校验业务码，失败时输出响应体便于诊断。
 * 供各 spec 复用（Playwright 禁止 spec 文件互相导入，助手必须独立成模块）。
 */
export async function login(page: Page, username = 'admin', password = 'admin123'): Promise<void> {
  await page.goto('/login')
  await page.locator('input[placeholder="admin"]').fill(username)
  await page.locator('input[type="password"]').first().fill(password)
  const loginResp = page.waitForResponse(r => r.url().includes('/api/auth/login'), { timeout: 15_000 })
  await page.locator('.login-btn').click()
  const resp = await loginResp
  const body = await resp.json().catch(() => ({ code: 'HTTP_' + resp.status() }))
  if (body.code !== 0) {
    throw new Error(`登录接口业务失败: code=${body.code} message=${body.message}`)
  }
  await page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 15_000 })
}

/** 断言当前页面无未捕获 JS 异常（配合 pageerror 监听使用） */
export function expectNoPageErrors(pageErrors: string[], where: string): void {
  expect(pageErrors, `${where} 不应有未捕获 JS 异常: ${pageErrors.join(' | ')}`).toHaveLength(0)
}
