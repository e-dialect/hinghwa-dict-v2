/**
 * User API endpoints
 * 
 * Handles API calls related to user management, authentication, and profiles.
 */

import { api } from './base';
import type { User } from '../types';

/**
 * Register a new user
 */
export async function registerUser(
  username: string,
  password: string,
  email: string,
  code: string
): Promise<User> {
  return api.post<User>('/users', { username, password, email, code });
}

/**
 * Get user info by ID
 */
export async function getUserInfo(id: number): Promise<User> {
  return api.get<{ user: User }>(`/users/${id}`).then((res) => res.user);
}

/**
 * Update user info (except password and email)
 */
export async function updateUserInfo(id: number, userInfo: Partial<User>): Promise<User> {
  return api.put<{ user: User; token?: string }>(`/users/${id}`, { user: userInfo }).then((res) => res.user);
}

/**
 * Change user password
 */
export async function changeUserPassword(
  id: number,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  return api.put(`/users/${id}/password`, { oldpassword: oldPassword, newpassword: newPassword });
}

/**
 * Change user email
 */
export async function changeUserEmail(id: number, email: string, code: string): Promise<void> {
  return api.put(`/users/${id}/email`, { email, code });
}

/**
 * Get email by username (for password reset)
 */
export async function getEmailByUsername(username: string): Promise<string> {
  return api.get<{ email: string }>('/login/forget', { username }).then((res) => res.email);
}

/**
 * Reset password
 */
export async function resetPassword(
  username: string,
  password: string,
  email: string,
  code: string
): Promise<void> {
  return api.put('/login/forget', { username, password, email, code });
}

/**
 * Get product info
 */
export async function getProductInfo(config?: Record<string, any>): Promise<any[]> {
  return api.get<{ products: any[] }>('/products', config).then((res) => res.products);
}

/**
 * Get product info by ID
 */
export async function getProductInfoById(id: number): Promise<any> {
  return api.get<{ product: any }>(`/products/${id}`).then((res) => res.product);
}
