import { defineConfig } from '@playwright/test'

/**
 * aicyi-platform-ui E2E 生产上线验收配置。
 *
 * - webServer: 由 Playwright 托管 vite dev（端口被占则复用现有实例），
 *   套件自包含，不依赖手工启动前端
 * - channel: 'chrome'：复用本机 Chrome，免除浏览器下载（内网/离线环境友好）
 * - baseURL: vite dev 代理 /api → 网关 18000，后端六服务需在运行
 * - retries: 1：隔离首访冷启动等瞬时抖动；重试后仍失败即真实缺陷
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 10_000,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
