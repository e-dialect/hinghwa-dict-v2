/**
 * Website API Module
 * Handles announcements, notifications, file uploads, and other website utilities
 */

import { pb, handleApiError, buildFilter } from './client';
import type { DailyExpression, Notification } from '../types/pocketbase';

/**
 * Send email verification code
 */
export async function sendEmailCode(email: string): Promise<void> {
  try {
    const response = await fetch(`${pb.baseUrl}/api/email/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Failed to send code');
    }

    uni.showToast({
      title: '验证码已发送',
      icon: 'success',
    });
  } catch (error) {
    handleApiError(error, '发送验证码失败');
    throw error;
  }
}

/**
 * Get announcements
 */
export async function getAnnouncements(
  page: number = 1,
  perPage: number = 10
): Promise<{
  items: any[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    // Announcements can be stored in articles with special tag or in a dedicated collection
    const result = await pb.collection('articles').getList(page, perPage, {
      filter: 'tags ~ "announcement"',
      sort: '-created',
      expand: 'author,author.profile',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '获取公告失败');
    return {
      items: [],
      totalPages: 0,
      totalItems: 0,
    };
  }
}

/**
 * Get hot articles (for homepage)
 */
export async function getHotArticles(limit: number = 10): Promise<any[]> {
  try {
    const result = await pb.collection('articles').getList(1, limit, {
      sort: '-views,-likes',
      expand: 'author,author.profile',
    });

    return result.items;
  } catch (error) {
    handleApiError(error, '获取热门文章失败');
    return [];
  }
}

/**
 * Get word of the day
 */
export async function getWordOfTheDay(): Promise<any | null> {
  try {
    // This would typically call a custom endpoint that selects a random word
    // or returns a pre-selected word of the day
    const response = await fetch(`${pb.baseUrl}/api/word-of-the-day`);

    if (!response.ok) {
      throw new Error('Failed to get word of the day');
    }

    const data = await response.json();
    return data.word;
  } catch (error) {
    console.error('Get word of the day failed:', error);
    return null;
  }
}

/**
 * Get daily expressions
 */
export async function getDailyExpressions(
  page: number = 1,
  perPage: number = 10
): Promise<{
  items: DailyExpression[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const result = await pb.collection('daily_expressions').getList<DailyExpression>(page, perPage, {
      sort: '-date',
      expand: 'dialect',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '获取日常用语失败');
    return {
      items: [],
      totalPages: 0,
      totalItems: 0,
    };
  }
}

/**
 * Upload file
 */
export async function uploadFile(file: File, collection: string = 'uploads'): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const record = await pb.collection(collection).create(formData);

    // Return file URL
    const fileUrl = pb.files.getUrl(record, record.file);

    uni.showToast({
      title: '上传成功',
      icon: 'success',
    });

    return fileUrl;
  } catch (error) {
    handleApiError(error, '上传失败');
    throw error;
  }
}

/**
 * Post mail/notification
 */
export async function postMail(data: {
  recipientId: string;
  subject: string;
  content: string;
  senderId?: string;
}): Promise<Notification> {
  try {
    const notification = await pb.collection('notifications').create<Notification>({
      user: data.recipientId,
      type: 'mail',
      title: data.subject,
      content: data.content,
      sender: data.senderId,
      read: false,
    });

    uni.showToast({
      title: '发送成功',
      icon: 'success',
    });

    return notification;
  } catch (error) {
    handleApiError(error, '发送失败');
    throw error;
  }
}

/**
 * Get all mails for a user
 */
export async function getAllMails(
  userId: string,
  page: number = 1,
  perPage: number = 20
): Promise<{
  items: Notification[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const filter = buildFilter({
      user: userId,
      type: 'mail',
    });

    const result = await pb.collection('notifications').getList<Notification>(page, perPage, {
      filter,
      sort: '-created',
      expand: 'sender,sender.profile',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '获取邮件失败');
    throw error;
  }
}

/**
 * Get mail details
 */
export async function getMailDetails(id: string): Promise<Notification> {
  try {
    const notification = await pb.collection('notifications').getOne<Notification>(id, {
      expand: 'sender,sender.profile',
    });

    // Mark as read
    if (!notification.read) {
      pb.collection('notifications').update(id, { read: true }).catch(() => {
        // Silent fail
      });
    }

    return notification;
  } catch (error) {
    handleApiError(error, '获取邮件详情失败');
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const filter = buildFilter({
      user: userId,
      read: false,
    });

    const result = await pb.collection('notifications').getList(1, 1, {
      filter,
    });

    return result.totalItems;
  } catch (error) {
    console.error('Get unread count failed:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(id: string): Promise<void> {
  try {
    await pb.collection('notifications').update(id, { read: true });
  } catch (error) {
    console.error('Mark as read failed:', error);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<void> {
  try {
    // Get all unread notifications
    const filter = buildFilter({
      user: userId,
      read: false,
    });

    const result = await pb.collection('notifications').getList(1, 500, {
      filter,
    });

    // Update all to read
    const promises = result.items.map(item =>
      pb.collection('notifications').update(item.id, { read: true })
    );

    await Promise.all(promises);

    uni.showToast({
      title: '全部标记为已读',
      icon: 'success',
    });
  } catch (error) {
    handleApiError(error, '标记失败');
    throw error;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(id: string): Promise<void> {
  try {
    await pb.collection('notifications').delete(id);

    uni.showToast({
      title: '删除成功',
      icon: 'success',
    });
  } catch (error) {
    handleApiError(error, '删除失败');
    throw error;
  }
}
