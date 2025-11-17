/**
 * TypeScript types for PocketBase collections
 * 
 * These types are based on the schema defined in pocketbase/SCHEMA.md
 * 
 * To auto-generate from a running instance:
 *   pnpm --filter services typegen
 */

export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
}

// Dialects
export interface DialectRecord extends BaseRecord {
  name: string;
  code: string;
  description?: string;
  parent?: string; // Relation to dialects
  region?: string;
  speakers?: number;
  status: 'active' | 'inactive';
  metadata?: Record<string, any>;
}

// Phonological Positions (切韻地位)
export interface PhonologicalPositionRecord extends BaseRecord {
  initial: string; // 聲母
  final: string; // 韻母
  tone: string; // 聲調
  division?: string; // 等
  articulation?: string; // 呼
  class?: string; // 類
  description?: string;
  metadata?: Record<string, any>;
}

// Characters
export interface CharacterRecord extends BaseRecord {
  simplified: string;
  traditional?: string;
  phonological_position?: string; // Relation to phonological_positions
  unicode: string;
  radical?: string;
  stroke_count?: number;
  meanings?: any[];
  variants?: any[];
  metadata?: Record<string, any>;
}

// Character Pronunciations
export interface CharacterPronunciationRecord extends BaseRecord {
  character: string; // Relation to characters
  dialect: string; // Relation to dialects
  ipa: string;
  romanization?: string;
  initial?: string; // Dialect-specific
  final?: string; // Dialect-specific
  tone?: string; // Dialect-specific
  tone_value?: string;
  reading_type?: 'literary' | 'colloquial' | 'both';
  source?: string; // Relation to users
  source_text?: string;
  audio?: string; // File
  frequency?: number;
  tags?: string[];
  examples?: any[];
  notes?: string;
  verified?: boolean;
}

// Words
export interface WordRecord extends BaseRecord {
  word: string;
  dialect: string; // Relation to dialects
  characters?: string[]; // Array of character IDs
  definition: string;
  definitions?: any[];
  standard_ipa?: string;
  standard_romanization?: string;
  mandarin?: string[];
  annotation?: string;
  contributor: string; // Relation to users
  source?: string;
  related_words?: string[]; // Relation to words
  related_articles?: string[]; // Relation to articles
  category?: string;
  tags?: string[];
  frequency?: number;
  views?: number;
  verified?: boolean;
}

// Word Pronunciations
export interface WordPronunciationRecord extends BaseRecord {
  word: string; // Relation to words
  character_pronunciation: string; // Relation to character_pronunciations
  position: number;
  sandhi?: string;
  ipa?: string;
  notes?: string;
}

// Pronunciations (audio recordings)
export interface PronunciationRecord extends BaseRecord {
  type: 'character' | 'word' | 'phrase' | 'sentence';
  content: string;
  ipa?: string;
  romanization?: string;
  dialect: string; // Relation to dialects
  audio: string; // File
  character?: string; // Relation to characters
  word?: string; // Relation to words
  contributor: string; // Relation to users
  source?: string;
  quality?: 'high' | 'medium' | 'low';
  duration?: number;
  verified?: boolean;
}

// Users (extended profile)
export interface UserProfileRecord extends BaseRecord {
  user: string; // Relation to auth collection
  nickname: string;
  avatar?: string; // File
  bio?: string;
  location?: string;
  dialect?: string; // Relation to dialects
  contribution_count?: number;
  points?: number;
  level?: 'user' | 'contributor' | 'moderator' | 'admin';
  verified?: boolean;
  wechat_openid?: string;
  email_verified?: boolean;
}

// Articles
export interface ArticleRecord extends BaseRecord {
  title: string;
  description?: string;
  content: string;
  cover?: string; // File
  author: string; // Relation to users
  dialect?: string; // Relation to dialects
  tags?: string[];
  views?: number;
  likes?: number;
  comments_count?: number;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
}

// Article Comments
export interface ArticleCommentRecord extends BaseRecord {
  article: string; // Relation to articles
  author: string; // Relation to users
  content: string;
  parent?: string; // Relation to article_comments
  likes?: number;
}

// Article Likes
export interface ArticleLikeRecord extends BaseRecord {
  article: string; // Relation to articles
  user: string; // Relation to users
}

// Word Lists
export interface WordListRecord extends BaseRecord {
  name: string;
  description?: string;
  owner: string; // Relation to users
  words?: string[]; // Array of word IDs
  dialect?: string; // Relation to dialects
  public?: boolean;
  views?: number;
}

// Quizzes
export interface QuizRecord extends BaseRecord {
  question: string;
  question_type: 'multiple_choice' | 'fill_blank' | 'listening';
  options?: any[];
  correct_answer: string;
  explanation?: string;
  dialect: string; // Relation to dialects
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  tags?: string[];
  audio?: string; // File
  contributor: string; // Relation to users
  verified?: boolean;
}

// Quiz Papers
export interface QuizPaperRecord extends BaseRecord {
  title: string;
  description?: string;
  dialect: string; // Relation to dialects
  questions: string[]; // Array of quiz IDs
  time_limit?: number;
  passing_score?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  public?: boolean;
  contributor: string; // Relation to users
}

// Quiz Records
export interface QuizRecordRecord extends BaseRecord {
  paper: string; // Relation to quiz_papers
  user: string; // Relation to users
  answers: any[];
  score: number;
  time_spent?: number;
  passed?: boolean;
}

// Notifications
export interface NotificationRecord extends BaseRecord {
  recipient: string; // Relation to users
  sender?: string; // Relation to users
  type: 'system' | 'message' | 'mention' | 'like' | 'comment';
  title: string;
  content: string;
  link?: string;
  read?: boolean;
}

// Products
export interface ProductRecord extends BaseRecord {
  name: string;
  description: string;
  image?: string; // File
  price: number;
  stock: number;
  category?: string;
  status: 'available' | 'sold_out' | 'discontinued';
}

// Transactions
export interface TransactionRecord extends BaseRecord {
  user: string; // Relation to users
  action: 'earn' | 'redeem';
  amount: number;
  reason: string;
  related_type?: string;
  related_id?: string;
  product?: string; // Relation to products
}

// Daily Expressions
export interface DailyExpressionRecord extends BaseRecord {
  expression: string;
  translation: string;
  dialect: string; // Relation to dialects
  ipa?: string;
  romanization?: string;
  audio?: string; // File
  category?: string;
  usage?: string;
  example?: string;
  contributor?: string; // Relation to users
}

// Announcements
export interface AnnouncementRecord extends BaseRecord {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent';
  status: 'active' | 'inactive';
  priority?: number;
  start_date?: string;
  end_date?: string;
}

// Word of the Day
export interface WordOfTheDayRecord extends BaseRecord {
  word: string; // Relation to words
  date: string;
}

// Files
export interface FileRecord extends BaseRecord {
  filename: string;
  type: 'image' | 'audio' | 'video' | 'document';
  size?: number;
  url: string;
  uploader: string; // Relation to users
  related_type?: string;
  related_id?: string;
}

// Type for expanded relations
export type ExpandedWord = WordRecord & {
  expand?: {
    dialect?: DialectRecord;
    contributor?: UserProfileRecord;
    related_words?: WordRecord[];
    related_articles?: ArticleRecord[];
  };
};

export type ExpandedCharacterPronunciation = CharacterPronunciationRecord & {
  expand?: {
    character?: CharacterRecord;
    dialect?: DialectRecord;
    source?: UserProfileRecord;
  };
};

export type ExpandedArticle = ArticleRecord & {
  expand?: {
    author?: UserProfileRecord;
    dialect?: DialectRecord;
  };
};

// Collection names
export const Collections = {
  Dialects: 'dialects',
  PhonologicalPositions: 'phonological_positions',
  Characters: 'characters',
  CharacterPronunciations: 'character_pronunciations',
  Words: 'words',
  WordPronunciations: 'word_pronunciations',
  Pronunciations: 'pronunciations',
  Users: 'users',
  Articles: 'articles',
  ArticleComments: 'article_comments',
  ArticleLikes: 'article_likes',
  WordLists: 'word_lists',
  Quizzes: 'quizzes',
  QuizPapers: 'quiz_papers',
  QuizRecords: 'quiz_records',
  Notifications: 'notifications',
  Products: 'products',
  Transactions: 'transactions',
  DailyExpressions: 'daily_expressions',
  Announcements: 'announcements',
  WordOfTheDay: 'word_of_the_day',
  Files: 'files',
} as const;
