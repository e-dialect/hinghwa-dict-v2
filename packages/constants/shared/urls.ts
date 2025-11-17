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
 * Applications should override this based on their build configuration
 * @default https://api.pxm.test.edialect.top (development)
 */
export const BASE_URL = 'https://api.pxm.test.edialect.top';

/**
 * Production API URL
 */
export const PRODUCTION_API_URL = 'https://api.pxm.edialect.top';

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
