/**
 * User API Service (Pocketbase)
 * 
 * Handles user management and profile operations
 */

import getPocketBase, { buildFilter, createPaginationParams } from '../pocketbase-client';
import type { UserProfileRecord, ProductRecord, TransactionRecord } from '../../types/pocketbase';
import { Collections } from '../../types/pocketbase';

/**
 * Register new user
 */
export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  nickname?: string;
}): Promise<any> {
  const pb = getPocketBase();
  
  // Create auth user
  const user = await pb.collection('users').create({
    username: data.username,
    email: data.email,
    emailVisibility: true,
    password: data.password,
    passwordConfirm: data.passwordConfirm,
    name: data.nickname || data.username,
  });
  
  // Create user profile
  await pb.collection<UserProfileRecord>(Collections.Users).create({
    user: user.id,
    nickname: data.nickname || data.username,
  });
  
  return user;
}

/**
 * Get user info by ID
 */
export async function getUserInfo(id: string): Promise<any> {
  const pb = getPocketBase();
  
  try {
    const profile = await pb.collection<UserProfileRecord>(Collections.Users).getFirstListItem(
      buildFilter({ user: id }),
      { expand: 'user,dialect' }
    );
    
    return {
      user: profile.expand?.user,
      profile,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Update user info
 */
export async function changeUserInfo(userId: string, data: {
  nickname?: string;
  bio?: string;
  location?: string;
  avatar?: File;
}): Promise<UserProfileRecord> {
  const pb = getPocketBase();
  
  // Find profile
  const profile = await pb.collection<UserProfileRecord>(Collections.Users).getFirstListItem(
    buildFilter({ user: userId })
  );
  
  const formData = new FormData();
  if (data.nickname) formData.append('nickname', data.nickname);
  if (data.bio) formData.append('bio', data.bio);
  if (data.location) formData.append('location', data.location);
  if (data.avatar) formData.append('avatar', data.avatar);
  
  return await pb.collection<UserProfileRecord>(Collections.Users).update(profile.id, formData);
}

/**
 * Change user password
 */
export async function changeUserPassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<boolean> {
  const pb = getPocketBase();
  
  // Verify old password by attempting to authenticate
  const authData = await pb.collection('users').authWithPassword(
    pb.authStore.model?.username || pb.authStore.model?.email || '',
    oldPassword
  );
  
  if (!authData) {
    throw new Error('Old password is incorrect');
  }
  
  // Update password
  await pb.collection('users').update(userId, {
    password: newPassword,
    passwordConfirm: newPassword,
  });
  
  return true;
}

/**
 * Change user email
 */
export async function changeUserEmail(
  userId: string,
  email: string,
  code: string
): Promise<boolean> {
  const pb = getPocketBase();
  
  // TODO: Verify email code
  // For now, just update email
  await pb.collection('users').update(userId, {
    email,
  });
  
  // Request verification for new email
  await pb.collection('users').requestVerification(email);
  
  return true;
}

/**
 * Bind WeChat to user account
 * Note: This is a placeholder - actual implementation needs WeChat API integration
 */
export async function bindingWechat(userId: string, openid: string, overwrite: boolean = false): Promise<boolean> {
  const pb = getPocketBase();
  
  // Find user profile
  const profile = await pb.collection<UserProfileRecord>(Collections.Users).getFirstListItem(
    buildFilter({ user: userId })
  );
  
  // Check if openid is already bound
  if (!overwrite) {
    const existing = await pb.collection<UserProfileRecord>(Collections.Users).getFullList({
      filter: buildFilter({ wechat_openid: openid }),
    });
    
    if (existing.length > 0) {
      throw new Error('WeChat account already bound to another user');
    }
  }
  
  // Update profile with openid
  await pb.collection<UserProfileRecord>(Collections.Users).update(profile.id, {
    wechat_openid: openid,
  });
  
  return true;
}

/**
 * Cancel WeChat binding
 */
export async function cancelBindingWechat(userId: string): Promise<boolean> {
  const pb = getPocketBase();
  
  // Find user profile
  const profile = await pb.collection<UserProfileRecord>(Collections.Users).getFirstListItem(
    buildFilter({ user: userId })
  );
  
  // Remove openid
  await pb.collection<UserProfileRecord>(Collections.Users).update(profile.id, {
    wechat_openid: '',
  });
  
  return true;
}

/**
 * Get email by username (for password reset)
 */
export async function getEmailByUsername(username: string): Promise<string> {
  const pb = getPocketBase();
  
  const user = await pb.collection('users').getFirstListItem(
    buildFilter({ username })
  );
  
  // Return partially masked email
  const email = user.email;
  const [localPart, domain] = email.split('@');
  const masked = localPart.substring(0, 2) + '***' + localPart.substring(localPart.length - 1);
  return `${masked}@${domain}`;
}

/**
 * Reset password
 */
export async function resetPassword(
  username: string,
  password: string,
  email: string,
  code: string
): Promise<boolean> {
  const pb = getPocketBase();
  
  // TODO: Verify code
  // For now, use Pocketbase's built-in password reset
  
  const user = await pb.collection('users').getFirstListItem(
    buildFilter({ username, email })
  );
  
  await pb.collection('users').update(user.id, {
    password,
    passwordConfirm: password,
  });
  
  return true;
}

/**
 * Get products
 */
export async function getProductInfo(config?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<{ items: ProductRecord[]; totalItems: number }> {
  const pb = getPocketBase();
  
  const filter = config?.status ? buildFilter({ status: config.status }) : '';
  
  const result = await pb.collection<ProductRecord>(Collections.Products).getList(
    config?.page || 1,
    config?.pageSize || 20,
    { filter }
  );
  
  return {
    items: result.items,
    totalItems: result.totalItems,
  };
}

/**
 * Get product by ID
 */
export async function getProductInfoWithId(id: string): Promise<ProductRecord> {
  const pb = getPocketBase();
  return await pb.collection<ProductRecord>(Collections.Products).getOne(id);
}

/**
 * Get user's point transactions
 */
export async function getMyPoints(userId: string, config?: {
  page?: number;
  pageSize?: number;
  action?: 'earn' | 'redeem';
}): Promise<{ items: TransactionRecord[]; totalItems: number }> {
  const pb = getPocketBase();
  
  const conditions: Record<string, any> = { user: userId };
  if (config?.action) conditions.action = config.action;
  
  const filter = buildFilter(conditions);
  
  const result = await pb.collection<TransactionRecord>(Collections.Transactions).getList(
    config?.page || 1,
    config?.pageSize || 10,
    { 
      filter,
      sort: '-created',
      expand: 'product',
    }
  );
  
  return {
    items: result.items,
    totalItems: result.totalItems,
  };
}

/**
 * Create point transaction
 */
export async function createTransaction(data: {
  user: string;
  action: 'earn' | 'redeem';
  amount: number;
  reason: string;
  related_type?: string;
  related_id?: string;
  product?: string;
}): Promise<TransactionRecord> {
  const pb = getPocketBase();
  
  return await pb.collection<TransactionRecord>(Collections.Transactions).create(data);
}
