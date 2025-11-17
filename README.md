# 兴化语记 V2 前端 (Hinghwa Dictionary V2 Frontend)

兴化语记是 [E方言](https://edialect.top) 中`莆仙方言公共服务包` 的别称，主要服务对象包括福建省莆田市及其周边地区的莆仙方言使用者。

这是兴化语记的第二版前端项目，采用 monorepo 架构，使用新的 PocketBase 后端。

## 项目结构

```
hinghwa-v2-frontend/
├── apps/                    # 应用程序
│   ├── web/                # Web 端应用 (Nuxt 3)
│   └── mobile/             # 移动端应用 (uni-app)
├── packages/               # 共享包
│   └── services/           # API 服务和类型定义
└── pnpm-workspace.yaml     # pnpm 工作区配置
```

### Apps

- **web**: 基于 Nuxt 3 的 Web 应用
- **mobile**: 基于 uni-app 的跨平台移动应用（支持 H5、微信小程序、App 等）

### Packages

- **services**: 共享的 API 服务层和 TypeScript 类型定义，将逐步迁移至使用 PocketBase SDK

## 技术栈

- **包管理**: pnpm (工作区)
- **构建工具**: Vite
- **Web 端**: Nuxt 3 + Vue 3
- **Mobile 端**: uni-app + Vue 3
- **后端**: PocketBase (计划中)
- **语言**: TypeScript

## 开发

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 同时启动所有应用
pnpm dev

# 只启动 Web 端
pnpm dev:web

# 只启动移动端 (H5)
pnpm dev:mobile
```

### 构建

```bash
# 构建所有应用
pnpm build

# 只构建 Web 端
pnpm build:web

# 只构建移动端
pnpm build:mobile
```

### 代码检查

```bash
# 检查代码风格
pnpm lint:check

# 自动修复代码风格问题
pnpm lint
```

## 移动端说明

移动端应用从 [hinghwa-dict-uni-app](https://github.com/e-dialect/hinghwa-dict-uni-app) 迁移而来。

### 支持的平台

- H5 (Web)
- 微信小程序
- QQ 小程序
- Android/iOS App
- 其他小程序平台

### 开发命令

```bash
cd apps/mobile

# H5 开发
pnpm dev:h5

# 微信小程序开发
pnpm dev:mp-weixin

# App 开发
pnpm dev:app
```

## 服务层

`packages/services` 提供共享的 API 服务层：

```
packages/services/
├── api/        # API 请求函数
├── types/      # TypeScript 类型定义
└── src/        # 业务逻辑层
```

类型定义将通过 `pocketbase-typegen` 从 PocketBase 数据库自动生成。

## 迁移说明

本项目正在从旧的 Django 后端迁移到 PocketBase 后端：

1. ✅ 前端代码已迁移到 monorepo 结构
2. ✅ 建立了 TypeScript 服务层框架
3. ⏳ API 正在逐步迁移到 PocketBase SDK
4. ⏳ 后端 PocketBase 实例准备中

## 相关链接

- 主网站: https://pxm.edialect.top
- 移动端: https://m.pxm.edialect.top
- E方言: https://edialect.top
- 旧版移动端仓库: https://github.com/e-dialect/hinghwa-dict-uni-app

## 许可证

本项目是 E方言平台的一部分。
