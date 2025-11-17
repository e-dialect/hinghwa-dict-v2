/**
 * Base API configuration and request utilities
 * 
 * This module provides the foundation for making API requests.
 * It will be gradually migrated to use PocketBase SDK.
 */

/**
 * API configuration
 */
export const API_CONFIG = {
  // Base URL for the API - to be configured based on environment
  baseURL: 'https://api.pxm.edialect.top',
  // Timeout for requests
  timeout: 30000,
};

/**
 * Base request function
 * 
 * This will be replaced with PocketBase client methods in the future.
 * For now, it provides a placeholder for migration.
 */
export async function request<T>(
  endpoint: string,
  options?: Record<string, any>
): Promise<T> {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Convenience methods
 */
export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<T>(`${endpoint}${query}`, { method: 'GET' });
  },

  post: <T>(endpoint: string, data?: any) => {
    return request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put: <T>(endpoint: string, data?: any) => {
    return request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: <T>(endpoint: string) => {
    return request<T>(endpoint, { method: 'DELETE' });
  },
};
