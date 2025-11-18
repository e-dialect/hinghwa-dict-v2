# API 架构重构说明

## 新架构原则

根据新的架构要求，API 代码应该遵循以下原则：

### 1. 单一数据源（Single Source of Truth）

**所有业务逻辑 API 都在 `packages/services` 中实现**

```
packages/services/
├── src/
│   ├── api/
│   │   ├── word.service.ts          # 词语相关 API
│   │   ├── user.service.ts          # 用户相关 API
│   │   ├── pronunciation.service.ts # 发音相关 API
│   │   ├── article.service.ts       # 文章相关 API
│   │   ├── quiz.service.ts          # 测试相关 API
│   │   ├── website.service.ts       # 网站工具 API
│   │   └── dialect.service.ts       # 方言相关 API
│   ├── pocketbase-client.ts         # Pocketbase 客户端封装
│   ├── utils/                       # 工具函数
│   └── index.ts                     # 统一导出
└── types/
    └── pocketbase.ts                # TypeScript 类型定义
```

**特点**：
- ✅ 环境无关（可在 Node.js/Browser/uni-app 中运行）
- ✅ 完整的类型定义
- ✅ 可被 Web 应用和移动应用共享
- ✅ 便于测试和维护

### 2. 移动端专用适配层

**`apps/mobile/src/api/` 只包含 uni-app 特定的功能**

```
apps/mobile/src/api/
└── index.ts  # uni-app 适配层 + 导出共享服务
```

**只包含以下内容**：

#### a) uni-app 环境初始化
```typescript
// 初始化 Pocketbase 客户端
const pb = initPocketBase(process.env.POCKETBASE_URL);

// uni.storage 同步
pb.authStore.onChange(() => {
  uni.setStorageSync('pb_auth', pb.authStore.exportToCookie());
});
```

#### b) uni-app 专用功能
```typescript
// 微信小程序登录
export async function wechatMiniProgramLogin() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: async (loginRes) => {
        // ...
      }
    });
  });
}

// uni-app 文件上传
export function uploadFile(collection, recordId, fieldName) {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      // ...
    });
  });
}

// uni-app 音频播放
export function playAudio(audioUrl) {
  const innerAudioContext = uni.createInnerAudioContext();
  // ...
}
```

#### c) 统一错误处理
```typescript
// uni.showToast 错误提示
export function handleApiError(error, message) {
  uni.showToast({
    title: message,
    icon: 'none'
  });
}
```

#### d) 重新导出共享服务
```typescript
// 让移动端可以统一从 @/api 导入
export * from 'packages/services';
```

## 使用方式

### 在移动端页面中

```vue
<script>
// 导入共享 API（来自 packages/services）
import { 
  getWordDetails,      // 共享服务
  searchWords,         // 共享服务
  createArticle        // 共享服务
} from '@/api';

// 导入 uni-app 专用功能（来自 apps/mobile/src/api）
import { 
  wechatMiniProgramLogin,  // uni-app 专用
  uploadFile,              // uni-app 专用
  playAudio,               // uni-app 专用
  handleApiError           // uni-app 专用
} from '@/api';

export default {
  methods: {
    async loadWord() {
      try {
        // 使用共享 API
        const word = await getWordDetails(this.wordId);
        this.word = word;
      } catch (error) {
        // 使用 uni-app 错误处理
        handleApiError(error, '加载词语失败');
      }
    },
    
    async loginWithWechat() {
      try {
        // 使用 uni-app 专用登录
        const result = await wechatMiniProgramLogin();
        this.user = result.user;
      } catch (error) {
        handleApiError(error, '登录失败');
      }
    }
  }
};
</script>
```

### 在 Web 应用中

```typescript
// 直接导入共享服务
import { 
  getWordDetails,
  searchWords 
} from 'packages/services';

async function loadWord(id: string) {
  const word = await getWordDetails(id);
  return word;
}
```

## 优势

### 1. 代码复用
- Web 和移动端共享 96 个 API 函数
- 只需维护一份业务逻辑
- 类型定义统一

### 2. 关注点分离
- `packages/services`: 纯业务逻辑，环境无关
- `apps/mobile/src/api`: 只处理 uni-app 特定需求

### 3. 易于测试
- 共享服务可以独立测试
- 不依赖 uni-app 环境

### 4. 易于扩展
- 添加新 API 只需在 `packages/services` 中实现
- 自动在所有应用中可用

## 迁移指南

### 旧方式（废弃）
```javascript
// ❌ 旧的服务调用
import { getWordDetails } from '@/services/word';

const res = await getWordDetails(id);
const word = res.word; // Django 返回格式
```

### 新方式
```typescript
// ✅ 新的 API 调用
import { getWordDetails } from '@/api';

const word = await getWordDetails(id); // 直接返回 typed 对象
```

## API 数量统计

### 共享服务（packages/services）
- Word Service: 14 functions
- Pronunciation Service: 14 functions
- User Service: 13 functions
- Article Service: 11 functions
- Quiz Service: 10 functions
- Website Service: 10 functions
- Dialect Service: 14 functions
- **总计**: 86 functions

### uni-app 专用（apps/mobile/src/api）
- wechatMiniProgramLogin
- getWechatUserInfo
- uploadFile
- uploadAudio
- playAudio
- handleApiError
- **总计**: 6 functions

**总 API 数**: 92 functions

## 文件结构对比

### 之前（错误的）
```
apps/mobile/src/api/
├── client.ts           # ❌ 重复实现
├── auth.ts             # ❌ 重复实现
├── user.ts             # ❌ 重复实现
├── word.ts             # ❌ 重复实现
├── pronunciation.ts    # ❌ 重复实现
├── article.ts          # ❌ 重复实现
├── quiz.ts             # ❌ 重复实现
├── website.ts          # ❌ 重复实现
├── dialect.ts          # ❌ 重复实现
└── index.ts            # ❌ 重复导出
```

### 现在（正确的）
```
packages/services/src/   # ✅ 单一数据源
├── api/
│   ├── word.service.ts
│   ├── user.service.ts
│   ├── pronunciation.service.ts
│   ├── article.service.ts
│   ├── quiz.service.ts
│   ├── website.service.ts
│   └── dialect.service.ts
├── pocketbase-client.ts
└── index.ts

apps/mobile/src/api/     # ✅ 只有 uni-app 专用
└── index.ts             # 适配层 + 重新导出
```

## 总结

✅ **遵循 DRY 原则**（Don't Repeat Yourself）  
✅ **单一职责**：共享服务处理业务逻辑，适配层处理平台特性  
✅ **易于维护**：修改一处，所有应用受益  
✅ **类型安全**：完整的 TypeScript 支持  
✅ **可测试性**：业务逻辑可独立测试  

这是现代前端工程的最佳实践！
