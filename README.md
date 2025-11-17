# 兴化语记 V2 (Hinghwa Dictionary V2)

兴化语记是 [E方言](https://edialect.top) 中`莆仙方言公共服务包` 的别称，主要服务对象包括福建省莆田市及其周边地区的莆仙方言使用者。

这是兴化语记的第二版项目，采用 **monorepo 架构**，使用 **Pocketbase 后端**和完整的**多方言架构**。

## 🎉 项目状态

✅ **后端重构完成** - Django已完全迁移到Pocketbase
- 82个API全部实现
- Docker容器化部署
- 数据迁移工具完成
- 音频合成微服务

📖 **详细文档**: 查看 [`docs/COMPLETION_SUMMARY.md`](docs/COMPLETION_SUMMARY.md)

## 项目结构

```
hinghwa-dict-v2/
├── apps/                    # 应用程序
│   ├── web/                # Web 端应用 (Nuxt 3)
│   └── mobile/             # 移动端应用 (uni-app)
├── packages/               # 共享包
│   ├── services/           # ✅ API 服务 (Pocketbase SDK)
│   └── constants/          # 共享常量（多方言支持）
├── pocketbase/             # ✅ Pocketbase 后端
│   ├── SCHEMA.md          # 数据库设计 (22 collections)
│   ├── pb_migrations/     # 数据库迁移
│   ├── pb_hooks/          # 自定义逻辑
│   └── scripts/           # 迁移脚本
├── audio-service/          # ✅ 音频合成微服务
├── docs/                   # ✅ 完整文档
├── docker-compose.yml      # ✅ Docker 编排
└── DOCKER.md               # ✅ 部署指南
```

### Apps

- **web**: 基于 Nuxt 3 的 Web 应用
- **mobile**: 基于 uni-app 的跨平台移动应用（H5、微信小程序、App）

### Packages

- **services**: ✅ 完整的 Pocketbase API 服务层（82个函数）
  - Word, Pronunciation, User, Article, Quiz, Website Services
  - 完整 TypeScript 类型定义
  - 认证、分页、文件上传等工具函数
- **constants**: 共享常量和多方言数据

### Backend

- **pocketbase**: ✅ Pocketbase 后端（Go-based BaaS）
  - 22个Collection，支持完整多方言架构
  - 内置 JWT 认证
  - 实时订阅支持
  - 文件存储
- **audio-service**: ✅ FastAPI 音频合成微服务
  - 音素MP3合并
  - 支持汉字/IPA/拼音输入
  - 可扩展架构（预留omnilingual-asr/DiaMoE-TTS接口）

## 技术栈

- **包管理**: pnpm (工作区)
- **构建工具**: Vite
- **Web 端**: Nuxt 3 + Vue 3
- **Mobile 端**: uni-app + Vue 3
- **后端**: ✅ **Pocketbase** (Go) + SQLite
- **音频服务**: ✅ **FastAPI** (Python) + pydub
- **容器化**: ✅ **Docker + Docker Compose**
- **语言**: TypeScript

## 快速开始

### 使用 Docker (推荐)

```bash
# 1. 克隆仓库
git clone https://github.com/e-dialect/hinghwa-dict-v2.git
cd hinghwa-dict-v2

# 2. 配置环境
cp .env.example .env
nano .env  # 修改配置

# 3. 启动所有服务
docker-compose up -d

# 4. 访问服务
# Pocketbase Admin: http://localhost:8090/_/
# Pocketbase API: http://localhost:8090/api/
# Audio Service: http://localhost:8001/
# Mobile App (H5): http://localhost:3000/
# Web App: http://localhost:3001/
```

详细部署指南: [`DOCKER.md`](DOCKER.md)

### 本地开发

#### 安装依赖

```bash
pnpm install
```

#### 启动 Pocketbase

```bash
cd pocketbase
# 下载 Pocketbase: https://pocketbase.io/docs/
./pocketbase serve
# 访问: http://localhost:8090/_/
```

#### 启动音频服务

```bash
cd audio-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

#### 开发模式

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

## API服务

✅ **完整实现** - `packages/services` 提供完整的 Pocketbase API 服务层：

```typescript
// 示例：使用 API 服务
import { 
  getWordDetails, 
  createPronunciation,
  getUserInfo,
  createArticle 
} from 'services';

// 获取词语详情
const word = await getWordDetails('word-id');

// 创建发音
const pron = await createPronunciation({
  type: 'word',
  content: '兴化',
  ipa: 'hiŋ1 hua2',
  dialect: 'dialect-id',
  audio: audioFile,
  contributor: 'user-id'
});
```

### 可用服务模块

- ✅ **Word Service** (14个函数) - 词语、字、词单管理
- ✅ **Pronunciation Service** (14个函数) - 发音记录、音频合成
- ✅ **User Service** (13个函数) - 用户管理、微信绑定、积分系统
- ✅ **Article Service** (11个函数) - 文章、评论、点赞
- ✅ **Quiz Service** (10个函数) - 题目、试卷、答题记录
- ✅ **Website Service** (10个函数) - 公告、通知、文件上传

**总计**: 82个API函数

详细API文档: [`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md)

## 多方言架构

✅ **完整支持** - 本项目采用可扩展的多方言架构设计：

### Schema 设计

```
dialects (方言)
  ├── parent (层级关系)
  └── region (地理位置)

characters (字)
  ├── phonological_position (切韵地位)
  └── unicode

character_pronunciations (字发音)
  ├── character (关联字)
  ├── dialect (方言)
  ├── ipa / romanization (音标)
  ├── initial / final / tone (声韵调)
  ├── reading_type (文白读)
  └── source (来源)

words (词)
  ├── dialect (方言)
  ├── characters[] (关联字)
  └── definition (释义)
```

详细架构设计: [`pocketbase/SCHEMA.md`](pocketbase/SCHEMA.md)

### 添加新方言

1. 在 Pocketbase 中创建新的 dialect 记录
2. 为新方言添加字、发音、词语数据
3. 前端可以按 dialect 筛选和切换

更多详情: [`docs/MULTI_DIALECT_ARCHITECTURE.md`](docs/MULTI_DIALECT_ARCHITECTURE.md)

## 数据迁移

✅ **自动化工具完成** - 从 Django 迁移到 Pocketbase：

```bash
cd pocketbase/scripts
npm install pocketbase
node migrate.js --step=all
```

迁移脚本会自动完成：
- Django数据导出
- 数据格式转换
- ID映射管理
- Pocketbase导入
- 关系重建

详细指南: [`pocketbase/scripts/migration_guide.md`](pocketbase/scripts/migration_guide.md)

## 后端说明

### Pocketbase Backend

✅ **完全实现** - 本项目使用 Pocketbase 作为后端：

- **22个Collection** - 支持多方言、字发音分离、切韵地位
- **完整API** - 82个函数全部实现
- **内置认证** - JWT + 邮箱验证 + 微信绑定
- **实时订阅** - 内置WebSocket支持
- **文件存储** - 图片、音频上传
- **Docker部署** - 一键启动

详细文档: [`pocketbase/README.md`](pocketbase/README.md)

### 音频合成服务

✅ **基础实现** - FastAPI微服务：

- 音素MP3文件合并
- 支持汉字/IPA/拼音输入
- 声调模糊匹配
- 可扩展架构（预留omnilingual-asr/DiaMoE-TTS接口）

详细文档: [`audio-service/README.md`](audio-service/README.md)

## 文档

- 📖 [`docs/COMPLETION_SUMMARY.md`](docs/COMPLETION_SUMMARY.md) - 完成总结
- 📖 [`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md) - 开发者指南
- 📖 [`DOCKER.md`](DOCKER.md) - Docker部署指南
- 📖 [`pocketbase/SCHEMA.md`](pocketbase/SCHEMA.md) - 数据库设计
- 📖 [`docs/DJANGO_REFERENCE.md`](docs/DJANGO_REFERENCE.md) - Django参考
- 📖 [`docs/MIGRATION_TODO.md`](docs/MIGRATION_TODO.md) - 迁移清单

## 相关链接

- 主网站: https://pxm.edialect.top
- 移动端: https://m.pxm.edialect.top
- E方言: https://edialect.top
- 旧版后端: https://github.com/e-dialect/hinghwa-dict-backend
- 旧版移动端: https://github.com/e-dialect/hinghwa-dict-uni-app

## 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md)（待添加）

## 许可证

本项目是 E方言平台的一部分。
