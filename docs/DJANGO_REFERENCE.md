# Django 后端参考文档

本文档记录从 Django 后端（https://github.com/e-dialect/hinghwa-dict-backend）迁移到 Pocketbase 时需要参考的关键实现细节。

## 数据模型对比

### Django Models vs Pocketbase Collections

#### 1. Word (词语)

**Django Model** (`word/models.py`):
```python
class Word(models.Model):
    word = models.CharField(max_length=60)  # 词
    definition = models.TextField()  # 注释
    contributor = models.ForeignKey(User)  # 贡献者
    annotation = models.TextField(blank=True)  # 附注
    mandarin = models.TextField(default="[]")  # 对应普通话词语
    standard_ipa = models.CharField(max_length=100, blank=True)  # 标准IPA
    standard_pinyin = models.CharField(max_length=100, blank=True)  # 标准拼音
    views = models.IntegerField(default=0)  # 访问量
    visibility = models.BooleanField(default=False)  # 是否审核
    related_words = models.ManyToManyField("self")  # 相关词汇
    related_articles = models.ManyToManyField(Article)  # 相关帖子
    tags = models.TextField(default="[]")  # 标签
```

**Pocketbase Collection** (words):
- 基本保持相同字段
- `visibility` 改为 `verified` (更清晰)
- 添加 `dialect` 字段支持多方言
- 添加 `characters` 字段关联单字
- `tags` 使用 JSON array 类型而非字符串

#### 2. Character (单字)

**Django Model**:
```python
class Character(models.Model):
    shengmu = models.CharField(max_length=30)  # 声母
    ipa = models.CharField(max_length=30)
    pinyin = models.CharField(max_length=30)  # 拼音
    yunmu = models.CharField(max_length=30)  # 韵母
    shengdiao = models.CharField(max_length=10)  # 声调
    character = models.CharField(max_length=10)  # 汉字
    county = models.CharField(max_length=100)  # 县区
    town = models.CharField(max_length=100)  # 乡镇
    traditional = models.CharField(max_length=30)  # 繁体字
    type = models.CharField(max_length=20, null=True)  # 读音类型
```

**Pocketbase Collections** (拆分为多个):
1. `characters` - 基本字信息
   - `simplified`, `traditional`, `unicode`, `phonological_position`
2. `character_pronunciations` - 字的发音
   - `character`, `dialect`, `ipa`, `romanization`, `initial`, `final`, `tone`
   - `county`, `town` 改为与 `dialect` 关联
   - `reading_type` (文白读)

**改进**: 将字的基本信息与发音信息分离，支持一字多音和多方言。

#### 3. Pronunciation (语音)

**Django Model**:
```python
class Pronunciation(models.Model):
    word = models.ForeignKey(Word)  # 词语
    source = models.URLField()  # 来源(音频URL)
    ipa = models.CharField(max_length=50)
    pinyin = models.CharField(max_length=50)
    county = models.CharField(max_length=100)  # 县区
    town = models.CharField(max_length=100)  # 乡镇
    contributor = models.ForeignKey(User)
    visibility = models.BooleanField(default=False)
    verifier = models.ForeignKey(User, null=True)
    views = models.IntegerField(default=0)
    upload_time = models.DateTimeField(auto_now_add=True)
```

**Pocketbase Collection** (pronunciations):
- 添加 `type` 字段 (character/word/phrase/sentence)
- `source` 改为 `audio` (file类型)
- 添加 `dialect` 关联
- 添加 `quality`, `duration` 字段
- `content` 字段存储文本内容

## 关键 API 实现参考

### 1. 音频合成 (Audio Combination)

**Django 实现** (`word/pronunciation/views.py`):

```python
def combinePronunciationV2(request):
    # 接收参数: words (汉字), ipas (IPA), pinyins (拼音)
    
    # 1. 获取可用的音频文件列表
    submit_list = os.listdir(os.path.join(settings.SAVED_PINYIN, "submit"))
    available = set([file.replace(".mp3", "") for file in submit_list if file.endswith(".mp3")])
    
    # 2. 根据输入类型转换为拼音
    if "words" in request.GET:
        # 查询 Character 表获取每个字的拼音
        result = Character.objects.filter(character__in=request.GET["words"])
        # 为每个字建立拼音候选集
    elif "ipas" in request.GET:
        # IPA 转拼音
        ipas = split(request.GET["ipas"]).split(" ")
        for ipa in ipas:
            inputs.append({translate.IPA_to_pinyin(ipa)})
    elif "pinyins" in request.GET:
        # 直接使用拼音
        pinyins = split(request.GET["pinyins"]).split(" ")
    
    # 3. 合成音频
    results = []
    for alt_pinyin in inputs:
        # 优先使用完全匹配的音频
        if len(alt_pinyin & available) > 0:
            result = {
                "pinyin": list(alt_pinyin & available)[0],
                "dir": os.path.join(settings.SAVED_PINYIN, "submit"),
            }
        # 次选：忽略声调匹配
        elif len(secondary_pinyin & secondary) > 0:
            # ...
        results.append(result)
    
    # 4. 使用 pydub 合并音频
    target = pydub.AudioSegment.silent(duration=100, frame_rate=44100)
    for item in results:
        file = os.path.join(item["dir"], item["pinyin"] + ".mp3")
        music = audio.from_file(file)
        target += music
    target.export(path, format="mp3")
    
    # 5. 上传到对象存储
    upload_file(path, key)
    
    return JsonResponse({"url": url, "tts": tts_url})
```

**关键要点**:
- 音频文件存储在 `SAVED_PINYIN/submit/` 目录
- 文件命名: `{pinyin}{tone}.mp3`，如 `heng1.mp3`
- 支持声调模糊匹配 (fallback to secondary)
- 使用 pydub 处理音频合并
- 音频参数: 44100Hz, MP3格式
- 音频间添加100ms静音

**Pocketbase 迁移方案**:
需要创建独立的音频处理微服务 (FastAPI):
```python
# audio-service/main.py
from fastapi import FastAPI, Query
from pydub import AudioSegment
import os

app = FastAPI()

@app.get("/audio/combine")
async def combine_audio(
    words: str = None,
    ipas: str = None,
    pinyins: str = None
):
    # 实现相同逻辑
    # 返回合成后的音频URL
    pass
```

### 2. 拼音查字 (Search Characters by Phonetic)

**Django 实现** (`word/character/views.py`):

```python
def searchCharactersPinyin(request):
    characters = Character.objects.all()
    
    # 按声母、韵母、声调筛选
    if "shengmu" in request.GET:
        characters = characters.filter(shengmu=request.GET["shengmu"])
    if "yunmu" in request.GET:
        characters = characters.filter(yunmu=request.GET["yunmu"])
    if "shengdiao" in request.GET:
        characters = characters.filter(shengdiao=request.GET["shengdiao"])
    
    # 去重逻辑：优先保留"城里"、"莆田"的发音
    result = {}
    for item in characters:
        if ((item.pinyin, item.character) not in result) or \
           (item.town == "城里" and item.county == "莆田"):
            result[(item.pinyin, item.character, item.traditional)] = item
    
    # 关联词语和语音
    # 按拼音归类所有 Word 和 Pronunciation
    words_dict = {}
    for item in Word.objects.filter(standard_pinyin__in=pinyin_list):
        if item.standard_pinyin not in words_dict:
            words_dict[item.standard_pinyin] = []
        words_dict[item.standard_pinyin].append(item)
    
    # 组装返回数据
    for (pinyin, char, trad), character in result.items():
        data = {
            "character": char,
            "traditional": trad,
            "pinyin": pinyin,
            "ipa": character.ipa,
            "words": words_dict.get(pinyin, []),
            "pronunciations": pronunciations_dict.get(pinyin, []),
        }
```

**Pocketbase 迁移**:
```typescript
// 需要两步查询
// 1. 查询 character_pronunciations
const pronunciations = await pb.collection('character_pronunciations')
  .getFullList({
    filter: 'initial="h" && final="eng" && tone="1"',
    expand: 'character'
  });

// 2. 获取关联的词语 (需要优化查询)
// 可以通过 word_pronunciations 关联
```

### 3. 词语详情 (Word Details)

**Django 实现** (`word/word/views.py`):

```python
def getWord(request, id):
    word = Word.objects.get(id=id)
    
    # 增加访问量
    word.views += 1
    word.save()
    
    # 获取贡献者信息
    contributor = {
        "nickname": word.contributor.profile.nickname,
        "avatar": word.contributor.profile.avatar.url,
        "id": word.contributor.id,
    }
    
    # 获取相关词语和文章
    related_words = [{"id": w.id, "word": w.word} for w in word.related_words.all()]
    related_articles = [{"id": a.id, "title": a.title} for a in word.related_articles.all()]
    
    return JsonResponse({
        "word": {
            "id": word.id,
            "word": word.word,
            "definition": word.definition,
            "annotation": word.annotation,
            "mandarin": json.loads(word.mandarin),
            "standard_ipa": word.standard_ipa,
            "standard_pinyin": word.standard_pinyin,
            "views": word.views,
            "related_words": related_words,
            "related_articles": related_articles,
            "contributor": contributor,
        }
    })
```

**Pocketbase 迁移**:
```typescript
const word = await pb.collection('words').getOne(id, {
  expand: 'dialect,contributor,related_words,related_articles'
});

// 更新访问量
await pb.collection('words').update(id, {
  views: word.views + 1
});
```

### 4. 用户认证 (Authentication)

**Django 实现** (JWT):
```python
# 登录
def login(request):
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(username=username, password=password)
    
    if user:
        # 生成 JWT token
        payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=7)
        }
        token = jwt.encode(payload, settings.JWT_KEY, algorithm='HS256')
        return JsonResponse({"token": token, "id": user.id})
```

**Pocketbase 迁移**:
```typescript
// Pocketbase 内置 JWT 认证
const authData = await pb.collection('users').authWithPassword(
  username,
  password
);
// authData.token 自动管理
// authData.record 包含用户信息
```

### 5. 微信登录 (WeChat Login)

**Django 实现**:
```python
def wechat_login(request):
    jscode = request.POST['jscode']
    
    # 调用微信 API 获取 session_key 和 openid
    response = requests.get(
        f"https://api.weixin.qq.com/sns/jscode2session",
        params={
            "appid": settings.WECHAT_APPID,
            "secret": settings.WECHAT_SECRET,
            "js_code": jscode,
            "grant_type": "authorization_code"
        }
    )
    data = response.json()
    openid = data['openid']
    
    # 查找或创建用户
    try:
        profile = UserProfile.objects.get(wechat_openid=openid)
        user = profile.user
    except UserProfile.DoesNotExist:
        # 返回 404，前端引导用户注册
        return JsonResponse({"msg": "User not found"}, status=404)
    
    # 生成 token
    token = generate_token(user)
    return JsonResponse({"token": token, "id": user.id})
```

**Pocketbase 迁移**:
需要在 Pocketbase hooks 中实现:
```javascript
// pb_hooks/wechat_auth.pb.js
onBeforeServe((e) => {
  e.router.add("POST", "/api/wechat/login", (c) => {
    const jscode = c.formValue("jscode")
    
    // 调用微信 API
    const response = $http.send({
      url: "https://api.weixin.qq.com/sns/jscode2session",
      method: "GET",
      params: {
        appid: $os.getenv("WECHAT_APPID"),
        secret: $os.getenv("WECHAT_SECRET"),
        js_code: jscode,
        grant_type: "authorization_code"
      }
    })
    
    const openid = response.json.openid
    
    // 查找用户
    const users = $app.dao().findRecordsByExpr("users", 
      $dbx.hashExp({"wechat_openid": openid})
    )
    
    if (users.length === 0) {
      return c.json(404, {"message": "User not found"})
    }
    
    // 生成认证 token
    const record = users[0]
    return c.json(200, {
      token: record.token,
      record: record
    })
  })
})
```

## 数据清理和验证

### Django 中的数据清理

Django models 使用 `clean()` 和 `save()` 方法进行数据清理:

```python
def clean(self):
    self.word = self.word.strip()
    self.definition = self.definition.strip()
    self.standard_ipa = split(self.standard_ipa)  # 格式化 IPA
    self.standard_pinyin = split(self.standard_pinyin)  # 格式化拼音
    return super(Word, self).clean()

def split(x: str) -> str:
    # 在数字后添加空格: "heng1hua2" -> "heng1 hua2"
    return re.sub("([0-9])([^0-9])", "\g<1> \g<2>", re.sub(" *", "", x))
```

### Pocketbase 中的数据验证

在 Pocketbase hooks 中实现:

```javascript
// pb_hooks/word_validation.pb.js
onRecordBeforeCreateRequest((e) => {
  if (e.collection.name !== "words") return
  
  // 清理数据
  e.record.set("word", e.record.get("word").trim())
  e.record.set("definition", e.record.get("definition").trim())
  
  // 格式化 IPA 和拼音
  const ipa = e.record.get("standard_ipa")
  if (ipa) {
    e.record.set("standard_ipa", splitPinyin(ipa))
  }
}, "words")

function splitPinyin(text) {
  // 在数字后添加空格
  return text.replace(/(\d)([^\d])/g, "$1 $2").replace(/\s+/g, " ").trim()
}
```

## 权限控制

### Django 权限

Django 使用装饰器和中间件:

```python
@csrf_exempt
@token_check  # 自定义装饰器验证 JWT
def createWord(request):
    user = get_request_user(request)
    # 创建词语
```

### Pocketbase 权限

Pocketbase 使用 Collection Rules:

```javascript
// words collection rules
{
  "listRule": "",  // 所有人可以列出
  "viewRule": "",  // 所有人可以查看
  "createRule": "@request.auth.id != ''",  // 登录用户可以创建
  "updateRule": "@request.auth.id = contributor",  // 只能更新自己的
  "deleteRule": "@request.auth.role = 'admin'"  // 只有管理员可以删除
}
```

## 文件上传

### Django 文件上传

```python
def upload_file(request):
    file = request.FILES['file']
    
    # 保存到本地
    path = os.path.join(settings.MEDIA_ROOT, 'uploads', file.name)
    with open(path, 'wb+') as destination:
        for chunk in file.chunks():
            destination.write(chunk)
    
    # 上传到 COS (腾讯云对象存储)
    cos_client.upload_file(path, key)
    
    return JsonResponse({"url": cos_url})
```

### Pocketbase 文件上传

Pocketbase 内置文件存储:

```typescript
// 前端上传
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('content', '兴化');
formData.append('dialect', dialectId);

const record = await pb.collection('pronunciations').create(formData);

// 获取文件 URL
const url = pb.files.getUrl(record, record.audio);
```

## 总结

### 主要差异

1. **数据模型**: Pocketbase 更扁平化，需要更多关联表
2. **认证**: Pocketbase 内置 JWT，更简单
3. **权限**: Pocketbase 使用声明式规则，Django 使用代码
4. **文件**: Pocketbase 内置存储，Django 需要额外配置
5. **API**: Pocketbase RESTful 自动生成，Django 需要手写

### 需要特殊处理的功能

1. **音频合成**: 需要独立微服务
2. **微信登录**: 需要自定义 hooks
3. **复杂查询**: 可能需要多步查询或自定义端点
4. **数据清理**: 需要在 hooks 中实现

### 优势

1. Pocketbase 更轻量，部署更简单
2. 自动生成 RESTful API
3. 内置实时订阅功能
4. 更好的类型安全 (TypeScript)
5. 更容易扩展多方言支持
