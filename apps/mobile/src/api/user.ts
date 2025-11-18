/**
 * User API Module
 * Handles user profile management, WeChat binding, and points system
 */

import { pb, handleApiError, buildFilter } from './client';
import type { User, UserProfile, Product, Transaction, ExpandedUser } from '../types/pocketbase';

/**
 * Get user information by ID
 */
export async function getUserInfo(id: string): Promise<ExpandedUser> {
  try {
    const user = await pb.collection('users').getOne<ExpandedUser>(id, {
      expand: 'profile',
    });
    return user;
  } catch (error) {
    handleApiError(error, '获取用户信息失败');
    throw error;
  }
}

/**
 * Update user information (except password and email)
 */
export async function changeUserInfo(
  id: string,
  userInfo: Partial<UserProfile>
): Promise<void> {
  try {
    // Get current user's profile
    const user = await pb.collection('users').getOne<ExpandedUser>(id, {
      expand: 'profile',
    });

    if (!user.expand?.profile) {
      throw new Error('用户资料不存在');
    }

    // Update profile
    await pb.collection('user_profiles').update(user.expand.profile.id, userInfo);

    // Refresh auth if updating current user
    if (pb.authStore.model?.id === id) {
      await pb.collection('users').authRefresh();
    }

    const app = getApp();
    app.globalData.userInfo = { ...app.globalData.userInfo, ...userInfo };

    uni.showToast({
      title: '修改成功',
      icon: 'success',
    });
  } catch (error) {
    handleApiError(error, '修改失败');
    throw error;
  }
}

/**
 * Update user password
 */
export async function changeUserPassword(
  id: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  try {
    await pb.collection('users').update(id, {
      oldPassword,
      password: newPassword,
      passwordConfirm: newPassword,
    });

    uni.showToast({
      title: '密码修改成功',
      icon: 'success',
    });
  } catch (error: any) {
    if (error?.status === 400) {
      uni.showToast({
        title: '原密码错误',
        icon: 'error',
      });
    } else {
      handleApiError(error, '密码修改失败');
    }
    throw error;
  }
}

/**
 * Update user email
 */
export async function changeUserEmail(
  id: string,
  email: string,
  code: string
): Promise<void> {
  try {
    // Verify email code first
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

    // Update email
    await pb.collection('users').update(id, { email });

    uni.showToast({
      title: '邮箱修改成功',
      icon: 'success',
    });
  } catch (error: any) {
    if (error.message === '验证码错误') {
      uni.showToast({
        title: '验证码错误',
        icon: 'error',
      });
    } else {
      handleApiError(error, '邮箱修改失败');
    }
    throw error;
  }
}

/**
 * Bind WeChat account
 */
export async function bindingWechat(id: string, overwrite: boolean = false): Promise<void> {
  // #ifndef H5
  uni.login({
    async success(res) {
      if (!res.code) {
        uni.showToast({
          title: '获取账号失败',
          icon: 'error',
        });
        return;
      }

      try {
        // Call custom hook for WeChat binding
        const response = await fetch(`${pb.baseUrl}/api/wechat/bind`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': pb.authStore.token,
          },
          body: JSON.stringify({
            userId: id,
            jscode: res.code,
            overwrite,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw errorData;
        }

        uni.showToast({
          title: '绑定成功',
          icon: 'success',
        });
      } catch (error: any) {
        uni.showToast({
          title: error?.message || '绑定失败',
          icon: 'none',
        });
      }
    },
  });
  // #endif
  
  // #ifdef H5
  uni.showToast({
    title: '当前平台不支持微信绑定',
    icon: 'error',
  });
  // #endif
}

/**
 * Unbind WeChat account
 */
export async function cancelBindingWechat(id: string): Promise<void> {
  try {
    // Call custom hook for WeChat unbinding
    const response = await fetch(`${pb.baseUrl}/api/wechat/unbind`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': pb.authStore.token,
      },
      body: JSON.stringify({ userId: id }),
    });

    if (!response.ok) {
      throw new Error('解除绑定失败');
    }

    uni.showToast({
      title: '解除绑定成功',
      icon: 'success',
    });
  } catch (error: any) {
    uni.showToast({
      title: error?.message || '解除绑定失败',
      icon: 'none',
    });
    throw error;
  }
}

/**
 * Clear user information
 */
export function clearUserInfo(): void {
  uni.clearStorageSync();
  const app = getApp();
  delete app.globalData.userInfo;
  delete app.globalData.id;
  delete app.globalData.contribution;
}

/**
 * Get all products
 */
export async function getProductInfo(page: number = 1, perPage: number = 20): Promise<{
  items: Product[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const result = await pb.collection('products').getList<Product>(page, perPage, {
      sort: '-created',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '获取产品信息失败');
    throw error;
  }
}

/**
 * Get product by ID
 */
export async function getProductInfoWithId(id: string): Promise<Product> {
  try {
    const product = await pb.collection('products').getOne<Product>(id);
    return product;
  } catch (error) {
    handleApiError(error, '获取产品信息失败');
    throw error;
  }
}

/**
 * Get user's points balance
 */
export async function getMyPoints(userId: string): Promise<number> {
  try {
    const user = await pb.collection('users').getOne<ExpandedUser>(userId, {
      expand: 'profile',
    });

    return user.expand?.profile?.contribution || 0;
  } catch (error) {
    handleApiError(error, '获取积分失败');
    throw error;
  }
}

/**
 * Create transaction (purchase product with points)
 */
export async function createTransaction(
  userId: string,
  productId: string,
  quantity: number = 1
): Promise<Transaction> {
  try {
    // Get product
    const product = await pb.collection('products').getOne<Product>(productId);
    const totalPoints = product.points * quantity;

    // Get user points
    const userPoints = await getMyPoints(userId);

    if (userPoints < totalPoints) {
      uni.showToast({
        title: '积分不足',
        icon: 'error',
      });
      throw new Error('积分不足');
    }

    // Create transaction
    const transaction = await pb.collection('transactions').create<Transaction>({
      user: userId,
      product: productId,
      quantity,
      points: totalPoints,
      status: 'completed',
    });

    // Deduct points from user profile
    const user = await pb.collection('users').getOne<ExpandedUser>(userId, {
      expand: 'profile',
    });

    if (user.expand?.profile) {
      await pb.collection('user_profiles').update(user.expand.profile.id, {
        contribution: userPoints - totalPoints,
      });
    }

    uni.showToast({
      title: '兑换成功',
      icon: 'success',
    });

    return transaction;
  } catch (error) {
    if (error instanceof Error && error.message === '积分不足') {
      throw error;
    }
    handleApiError(error, '兑换失败');
    throw error;
  }
}

/**
 * Get user's transaction history
 */
export async function getUserTransactions(
  userId: string,
  page: number = 1,
  perPage: number = 20
): Promise<{
  items: Transaction[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const filter = buildFilter({ user: userId });
    const result = await pb.collection('transactions').getList<Transaction>(page, perPage, {
      filter,
      sort: '-created',
      expand: 'product',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '获取交易记录失败');
    throw error;
  }
}
