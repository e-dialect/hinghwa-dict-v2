/**
 * Authentication API Module
 * Handles login, logout, token refresh, and registration
 */

import { pb, handleApiError } from './client';
import type { User, UserProfile } from '../types/pocketbase';

export interface LoginResponse {
  token: string;
  record: User & { expand?: { profile: UserProfile } };
}

/**
 * Load user information to app.globalData
 */
export async function loadUserInfo(): Promise<void> {
  try {
    const userId = uni.getStorageSync('pb_auth_user_id');
    if (!userId) return;

    const user = await pb.collection('users').getOne<User>(userId, {
      expand: 'profile'
    });

    const app = getApp();
    app.globalData.userInfo = user;
    app.globalData.id = user.id;
    
    // Load user profile data
    if (user.expand?.profile) {
      app.globalData.contribution = user.expand.profile.contribution || 0;
    }
  } catch (error) {
    console.error('Failed to load user info:', error);
    handleApiError(error, '加载用户信息失败');
  }
}

/**
 * Handle post-login actions
 */
export async function afterLogin(record: User): Promise<void> {
  uni.showToast({
    title: '登录成功',
    icon: 'success',
  });

  // Save auth data
  uni.setStorageSync('pb_auth_token', pb.authStore.token);
  uni.setStorageSync('pb_auth_user_id', record.id);

  // Load user info
  await loadUserInfo();

  // Navigate based on platform
  // #ifdef H5
  const { toIndexPage } = await import('@/routers');
  toIndexPage(true);
  // #endif
  
  // #ifndef H5
  const { toMePage } = await import('@/routers/user');
  toMePage();
  // #endif
}

/**
 * Normal login with username and password
 */
export async function normalLogin(username: string, password: string): Promise<void> {
  if (!username) {
    uni.showToast({
      title: '请输入用户名',
      icon: 'error',
    });
    return;
  }
  
  if (!password) {
    uni.showToast({
      title: '请输入密码',
      icon: 'error',
    });
    return;
  }

  try {
    const authData = await pb.collection('users').authWithPassword<User>(
      username,
      password,
      { expand: 'profile' }
    );
    await afterLogin(authData.record);
  } catch (error: any) {
    if (error?.status === 400) {
      uni.showToast({
        title: '用户名或密码错误',
        icon: 'error',
      });
    } else {
      handleApiError(error, '登录失败');
    }
  }
}

/**
 * WeChat Mini Program login
 */
export async function mpLogin(): Promise<void> {
  // #ifdef H5
  const { toLoginPage } = await import('@/routers/login');
  toLoginPage();
  return;
  // #endif

  // #ifndef H5
  uni.login({
    success: async (res) => {
      if (!res.code) {
        const { toLoginPage } = await import('@/routers/login');
        toLoginPage();
        return;
      }

      try {
        // Call custom Pocketbase hook for WeChat login
        const response = await fetch(`${pb.baseUrl}/api/wechat/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jscode: res.code }),
        });

        if (!response.ok) {
          throw new Error('WeChat login failed');
        }

        const data = await response.json();
        
        // Manually set auth
        pb.authStore.save(data.token, data.record);
        await afterLogin(data.record);
      } catch (error: any) {
        if (error?.status === 404) {
          uni.showModal({
            content: '当前用户未注册或未绑定微信',
            showCancel: false,
            success() {
              const { toLoginPage } = await import('@/routers/login');
              toLoginPage();
            },
          });
        } else {
          handleApiError(error, '登录失败');
        }
      }
    },
    fail() {
      const { toLoginPage } = await import('@/routers/login');
      toLoginPage();
    },
  });
  // #endif
}

/**
 * Refresh auth token and get login status
 */
export async function getLoginStatus(): Promise<boolean> {
  try {
    await pb.collection('users').authRefresh();
    
    // Update storage
    uni.setStorageSync('pb_auth_token', pb.authStore.token);
    uni.setStorageSync('pb_auth_user_id', pb.authStore.model?.id);
    
    await loadUserInfo();
    return true;
  } catch (error: any) {
    if (error?.status === 401) {
      const token = uni.getStorageSync('pb_auth_token');
      if (token) {
        uni.removeStorageSync('pb_auth_token');
        uni.removeStorageSync('pb_auth_user_id');
        uni.showToast({
          title: '登录已过期，请重新登录',
          icon: 'error',
        });
      }
    }
    return false;
  }
}

/**
 * Check login status synchronously
 */
export function getLoginStatusSync(): boolean {
  return !!uni.getStorageSync('pb_auth_token');
}

/**
 * Logout user
 */
export function logout(): void {
  pb.authStore.clear();
  uni.removeStorageSync('pb_auth_token');
  uni.removeStorageSync('pb_auth_user_id');
  
  const app = getApp();
  delete app.globalData.userInfo;
  delete app.globalData.id;
  delete app.globalData.contribution;
  
  uni.showToast({
    title: '已退出登录',
    icon: 'success',
  });
}

/**
 * Register new user with email verification
 */
export async function registerUser(
  username: string,
  password: string,
  email: string,
  code: string
): Promise<User> {
  try {
    // Verify email code first (custom endpoint)
    const verifyResponse = await fetch(`${pb.baseUrl}/api/email/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    if (!verifyResponse.ok) {
      throw new Error('验证码错误');
    }

    // Create user
    const user = await pb.collection('users').create<User>({
      username,
      email,
      password,
      passwordConfirm: password,
      emailVisibility: true,
    });

    // Create user profile
    await pb.collection('user_profiles').create({
      user: user.id,
      nickname: username,
      contribution: 0,
    });

    uni.showToast({
      title: '注册成功',
      icon: 'success',
    });

    return user;
  } catch (error: any) {
    if (error.message === '验证码错误') {
      uni.showToast({
        title: '验证码错误',
        icon: 'error',
      });
    } else if (error?.status === 400 && error?.data?.username) {
      uni.showToast({
        title: '用户名已存在',
        icon: 'error',
      });
    } else {
      handleApiError(error, '注册失败');
    }
    throw error;
  }
}

/**
 * Register WeChat user
 */
export async function registerWechatUser(
  username: string,
  password: string,
  nickname: string
): Promise<void> {
  // #ifndef H5
  uni.login({
    async success(res) {
      if (!res.code) {
        uni.showToast({
          title: '当前平台不支持',
          icon: 'error',
        });
        return;
      }

      try {
        // Call custom hook for WeChat registration
        const response = await fetch(`${pb.baseUrl}/api/wechat/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
            jscode: res.code,
            nickname,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw errorData;
        }

        uni.showToast({
          title: '注册成功',
          icon: 'success',
        });

        uni.navigateBack({ delta: 1 });
      } catch (error: any) {
        if (error?.status === 409) {
          uni.showToast({
            title: '用户名已存在',
            icon: 'error',
          });
        } else {
          handleApiError(error, '注册失败');
        }
      }
    },
  });
  // #endif
  
  // #ifdef H5
  uni.showToast({
    title: '当前平台不支持微信注册',
    icon: 'error',
  });
  // #endif
}

/**
 * Get email by username (for password reset)
 */
export async function getEmailByUsername(username: string): Promise<string> {
  try {
    const users = await pb.collection('users').getList<User>(1, 1, {
      filter: `username = "${username}"`,
    });

    if (users.items.length === 0) {
      throw new Error('用户不存在');
    }

    const email = users.items[0].email;
    // Return partially masked email
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.substring(0, 2) + '***';
    return `${maskedLocal}@${domain}`;
  } catch (error) {
    handleApiError(error, '获取邮箱失败');
    throw error;
  }
}

/**
 * Reset password with email verification
 */
export async function resetPassword(
  username: string,
  password: string,
  email: string,
  code: string
): Promise<void> {
  try {
    // Custom endpoint to reset password with verification
    const response = await fetch(`${pb.baseUrl}/api/password/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        email,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error('重置密码失败');
    }

    uni.showToast({
      title: '密码重置成功',
      icon: 'success',
    });
  } catch (error) {
    handleApiError(error, '重置密码失败');
    throw error;
  }
}
