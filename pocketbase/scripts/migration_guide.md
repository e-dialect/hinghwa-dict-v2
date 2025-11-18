# Data Migration Guide: Django to Pocketbase

This guide provides step-by-step instructions for migrating data from the old Django backend to the new Pocketbase backend.

## Overview

The migration process involves:
1. Exporting data from Django database
2. Transforming data to match new schema
3. Importing data into Pocketbase
4. Verifying data integrity
5. Updating frontend to use new API

## Prerequisites

- Access to Django database (PostgreSQL/MySQL)
- Running Pocketbase instance
- Node.js installed for running scripts
- Python installed for export scripts

## Migration Steps

### Phase 1: Setup and Export

#### 1.1 Export Django Data

Create export scripts to dump data from Django database:

```python
# scripts/export_django_data.py
import json
import sys
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project.settings')
django.setup()

from your_app.models import Word, Character, Pronunciation, User, Article

def export_users():
    users = []
    for user in User.objects.all():
        users.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'nickname': user.profile.nickname if hasattr(user, 'profile') else user.username,
            'avatar': user.profile.avatar.url if hasattr(user, 'profile') and user.profile.avatar else None,
            'wechat_openid': user.profile.wechat_openid if hasattr(user, 'profile') else None,
            'created': user.date_joined.isoformat(),
        })
    with open('export/users.json', 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)
    print(f"Exported {len(users)} users")

def export_characters():
    characters = []
    for char in Character.objects.all():
        characters.append({
            'id': char.id,
            'simplified': char.simplified,
            'traditional': char.traditional,
            'unicode': char.unicode,
            'meanings': char.meanings,
            # Add other fields as needed
        })
    with open('export/characters.json', 'w', encoding='utf-8') as f:
        json.dump(characters, f, ensure_ascii=False, indent=2)
    print(f"Exported {len(characters)} characters")

def export_words():
    words = []
    for word in Word.objects.all():
        words.append({
            'id': word.id,
            'word': word.word,
            'definition': word.definition,
            'standard_ipa': word.standard_ipa,
            'standard_pinyin': word.standard_pinyin,
            'contributor_id': word.contributor_id,
            'created': word.created.isoformat(),
            'views': word.views,
            # Add other fields
        })
    with open('export/words.json', 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False, indent=2)
    print(f"Exported {len(words)} words")

def export_pronunciations():
    pronunciations = []
    for pron in Pronunciation.objects.all():
        pronunciations.append({
            'id': pron.id,
            'content': pron.content,
            'ipa': pron.ipa,
            'pinyin': pron.pinyin,
            'audio_url': pron.audio.url if pron.audio else None,
            'contributor_id': pron.contributor_id,
            'created': pron.created.isoformat(),
        })
    with open('export/pronunciations.json', 'w', encoding='utf-8') as f:
        json.dump(pronunciations, f, ensure_ascii=False, indent=2)
    print(f"Exported {len(pronunciations)} pronunciations")

def export_articles():
    articles = []
    for article in Article.objects.all():
        articles.append({
            'id': article.id,
            'title': article.title,
            'description': article.description,
            'content': article.content,
            'cover': article.cover.url if article.cover else None,
            'author_id': article.author_id,
            'views': article.views,
            'likes': article.likes,
            'created': article.created.isoformat(),
        })
    with open('export/articles.json', 'w', encoding='utf-8') as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    print(f"Exported {len(articles)} articles")

if __name__ == '__main__':
    os.makedirs('export', exist_ok=True)
    export_users()
    export_characters()
    export_words()
    export_pronunciations()
    export_articles()
    print("Export complete!")
```

Run the export script:

```bash
python scripts/export_django_data.py
```

### Phase 2: Data Transformation

#### 2.1 Transform Data to Pocketbase Format

Create transformation scripts:

```javascript
// scripts/transform_data.js
const fs = require('fs');
const path = require('path');

// Create default Puxian dialect
const puxianDialect = {
  name: '莆仙话',
  code: 'puxian',
  description: '莆田市及周边地区的莆仙方言',
  region: '福建省莆田市',
  speakers: 5000000,
  status: 'active',
};

// Transform users
function transformUsers() {
  const djangoUsers = JSON.parse(fs.readFileSync('export/users.json', 'utf-8'));
  const pbUsers = djangoUsers.map(user => ({
    username: user.username,
    email: user.email,
    emailVisibility: true,
    password: 'REQUIRES_RESET', // Users need to reset password
    passwordConfirm: 'REQUIRES_RESET',
    name: user.nickname,
    avatar: user.avatar,
    // Store old ID for reference mapping
    old_id: user.id,
  }));
  
  fs.writeFileSync('import/pb_users.json', JSON.stringify(pbUsers, null, 2));
  console.log(`Transformed ${pbUsers.length} users`);
}

// Transform characters
function transformCharacters() {
  const djangoChars = JSON.parse(fs.readFileSync('export/characters.json', 'utf-8'));
  const pbChars = djangoChars.map(char => ({
    simplified: char.simplified,
    traditional: char.traditional || char.simplified,
    unicode: char.unicode,
    meanings: char.meanings || [],
    variants: [],
    old_id: char.id,
  }));
  
  fs.writeFileSync('import/pb_characters.json', JSON.stringify(pbChars, null, 2));
  console.log(`Transformed ${pbChars.length} characters`);
}

// Transform words
function transformWords(userIdMap, dialectId) {
  const djangoWords = JSON.parse(fs.readFileSync('export/words.json', 'utf-8'));
  const pbWords = djangoWords.map(word => ({
    word: word.word,
    dialect: dialectId,
    definition: word.definition,
    standard_ipa: word.standard_ipa || '',
    standard_romanization: word.standard_pinyin || '',
    contributor: userIdMap[word.contributor_id] || null,
    views: word.views || 0,
    verified: false, // Needs re-verification
    old_id: word.id,
  }));
  
  fs.writeFileSync('import/pb_words.json', JSON.stringify(pbWords, null, 2));
  console.log(`Transformed ${pbWords.length} words`);
}

// Transform pronunciations
function transformPronunciations(userIdMap, dialectId) {
  const djangoProns = JSON.parse(fs.readFileSync('export/pronunciations.json', 'utf-8'));
  const pbProns = djangoProns.map(pron => ({
    type: 'character', // Determine based on content length
    content: pron.content,
    ipa: pron.ipa || '',
    romanization: pron.pinyin || '',
    dialect: dialectId,
    contributor: userIdMap[pron.contributor_id] || null,
    audio_url: pron.audio_url, // Will need to re-upload files
    verified: false,
    old_id: pron.id,
  }));
  
  fs.writeFileSync('import/pb_pronunciations.json', JSON.stringify(pbProns, null, 2));
  console.log(`Transformed ${pbProns.length} pronunciations`);
}

// Transform articles
function transformArticles(userIdMap) {
  const djangoArticles = JSON.parse(fs.readFileSync('export/articles.json', 'utf-8'));
  const pbArticles = djangoArticles.map(article => ({
    title: article.title,
    description: article.description || '',
    content: article.content,
    author: userIdMap[article.author_id] || null,
    cover_url: article.cover,
    views: article.views || 0,
    likes: article.likes || 0,
    status: 'published',
    old_id: article.id,
  }));
  
  fs.writeFileSync('import/pb_articles.json', JSON.stringify(pbArticles, null, 2));
  console.log(`Transformed ${pbArticles.length} articles`);
}

// Main transformation
async function main() {
  fs.mkdirSync('import', { recursive: true });
  
  // Save dialect
  fs.writeFileSync('import/pb_dialect.json', JSON.stringify([puxianDialect], null, 2));
  
  // Transform data (need to map user IDs after import)
  transformUsers();
  transformCharacters();
  
  console.log('Transformation complete!');
  console.log('Note: words, pronunciations, and articles need user ID mapping after user import');
}

main();
```

Run transformation:

```bash
node scripts/transform_data.js
```

### Phase 3: Import to Pocketbase

#### 3.1 Create Import Script

```javascript
// scripts/import_to_pocketbase.js
const PocketBase = require('pocketbase/cjs');
const fs = require('fs');

const pb = new PocketBase('http://127.0.0.1:8090');

async function authenticate() {
  await pb.admins.authWithPassword('admin@example.com', 'admin-password');
  console.log('Authenticated as admin');
}

async function importDialect() {
  const dialects = JSON.parse(fs.readFileSync('import/pb_dialect.json', 'utf-8'));
  for (const dialect of dialects) {
    try {
      const record = await pb.collection('dialects').create(dialect);
      console.log(`Created dialect: ${record.name}`);
      return record.id;
    } catch (error) {
      console.error(`Error creating dialect: ${error.message}`);
    }
  }
}

async function importUsers() {
  const users = JSON.parse(fs.readFileSync('import/pb_users.json', 'utf-8'));
  const idMap = {};
  
  for (const user of users) {
    try {
      const record = await pb.collection('users').create({
        username: user.username,
        email: user.email,
        emailVisibility: user.emailVisibility,
        password: Math.random().toString(36).slice(-8), // Random temp password
        passwordConfirm: Math.random().toString(36).slice(-8),
        verified: false, // Users need to verify email
      });
      
      idMap[user.old_id] = record.id;
      console.log(`Created user: ${user.username}`);
    } catch (error) {
      console.error(`Error creating user ${user.username}: ${error.message}`);
    }
  }
  
  fs.writeFileSync('import/user_id_map.json', JSON.stringify(idMap, null, 2));
  return idMap;
}

async function importCharacters() {
  const characters = JSON.parse(fs.readFileSync('import/pb_characters.json', 'utf-8'));
  const idMap = {};
  
  for (const char of characters) {
    try {
      const record = await pb.collection('characters').create({
        simplified: char.simplified,
        traditional: char.traditional,
        unicode: char.unicode,
        meanings: char.meanings,
      });
      
      idMap[char.old_id] = record.id;
      console.log(`Created character: ${char.simplified}`);
    } catch (error) {
      console.error(`Error creating character: ${error.message}`);
    }
  }
  
  fs.writeFileSync('import/character_id_map.json', JSON.stringify(idMap, null, 2));
  return idMap;
}

async function importWords(dialectId, userIdMap) {
  const words = JSON.parse(fs.readFileSync('import/pb_words.json', 'utf-8'));
  
  for (const word of words) {
    try {
      await pb.collection('words').create({
        ...word,
        dialect: dialectId,
        contributor: userIdMap[word.contributor] || null,
      });
      console.log(`Created word: ${word.word}`);
    } catch (error) {
      console.error(`Error creating word ${word.word}: ${error.message}`);
    }
  }
}

async function main() {
  try {
    await authenticate();
    
    // Import in correct order
    console.log('Importing dialect...');
    const dialectId = await importDialect();
    
    console.log('Importing users...');
    const userIdMap = await importUsers();
    
    console.log('Importing characters...');
    await importCharacters();
    
    console.log('Importing words...');
    await importWords(dialectId, userIdMap);
    
    console.log('Import complete!');
  } catch (error) {
    console.error('Import failed:', error);
  }
}

main();
```

#### 3.2 Install Dependencies and Run Import

```bash
cd pocketbase/scripts
npm install pocketbase
node import_to_pocketbase.js
```

### Phase 4: File Migration

#### 4.1 Upload Files to Pocketbase

```javascript
// scripts/migrate_files.js
const PocketBase = require('pocketbase/cjs');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const pb = new PocketBase('http://127.0.0.1:8090');

async function downloadAndReupload(oldUrl, collection, recordId, fieldName) {
  try {
    // Download file from old server
    const response = await axios.get(oldUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    // Create form data
    const formData = new FormData();
    const filename = path.basename(oldUrl);
    formData.append(fieldName, new Blob([buffer]), filename);
    
    // Update record with new file
    await pb.collection(collection).update(recordId, formData);
    console.log(`Migrated file: ${filename}`);
  } catch (error) {
    console.error(`Error migrating file ${oldUrl}: ${error.message}`);
  }
}

async function migrateAvatars() {
  const users = await pb.collection('users').getFullList();
  
  for (const user of users) {
    const userExport = /* load from export with old avatar URL */;
    if (userExport.avatar) {
      await downloadAndReupload(userExport.avatar, 'users', user.id, 'avatar');
    }
  }
}

async function migratePronunciationAudio() {
  const pronunciations = await pb.collection('pronunciations').getFullList();
  
  for (const pron of pronunciations) {
    const pronExport = /* load from export with old audio URL */;
    if (pronExport.audio_url) {
      await downloadAndReupload(pronExport.audio_url, 'pronunciations', pron.id, 'audio');
    }
  }
}

async function main() {
  await pb.admins.authWithPassword('admin@example.com', 'admin-password');
  
  console.log('Migrating avatars...');
  await migrateAvatars();
  
  console.log('Migrating pronunciation audio...');
  await migratePronunciationAudio();
  
  console.log('File migration complete!');
}

main();
```

### Phase 5: Verification

#### 5.1 Verify Data Integrity

```javascript
// scripts/verify_migration.js
const PocketBase = require('pocketbase/cjs');
const fs = require('fs');

const pb = new PocketBase('http://127.0.0.1:8090');

async function verifyCount(collection, expectedCount) {
  const records = await pb.collection(collection).getFullList();
  const actual = records.length;
  const status = actual === expectedCount ? '✓' : '✗';
  console.log(`${status} ${collection}: ${actual} / ${expectedCount}`);
  return actual === expectedCount;
}

async function verifyRelations() {
  // Check that words reference valid dialects
  const words = await pb.collection('words').getFullList();
  let validWords = 0;
  
  for (const word of words) {
    if (word.dialect && word.contributor) {
      validWords++;
    }
  }
  
  console.log(`✓ Words with valid relations: ${validWords} / ${words.length}`);
}

async function main() {
  await pb.admins.authWithPassword('admin@example.com', 'admin-password');
  
  console.log('Verifying migration...\n');
  
  // Load expected counts from export
  const expectedCounts = {
    users: JSON.parse(fs.readFileSync('export/users.json')).length,
    characters: JSON.parse(fs.readFileSync('export/characters.json')).length,
    words: JSON.parse(fs.readFileSync('export/words.json')).length,
    pronunciations: JSON.parse(fs.readFileSync('export/pronunciations.json')).length,
    articles: JSON.parse(fs.readFileSync('export/articles.json')).length,
  };
  
  let allPassed = true;
  for (const [collection, count] of Object.entries(expectedCounts)) {
    const passed = await verifyCount(collection, count);
    allPassed = allPassed && passed;
  }
  
  await verifyRelations();
  
  if (allPassed) {
    console.log('\n✓ All verifications passed!');
  } else {
    console.log('\n✗ Some verifications failed. Check the logs above.');
  }
}

main();
```

## Post-Migration Tasks

### 1. Update Frontend Configuration

Update `packages/constants/shared/urls.ts`:

```typescript
export const BASE_URL = 'http://127.0.0.1:8090/api';
```

### 2. Test API Endpoints

Test key endpoints:

```bash
# Test word search
curl "http://127.0.0.1:8090/api/collections/words/records?filter=(word~'兴化')"

# Test user authentication
curl -X POST "http://127.0.0.1:8090/api/collections/users/auth-with-password" \
  -d '{"identity":"username","password":"password"}'
```

### 3. Update Mobile App

The frontend migration will be handled separately. Key changes:
- Replace all service calls from `apps/mobile/src/services/*.js`
- Use new Pocketbase client from `packages/services`
- Update authentication flow
- Update file upload handling

### 4. Password Reset

Since we can't migrate passwords, users need to reset:

1. Send password reset emails to all users
2. Or set up a migration flow where users verify their identity

### 5. Monitor and Fix

- Monitor error logs
- Fix any data inconsistencies
- Update missing relationships
- Re-verify content quality

## Rollback Plan

If migration fails:

1. Keep old Django backend running
2. Don't switch frontend to new API yet
3. Fix issues in Pocketbase
4. Re-run migration
5. Only switch frontend after full verification

## Timeline Estimate

- Phase 1 (Export): 2-4 hours
- Phase 2 (Transform): 4-8 hours
- Phase 3 (Import): 4-8 hours
- Phase 4 (Files): 8-16 hours (depending on file count)
- Phase 5 (Verify): 2-4 hours
- Post-migration: 4-8 hours

**Total: 24-48 hours**

## Troubleshooting

### Common Issues

1. **Timeout during import**: Increase batch size or add delays between imports
2. **File upload fails**: Check file size limits and storage configuration
3. **Relation errors**: Ensure referenced records exist before creating relations
4. **Duplicate key errors**: Handle existing records by checking before creating

### Support

- Pocketbase Discord: https://discord.gg/pocketbase
- Documentation: https://pocketbase.io/docs/
- GitHub Issues: https://github.com/pocketbase/pocketbase/issues
