# 移动端完整迁移指南

## 概述

本文档详细说明如何将 `apps/mobile` 中的57个Vue页面从Django API迁移到Pocketbase API。

## 迁移原则

1. **正确性优先** - 确保功能完全对等
2. **类型安全** - 使用TypeScript增强代码质量
3. **组件化** - 提取可复用组件，减少重复代码
4. **多方言支持** - 架构支持多方言和方言片区
5. **向后兼容** - 保持URL结构和用户体验一致

## 架构设计

### 新目录结构

```
apps/mobile/src/
├── api/                      # API层（NEW）
│   ├── client.ts            # Pocketbase客户端封装
│   ├── word.ts              # 词语API
│   ├── character.ts         # 字API  
│   ├── pronunciation.ts     # 发音API
│   ├── user.ts              # 用户API
│   ├── article.ts           # 文章API
│   ├── quiz.ts              # 测试API
│   ├── dialect.ts           # 方言API
│   └── index.ts             # 统一导出
├── components/              
│   └── shared/              # 共享组件（NEW）
│       ├── DialectSelector.vue    # 方言选择器
│       ├── PronunciationButton.vue # 发音按钮
│       ├── DialectTag.vue         # 方言标签
│       ├── PaginationList.vue     # 分页列表
│       └── ErrorBoundary.vue      # 错误边界
├── composables/             # 组合式API（NEW）
│   ├── useAuth.ts          # 认证逻辑
│   ├── useDialect.ts       # 方言偏好
│   ├── usePagination.ts    # 分页逻辑
│   └── useAudio.ts         # 音频播放
├── stores/                  # 状态管理（NEW）
│   ├── user.ts             # 用户状态
│   ├── dialect.ts          # 方言状态
│   └── app.ts              # 应用状态
├── services/                # 旧API层（待废弃）
│   └── *.js                # Django API调用
└── pages/                   # 页面（待迁移）
    └── *.vue               # 57个页面
```

## API迁移对照表

### 1. 认证相关 (login.js → auth API)

| Django API | Pocketbase API | 说明 |
|-----------|---------------|------|
| `POST /login` | `pb.collection('users').authWithPassword()` | 用户名密码登录 |
| `POST /login/wechat` | Custom hook + `authWithPassword()` | 微信登录（需hook） |
| `PUT /login` | `pb.collection('users').authRefresh()` | 刷新token |
| `POST /users` | `pb.collection('users').create()` | 注册 |
| `POST /users/wechat/register` | Custom hook + `create()` | 微信注册 |

### 2. 用户相关 (user.js → user API)

| Django API | Pocketbase API | 说明 |
|-----------|---------------|------|
| `GET /users/{id}` | `pb.collection('users').getOne(id, {expand: 'dialect'})` | 获取用户信息 |
| `PUT /users/{id}` | `pb.collection('users').update(id, data)` | 更新用户信息 |
| `PUT /users/{id}/password` | `pb.collection('users').update(id, {...})` | 修改密码 |
| `PUT /users/{id}/email` | `pb.collection('users').requestEmailChange()` | 修改邮箱 |
| `PUT /users/{id}/wechat` | Custom hook | 绑定微信 |
| `DELETE /users/{id}/wechat` | `pb.collection('users').update()` | 解绑微信 |

### 3. 词语相关 (word.js → word API)

| Django API | Pocketbase API | 说明 |
|-----------|---------------|------|
| `GET /words/{id}` | `pb.collection('words').getOne(id, {expand: 'dialect,contributor,related_words,related_articles'})` | 词语详情 |
| `GET /words?search={key}` | `pb.collection('words').getList(page, perPage, {filter: 'word~"'+key+'"'})` | 搜索词语 |
| `GET /words?contributor={id}` | `pb.collection('words').getList(page, perPage, {filter: 'contributor="'+id+'"'})` | 用户词语 |
| `PUT /words` (批量) | 循环调用 `getOne()` 或使用filter | 批量获取 |
| `GET /words/phonetic_ordering` | Custom algorithm | 音序表（待实现） |
| `POST /words/dictionary` | Custom search with phonetic | 音序查词 |

### 4. 字相关 (character.js → character API)

| Django API | Pocketbase API | 说明 |
|-----------|---------------|------|
| `GET /characters?search={key}` | `pb.collection('characters').getList(page, perPage, {filter: 'simplified~"'+key+'" || traditional~"'+key+'"'})` | 搜索字 |
| `GET /characters?contributor={id}` | `pb.collection('character_pronunciations').getList(page, perPage, {filter: 'contributor="'+id+'"', expand: 'character'})` | 用户字发音 |
| 按音韵筛选 | 复杂filter组合 | 声母/韵母/声调筛选 |

### 5. 发音相关 (pronunciation.js → pronunciation API)

| Django API | Pocketbase API | 说明 |
|-----------|---------------|------|
| `GET /pronunciation?word={id}` | `pb.collection('pronunciations').getList(page, perPage, {filter: 'word="'+id+'"', expand: 'dialect,contributor'})` | 词语发音列表 |
| `POST /pronunciation/combine` | `Audio Service API` | 音频合成（微服务） |
| `POST /pronunciation` | `pb.collection('pronunciations').create()` | 创建发音 |

### 6. 文章相关 (article.js → article API)

| Django API | Pocketbase API | 说明 |
|-----------|---------------|------|
| `GET /articles` | `pb.collection('articles').getList(page, perPage, {expand: 'author,dialect'})` | 文章列表 |
| `GET /articles/{id}` | `pb.collection('articles').getOne(id, {expand: 'author,dialect'})` | 文章详情 |
| `POST /articles` | `pb.collection('articles').create()` | 创建文章 |
| `PUT /articles/{id}` | `pb.collection('articles').update()` | 更新文章 |
| `DELETE /articles/{id}` | `pb.collection('articles').delete()` | 删除文章 |
| `POST /articles/{id}/like` | `pb.collection('likes').create({article: id, user: userId})` | 点赞 |
| `DELETE /articles/{id}/like` | `pb.collection('likes').delete(likeId)` | 取消点赞 |

### 7. 评论相关

| Django API | Pocketbase API | 说明 |
|-----------|---------------|------|
| `GET /articles/{id}/comments` | `pb.collection('comments').getList(page, perPage, {filter: 'article="'+id+'"', expand: 'author,parent'})` | 文章评论 |
| `POST /comments` | `pb.collection('comments').create()` | 创建评论 |

### 8. 测试相关 (quiz.js → quiz API)

| Django API | Pocketbase API | 说明 |
|-----------|---------------|------|
| `GET /quizzes` | `pb.collection('quizzes').getList()` | 题目列表 |
| `GET /quizzes/{id}` | `pb.collection('quizzes').getOne()` | 题目详情 |
| `GET /papers` | `pb.collection('quiz_papers').getList()` | 试卷列表 |
| `GET /papers/{id}` | `pb.collection('quiz_papers').getOne(id, {expand: 'quizzes'})` | 试卷详情 |
| `POST /records` | `pb.collection('quiz_records').create()` | 提交答卷 |
| `GET /records` | `pb.collection('quiz_records').getList(page, perPage, {filter: 'user="'+userId+'"'})` | 答题记录 |

## 页面迁移步骤

### 通用迁移模式

每个页面迁移遵循以下步骤：

#### 1. 替换导入
```typescript
// 旧
import { getWordDetails } from '@/services/word';

// 新
import { getWordDetails } from '@/api/word';
```

#### 2. 添加类型定义
```typescript
// 在script中添加类型
import type { ExpandedWord } from '@/types/pocketbase';

// 为data添加类型
const word = ref<ExpandedWord | null>(null);
```

#### 3. 更新API调用
```typescript
// 旧
await getWordDetails(id).then(res => {
  word.value = res.word;
});

// 新
try {
  word.value = await getWordDetails(id);
} catch (error) {
  handleApiError(error, '获取词语失败');
}
```

#### 4. 更新数据结构访问
```typescript
// 旧：Django返回嵌套对象
word.contributor.nickname

// 新：Pocketbase需要expand
word.expand?.contributor?.name
```

#### 5. 添加方言支持
```vue
<template>
  <!-- 显示方言标签 -->
  <DialectTag v-if="word.expand?.dialect" :dialect="word.expand.dialect" />
  
  <!-- 方言选择器 -->
  <DialectSelector v-model="selectedDialect" @change="onDialectChange" />
</template>
```

### 重点页面迁移

#### 1. 首页 (pages/home.vue)

**改动点**：
- 热门词语列表
- 每日一词
- 公告列表

**迁移方案**：
```typescript
// 获取热门词语
const hotWords = await pb.collection('words')
  .getList(1, 10, {
    sort: '-views',
    expand: 'dialect'
  });

// 获取每日一词（从daily_expressions）
const dailyWord = await pb.collection('daily_expressions')
  .getList(1, 1, {
    filter: `date="${today}"`,
    expand: 'word,word.dialect'
  });

// 获取公告
const announcements = await pb.collection('announcements')
  .getList(1, 5, {
    sort: '-created',
    filter: 'published=true'
  });
```

#### 2. 搜索页 (pages/search.vue)

**改动点**：
- 词语搜索
- 字搜索
- 按方言筛选（NEW）

**迁移方案**：
```typescript
// 词语搜索（支持方言筛选）
const searchWords = async (keyword: string, dialectId?: string) => {
  let filter = `word~"${keyword}"`;
  if (dialectId) {
    filter += ` && dialect="${dialectId}"`;
  }
  
  return await pb.collection('words').getList(page, 30, {
    filter,
    expand: 'dialect,contributor',
    sort: '-views'
  });
};
```

#### 3. 词语详情 (pages/words/details.vue)

**改动点**：
- 词语信息展示
- 发音播放
- 多方言发音展示（NEW）
- 相关词语、文章

**迁移方案**：
```typescript
// 获取词语详情
const word = await pb.collection('words').getOne(id, {
  expand: 'dialect,contributor,related_words,related_articles'
});

// 获取该词在所有方言片区的发音
const pronunciations = await pb.collection('pronunciations').getList(1, 50, {
  filter: `word="${id}"`,
  expand: 'dialect,contributor',
  sort: 'dialect.priority' // 按片区优先级排序
});

// 播放发音（使用音频合成服务）
const playPronunciation = async (ipa: string, dialectId: string) => {
  const audioUrl = `${AUDIO_SERVICE_URL}/audio/combine?ipas=${encodeURIComponent(ipa)}`;
  // 播放音频...
};
```

#### 4. 用户页面 (pages/users/me.vue)

**改动点**：
- 用户信息
- 贡献统计
- 方言偏好设置（NEW）

**迁移方案**：
```typescript
// 获取用户详情
const user = await pb.collection('users').getOne(userId, {
  expand: 'dialect' // 用户偏好方言
});

// 获取用户贡献统计
const stats = {
  words: await pb.collection('words').getList(1, 1, {
    filter: `contributor="${userId}"`
  }).then(r => r.totalItems),
  
  pronunciations: await pb.collection('pronunciations').getList(1, 1, {
    filter: `contributor="${userId}"`
  }).then(r => r.totalItems),
  
  articles: await pb.collection('articles').getList(1, 1, {
    filter: `author="${userId}"`
  }).then(r => r.totalItems),
};

// 设置方言偏好
const setPreferredDialect = async (dialectId: string) => {
  await pb.collection('users').update(userId, {
    dialect: dialectId
  });
};
```

#### 5. 发音上传 (pages/words/pronunciations/upload.vue)

**改动点**：
- 音频录制
- 发音信息填写
- 方言选择（NEW）

**迁移方案**：
```typescript
// 创建发音记录
const createPronunciation = async (data: {
  word: string;
  audio: File;
  ipa: string;
  romanization?: string;
  dialect: string;
  reading_type?: string;
}) => {
  const formData = new FormData();
  formData.append('word', data.word);
  formData.append('audio', data.audio);
  formData.append('ipa', data.ipa);
  if (data.romanization) formData.append('romanization', data.romanization);
  formData.append('dialect', data.dialect);
  formData.append('contributor', getCurrentUser()!.id);
  if (data.reading_type) formData.append('reading_type', data.reading_type);
  
  return await pb.collection('pronunciations').create(formData);
};
```

## 共享组件

### 1. DialectSelector.vue

```vue
<template>
  <picker
    :value="selectedIndex"
    :range="dialectOptions"
    range-key="name"
    @change="onChange"
  >
    <view class="picker">
      当前方言：{{ currentDialect?.name || '请选择' }}
    </view>
  </picker>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { DialectRecord } from '@/types/pocketbase';
import { getDialects } from '@/api/dialect';

const props = defineProps<{
  modelValue?: string; // dialectId
  showChildren?: boolean; // 是否显示子方言
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', dialect: DialectRecord): void;
}>();

const dialectOptions = ref<DialectRecord[]>([]);
const selectedIndex = ref(0);

const currentDialect = computed(() => {
  return dialectOptions.value[selectedIndex.value];
});

onMounted(async () => {
  // 获取方言列表
  const result = await getDialects();
  dialectOptions.value = result.items;
  
  // 设置初始选中
  if (props.modelValue) {
    const index = dialectOptions.value.findIndex(d => d.id === props.modelValue);
    if (index >= 0) selectedIndex.value = index;
  }
});

const onChange = (e: any) => {
  selectedIndex.value = e.detail.value;
  const dialect = dialectOptions.value[selectedIndex.value];
  emit('update:modelValue', dialect.id);
  emit('change', dialect);
};
</script>
```

### 2. PronunciationButton.vue

```vue
<template>
  <button
    class="cu-btn sm"
    :class="{ 'bg-blue': !isPlaying, 'bg-grey': isPlaying }"
    @tap="play"
  >
    <text class="cuIcon-play" v-if="!isPlaying"></text>
    <text class="cuIcon-stop" v-else></text>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { PronunciationRecord } from '@/types/pocketbase';
import { getFileUrl } from '@/api/client';

const props = defineProps<{
  pronunciation?: PronunciationRecord;
  ipa?: string;
  pinyin?: string;
  dialectId?: string;
}>();

const isPlaying = ref(false);
const audioContext = ref<UniApp.InnerAudioContext | null>(null);

const play = async () => {
  if (isPlaying.value) {
    audioContext.value?.stop();
    return;
  }
  
  let audioUrl: string;
  
  // 如果有pronunciation记录，使用其音频文件
  if (props.pronunciation && props.pronunciation.audio) {
    audioUrl = getFileUrl(props.pronunciation, props.pronunciation.audio);
  } else {
    // 否则调用音频合成服务
    const params = new URLSearchParams();
    if (props.ipa) params.append('ipas', props.ipa);
    if (props.pinyin) params.append('pinyins', props.pinyin);
    
    audioUrl = `${import.meta.env.VITE_AUDIO_SERVICE_URL}/audio/combine?${params}`;
  }
  
  // 播放音频
  audioContext.value = uni.createInnerAudioContext();
  audioContext.value.src = audioUrl;
  audioContext.value.onPlay(() => {
    isPlaying.value = true;
  });
  audioContext.value.onEnded(() => {
    isPlaying.value = false;
  });
  audioContext.value.onError((e) => {
    console.error('Audio play error:', e);
    isPlaying.value = false;
    uni.showToast({ title: '播放失败', icon: 'error' });
  });
  audioContext.value.play();
};
</script>
```

### 3. DialectTag.vue

```vue
<template>
  <view class="cu-tag sm" :class="tagClass">
    {{ dialect?.name || '未知' }}
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DialectRecord } from '@/types/pocketbase';

const props = defineProps<{
  dialect: DialectRecord;
  showParent?: boolean;
}>();

const tagClass = computed(() => {
  // 根据方言层级或优先级设置不同颜色
  if (props.dialect.priority === 1) return 'bg-red';
  if (props.dialect.priority === 2) return 'bg-orange';
  return 'bg-blue';
});
</script>
```

## 组合式API (Composables)

### useAuth.ts

```typescript
import { ref, computed } from 'vue';
import { getCurrentUser, isAuthenticated, logout as pbLogout } from '@/api/client';
import type { RecordModel } from 'pocketbase';

export function useAuth() {
  const user = ref<RecordModel | null>(getCurrentUser());
  const isLoggedIn = computed(() => isAuthenticated());
  
  const refreshUser = () => {
    user.value = getCurrentUser();
  };
  
  const logout = () => {
    pbLogout();
    user.value = null;
    
    // 跳转到登录页
    uni.reLaunch({
      url: '/pages/index'
    });
  };
  
  return {
    user,
    isLoggedIn,
    refreshUser,
    logout,
  };
}
```

### useDialect.ts

```typescript
import { ref, computed, watch } from 'vue';
import type { DialectRecord } from '@/types/pocketbase';
import { getDialects, getUserPreferredDialect } from '@/api/dialect';
import { getCurrentUser } from '@/api/client';

export function useDialect() {
  const currentDialect = ref<DialectRecord | null>(null);
  const allDialects = ref<DialectRecord[]>([]);
  
  // 加载用户偏好方言
  const loadPreferredDialect = async () => {
    const user = getCurrentUser();
    if (user) {
      const preferred = await getUserPreferredDialect(user.id);
      currentDialect.value = preferred;
    } else {
      // 未登录用户从localStorage读取
      const dialectId = uni.getStorageSync('preferred_dialect');
      if (dialectId) {
        const dialects = await getDialects();
        currentDialect.value = dialects.items.find(d => d.id === dialectId) || null;
      }
    }
  };
  
  // 加载所有方言
  const loadAllDialects = async () => {
    const result = await getDialects();
    allDialects.value = result.items;
  };
  
  // 设置偏好方言
  const setPreferredDialect = async (dialectId: string) => {
    const user = getCurrentUser();
    if (user) {
      // 已登录：保存到用户profile
      await pb.collection('users').update(user.id, {
        dialect: dialectId
      });
    } else {
      // 未登录：保存到localStorage
      uni.setStorageSync('preferred_dialect', dialectId);
    }
    
    await loadPreferredDialect();
  };
  
  return {
    currentDialect,
    allDialects,
    loadPreferredDialect,
    loadAllDialects,
    setPreferredDialect,
  };
}
```

## 迁移清单

### Phase 1: 基础设施（完成）
- [x] API客户端封装
- [x] 类型定义
- [x] 共享组件
- [x] 组合式API

### Phase 2: 核心服务（进行中）
- [ ] 认证服务 (login.js)
- [ ] 用户服务 (user.js)
- [ ] 词语服务 (word.js)
- [ ] 字服务 (character.js)
- [ ] 发音服务 (pronunciation.js)
- [ ] 文章服务 (article.js)
- [ ] 测试服务 (quiz.js)
- [ ] 方言服务 (dialect.js) - NEW

### Phase 3: 页面迁移
- [ ] 首页 (home.vue)
- [ ] 搜索页 (search.vue)
- [ ] 词语详情 (words/details.vue)
- [ ] 字列表 (words/characters/*.vue)
- [ ] 发音页面 (words/pronunciations/*.vue)
- [ ] 用户中心 (users/me.vue)
- [ ] 用户资料 (users/profile.vue)
- [ ] 用户贡献 (users/contribution/*.vue)
- [ ] 登录注册 (login/*.vue)
- [ ] 文章列表 (articles/list.vue)
- [ ] 文章详情 (articles/details.vue)
- [ ] 文章编辑 (articles/edit.vue)
- [ ] 测试列表 (quizzes/list.vue)
- [ ] 测试详情 (quizzes/details.vue)
- [ ] 答题页面 (quizzes/answer.vue)
- [ ] 答题记录 (quizzes/records.vue)
- [ ] 词单页面 (lists/*.vue)
- [ ] 产品页面 (products/*.vue)
- [ ] 消息页面 (mails/*.vue)
- [ ] 工具页面 (tools/*.vue)

### Phase 4: 测试与优化
- [ ] 功能测试
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] 用户体验优化

## 测试checklist

每个页面迁移后需要测试：

- [ ] 页面正常加载
- [ ] 数据正确显示
- [ ] 交互功能正常
- [ ] 错误处理正确
- [ ] 加载状态显示
- [ ] 分页功能正常（如有）
- [ ] 方言切换正常（如有）
- [ ] 音频播放正常（如有）
- [ ] 文件上传正常（如有）
- [ ] 登录状态正确

## 常见问题

### 1. 如何处理关系数据？

使用 `expand` 参数：
```typescript
const word = await pb.collection('words').getOne(id, {
  expand: 'dialect,contributor,related_words'
});

// 访问关系数据
word.expand.dialect.name
word.expand.contributor.name
```

### 2. 如何实现分页？

```typescript
const getList = async (page: number = 1) => {
  const result = await pb.collection('words').getList(page, 30, {
    sort: '-created',
    expand: 'dialect'
  });
  
  return {
    items: result.items,
    page: result.page,
    perPage: result.perPage,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
  };
};
```

### 3. 如何处理文件上传？

```typescript
const formData = new FormData();
formData.append('field1', 'value1');
formData.append('file', fileBlob, 'filename.ext');

await pb.collection('collection').create(formData);
```

### 4. 如何处理实时数据？

使用Pocketbase实时订阅：
```typescript
pb.collection('words').subscribe('*', (e) => {
  console.log(e.action); // create, update, delete
  console.log(e.record);
  
  // 更新UI
  if (e.action === 'create') {
    // ...
  }
});
```

## 性能优化建议

1. **懒加载图片** - 使用 `lazy-load`属性
2. **虚拟列表** - 长列表使用虚拟滚动
3. **缓存策略** - 合理使用缓存减少请求
4. **预加载** - 预加载常用数据（方言列表等）
5. **分页加载** - 避免一次加载大量数据

## 多方言最佳实践

1. **全局方言选择器** - 在导航栏提供快速切换
2. **保存用户偏好** - 登录用户保存到服务端，游客保存到本地
3. **智能默认** - 根据地理位置智能选择默认方言
4. **多片区对比** - 提供"查看所有片区"功能
5. **方言标识** - 清晰标注每条数据的方言归属

## 总结

本迁移遵循渐进式原则，先建立基础设施，再迁移核心服务，最后逐页面迁移。确保每个阶段完成后都能正常运行，降低风险。
