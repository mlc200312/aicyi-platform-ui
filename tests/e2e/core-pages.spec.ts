import { test, expect, type Page } from '@playwright/test'
import { login, expectNoPageErrors } from './helpers/login'

/**
 * 核心页面加载旅程：登录 → 动态菜单（RBAC 下发）→ 各业务页面数据渲染。
 * 同时断言全程零未捕获 JS 异常（pageerror）——生产可用性的底线。
 *
 * 菜单结构说明：侧边栏一级为目录（系统管理/工单中心/日志管理…），
 * 二级菜单（用户管理等）随目录展开渲染，故分两层断言。
 */

const CORE_PAGES: Array<{ path: string; name: string }> = [
  { path: '/dashboard', name: '工作台' },
  { path: '/system/user', name: '用户管理' },
  { path: '/system/role', name: '角色管理' },
  { path: '/system/menu', name: '菜单管理' },
  { path: '/log', name: '操作日志' },
  { path: '/system/work-order', name: '工单管理' },
  { path: '/template', name: '消息模板' },
]

test.describe('核心页面加载', () => {
  let pageErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    pageErrors = []
    page.on('pageerror', err => pageErrors.push(String(err)))
    await login(page)
  })

  test('动态菜单按 RBAC 权限渲染（一级目录）', async ({ page }) => {
    const menubar = page.getByRole('menubar').first()
    await expect(menubar).toBeVisible()
    // 一级目录来自后端 sys_menu 下发（超管全量）
    for (const name of ['系统管理', '工单中心', '日志管理']) {
      await expect(menubar.getByRole('menuitem', { name })).toBeVisible()
    }
  })

  test('展开「系统管理」渲染二级菜单（用户/角色/菜单管理）', async ({ page }) => {
    await page.getByRole('menuitem', { name: '系统管理' }).click()
    for (const name of ['用户管理', '角色管理', '菜单管理']) {
      await expect(page.getByRole('menuitem', { name }).first()).toBeVisible({ timeout: 5_000 })
    }
  })

  for (const { path, name } of CORE_PAGES) {
    test(`${name}（${path}）数据渲染且无 JS 异常`, async ({ page }) => {
      await page.goto(path)
      // 列表页统一断言 Element Plus 表格渲染
      await expect(page.locator('.el-table').first()).toBeVisible({ timeout: 15_000 })
      // 留出异步数据加载与渲染时间，让潜在错误有机会暴露
      await page.waitForTimeout(800)
      expectNoPageErrors(pageErrors, name)
    })
  }
})
