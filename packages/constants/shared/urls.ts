/**
 * Shared URLs and resource paths
 * These are configuration values that apply across all dialects
 */

/**
 * CDN/COS base URL for static resources
 */
export const COS_URL = 'https://cos.edialect.top/miniprogram';

/**
 * Base API URL - determined by environment
 */
export const BASE_URL = import.meta.env?.MODE === 'production'
  ? 'https://api.pxm.edialect.top'
  : 'https://api.pxm.test.edialect.top';

/**
 * Default article cover image
 */
export const DEFAULT_ARTICLE_COVER = 'https://cos.edialect.top/website/默认封面.png';

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  WORDS: '/words',
  USERS: '/users',
  ARTICLES: '/articles',
  PRONUNCIATIONS: '/pronunciations',
  CHARACTERS: '/characters',
} as const;
