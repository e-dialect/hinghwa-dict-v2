# Pocketbase Schema Design for Multi-Dialect Dictionary

## Overview
This schema is designed to support multiple Chinese dialects with a focus on phonological data, characters, words, and user-generated content.

## Core Collections

### 1. dialects
Stores information about different dialect regions.

**Fields:**
- `name` (text, required, unique) - Dialect name (e.g., "莆仙话", "福州话")
- `code` (text, required, unique) - Dialect code (e.g., "puxian", "fuzhou")
- `description` (text) - Description of the dialect
- `parent` (relation to dialects, optional) - Parent dialect for hierarchical relationships
- `region` (text) - Geographic region
- `speakers` (number) - Estimated number of speakers
- `status` (select: active, inactive) - Status of the dialect
- `metadata` (json) - Additional metadata

### 2. phonological_positions
Stores 切韻地位 (Qieyun phonological positions) for Chinese characters.

**Fields:**
- `initial` (text, required) - 聲母 (initial consonant)
- `final` (text, required) - 韻母 (final/rhyme)
- `tone` (text, required) - 聲調 (tone)
- `division` (text) - 等 (division, 1-4)
- `articulation` (text) - 呼 (articulation: 開口呼, 合口呼, etc.)
- `class` (text) - 類 (class)
- `description` (text) - Description
- `metadata` (json) - Additional phonological data

**Indexes:**
- Composite index on `initial`, `final`, `tone` for fast lookup

### 3. characters
Stores individual Chinese characters with their phonological positions.

**Fields:**
- `simplified` (text, required) - Simplified character
- `traditional` (text) - Traditional character
- `phonological_position` (relation to phonological_positions, optional) - Link to 切韻地位
- `unicode` (text, required) - Unicode codepoint
- `radical` (text) - Character radical
- `stroke_count` (number) - Number of strokes
- `meanings` (json) - Array of meanings in different languages
- `variants` (json) - Character variants
- `metadata` (json) - Additional character metadata

**Indexes:**
- Index on `simplified`, `traditional`, `unicode`

### 4. character_pronunciations
Records pronunciation of a character in a specific dialect.

**Fields:**
- `character` (relation to characters, required) - The character
- `dialect` (relation to dialects, required) - The dialect
- `ipa` (text, required) - IPA transcription
- `romanization` (text) - Romanized pronunciation (e.g., 興化平話字)
- `initial` (text) - Dialect-specific initial (聲母)
- `final` (text) - Dialect-specific final (韻母)
- `tone` (text) - Dialect-specific tone (聲調)
- `tone_value` (text) - Tone value (e.g., "53", "31")
- `reading_type` (select: literary, colloquial, both) - 文白讀標注
- `source` (relation to users, optional) - Contributor or source
- `source_text` (text) - Source reference (book, person name, etc.)
- `audio` (file) - Audio file
- `frequency` (number) - Usage frequency
- `tags` (json) - Array of tags/categories
- `examples` (json) - Example words/phrases using this pronunciation
- `notes` (text) - Additional notes
- `verified` (bool, default: false) - Whether verified by moderator
- `created` (date) - Auto-generated
- `updated` (date) - Auto-generated

**Indexes:**
- Composite index on `character`, `dialect`
- Index on `dialect` for filtering

### 5. words
Stores dictionary entries (words/phrases).

**Fields:**
- `word` (text, required) - The word/phrase text
- `dialect` (relation to dialects, required) - Primary dialect
- `characters` (json) - Array of character IDs in order
- `definition` (text, required) - Definition/explanation
- `definitions` (json) - Structured definitions with examples
- `standard_ipa` (text) - Standard IPA pronunciation
- `standard_romanization` (text) - Standard romanization
- `mandarin` (json) - Mandarin equivalents
- `annotation` (text) - Additional annotation
- `contributor` (relation to users, required) - User who contributed
- `source` (text) - Source reference
- `related_words` (relation to words, multiple) - Related words
- `related_articles` (relation to articles, multiple) - Related articles
- `category` (text) - Word category
- `tags` (json) - Array of tags
- `frequency` (number) - Usage frequency
- `views` (number, default: 0) - View count
- `verified` (bool, default: false) - Whether verified
- `created` (date) - Auto-generated
- `updated` (date) - Auto-generated

**Indexes:**
- Index on `word`, `dialect`
- Full-text search on `word`, `definition`

### 6. word_pronunciations
Stores pronunciation details for words.

**Fields:**
- `word` (relation to words, required) - The word
- `character_pronunciation` (relation to character_pronunciations, required) - Link to character pronunciation
- `position` (number, required) - Position in the word (0-indexed)
- `sandhi` (text) - Tone sandhi or other phonological changes
- `ipa` (text) - IPA if different from character pronunciation
- `notes` (text) - Additional notes

**Indexes:**
- Composite index on `word`, `position`

### 7. pronunciations (audio recordings)
Stores individual pronunciation audio files.

**Fields:**
- `type` (select: character, word, phrase, sentence) - Type of pronunciation
- `content` (text, required) - Text content
- `ipa` (text) - IPA transcription
- `romanization` (text) - Romanization
- `dialect` (relation to dialects, required) - Dialect
- `audio` (file, required) - Audio file
- `character` (relation to characters, optional) - If single character
- `word` (relation to words, optional) - If word
- `contributor` (relation to users, required) - User who uploaded
- `source` (text) - Source information
- `quality` (select: high, medium, low) - Audio quality
- `duration` (number) - Audio duration in seconds
- `verified` (bool, default: false) - Whether verified
- `created` (date) - Auto-generated

**Indexes:**
- Index on `type`, `dialect`
- Index on `character`, `word`

## User & Content Management Collections

### 8. users
Extended user information (in addition to Pocketbase auth).

**Fields:**
- `user` (relation to _pb_users_auth_, required, unique) - Auth user
- `nickname` (text, required) - Display name
- `avatar` (file) - Avatar image
- `bio` (text) - User biography
- `location` (text) - User location
- `dialect` (relation to dialects) - User's native dialect
- `contribution_count` (number, default: 0) - Total contributions
- `points` (number, default: 0) - User points/credits
- `level` (select: user, contributor, moderator, admin) - User level
- `verified` (bool, default: false) - Verified contributor
- `wechat_openid` (text, unique) - WeChat OpenID
- `email_verified` (bool, default: false) - Email verification status
- `created` (date) - Auto-generated
- `updated` (date) - Auto-generated

**Indexes:**
- Index on `user`, `wechat_openid`

### 9. articles
User-generated articles/blog posts.

**Fields:**
- `title` (text, required) - Article title
- `description` (text) - Short description
- `content` (text, required) - Article content (Markdown)
- `cover` (file) - Cover image
- `author` (relation to users, required) - Article author
- `dialect` (relation to dialects, optional) - Related dialect
- `tags` (json) - Array of tags
- `views` (number, default: 0) - View count
- `likes` (number, default: 0) - Like count
- `comments_count` (number, default: 0) - Comment count
- `status` (select: draft, published, archived) - Article status
- `published_at` (date) - Publication date
- `created` (date) - Auto-generated
- `updated` (date) - Auto-generated

**Indexes:**
- Full-text search on `title`, `content`
- Index on `author`, `status`

### 10. article_comments
Comments on articles.

**Fields:**
- `article` (relation to articles, required) - The article
- `author` (relation to users, required) - Comment author
- `content` (text, required) - Comment content
- `parent` (relation to article_comments, optional) - Parent comment for replies
- `likes` (number, default: 0) - Like count
- `created` (date) - Auto-generated
- `updated` (date) - Auto-generated

**Indexes:**
- Index on `article`, `parent`

### 11. article_likes
Tracks article likes.

**Fields:**
- `article` (relation to articles, required) - The article
- `user` (relation to users, required) - User who liked
- `created` (date) - Auto-generated

**Indexes:**
- Composite unique index on `article`, `user`

### 12. word_lists
User-created word collections/lists.

**Fields:**
- `name` (text, required) - List name
- `description` (text) - List description
- `owner` (relation to users, required) - List owner
- `words` (json) - Array of word IDs
- `dialect` (relation to dialects, optional) - Associated dialect
- `public` (bool, default: false) - Whether list is public
- `views` (number, default: 0) - View count
- `created` (date) - Auto-generated
- `updated` (date) - Auto-generated

**Indexes:**
- Index on `owner`, `public`

## Quiz & Learning Collections

### 13. quizzes
Individual quiz questions.

**Fields:**
- `question` (text, required) - Question text
- `question_type` (select: multiple_choice, fill_blank, listening) - Question type
- `options` (json) - Answer options for multiple choice
- `correct_answer` (text, required) - Correct answer
- `explanation` (text) - Explanation of the answer
- `dialect` (relation to dialects, required) - Related dialect
- `difficulty` (select: easy, medium, hard) - Difficulty level
- `category` (text) - Question category
- `tags` (json) - Array of tags
- `audio` (file) - Audio file for listening questions
- `contributor` (relation to users, required) - Creator
- `verified` (bool, default: false) - Whether verified
- `created` (date) - Auto-generated

**Indexes:**
- Index on `dialect`, `difficulty`, `category`

### 14. quiz_papers
Quiz test papers (collections of questions).

**Fields:**
- `title` (text, required) - Paper title
- `description` (text) - Paper description
- `dialect` (relation to dialects, required) - Related dialect
- `questions` (json, required) - Array of quiz IDs
- `time_limit` (number) - Time limit in minutes
- `passing_score` (number) - Passing score percentage
- `difficulty` (select: easy, medium, hard) - Overall difficulty
- `public` (bool, default: true) - Whether public
- `contributor` (relation to users, required) - Creator
- `created` (date) - Auto-generated

**Indexes:**
- Index on `dialect`, `difficulty`

### 15. quiz_records
User quiz attempt records.

**Fields:**
- `paper` (relation to quiz_papers, required) - The paper
- `user` (relation to users, required) - The user
- `answers` (json, required) - Array of answer records
- `score` (number, required) - Final score
- `time_spent` (number) - Time spent in seconds
- `passed` (bool) - Whether passed
- `created` (date) - Auto-generated

**Indexes:**
- Index on `user`, `paper`

## Website & System Collections

### 16. notifications
User notifications/messages.

**Fields:**
- `recipient` (relation to users, required) - Recipient user
- `sender` (relation to users, optional) - Sender user (if applicable)
- `type` (select: system, message, mention, like, comment) - Notification type
- `title` (text, required) - Notification title
- `content` (text, required) - Notification content
- `link` (text) - Link to related content
- `read` (bool, default: false) - Whether read
- `created` (date) - Auto-generated

**Indexes:**
- Index on `recipient`, `read`

### 17. products
Point store products.

**Fields:**
- `name` (text, required) - Product name
- `description` (text, required) - Product description
- `image` (file) - Product image
- `price` (number, required) - Price in points
- `stock` (number, required) - Available stock
- `category` (text) - Product category
- `status` (select: available, sold_out, discontinued) - Product status
- `created` (date) - Auto-generated
- `updated` (date) - Auto-generated

**Indexes:**
- Index on `status`, `category`

### 18. transactions
Point transactions (earn/redeem).

**Fields:**
- `user` (relation to users, required) - The user
- `action` (select: earn, redeem) - Transaction type
- `amount` (number, required) - Point amount (positive or negative)
- `reason` (text, required) - Transaction reason
- `related_type` (text) - Related content type (e.g., "word", "article")
- `related_id` (text) - Related content ID
- `product` (relation to products, optional) - If redeeming for product
- `created` (date) - Auto-generated

**Indexes:**
- Index on `user`, `action`

### 19. daily_expressions
Daily expressions/phrases.

**Fields:**
- `expression` (text, required) - The expression/phrase
- `translation` (text, required) - Translation
- `dialect` (relation to dialects, required) - Dialect
- `ipa` (text) - IPA transcription
- `romanization` (text) - Romanization
- `audio` (file) - Audio file
- `category` (text) - Expression category
- `usage` (text) - Usage notes
- `example` (text) - Example usage
- `contributor` (relation to users, optional) - Contributor
- `created` (date) - Auto-generated

**Indexes:**
- Index on `dialect`, `category`
- Full-text search on `expression`, `translation`

### 20. announcements
System announcements.

**Fields:**
- `title` (text, required) - Announcement title
- `content` (text, required) - Announcement content
- `type` (select: info, warning, urgent) - Announcement type
- `status` (select: active, inactive) - Status
- `priority` (number, default: 0) - Display priority
- `start_date` (date) - Start display date
- `end_date` (date) - End display date
- `created` (date) - Auto-generated

**Indexes:**
- Index on `status`, `start_date`, `end_date`

### 21. word_of_the_day
Daily featured word.

**Fields:**
- `word` (relation to words, required) - The featured word
- `date` (date, required, unique) - Date
- `created` (date) - Auto-generated

**Indexes:**
- Index on `date`

### 22. files
File metadata (for tracking uploads).

**Fields:**
- `filename` (text, required) - Original filename
- `type` (select: image, audio, video, document) - File type
- `size` (number) - File size in bytes
- `url` (text, required) - File URL
- `uploader` (relation to users, required) - User who uploaded
- `related_type` (text) - Related content type
- `related_id` (text) - Related content ID
- `created` (date) - Auto-generated

**Indexes:**
- Index on `uploader`, `type`

## Relationships Summary

```
dialects (1) -> (*) character_pronunciations
dialects (1) -> (*) words
dialects (1) -> (*) pronunciations
dialects (1) -> (*) quizzes
dialects (1) -> (*) quiz_papers
dialects (1) -> (*) daily_expressions

characters (1) -> (*) character_pronunciations
characters (1) -> (*) pronunciations

phonological_positions (1) -> (*) characters

users (1) -> (*) character_pronunciations (as source)
users (1) -> (*) words (as contributor)
users (1) -> (*) pronunciations (as contributor)
users (1) -> (*) articles (as author)
users (1) -> (*) article_comments (as author)
users (1) -> (*) article_likes
users (1) -> (*) word_lists (as owner)
users (1) -> (*) quizzes (as contributor)
users (1) -> (*) quiz_papers (as contributor)
users (1) -> (*) quiz_records
users (1) -> (*) notifications (as recipient/sender)
users (1) -> (*) transactions
users (1) -> (*) files (as uploader)

words (1) -> (*) word_pronunciations
words (1) -> (*) pronunciations

articles (1) -> (*) article_comments
articles (1) -> (*) article_likes

quiz_papers (1) -> (*) quiz_records
```

## Access Control Rules

### Public Read Access
- dialects (all)
- phonological_positions (all)
- characters (all)
- character_pronunciations (verified only)
- words (verified only, or own contributions)
- pronunciations (verified only, or own contributions)
- articles (published only)
- article_comments (all for published articles)
- word_lists (public only, or own lists)
- quizzes (verified only)
- quiz_papers (public only)
- daily_expressions (all)
- announcements (active only)
- word_of_the_day (all)

### Authenticated Write Access
- character_pronunciations (create own, update own unverified)
- words (create own, update own unverified)
- pronunciations (create own, update own unverified)
- articles (create own, update own)
- article_comments (create, update own)
- article_likes (create own, delete own)
- word_lists (create own, update own)
- quiz_records (create own)

### Moderator/Admin Access
- Verify content
- Delete inappropriate content
- Manage users
- Manage system content (announcements, word_of_the_day, etc.)

## Migration Considerations

1. **Character Deduplication**: Ensure characters are deduplicated based on simplified/traditional forms
2. **Phonological Position Mapping**: Create mapping from old system to new phonological positions
3. **User Migration**: Migrate user accounts with hashed passwords, WeChat bindings
4. **Content Migration**: Migrate words, pronunciations, articles with proper relationships
5. **File Migration**: Upload files to Pocketbase storage and update URLs
6. **View Counts**: Preserve view counts and statistics
7. **Timestamps**: Preserve creation and update timestamps

## Performance Optimizations

1. **Indexes**: Create composite indexes on frequently queried fields
2. **Caching**: Use Pocketbase caching for frequently accessed data
3. **Pagination**: Implement pagination for large result sets
4. **Lazy Loading**: Load related data only when needed
5. **Full-Text Search**: Use Pocketbase full-text search capabilities
