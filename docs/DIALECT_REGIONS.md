# 方言片区/口音管理指南

## 概述

本系统支持方言的层级结构，可以将不同地区的口音/片区作为子方言进行管理。例如，莆仙方言（Puxian dialect）下可以包含多个地区性的口音变体。

## 莆仙方言片区示例

### 层级结构

```
莆仙话 (puxian)
├── 莆田城里 (putian-chengshi)
├── 仙游城关 (xianyou-chengguan)
└── 仙游游洋 (xianyou-youyang)
```

### 在 Pocketbase 中创建

#### 1. 创建主方言（如果还没有）

```typescript
const puxian = await pb.collection('dialects').create({
  name: '莆仙话',
  code: 'puxian',
  description: '莆田市及周边地区的莆仙方言',
  region: '福建省莆田市',
  speakers: 5000000,
  status: 'active',
  metadata: {
    iso_code: 'cpx',
    alternative_names: ['兴化话', '莆仙语', 'Hinghwa']
  }
});
```

#### 2. 创建子方言/片区

```typescript
// 莆田城里
const putianCity = await pb.collection('dialects').create({
  name: '莆田城里',
  code: 'putian-chengshi',
  description: '莆田市区（城厢区）的口音',
  parent: puxian.id,  // 父方言
  region: '福建省莆田市城厢区',
  speakers: 500000,
  status: 'active',
  metadata: {
    is_standard: true,  // 标记为标准音
    representative_area: '城厢区',
    priority: 1  // 优先级（用于默认选择）
  }
});

// 仙游城关
const xianyouCity = await pb.collection('dialects').create({
  name: '仙游城关',
  code: 'xianyou-chengguan',
  description: '仙游县城关地区的口音',
  parent: puxian.id,
  region: '福建省莆田市仙游县城关',
  speakers: 300000,
  status: 'active',
  metadata: {
    representative_area: '仙游县城',
    priority: 2
  }
});

// 仙游游洋
const xianyouYouyang = await pb.collection('dialects').create({
  name: '仙游游洋',
  code: 'xianyou-youyang',
  description: '仙游县游洋镇的口音',
  parent: puxian.id,
  region: '福建省莆田市仙游县游洋镇',
  speakers: 50000,
  status: 'active',
  metadata: {
    representative_area: '游洋镇',
    priority: 3
  }
});
```

## 前端使用场景

### 1. 获取方言及其子方言

```typescript
import { pb } from 'services';

// 获取莆仙话主方言
const puxian = await pb.collection('dialects')
  .getFirstListItem("code='puxian'");

// 获取所有莆仙话子方言
const subDialects = await pb.collection('dialects')
  .getFullList({
    filter: `parent='${puxian.id}'`,
    sort: 'metadata.priority'  // 按优先级排序
  });

// 结果:
// [
//   { name: '莆田城里', code: 'putian-chengshi', ... },
//   { name: '仙游城关', code: 'xianyou-chengguan', ... },
//   { name: '仙游游洋', code: 'xianyou-youyang', ... }
// ]
```

### 2. 用户偏好口音设置

#### 在用户配置中存储偏好

```typescript
// 用户选择偏好口音
async function setPreferredDialect(userId: string, dialectId: string) {
  const profile = await pb.collection('user_profiles')
    .getFirstListItem(`user='${userId}'`);
  
  await pb.collection('user_profiles').update(profile.id, {
    dialect: dialectId,  // 使用已有的 dialect 字段
    // 或者在 metadata 中存储更多信息
    metadata: {
      ...profile.metadata,
      preferred_accent: dialectId,
      accent_name: '莆田城里'
    }
  });
}

// 获取用户偏好口音
async function getUserPreferredDialect(userId: string) {
  const profile = await pb.collection('user_profiles')
    .getFirstListItem(`user='${userId}'`, {
      expand: 'dialect'
    });
  
  return profile.expand?.dialect;
}
```

#### 在本地存储中保存（未登录用户）

```typescript
// 保存到 localStorage
function saveLocalPreferredDialect(dialectCode: string) {
  localStorage.setItem('preferred_dialect', dialectCode);
}

// 读取
function getLocalPreferredDialect() {
  return localStorage.getItem('preferred_dialect') || 'putian-chengshi'; // 默认莆田城里
}
```

### 3. 按片区检索字音

```typescript
// 获取某个字在所有莆仙话片区的发音
async function getCharacterPronunciationsByDialect(
  characterId: string,
  parentDialectId: string
) {
  // 获取所有子方言
  const subDialects = await pb.collection('dialects')
    .getFullList({ filter: `parent='${parentDialectId}'` });
  
  const dialectIds = [parentDialectId, ...subDialects.map(d => d.id)];
  
  // 获取所有片区的发音
  const pronunciations = await pb.collection('character_pronunciations')
    .getFullList({
      filter: dialectIds.map(id => `dialect='${id}'`).join(' || ') + ` && character='${characterId}'`,
      expand: 'dialect',
      sort: 'dialect.metadata.priority'
    });
  
  return pronunciations;
}
```

### 4. 语音合成时使用用户偏好口音

```typescript
import { combinePronunciation } from 'services';

async function synthesizeSpeech(text: string, userId?: string) {
  // 获取用户偏好口音
  let dialectCode = 'putian-chengshi'; // 默认
  
  if (userId) {
    const preferredDialect = await getUserPreferredDialect(userId);
    if (preferredDialect) {
      dialectCode = preferredDialect.code;
    }
  } else {
    dialectCode = getLocalPreferredDialect();
  }
  
  // 调用音频合成服务
  // 注意：音频服务需要扩展以支持不同片区的音素库
  const result = await combinePronunciation({
    words: text,
    dialect: dialectCode  // 传递方言代码
  });
  
  return result.url;
}
```

### 5. UI 组件：方言选择器

```vue
<template>
  <div class="dialect-selector">
    <select v-model="selectedDialect" @change="onDialectChange">
      <option :value="mainDialect.id">
        {{ mainDialect.name }}（全部）
      </option>
      <option 
        v-for="sub in subDialects" 
        :key="sub.id" 
        :value="sub.id"
      >
        {{ sub.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { pb } from 'services';

const mainDialect = ref(null);
const subDialects = ref([]);
const selectedDialect = ref('');

onMounted(async () => {
  // 加载莆仙话及子方言
  mainDialect.value = await pb.collection('dialects')
    .getFirstListItem("code='puxian'");
  
  subDialects.value = await pb.collection('dialects')
    .getFullList({
      filter: `parent='${mainDialect.value.id}'`,
      sort: 'metadata.priority'
    });
  
  // 加载用户偏好
  const saved = getLocalPreferredDialect();
  selectedDialect.value = saved || mainDialect.value.id;
});

function onDialectChange() {
  // 保存偏好
  const dialect = subDialects.value.find(d => d.id === selectedDialect.value);
  if (dialect) {
    saveLocalPreferredDialect(dialect.code);
  }
  
  // 触发事件，让其他组件知道方言已更改
  emit('dialect-changed', selectedDialect.value);
}
</script>
```

### 6. 显示所有片区的发音

```vue
<template>
  <div class="pronunciation-list">
    <h3>{{ character }} 在莆仙话各片区的读音</h3>
    
    <div 
      v-for="pron in pronunciations" 
      :key="pron.id"
      class="pronunciation-item"
      :class="{ 'preferred': pron.dialect === userPreferredDialect }"
    >
      <div class="dialect-name">
        {{ pron.expand.dialect.name }}
      </div>
      <div class="ipa">{{ pron.ipa }}</div>
      <div class="romanization">{{ pron.romanization }}</div>
      <button @click="playAudio(pron)">
        🔊 播放
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getCharacterPronunciationsByDialect } from 'services';

const props = defineProps<{
  characterId: string;
  character: string;
}>();

const pronunciations = ref([]);
const userPreferredDialect = ref('');

onMounted(async () => {
  // 获取莆仙话主方言ID
  const puxian = await pb.collection('dialects')
    .getFirstListItem("code='puxian'");
  
  // 加载所有片区的发音
  pronunciations.value = await getCharacterPronunciationsByDialect(
    props.characterId,
    puxian.id
  );
  
  // 加载用户偏好
  userPreferredDialect.value = getLocalPreferredDialect();
});

async function playAudio(pron) {
  // 播放音频
  if (pron.audio) {
    const url = pb.files.getUrl(pron, pron.audio);
    const audio = new Audio(url);
    await audio.play();
  }
}
</script>

<style scoped>
.pronunciation-item.preferred {
  background-color: #e8f5e9;
  border-left: 4px solid #4caf50;
}
</style>
```

## 数据迁移

### 迁移现有数据时处理片区

```javascript
// 在 migrate.js 中扩展

// 1. 创建主方言和子方言
const puxian = await createMainDialect();
const subDialects = await createSubDialects(puxian.id);

// 2. 根据原数据的 county 和 town 字段映射到对应片区
function mapToDialect(county, town) {
  if (county === '莆田' && town === '城里') {
    return subDialects.find(d => d.code === 'putian-chengshi');
  } else if (county === '仙游' && town === '城关') {
    return subDialects.find(d => d.code === 'xianyou-chengguan');
  } else if (county === '仙游' && town === '游洋') {
    return subDialects.find(d => d.code === 'xianyou-youyang');
  }
  // 默认返回主方言
  return puxian;
}

// 3. 迁移字音时指定片区
for (const pron of characterPronunciations) {
  const dialect = mapToDialect(pron.county, pron.town);
  
  await pb.collection('character_pronunciations').create({
    character: charIdMap[pron.character_text],
    dialect: dialect.id,  // 使用对应的片区
    ipa: pron.ipa,
    // ... 其他字段
  });
}
```

## 音频服务扩展

### 支持不同片区的音素库

```python
# audio-service/main.py 扩展

PHONEME_DIRS = {
    'putian-chengshi': '/app/phonemes/putian-city',
    'xianyou-chengguan': '/app/phonemes/xianyou-city',
    'xianyou-youyang': '/app/phonemes/xianyou-youyang',
    'puxian': '/app/phonemes/puxian-standard'  # 默认/标准音
}

@app.get("/audio/combine")
async def combine_audio(
    pinyins: str = None,
    dialect: str = Query('puxian', description="Dialect code")
):
    # 选择对应方言的音素目录
    phoneme_dir = PHONEME_DIRS.get(dialect, PHONEME_DIRS['puxian'])
    
    # 使用对应目录的音素文件合成音频
    # ...
```

## API 服务函数扩展

```typescript
// packages/services/src/api/dialect.service.ts (新文件)

/**
 * Get all sub-dialects of a parent dialect
 */
export async function getSubDialects(parentDialectId: string) {
  const pb = getPocketBase();
  
  return await pb.collection('dialects').getFullList({
    filter: `parent='${parentDialectId}'`,
    sort: 'metadata.priority',
  });
}

/**
 * Get dialect hierarchy (parent and children)
 */
export async function getDialectHierarchy(dialectCode: string) {
  const pb = getPocketBase();
  
  // Get the dialect
  const dialect = await pb.collection('dialects')
    .getFirstListItem(`code='${dialectCode}'`, {
      expand: 'parent'
    });
  
  // Get children
  const children = await pb.collection('dialects').getFullList({
    filter: `parent='${dialect.id}'`,
    sort: 'metadata.priority'
  });
  
  return {
    dialect,
    parent: dialect.expand?.parent,
    children
  };
}

/**
 * Search across all related dialects (parent and siblings)
 */
export async function searchAcrossDialectFamily(
  dialectId: string,
  searchParams: any
) {
  const pb = getPocketBase();
  
  // Get dialect info
  const dialect = await pb.collection('dialects').getOne(dialectId);
  
  // If it has a parent, search across all siblings
  // If it is a parent, search across all children
  const familyDialects = dialect.parent
    ? await pb.collection('dialects').getFullList({
        filter: `parent='${dialect.parent}' || id='${dialect.parent}'`
      })
    : await pb.collection('dialects').getFullList({
        filter: `parent='${dialectId}' || id='${dialectId}'`
      });
  
  const dialectIds = familyDialects.map(d => d.id);
  
  // Use these IDs for searching
  return dialectIds;
}
```

## 总结

✅ **架构已支持**：现有的 schema 设计完全支持方言片区/口音的层级结构

✅ **实现方式**：
1. 使用 `parent` 字段建立莆仙话及其子方言的层级关系
2. 在用户配置中存储偏好口音
3. 检索时可以按片区过滤或显示所有片区
4. 语音合成时使用用户偏好片区的音素库

✅ **数据迁移**：根据原数据的 county/town 字段自动映射到对应片区

✅ **前端支持**：提供方言选择器组件，支持偏好保存和多片区展示

这个设计既满足了当前莆仙话多片区的需求，也为未来添加其他方言（如福州话、闽南话等）及其片区预留了扩展性。
