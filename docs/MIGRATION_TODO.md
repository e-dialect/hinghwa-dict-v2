# Django to Pocketbase Migration TODO

This document tracks the migration status of all APIs from Django to Pocketbase.

## Overall Progress

### Completed ✓
- [x] Pocketbase schema design (22 collections)
- [x] Pocketbase directory structure setup
- [x] TypeScript types for all collections
- [x] Pocketbase client wrapper
- [x] Word API service (基础部分完成)
- [x] Data migration guide and scripts

### In Progress ⏳
- [ ] Complete all API services
- [ ] Update mobile app to use new services
- [ ] Test and verify all functionality

## API Migration Status

### 1. Word APIs (`apps/mobile/src/services/word.js`)

| Function | Status | Notes |
|----------|--------|-------|
| `getWordDetails` | ✓ | Migrated to `packages/services/src/api/word.service.ts` |
| `searchWords` | ✓ | Migrated |
| `filterUserWords` | ✓ | Migrated |
| `getWords` (batch) | ✓ | Migrated as `getWordsByIds` |
| `getPhoneticOrder` | ⏳ | TODO: Need to design phonetic ordering structure |
| `searchDictionary` | ⏳ | TODO: Depends on phonetic ordering |

### 2. Character APIs (`apps/mobile/src/services/character.js`)

| Function | Status | Notes |
|----------|--------|-------|
| `getCharacters` (batch) | ✓ | Migrated |
| `searchCharacters` | ✓ | Migrated |
| `getCharacterDetails` | ✓ | Migrated |
| `searchCharactersByFilters` | ✓ | Migrated with phonetic filters |

### 3. Pronunciation APIs (`apps/mobile/src/services/pronunciation.js`)

| Function | Status | Notes |
|----------|--------|-------|
| `createPronunciation` | ⏳ | TODO |
| `getPronunciations` | ⏳ | TODO |
| `getPronunciationsWithTotal` | ⏳ | TODO |
| `combinePronunciation` | ⚠️ | **Cannot migrate** - Requires audio combination server-side |
| `combinePronunciationByChinese` | ⚠️ | **Cannot migrate** - Depends on above |
| `combinePronunciationByPinyin` | ⚠️ | **Cannot migrate** - Depends on above |
| `combinePronunciationByIpa` | ⚠️ | **Cannot migrate** - Depends on above |
| `getPronunciationDetails` | ⏳ | TODO |
| `getPronunciationRanking` | ⏳ | TODO |

### 4. User APIs (`apps/mobile/src/services/user.js`)

| Function | Status | Notes |
|----------|--------|-------|
| `registerUser` | ⏳ | TODO: Adapt for Pocketbase auth |
| `registerWechatUser` | ⚠️ | **Special handling** - WeChat integration |
| `getUserInfo` | ⏳ | TODO |
| `changeUserInfo` | ⏳ | TODO |
| `changeUserPassword` | ⏳ | TODO |
| `changeUserEmail` | ⏳ | TODO |
| `bindingWechat` | ⚠️ | **Special handling** - WeChat integration |
| `cancelBindingWechat` | ⚠️ | **Special handling** - WeChat integration |
| `clearUserInfo` | ⏳ | TODO: Adapt for Pocketbase |
| `getEmailByUsername` | ⏳ | TODO |
| `resetPassword` | ⏳ | TODO |
| `getProductInfo` | ⏳ | TODO |
| `getProductInfoWithId` | ⏳ | TODO |

### 5. Login APIs (`apps/mobile/src/services/login.js`)

| Function | Status | Notes |
|----------|--------|-------|
| `loadUserInfo` | ⏳ | TODO |
| `afterLogin` | ⏳ | TODO: Adapt for Pocketbase |
| `mpLogin` | ⚠️ | **Special handling** - WeChat mini-program |
| `normalLogin` | ⏳ | TODO |
| `getLoginStatus` | ⏳ | TODO |
| `getLoginStatusSync` | ⏳ | TODO |

### 6. Article APIs (`apps/mobile/src/services/article.js`)

| Function | Status | Notes |
|----------|--------|-------|
| `createArticle` | ⏳ | TODO |
| `deleteArticle` | ⏳ | TODO |
| `updateArticle` | ⏳ | TODO |
| `getArticle` | ⏳ | TODO |
| `searchArticleId` | ⏳ | TODO |
| `getArticles` (batch) | ⏳ | TODO |
| `searchArticles` | ⏳ | TODO |
| `likeArticle` | ⏳ | TODO |
| `unlikeArticle` | ⏳ | TODO |
| `createComment` | ⏳ | TODO |
| `getComment` (batch) | ⏳ | TODO |
| `getComments` | ⏳ | TODO |

### 7. Quiz APIs (`apps/mobile/src/services/quiz.js` & `quizset.js`)

| Function | Status | Notes |
|----------|--------|-------|
| `getQuiz` | ⏳ | TODO |
| `searchQuiz` | ⏳ | TODO |
| `getRandomQuiz` | ⏳ | TODO |
| `getTestPaper` | ⏳ | TODO |
| `getAllPapers` | ⏳ | TODO |
| `getPaperDetail` | ⏳ | TODO |
| `getAllRecords` | ⏳ | TODO |
| `getRecord` | ⏳ | TODO |
| `uploadMyAnswer` | ⏳ | TODO |
| `uploadPaper` | ⏳ | TODO |

### 8. File APIs (`apps/mobile/src/services/file.js`)

| Function | Status | Notes |
|----------|--------|-------|
| `uploadFile` | ⏳ | TODO: Adapt for Pocketbase file upload |
| `chooseAndUploadImages` | ⏳ | TODO |
| `chooseAndUploadAnImage` | ⏳ | TODO |

### 9. Mail/Notification APIs (`apps/mobile/src/services/mail.js`)

| Function | Status | Notes |
|----------|--------|-------|
| `postMail` | ⏳ | TODO |
| `getAllMails` | ⏳ | TODO |
| `getMailDetails` | ⏳ | TODO |

### 10. List APIs (`apps/mobile/src/services/lists.js`)

| Function | Status | Notes |
|----------|--------|-------|
| `getWordLists` | ✓ | Migrated |
| `getWordListDetails` | ✓ | Migrated |
| `postWordList` | ✓ | Migrated as `createWordList` |

### 11. Point/Product APIs (`apps/mobile/src/services/point.js`)

| Function | Status | Notes |
|----------|--------|-------|
| `getGoods` | ⏳ | TODO |
| `getGoodDetail` | ⏳ | TODO |
| `uploadGoods` | ⏳ | TODO |
| `getMyPoints` | ⏳ | TODO |

### 12. Website APIs (`apps/mobile/src/services/website.js`)

| Function | Status | Notes |
|----------|--------|-------|
| `sendEmailCode` | ⏳ | TODO |
| `getAnnouncements` | ⏳ | TODO |
| `getHotArticles` | ⏳ | TODO |
| `getWordOfTheDay` | ⏳ | TODO |
| `getDailyExpressions` | ⏳ | TODO |

### 13. Relative APIs (`apps/mobile/src/services/relative.js`)

| Function | Status | Notes |
|----------|--------|-------|
| `buttons` | ✓ | Static data - no migration needed |
| `fieldName` | ✓ | Static data - no migration needed |
| `relative` | ✓ | Static data - no migration needed |
| `find` | ✓ | Static data - no migration needed |

### 14. Share Messages (`apps/mobile/src/services/shareMessages.js`)

| Function | Status | Notes |
|----------|--------|-------|
| `message` | ✓ | Static utility - no migration needed |
| `defaultMessage` | ✓ | Static utility - no migration needed |
| `onShareTimeline` | ✓ | Static utility - no migration needed |

## APIs That Cannot Be Migrated

### 1. Audio Combination API (`combinePronunciation`)
**Reason**: This requires server-side audio processing to combine multiple audio files using pydub (Python library). The Django implementation:
- Takes IPA, pinyin, or Chinese characters as input
- Looks up individual phoneme audio files in a directory (`SAVED_PINYIN/submit/`)
- Uses pydub to merge audio segments with silence between them
- Uploads the combined audio to object storage
- Returns the URL of the combined audio file

Pocketbase doesn't have built-in audio processing capabilities.

**Django Implementation Details** (from `word/pronunciation/views.py`):
```python
def MergeAudio(pinyins, path):
    target = pydub.AudioSegment.silent(duration=100, frame_rate=44100)
    for item in pinyins:
        file = os.path.join(item["dir"], item["pinyin"] + ".mp3")
        music = audio.from_file(file)
        music.set_frame_rate(44100)
        target += music
    target.export(path, format="mp3")
```

**Solution Options**:
1. Keep this API on Django backend temporarily
2. Create a separate Python microservice for audio processing (FastAPI/Flask)
3. Use a third-party audio processing service
4. Implement client-side audio combination (not feasible due to browser limitations)

**Recommended**: Option 2 - Create a separate Python microservice (FastAPI) with the same logic that can be called from Pocketbase hooks or directly from the frontend.

**TODO**:
- [ ] Create FastAPI microservice with pydub
- [ ] Implement `/audio/combine` endpoint
- [ ] Add phoneme audio file storage
- [ ] Integrate with Pocketbase via direct API calls
- [ ] Update frontend to call the new endpoint

### 2. WeChat Integration APIs
**Reason**: WeChat integration requires special handling with WeChat's authentication flow and APIs. These are tightly coupled with uni-app's WeChat capabilities.

**Affected Functions**:
- `registerWechatUser`
- `bindingWechat`
- `cancelBindingWechat`
- `mpLogin`

**Solution**:
- Store WeChat OpenID in user profile (`wechat_openid` field)
- Implement WeChat login flow in Pocketbase hooks
- Use Pocketbase custom auth methods

**TODO**:
- [ ] Create Pocketbase hook for WeChat authentication
- [ ] Implement WeChat OpenID binding
- [ ] Test WeChat mini-program integration

### 3. Complex Phonetic Ordering
**Reason**: The phonetic ordering system (`getPhoneticOrder`, `searchDictionary`) is complex and may require algorithmic processing.

**Solution**:
- Store pre-computed phonetic ordering in a separate collection
- Implement ordering algorithm in Pocketbase hooks
- Or create a dedicated service

**TODO**:
- [ ] Design phonetic ordering data structure
- [ ] Implement ordering algorithm
- [ ] Create API endpoints

## Mobile App Migration Plan

### Phase 1: Service Layer Migration
1. **Copy old service files as reference**
   - Keep `apps/mobile/src/services/*.js` as-is temporarily
   - Reference them when implementing new services

2. **Implement new services in `packages/services`**
   - Complete all API services
   - Add error handling
   - Add type safety

3. **Create compatibility wrapper**
   - Create a compatibility layer that mimics old API responses
   - This allows gradual migration of UI components

### Phase 2: Authentication Migration
1. **Update login flow**
   - Replace Django auth with Pocketbase auth
   - Handle token storage
   - Update auth guards

2. **Update user session management**
   - Adapt to Pocketbase auth store
   - Handle token refresh
   - Update logout logic

### Phase 3: UI Component Migration
1. **Identify all pages using services**
   - Create inventory of pages and their API dependencies
   - Prioritize by usage frequency

2. **Migrate page by page**
   - Start with simple pages (e.g., static content)
   - Then move to complex pages (e.g., word details, search)
   - Test thoroughly after each migration

3. **Update request handlers**
   - Replace all service imports
   - Update response handling
   - Fix any UI rendering issues

### Phase 4: File Upload Migration
1. **Update file upload logic**
   - Replace Django file upload with Pocketbase
   - Handle multipart form data
   - Update file URL generation

2. **Migrate existing files**
   - Download files from old server
   - Upload to Pocketbase storage
   - Update file references in database

### Phase 5: Testing & Deployment
1. **Integration testing**
   - Test all features end-to-end
   - Verify data integrity
   - Check performance

2. **User acceptance testing**
   - Get feedback from users
   - Fix any issues
   - Optimize if needed

3. **Deployment**
   - Deploy Pocketbase backend
   - Deploy updated frontend
   - Monitor for issues

## Next Immediate Steps

1. **Complete remaining API services** (Estimate: 2-3 days)
   - Pronunciation service
   - User service
   - Article service
   - Quiz service
   - Notification service
   - Product/transaction service

2. **Create compatibility wrapper** (Estimate: 1 day)
   - Wrap new services to match old API signatures
   - This allows easier migration of UI components

3. **Implement special handling** (Estimate: 2-3 days)
   - Audio combination service
   - WeChat integration
   - Phonetic ordering

4. **Start mobile app migration** (Estimate: 5-7 days)
   - Begin with authentication
   - Then migrate simple pages
   - Gradually move to complex features

5. **Data migration** (Estimate: 2-3 days)
   - Export Django data
   - Transform to Pocketbase format
   - Import and verify

6. **Testing and fixes** (Estimate: 3-5 days)
   - Comprehensive testing
   - Bug fixes
   - Performance optimization

**Total Estimated Time**: 15-24 days of development work

## Notes for Developer

### Important Considerations

1. **Gradual Migration**: Don't try to migrate everything at once. Start with core features and expand gradually.

2. **Backward Compatibility**: Keep old services working until all pages are migrated.

3. **Data Integrity**: Ensure all data is properly migrated and validated.

4. **User Experience**: Minimize disruption to users. Consider a phased rollout.

5. **Documentation**: Keep documentation updated as you migrate.

6. **Testing**: Test thoroughly at each step. Don't accumulate testing debt.

### Common Pitfalls to Avoid

1. **Don't break existing functionality** while migrating
2. **Don't forget to handle edge cases** in new implementation
3. **Don't skip error handling** - Pocketbase errors are different from Django
4. **Don't forget about file uploads** - They work differently in Pocketbase
5. **Don't ignore WeChat integration** - It's critical for mini-program users
6. **Don't forget to migrate static data** (kinship terms, etc.)

### Tools and Resources

- Pocketbase Documentation: https://pocketbase.io/docs/
- Pocketbase JS SDK: https://github.com/pocketbase/js-sdk
- uni-app Documentation: https://uniapp.dcloud.io/
- Vue 3 Documentation: https://v3.vuejs.org/

### Support

If you encounter issues:
1. Check Pocketbase documentation
2. Review the schema in `pocketbase/SCHEMA.md`
3. Look at existing implemented services for patterns
4. Ask in Pocketbase Discord community
