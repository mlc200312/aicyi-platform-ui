import { test, expect } from '@playwright/test'
import { login } from './helpers/login'

/**
 * 认证守卫核心旅程：路由守卫拦截 / 登录失败拒绝 / 登录成功进入 / 登出回登录页。
 * 生产上线验收：认证链路是平台安全边界，四个用例全绿方可上线。
 *
 * 已知体验项（不在本套件阻断范围，见上线报告）：登录失败当前为静默拒绝
 * （无全局错误提示），断言按现行为校验「拒绝进入」这一安全语义。
 */

test.describe('认证守卫', () => {
  test('未登录访问受保护路由被重定向到登录页', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
    // 携带 redirect 回跳参数（登录后恢复目标页）
    await expect(page).toHaveURL(/redirect=/)
  })

  test('错误密码登录被拒绝（不跳转、不发令牌）', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[placeholder="admin"]').fill('admin')
    await page.locator('input[type="password"]').first().fill('wrong-password-123')
    await page.locator('.login-btn').click()
    // 安全语义：停留在登录页
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    await page.waitForTimeout(1000)
    // 令牌从未签发
    const token = await page.evaluate(() =>
      sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken'),
    )
    expect(token, '错误密码不应签发令牌').toBeFalsy()
  })

  test('正确登录进入工作台并签发令牌', async ({ page }) => {
    await login(page)
    const token = await page.evaluate(() =>
      sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken'),
    )
    expect(token, 'accessToken 应已写入存储').toBeTruthy()
  })

  test('登出后回到登录页且令牌清除', async ({ page }) => {
    await login(page)
    // 头像下拉 → 退出登录
    await page.locator('.avatar').hover()
    await page.getByText('退出登录').click()
    await expect(page).toHaveURL(/\/login/)
    const token = await page.evaluate(() =>
      sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken'),
    )
    expect(token, '登出后令牌应被清除').toBeFalsy()
  })
})
