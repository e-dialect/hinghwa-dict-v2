# 后端重构指南

本指南面向继续完成后端重构工作的开发者。

## 当前状态

✅ **已完成**: 架构设计和基础实施（约20%）  
⏳ **进行中**: API服务实现  
📋 **待开始**: 移动端迁移、数据迁移

## 快速开始

### 1. 了解项目结构

```
hinghwa-dict-v2/
├── pocketbase/                 # Pocketbase后端
│   ├── SCHEMA.md              # ⭐ 详细schema设计
│   ├── README.md              # 操作指南
│   └── scripts/               # 迁移脚本
├── packages/
│   ├── services/              # 共享API服务层
│   │   ├── types/             # TypeScript类型
│   │   └── src/
│   │       ├── pocketbase-client.ts  # 客户端封装
│   │       ├── api/           # API服务
│   │       └── utils/         # 工具函数
│   └── constants/             # 共享常量
├── apps/
│   └── mobile/                # uni-app移动端
│       └── src/services/      # 旧的Django API (待迁移)
└── docs/
    ├── WORK_SUMMARY.md        # ⭐ 工作总结
    ├── MIGRATION_TODO.md      # ⭐ 迁移清单
    ├── DJANGO_REFERENCE.md    # ⭐ Django参考
    └── MULTI_DIALECT_ARCHITECTURE.md
```

### 2. 阅读关键文档

**必读** (按顺序):
1. [`docs/WORK_SUMMARY.md`](./docs/WORK_SUMMARY.md) - 理解整体进度
2. [`pocketbase/SCHEMA.md`](./pocketbase/SCHEMA.md) - 理解数据结构
3. [`docs/MIGRATION_TODO.md`](./docs/MIGRATION_TODO.md) - 了解待完成工作
4. [`docs/DJANGO_REFERENCE.md`](./docs/DJANGO_REFERENCE.md) - 参考原实现

**可选**:
- [`pocketbase/scripts/migration_guide.md`](./pocketbase/scripts/migration_guide.md) - 数据迁移
- [`pocketbase/README.md`](./pocketbase/README.md) - Pocketbase操作

### 3. 环境准备

```bash
# 安装依赖
pnpm install

# 启动Pocketbase (需先下载可执行文件)
cd pocketbase
./pocketbase serve

# 开发时启动移动端
cd apps/mobile
pnpm dev:h5
```

## 开发路线图

### 阶段1: 完成API服务 (优先级: 🔴高)

#### 1.1 Pronunciation Service
**文件**: `packages/services/src/api/pronunciation.service.ts`

**需要实现的函数**:
```typescript
// 基础CRUD
- createPronunciation(data: PronunciationData)
- getPronunciations(filter: PronunciationFilter)
- getPronunciationDetails(id: string)
- deletePronunciation(id: string)

// 排行榜
- getPronunciationRanking(days: number)

// 注意: combinePronunciation需要独立微服务
```

**参考**: 
- Django实现: `hinghwa-dict-backend/word/pronunciation/views.py`
- 文档: `docs/DJANGO_REFERENCE.md` 第1节

#### 1.2 User Service
**文件**: `packages/services/src/api/user.service.ts`

**需要实现的函数**:
```typescript
// 用户信息
- getUserInfo(id: string)
- updateUserInfo(id: string, data: UserData)

// 密码和邮箱
- changePassword(id: string, oldPassword: string, newPassword: string)
- changeEmail(id: string, email: string, code: string)

// 产品和积分
- getProducts(filter?: ProductFilter)
- getProductById(id: string)
- getMyPoints(userId: string)
```

**参考**: Django实现 `user/views.py`

#### 1.3 Article Service  
**文件**: `packages/services/src/api/article.service.ts`

**需要实现的函数**:
```typescript
// CRUD
- createArticle(data: ArticleData)
- getArticle(id: string)
- updateArticle(id: string, data: ArticleData)
- deleteArticle(id: string)
- searchArticles(keyword: string)

// 点赞
- likeArticle(id: string)
- unlikeArticle(id: string)

// 评论
- createComment(articleId: string, content: string, parentId?: string)
- getComments(articleId: string)
```

**参考**: Django实现 `article/views.py`

#### 1.4 其他服务

按优先级依次实现：
- Quiz Service (quiz.service.ts)
- Notification Service (notification.service.ts)
- File Service (file.service.ts)
- Website Service (website.service.ts)

### 阶段2: 特殊功能 (优先级: 🔴高)

#### 2.1 音频合成微服务

**方案**: 独立的FastAPI服务

**实现步骤**:
1. 创建 `audio-service/` 目录
2. 编写FastAPI应用:
```python
# audio-service/main.py
from fastapi import FastAPI
from pydub import AudioSegment

app = FastAPI()

@app.get("/audio/combine")
async def combine_audio(
    words: str = None,
    ipas: str = None,
    pinyins: str = None
):
    # 实现音频合成逻辑
    # 参考: Django的 combinePronunciationV2
    pass
```
3. 准备音素文件库
4. 部署服务
5. 更新前端调用

**详细参考**: `docs/DJANGO_REFERENCE.md` 音频合成章节

#### 2.2 微信登录Hook

**文件**: `pocketbase/pb_hooks/wechat_auth.pb.js`

**实现**:
```javascript
onBeforeServe((e) => {
  // POST /api/wechat/login
  e.router.add("POST", "/api/wechat/login", async (c) => {
    const jscode = c.formValue("jscode")
    
    // 1. 调用微信API
    const response = $http.send({
      url: "https://api.weixin.qq.com/sns/jscode2session",
      // ...
    })
    
    // 2. 获取openid
    const openid = response.json.openid
    
    // 3. 查找用户
    const users = $app.dao().findRecordsByExpr("users", 
      $dbx.hashExp({"wechat_openid": openid})
    )
    
    // 4. 返回认证信息
    return c.json(200, { token, record })
  })
  
  // POST /api/wechat/bind - 绑定微信
  // ...
})
```

**参考**: 
- Django实现: `user/views.py` 的 `wechat_login`
- Pocketbase Hooks文档: https://pocketbase.io/docs/js-routing/

### 阶段3: 移动端迁移 (优先级: 🟡中)

#### 3.1 创建兼容层

**目的**: 让旧代码能够调用新API

**文件**: `packages/services/src/compat/index.ts`

```typescript
// 包装新API以匹配旧API签名
export async function getWordDetails(id: number) {
  // 转换ID类型
  const pbId = String(id);
  
  // 调用新API
  const word = await wordService.getWordDetails(pbId);
  
  // 转换响应格式以匹配旧格式
  return {
    word: {
      id: Number(word.id),
      word: word.word,
      definition: word.definition,
      // ... 转换其他字段
    }
  };
}
```

#### 3.2 替换服务调用

**策略**: 逐个页面迁移

1. 选择一个简单页面（如词语详情页）
2. 替换import:
```javascript
// 旧的
// import { getWordDetails } from '@/services/word';

// 新的
import { getWordDetails } from 'services/compat';
```
3. 测试功能
4. 继续下一个页面

**需要迁移的页面**: 
- 见 `docs/MIGRATION_TODO.md` 的移动端迁移计划

#### 3.3 认证层迁移

**重点**: 
- 替换 `uni.getStorageSync('token')` 为 Pocketbase auth
- 更新 `apps/mobile/src/services/login.js`
- 测试登录、注册、登出流程

### 阶段4: 数据迁移 (优先级: 🟡中)

**完整指南**: `pocketbase/scripts/migration_guide.md`

**关键步骤**:
1. 从Django导出数据 (Python脚本)
2. 数据转换 (Node.js脚本)
3. 导入Pocketbase (Node.js + Pocketbase SDK)
4. 文件迁移 (下载+重新上传)
5. 验证数据完整性

**注意事项**:
- 先在测试环境执行
- 准备回滚方案
- 保留Django备份
- 逐步迁移，不要一次性全部迁移

## 开发技巧

### 1. 使用TypeScript类型

所有Pocketbase collections都有类型定义：

```typescript
import type { WordRecord, ExpandedWord } from 'services/types/pocketbase';

// 获取词语
const word: WordRecord = await pb.collection('words').getOne(id);

// 带关系扩展
const expandedWord: ExpandedWord = await pb.collection('words')
  .getOne(id, { expand: 'dialect,contributor' });
```

### 2. 使用客户端工具函数

```typescript
import { buildFilter, createPaginationParams } from 'services/src/pocketbase-client';

// 构建过滤器
const filter = buildFilter({
  word: { contains: '兴化' },
  views: { gte: 100 }
});
// 结果: "word~'兴化' && views>=100"

// 分页参数
const params = createPaginationParams({
  page: 1,
  perPage: 20,
  sort: '-created'
});
```

### 3. 错误处理

```typescript
import { handlePocketBaseError } from 'services/src/pocketbase-client';

try {
  const word = await pb.collection('words').getOne(id);
} catch (error) {
  const { message, statusCode } = handlePocketBaseError(error);
  console.error(`Error ${statusCode}: ${message}`);
}
```

### 4. 参考已完成的Word Service

`packages/services/src/api/word.service.ts` 是一个很好的参考示例，展示了：
- 如何使用Pocketbase client
- 如何处理分页
- 如何处理关系扩展
- 如何构建过滤器

## 测试

### 单元测试 (TODO)

```bash
# 待添加测试框架
pnpm test
```

### 手动测试

1. 启动Pocketbase
2. 使用Postman或curl测试API
3. 或在浏览器console中测试:

```javascript
// 在H5开发环境的console中
const pb = new PocketBase('http://127.0.0.1:8090');

// 测试搜索
const results = await pb.collection('words')
  .getList(1, 20, { filter: "word~'兴化'" });
console.log(results);
```

## 常见问题

### Q1: Pocketbase文件在哪里？
需要从 https://pocketbase.io/docs/ 下载，放在 `pocketbase/` 目录。

### Q2: 如何创建Collections?
1. 启动Pocketbase: `./pocketbase serve`
2. 访问: http://127.0.0.1:8090/_/
3. 按照 `pocketbase/SCHEMA.md` 手动创建
4. 或使用迁移脚本 (TODO)

### Q3: 音频合成服务怎么办？
暂时可以继续使用Django的旧服务，等FastAPI微服务开发完成后再切换。

### Q4: 如何调试Pocketbase？
Pocketbase有内置的管理界面，可以查看数据、日志等：
http://127.0.0.1:8090/_/

### Q5: 类型报错怎么办？
确保在`packages/services/src`中正确import类型：
```typescript
import type { WordRecord } from '../../types/pocketbase';
```

## 资源链接

### 官方文档
- Pocketbase: https://pocketbase.io/docs/
- Pocketbase JS SDK: https://github.com/pocketbase/js-sdk
- uni-app: https://uniapp.dcloud.io/

### 项目文档
- [工作总结](./docs/WORK_SUMMARY.md) - 当前进度和计划
- [迁移TODO](./docs/MIGRATION_TODO.md) - 详细任务清单
- [Django参考](./docs/DJANGO_REFERENCE.md) - 原实现参考
- [Schema设计](./pocketbase/SCHEMA.md) - 数据结构

### 原仓库
- Django后端: https://github.com/e-dialect/hinghwa-dict-backend
- 旧移动端: https://github.com/e-dialect/hinghwa-dict-uni-app

## 联系和协作

- 遇到问题可以查看Issue或创建新Issue
- 建议使用PR方式提交代码
- 重要更新请更新相关文档

## 下一步行动

**建议从这里开始**:

1. ✅ 阅读完本文档
2. ✅ 阅读 `docs/WORK_SUMMARY.md` 了解整体情况
3. ✅ 阅读 `docs/MIGRATION_TODO.md` 选择要完成的任务
4. 🔴 **优先**: 实现 Pronunciation Service
5. 🔴 **优先**: 实现 User Service
6. 🔴 **优先**: 创建音频合成微服务

祝开发顺利！ 🚀
