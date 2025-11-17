/**
 * Type definitions for the Hinghwa Dictionary API
 * 
 * These types represent the data structures used in the API.
 * They will be gradually migrated to use PocketBase-generated types.
 */

/**
 * User related types
 */
export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  contribution?: number;
  created_at?: string;
}

/**
 * Word definition with examples
 */
export interface Definition {
  content: string;
  example?: Example[];
}

export interface Example {
  type: string;  // 例：例句 俗：俗语
  content: string;
  explain?: string;
}

/**
 * Word entry
 */
export interface Word {
  id: number;
  word: string;
  definition: string;
  definitions?: Definition[];
  contributor?: User;
  annotation?: string;
  mandarin?: string[];
  related_words?: RelatedWord[];
  related_articles?: RelatedArticle[];
  views: number;
  standard_ipa?: string;
  standard_pinyin?: string;
  source?: string;
}

export interface RelatedWord {
  id: number;
  word: string;
}

export interface RelatedArticle {
  id: number;
  title: string;
}

/**
 * Character entry
 */
export interface Character {
  id: number;
  character: string;
  pinyin?: string;
  ipa?: string;
  related_words?: RelatedWord[];
}

/**
 * Article types
 */
export interface Article {
  id: number;
  title: string;
  content: string;
  author?: User;
  created_at: string;
  updated_at?: string;
  views?: number;
  likes?: number;
}

/**
 * Pronunciation types
 */
export interface Pronunciation {
  id: number;
  word_id: number;
  audio_url: string;
  contributor?: User;
  dialect?: string;
  created_at: string;
}

/**
 * Quiz types
 */
export interface Quiz {
  id: number;
  title: string;
  questions?: Question[];
}

export interface Question {
  id: number;
  content: string;
  options: string[];
  answer: number;
}

/**
 * API Response wrapper types
 */
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Search and filter types
 */
export interface SearchParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface WordSearchParams extends SearchParams {
  contributor?: number;
  dialect?: string;
}
