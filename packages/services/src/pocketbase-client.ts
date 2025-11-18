/**
 * Pocketbase Client Wrapper
 * 
 * This module provides a configured Pocketbase client instance
 * and utility functions for common operations.
 */

import PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';

// Get API URL from environment or use default
const API_URL = typeof process !== 'undefined' && process.env?.POCKETBASE_URL
  ? process.env.POCKETBASE_URL
  : 'http://127.0.0.1:8090';

// Create singleton Pocketbase instance
let pbInstance: PocketBase | null = null;

/**
 * Get or create Pocketbase client instance
 */
export function getPocketBase(): PocketBase {
  if (!pbInstance) {
    pbInstance = new PocketBase(API_URL);
    
    // Enable auto-cancellation for duplicate requests
    pbInstance.autoCancellation(true);
  }
  
  return pbInstance;
}

/**
 * Initialize Pocketbase client with custom URL
 */
export function initPocketBase(url: string): PocketBase {
  pbInstance = new PocketBase(url);
  pbInstance.autoCancellation(true);
  return pbInstance;
}

/**
 * Get current authenticated user
 */
export function getCurrentUser() {
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
export function getAuthToken(): string | null {
  const pb = getPocketBase();
  return pb.authStore.token;
}

/**
 * Clear authentication
 */
export function logout(): void {
  const pb = getPocketBase();
  pb.authStore.clear();
}

/**
 * Login with email and password
 */
export async function loginWithPassword(email: string, password: string) {
  const pb = getPocketBase();
  return await pb.collection('users').authWithPassword(email, password);
}

/**
 * Register new user
 */
export async function register(data: {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  name?: string;
}) {
  const pb = getPocketBase();
  return await pb.collection('users').create(data);
}

/**
 * Request email verification
 */
export async function requestVerification(email: string) {
  const pb = getPocketBase();
  return await pb.collection('users').requestVerification(email);
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string) {
  const pb = getPocketBase();
  return await pb.collection('users').requestPasswordReset(email);
}

/**
 * Confirm password reset
 */
export async function confirmPasswordReset(
  token: string,
  password: string,
  passwordConfirm: string
) {
  const pb = getPocketBase();
  return await pb.collection('users').confirmPasswordReset(
    token,
    password,
    passwordConfirm
  );
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (token: string, model: RecordModel | null) => void) {
  const pb = getPocketBase();
  return pb.authStore.onChange(callback);
}

/**
 * Get file URL from record
 */
export function getFileUrl(
  record: RecordModel,
  filename: string,
  queryParams?: { thumb?: string }
): string {
  const pb = getPocketBase();
  return pb.files.getUrl(record, filename, queryParams);
}

/**
 * Build filter query string
 * 
 * Examples:
 *   buildFilter({ word: 'hello' }) => "word='hello'"
 *   buildFilter({ word: { contains: 'hello' } }) => "word~'hello'"
 *   buildFilter({ views: { gte: 100 } }) => "views>=100"
 */
export function buildFilter(conditions: Record<string, any>): string {
  const filters: string[] = [];
  
  for (const [field, value] of Object.entries(conditions)) {
    if (value === null || value === undefined) continue;
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      // Handle operators
      if ('eq' in value) filters.push(`${field}='${value.eq}'`);
      else if ('ne' in value) filters.push(`${field}!='${value.ne}'`);
      else if ('gt' in value) filters.push(`${field}>${value.gt}`);
      else if ('gte' in value) filters.push(`${field}>=${value.gte}`);
      else if ('lt' in value) filters.push(`${field}<${value.lt}`);
      else if ('lte' in value) filters.push(`${field}<=${value.lte}`);
      else if ('contains' in value) filters.push(`${field}~'${value.contains}'`);
      else if ('in' in value) filters.push(`${field}?~'${Array.isArray(value.in) ? value.in.join('|') : value.in}'`);
    } else {
      // Direct equality
      if (typeof value === 'string') {
        filters.push(`${field}='${value}'`);
      } else {
        filters.push(`${field}=${value}`);
      }
    }
  }
  
  return filters.join(' && ');
}

/**
 * Paginated list query helper
 */
export interface PaginationOptions {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  expand?: string;
}

/**
 * Create pagination params
 */
export function createPaginationParams(options: PaginationOptions = {}) {
  return {
    page: options.page || 1,
    perPage: options.perPage || 30,
    sort: options.sort || '-created',
    filter: options.filter || '',
    expand: options.expand || '',
  };
}

/**
 * Error handler for Pocketbase errors
 */
export function handlePocketBaseError(error: any): { message: string; statusCode?: number } {
  if (error?.response?.data) {
    return {
      message: error.response.data.message || 'An error occurred',
      statusCode: error.status,
    };
  }
  
  if (error?.message) {
    return {
      message: error.message,
    };
  }
  
  return {
    message: 'An unexpected error occurred',
  };
}

// Export the singleton instance getter as default
export default getPocketBase;
