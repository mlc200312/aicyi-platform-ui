# aicyi-platform-ui

统一授权认证后台管理系统前端。面向企业管理后台的 RBAC（基于角色的访问控制）解决方案，提供用户、角色、菜单、权限的统一管理，以及登录认证、个人中心、操作日志等基础能力。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | Vue 3（`<script setup>` 组合式 API） |
| 语言 | TypeScript |
| 构建工具 | Vite |
| UI 组件库 | Element Plus（含图标库） |
| 状态管理 | Pinia |
| 路由 | Vue Router（History 模式） |
| HTTP | Axios |
| 样式 | SCSS（全局变量自动注入） |
| 工程化 | unplugin-auto-import + unplugin-vue-components（Element Plus 按需自动导入） |

## 功能特性

- **登录认证**：账号密码登录、记住我、Token 自动携带；首次登录强制修改初始密码
- **仪表盘**：统计卡片、近 7 天登录趋势图、最近操作日志、用户管理快捷入口
- **用户管理**：分页检索、新增/编辑、分配角色、重置密码、启用/禁用、删除（内置 admin 受保护）
- **角色管理**：新增/编辑、分配菜单权限、启用/禁用、删除（内置 super_admin 受保护）
- **菜单管理**：树形结构，支持目录/菜单/按钮三级类型，管理路由地址、权限标识、接口路径、图标、排序、显隐
- **权限管理**：按用户单独分配权限（角色权限 + 用户单独权限，单独权限优先级更高），支持一键重置
- **个人中心**：查看个人信息、修改昵称/手机号/邮箱、修改密码
- **日志管理**：操作日志查看（当前为演示数据）
- **动态菜单**：侧边栏菜单由后端接口动态下发，支持按 sort 排序、按钮类型过滤

## 目录结构

```
aicyi-platform-ui
├── index.html                  # 入口 HTML
├── vite.config.ts              # Vite 配置（别名 @、SCSS 变量注入、/api 代理）
├── tsconfig*.json              # TypeScript 配置
├── public/                     # 静态资源
└── src/
    ├── main.ts                 # 应用入口（注册 Element Plus、Pinia、Router）
    ├── App.vue                 # 根组件
    ├── api/                    # 接口层
    │   ├── auth.ts             # 登录 / 登出 / 刷新 Token / 修改密码
    │   ├── user.ts             # 用户管理
    │   ├── role.ts             # 角色管理
    │   ├── menu.ts             # 菜单管理
    │   └── permission.ts       # 权限分配
    ├── components/             # 通用组件（ErrorBanner 等）
    ├── layout/                 # 后台主布局（侧边栏 + 顶栏 + 内容区）
    ├── router/                 # 路由配置 + 登录守卫
    ├── stores/                 # Pinia：user（登录态）、menu（动态菜单）、error（错误提示）
    ├── styles/                 # 全局样式与 SCSS 变量
    ├── utils/
    │   ├── request.ts          # Axios 封装（Token 拦截、统一业务码处理）
    │   └── confirm.ts          # 居中确认弹窗
    └── views/
        ├── login/              # 登录页（含初始密码修改）
        ├── dashboard/          # 仪表盘
        ├── profile/            # 个人中心
        ├── log/                # 日志管理
        └── system/             # 用户 / 角色 / 菜单 / 权限管理
```

## 快速开始

环境要求：Node.js 18+（建议使用项目锁定的依赖版本）。

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 类型检查 + 生产构建（产物输出到 dist/）
npm run build

# 本地预览生产构建
npm run preview
```

## 开发配置

- **接口代理**：开发环境下 `/api` 前缀的请求由 Vite 代理转发至 `http://localhost:18080`（后端服务地址），如需调整请修改 `vite.config.ts` 中的 `server.proxy`。
- **路径别名**：`@` 指向 `src/` 目录。
- **样式变量**：SCSS 全局变量（主题色、背景色、文字色等）定义于 `src/styles/variables.scss`，在各组件中可直接使用（已通过 `additionalData` 自动注入）。

## 接口约定

- **统一响应格式**：后端统一返回 `{ code, data, message }`，`code === 0` 表示成功。
- **认证方式**：请求头携带 `Authorization: Bearer <accessToken>`，Token 存于 `localStorage`。
- **业务码约定**：`40101`（未登录）/ `40102`（Token 过期）时自动清理登录态并跳转登录页；其他非 0 code 统一通过顶部错误横幅提示。
- **错误提示**：接口错误统一由 `src/utils/request.ts` 拦截处理，经 `ErrorBanner` 展示，业务代码无需重复处理。

## 相关项目

- 后端服务：统一授权认证后台服务端（接口前缀 `/api`，默认端口 `18080`）

## License

Copyright © 2026 aicyi-platform All Rights Reserved.
