/**
 * Pocketbase Client for uni-app
 * 
 * Adapts Pocketbase SDK for use in uni-app environment
 */

import PocketBase from 'pocketbase';
import type { RecordAuthResponse, RecordModel } from 'pocketbase';

// Get API URL from environment
const API_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Singleton instance
let pbInstance: PocketBase | null = null;

/**
 * Get or create Pocketbase client instance
 */
export function getPocketBase(): PocketBase {
  if (!pbInstance) {
    pbInstance = new PocketBase(API_URL);
    
    // Configure for uni-app environment
    pbInstance.autoCancellation(false); // Disable auto-cancel in uni-app
    
    // Load auth from storage
    loadAuthFromStorage();
    
    // Listen to auth changes and save to storage
    pbInstance.authStore.onChange((token, model) => {
      saveAuthToStorage(token, model);
    });
  }
  
  return pbInstance;
}

/**
 * Initialize with custom URL
 */
export function initPocketBase(url: string): PocketBase {
  pbInstance = new PocketBase(url);
  pbInstance.autoCancellation(false);
  loadAuthFromStorage();
  
  pbInstance.authStore.onChange((token, model) => {
    saveAuthToStorage(token, model);
  });
  
  return pbInstance;
}

/**
 * Load auth data from uni storage
 */
function loadAuthFromStorage() {
  try {
    const token = uni.getStorageSync('pb_token');
    const model = uni.getStorageSync('pb_model');
    
    if (token && model) {
      pbInstance?.authStore.save(token, model);
    }
  } catch (e) {
    console.error('Failed to load auth from storage:', e);
  }
}

/**
 * Save auth data to uni storage
 */
function saveAuthToStorage(token: string, model: RecordModel | null) {
  try {
    if (token && model) {
      uni.setStorageSync('pb_token', token);
      uni.setStorageSync('pb_model', model);
      uni.setStorageSync('id', model.id); // For compatibility
    } else {
      uni.removeStorageSync('pb_token');
      uni.removeStorageSync('pb_model');
      uni.removeStorageSync('id');
    }
  } catch (e) {
    console.error('Failed to save auth to storage:', e);
  }
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): RecordModel | null {
  const pb = getPocketBase();
  return pb.authStore.model;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const pb = getPocketBase();
  return pb.authStore.isValid;
}

/**
 * Get auth token
 */
export function getAuthToken(): string {
  const pb = getPocketBase();
  return pb.authStore.token;
}

/**
 * Clear authentication and storage
 */
export function logout(): void {
  const pb = getPocketBase();
  pb.authStore.clear();
  
  // Clear uni storage
  uni.removeStorageSync('pb_token');
  uni.removeStorageSync('pb_model');
  uni.removeStorageSync('id');
  
  // Clear app global data
  const app = getApp();
  if (app.globalData) {
    delete app.globalData.userInfo;
    delete app.globalData.id;
  }
}

/**
 * Login with username and password
 */
export async function loginWithPassword(
  username: string,
  password: string
): Promise<RecordAuthResponse<RecordModel>> {
  const pb = getPocketBase();
  return await pb.collection('users').authWithPassword(username, password);
}

/**
 * Register new user
 */
export async function registerUser(data: {
  username: string;
  password: string;
  passwordConfirm: string;
  email: string;
  name?: string;
}): Promise<RecordModel> {
  const pb = getPocketBase();
  return await pb.collection('users').create(data);
}

/**
 * Handle API errors with uni.showToast
 */
export function handleApiError(error: any, defaultMessage: string = '操作失败'): void {
  let message = defaultMessage;
  
  if (error?.response?.message) {
    message = error.response.message;
  } else if (error?.message) {
    message = error.message;
  } else if (error?.data?.message) {
    message = error.data.message;
  }
  
  uni.showToast({
    title: message,
    icon: 'error',
    duration: 2000,
  });
  
  console.error('API Error:', error);
}

/**
 * Build filter string for queries
 */
export function buildFilter(conditions: Record<string, any>): string {
  const filters: string[] = [];
  
  for (const [key, value] of Object.entries(conditions)) {
    if (value === undefined || value === null) continue;
    
    if (typeof value === 'object') {
      // Handle comparison operators
      if (value.contains) {
        filters.push(`${key}~"${value.contains}"`);
      } else if (value.equals) {
        filters.push(`${key}="${value.equals}"`);
      } else if (value.gte !== undefined) {
        filters.push(`${key}>=${value.gte}`);
      } else if (value.lte !== undefined) {
        filters.push(`${key}<=${value.lte}`);
      } else if (value.gt !== undefined) {
        filters.push(`${key}>${value.gt}`);
      } else if (value.lt !== undefined) {
        filters.push(`${key}<${value.lt}`);
      }
    } else {
      // Direct equality
      filters.push(`${key}="${value}"`);
    }
  }
  
  return filters.join(' && ');
}

/**
 * Create pagination params
 */
export interface PaginationOptions {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  expand?: string;
}

export function createPaginationParams(options: PaginationOptions = {}) {
  return {
    page: options.page || 1,
    perPage: options.perPage || 30,
    sort: options.sort,
    filter: options.filter,
    expand: options.expand,
  };
}

/**
 * Get file URL from Pocketbase
 */
export function getFileUrl(
  record: RecordModel,
  filename: string,
  queryParams?: Record<string, string>
): string {
  const pb = getPocketBase();
  return pb.files.getUrl(record, filename, queryParams);
}

export default getPocketBase;
