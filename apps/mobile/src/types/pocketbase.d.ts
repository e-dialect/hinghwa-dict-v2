/**
 * Pocketbase Type Definitions for Mobile App
 * Auto-generated types for all collections
 */

// Base record type
export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
}

// User
export interface User extends BaseRecord {
  username: string;
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  avatar?: string;
  expand?: {
    profile?: UserProfile;
  };
}

// User Profile
export interface UserProfile extends BaseRecord {
  user: string;
  nickname: string;
  bio?: string;
  avatar?: string;
  contribution: number;
  dialect?: string;
  expand?: {
    dialect?: Dialect;
  };
}

// Dialect
export interface Dialect extends BaseRecord {
  name: string;
  region: string;
  parent?: string;
  description?: string;
  metadata?: Record<string, any>;
  expand?: {
    parent?: Dialect;
  };
}

// Phonological Position
export interface PhonologicalPosition extends BaseRecord {
  initial: string;
  articulation: string;
  division: string;
  class: string;
  final: string;
  tone: string;
}

// Character
export interface Character extends BaseRecord {
  simplified: string;
  traditional: string;
  unicode: string;
  phonological_position?: string;
  expand?: {
    phonological_position?: PhonologicalPosition;
    pronunciations?: CharacterPronunciation[];
  };
}

// Character Pronunciation
export interface CharacterPronunciation extends BaseRecord {
  character: string;
  dialect: string;
  ipa?: string;
  romanization?: string;
  initial?: string;
  final?: string;
  tone?: string;
  reading_type?: string;
  source_pronunciation?: string;
  tags?: string[];
  expand?: {
    character?: Character;
    dialect?: Dialect;
    source_pronunciation?: Pronunciation;
  };
}

// Word
export interface Word extends BaseRecord {
  word: string;
  definition?: string;
  dialect: string;
  contributor: string;
  characters?: string[];
  mandarin?: string[];
  related_words?: string[];
  related_articles?: string[];
  views: number;
  standard_ipa?: string;
  standard_pinyin?: string;
  source?: string;
  tags?: string[];
  expand?: {
    dialect?: Dialect;
    contributor?: User;
    related_words?: Word[];
    pronunciations?: Pronunciation[];
  };
}

// Expanded Word (with full relations)
export type ExpandedWord = Word & {
  expand: {
    dialect: Dialect;
    contributor: User & { expand?: { profile?: UserProfile } };
    related_words?: Word[];
    pronunciations?: Pronunciation[];
  };
};

// Pronunciation
export interface Pronunciation extends BaseRecord {
  type: 'word' | 'character';
  content: string;
  ipa?: string;
  romanization?: string;
  dialect: string;
  contributor: string;
  audio?: string;
  reading_type?: string;
  tags?: string[];
  expand?: {
    dialect?: Dialect;
    contributor?: User;
  };
}

// Expanded Pronunciation
export type ExpandedPronunciation = Pronunciation & {
  expand: {
    dialect: Dialect;
    contributor: User & { expand?: { profile?: UserProfile } };
  };
};

// Word List
export interface WordList extends BaseRecord {
  name: string;
  description?: string;
  creator: string;
  words: string[];
  expand?: {
    creator?: User;
  };
}

// Article
export interface Article extends BaseRecord {
  title: string;
  content: string;
  author: string;
  tags?: string[];
  related_words?: string[];
  views: number;
  likes: number;
  expand?: {
    author?: User;
    related_words?: Word[];
  };
}

// Expanded Article
export type ExpandedArticle = Article & {
  expand: {
    author: User & { expand?: { profile?: UserProfile } };
    related_words?: Word[];
  };
}; 

// Comment
export interface Comment extends BaseRecord {
  article: string;
  author: string;
  content: string;
  parent?: string;
  expand?: {
    article?: Article;
    author?: User;
    parent?: Comment;
    replies?: Comment[];
  };
}

// Expanded Comment
export type ExpandedComment = Comment & {
  expand: {
    author: User & { expand?: { profile?: UserProfile } };
    replies?: Comment[];
  };
};

// Article Like
export interface ArticleLike extends BaseRecord {
  article: string;
  user: string;
}

// Quiz
export interface Quiz extends BaseRecord {
  question: string;
  answer: string;
  type: string;
  options?: string[];
  creator: string;
  explanation?: string;
  expand?: {
    creator?: User;
  };
}

// Quiz Paper
export interface QuizPaper extends BaseRecord {
  title: string;
  description?: string;
  quizzes: string[];
  creator: string;
  expand?: {
    creator?: User;
  };
}

// Quiz Record
export interface QuizRecord extends BaseRecord {
  paper: string;
  user: string;
  answers: Record<string, string>;
  score: number;
  total_score: number;
  expand?: {
    paper?: QuizPaper;
    user?: User;
  };
}

// Product
export interface Product extends BaseRecord {
  name: string;
  description?: string;
  points: number;
  image?: string;
  stock?: number;
}

// Transaction
export interface Transaction extends BaseRecord {
  user: string;
  product: string;
  quantity: number;
  points: number;
  status: string;
  expand?: {
    user?: User;
    product?: Product;
  };
}

// Notification
export interface Notification extends BaseRecord {
  user: string;
  type: string;
  title: string;
  content: string;
  sender?: string;
  read: boolean;
  expand?: {
    user?: User;
    sender?: User;
  };
}

// Daily Expression
export interface DailyExpression extends BaseRecord {
  expression: string;
  translation: string;
  dialect: string;
  ipa?: string;
  romanization?: string;
  date: string;
  expand?: {
    dialect?: Dialect;
  };
}

// Expanded User (with profile)
export type ExpandedUser = User & {
  expand: {
    profile: UserProfile & {
      expand?: {
        dialect?: Dialect;
      };
    };
  };
};

// Expanded Character
export type ExpandedCharacter = Character & {
  expand: {
    phonological_position?: PhonologicalPosition;
    pronunciations?: CharacterPronunciation[];
  };
};

// Collection names (for type-safe collection access)
export const Collections = {
  users: 'users',
  userProfiles: 'user_profiles',
  dialects: 'dialects',
  phonologicalPositions: 'phonological_positions',
  characters: 'characters',
  characterPronunciations: 'character_pronunciations',
  words: 'words',
  pronunciations: 'pronunciations',
  wordLists: 'word_lists',
  articles: 'articles',
  comments: 'comments',
  articleLikes: 'article_likes',
  quizzes: 'quizzes',
  quizPapers: 'quiz_papers',
  quizRecords: 'quiz_records',
  products: 'products',
  transactions: 'transactions',
  notifications: 'notifications',
  dailyExpressions: 'daily_expressions',
} as const;
