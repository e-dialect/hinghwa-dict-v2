# Phase 3 & 4: 页面迁移执行计划

## 当前状态

✅ **Phase 1完成**: 架构设计
✅ **Phase 2完成**: TypeScript API 层（packages/services，86个函数）
✅ **架构重构完成**: 移除重复代码，集中API到packages/services
✅ **共享组件创建**: DialectSelector, PronunciationButton, DialectTag

🔄 **Phase 3进行中**: 页面迁移（57个Vue页面）

---

## 迁移方法论

### 标准5步流程

每个页面按以下步骤迁移：

#### 步骤1: 更新导入语句
```diff
- import { getWordDetails } from '@/services/word';
+ import { getWordDetails } from '@/api';
+ import type { ExpandedWord } from 'packages/services';
```

#### 步骤2: 添加类型定义
```diff
data() {
  return {
-   word: null
+   word: null as ExpandedWord | null
  }
}
```

#### 步骤3: 更新API调用
```diff
- const res = await getWordDetails(id);
- this.word = res.word;
+ this.word = await getWordDetails(id);
```

#### 步骤4: 更新数据访问
```diff
- word.contributor.nickname
+ word.expand?.contributor?.name
```

#### 步骤5: 添加方言支持（如适用）
```vue
<DialectSelector v-model="selectedDialect" />
<view v-for="pron in pronunciations">
  <DialectTag :dialect="pron.expand.dialect" />
  <PronunciationButton :pronunciation="pron" />
</view>
```

---

## 迁移优先级

### Priority 1: 核心功能（10页）⭐
**预计时间**: 3-4天

1. ✅ **words/details.vue** - 词语详情（最重要，已完成示例）
2. ⏳ words/characters/details.vue - 字详情
3. ⏳ words/pronunciations/upload.vue - 发音上传
4. ✅ **home.vue** - 首页（已完成示例）
5. ⏳ search.vue - 搜索页
6. ⏳ login/login.vue - 登录
7. ⏳ login/register.vue - 注册
8. ⏳ login/forget.vue - 忘记密码
9. ⏳ articles/details.vue - 文章详情
10. ⏳ users/me.vue - 个人中心

### Priority 2: 用户功能（15页）
**预计时间**: 4-5天

**用户管理** (4页)
11. users/edit.vue
12. users/words.vue
13. users/articles.vue
14. users/pronunciations.vue

**积分商城** (3页)
15. products/index.vue
16. products/details.vue
17. products/history.vue

**通知系统** (3页)
18. mails/index.vue
19. mails/details.vue
20. mails/send.vue

**词单管理** (3页)
21. lists/index.vue
22. lists/details.vue
23. lists/create.vue

**设置页面** (2页)
24. users/settings.vue
25. users/profile-settings.vue

### Priority 3: 其他功能（32页）
**预计时间**: 8-10天

**测试系统** (10页)
26-35. quizzes/*

**文章系统** (剩余5页)
36-40. articles/*

**工具页面** (17页)
41-57. tools/*, error pages, etc.

---

## 已完成示例

### 1. words/details.vue 迁移示例

**关键改动**：
```vue
<script>
// 新导入
import { getWordDetails, getWordPronunciations } from '@/api';
import type { ExpandedWord, Pronunciation } from 'packages/services';
import PronunciationButton from '@/components/PronunciationButton.vue';
import DialectTag from '@/components/DialectTag.vue';

export default {
  components: {
    PronunciationButton,
    DialectTag
  },
  data() {
    return {
      word: null as ExpandedWord | null,
      pronunciations: [] as Pronunciation[]
    };
  },
  async onLoad(options) {
    const id = options.id;
    await this.loadWord(id);
  },
  methods: {
    async loadWord(id) {
      try {
        // 新API调用
        this.word = await getWordDetails(id);
        this.pronunciations = await getWordPronunciations(id);
      } catch (error) {
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    }
  }
};
</script>
```

### 2. home.vue 迁移示例

**关键改动**：
```vue
<script>
import { getWordOfTheDay, getAnnouncements } from '@/api';
import type { Word, Article } from 'packages/services';

export default {
  data() {
    return {
      word: null as Word | null,
      announcements: [] as Article[]
    };
  },
  async onLoad() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      try {
        this.word = await getWordOfTheDay();
        this.announcements = await getAnnouncements(1, 10);
      } catch (error) {
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    }
  }
};
</script>
```

---

## 测试清单

每个页面迁移后需要测试：

### 功能测试
- [ ] 页面加载无错误
- [ ] API调用返回正确数据
- [ ] UI正确显示数据
- [ ] 用户交互正常
- [ ] 错误处理显示适当消息
- [ ] 加载状态正确
- [ ] 导航功能正常

### 方言功能测试（如适用）
- [ ] 方言选择器正常工作
- [ ] 用户偏好保存成功
- [ ] 多片区发音正确显示
- [ ] 语音播放使用偏好方言

### uni-app 功能测试
- [ ] 微信登录正常（小程序）
- [ ] 文件上传正常
- [ ] 音频播放正常
- [ ] Toast提示正常
- [ ] 本地存储同步正常

---

## 执行策略

### 渐进式迁移
1. ✅ 保留旧 `/services/` 目录
2. 🔄 逐个页面迁移到新 `/api/`
3. ✅ 新旧API可并存
4. ✅ 所有页面完成后删除旧API

### 批量处理
- 按功能模块分批迁移（词语、用户、文章等）
- 每个模块完成后进行集成测试
- 确保相关页面一起迁移，避免依赖问题

### 质量保证
- 每批迁移3-5个页面
- 立即测试，发现问题立即修复
- 使用类型检查避免运行时错误
- 复用共享组件提高一致性

---

## 工作量估算

| 阶段 | 页面数 | 预计天数 | 说明 |
|------|--------|----------|------|
| Priority 1 | 10 | 3-4天 | 核心功能，需要仔细测试 |
| Priority 2 | 15 | 4-5天 | 用户功能，中等复杂度 |
| Priority 3 | 32 | 8-10天 | 其他功能，相对简单 |
| **Phase 3 总计** | **57** | **15-19天** | 页面迁移 |
| Phase 4 测试 | - | 3-5天 | 全面测试和优化 |
| **总计** | **57** | **18-24天** | 完整迁移 |

---

## 快速完成建议

### 方案1: 先完成3个关键页面
立即完成这3个最重要的页面，建立成功模式：
1. **words/details.vue** ⭐ - 最高流量
2. **home.vue** - 用户入口
3. **login/login.vue** - 关键路径

**时间**: 1天  
**效果**: 证明迁移方案可行，建立信心

### 方案2: 完成Priority 1全部（10页）
完成所有核心功能页面：
**时间**: 3-4天  
**效果**: 主要功能可用，可以进行初步测试

### 方案3: 完整迁移（推荐）
按Priority 1 → 2 → 3 顺序完成全部57页：
**时间**: 18-24天  
**效果**: 完整的系统迁移，生产就绪

---

## 当前进度

✅ **已完成**:
- Phase 1: 架构设计（100%）
- Phase 2: API服务层（100%）
- 架构重构: API集中化（100%）
- 共享组件: 3个（100%）
- 示例迁移: 2个页面（words/details, home）

🔄 **进行中**:
- Phase 3: 页面迁移（4% - 2/57完成）

📋 **待完成**:
- Phase 3: 55个页面待迁移
- Phase 4: 全面测试和优化

---

## 下一步行动

### 立即行动
1. 完成Priority 1剩余8个核心页面
2. 每完成一批（3-5页）进行测试
3. 记录遇到的问题和解决方案

### 中期行动
4. 完成Priority 2的15个用户功能页面
5. 进行集成测试
6. 优化性能和用户体验

### 最终行动
7. 完成Priority 3的32个其他页面
8. 全面测试（Phase 4）
9. 删除旧API代码
10. 准备生产部署

---

## 成功标准

✅ 所有57个页面成功迁移  
✅ 所有功能正常工作  
✅ 类型检查无错误  
✅ 性能满足要求  
✅ 用户体验良好  
✅ 多方言功能完整  
✅ 通过集成测试  
✅ 删除所有旧代码  

---

**状态**: Phase 3开始，已完成架构和示例  
**进度**: 2/57页面完成（4%）  
**下一步**: 完成Priority 1核心页面
