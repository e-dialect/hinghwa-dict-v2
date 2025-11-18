/**
 * Website/System API Service (Pocketbase)
 * 
 * Handles notifications, announcements, daily expressions, etc.
 */

import getPocketBase, { buildFilter } from '../pocketbase-client';
import type { 
  NotificationRecord, 
  AnnouncementRecord, 
  DailyExpressionRecord,
  WordOfTheDayRecord 
} from '../../types/pocketbase';
import { Collections } from '../../types/pocketbase';

/**
 * Send email verification code
 */
export async function sendEmailCode(email: string): Promise<boolean> {
  const pb = getPocketBase();
  
  // Use Pocketbase's built-in email verification
  await pb.collection('users').requestVerification(email);
  
  return true;
}

/**
 * Get announcements
 */
export async function getAnnouncements(): Promise<AnnouncementRecord[]> {
  const pb = getPocketBase();
  
  const now = new Date().toISOString();
  
  const announcements = await pb.collection<AnnouncementRecord>(Collections.Announcements).getFullList({
    filter: `status='active' && (start_date<='' || start_date<='${now}') && (end_date<='' || end_date>='${now}')`,
    sort: '-priority,-created',
  });
  
  return announcements;
}

/**
 * Get hot articles
 */
export async function getHotArticles(): Promise<any> {
  const pb = getPocketBase();
  
  // Get articles sorted by views
  const articles = await pb.collection(Collections.Articles).getList(1, 10, {
    filter: "status='published'",
    sort: '-views,-likes',
    expand: 'author',
  });
  
  return articles;
}

/**
 * Get word of the day
 */
export async function getWordOfTheDay(): Promise<any> {
  const pb = getPocketBase();
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's word
    const wordOfDay = await pb.collection<WordOfTheDayRecord>(Collections.WordOfTheDay).getFirstListItem(
      buildFilter({ date: today }),
      { expand: 'word' }
    );
    
    if (wordOfDay.expand?.word) {
      // Get full word details
      const word = await pb.collection(Collections.Words).getOne(wordOfDay.word, {
        expand: 'dialect,contributor',
      });
      return word;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get daily expressions
 */
export async function getDailyExpressions(
  keyword: string = '',
  page: number = 1,
  pageSize: number = 10
): Promise<{ expressions: DailyExpressionRecord[]; total: number }> {
  const pb = getPocketBase();
  
  const filter = keyword 
    ? `expression~'${keyword}' || translation~'${keyword}'`
    : '';
  
  const result = await pb.collection<DailyExpressionRecord>(Collections.DailyExpressions).getList(
    page,
    pageSize,
    {
      filter,
      expand: 'dialect,contributor',
    }
  );
  
  return {
    expressions: result.items,
    total: result.totalItems,
  };
}

/**
 * Post notification/mail
 */
export async function postMail(data: {
  recipient: string;
  title: string;
  content: string;
  type?: 'system' | 'message' | 'mention' | 'like' | 'comment';
  link?: string;
  sender?: string;
}): Promise<NotificationRecord> {
  const pb = getPocketBase();
  
  return await pb.collection<NotificationRecord>(Collections.Notifications).create({
    recipient: data.recipient,
    title: data.title,
    content: data.content,
    type: data.type || 'system',
    link: data.link,
    sender: data.sender,
  });
}

/**
 * Get all notifications for user
 */
export async function getAllMails(userId: string, page: number = 1): Promise<any> {
  const pb = getPocketBase();
  
  const result = await pb.collection<NotificationRecord>(Collections.Notifications).getList(
    page,
    20,
    {
      filter: buildFilter({ recipient: userId }),
      sort: '-created',
      expand: 'sender',
    }
  );
  
  return result;
}

/**
 * Get notification details
 */
export async function getMailDetails(id: string): Promise<NotificationRecord> {
  const pb = getPocketBase();
  
  const notification = await pb.collection<NotificationRecord>(Collections.Notifications).getOne(id, {
    expand: 'sender',
  });
  
  // Mark as read
  if (!notification.read) {
    await pb.collection<NotificationRecord>(Collections.Notifications).update(id, {
      read: true,
    });
  }
  
  return notification;
}

/**
 * Upload file (generic)
 */
export async function uploadFile(file: File, collection: string = 'files'): Promise<{ url: string; id: string }> {
  const pb = getPocketBase();
  
  if (!pb.authStore.isValid || !pb.authStore.model) {
    throw new Error('Must be logged in to upload files');
  }
  
  const formData = new FormData();
  formData.append('filename', file.name);
  formData.append('type', file.type.startsWith('image/') ? 'image' : 
                          file.type.startsWith('audio/') ? 'audio' : 'document');
  formData.append('size', file.size.toString());
  formData.append('uploader', pb.authStore.model.id);
  formData.append('url', file); // Pocketbase will handle this
  
  const record = await pb.collection(Collections.Files).create(formData);
  
  // Get file URL
  const url = pb.files.getUrl(record, record.url);
  
  return { url, id: record.id };
}

/**
 * Create daily expression
 */
export async function createDailyExpression(data: {
  expression: string;
  translation: string;
  dialect: string;
  ipa?: string;
  romanization?: string;
  audio?: File;
  category?: string;
  usage?: string;
  example?: string;
  contributor?: string;
}): Promise<DailyExpressionRecord> {
  const pb = getPocketBase();
  
  const formData = new FormData();
  formData.append('expression', data.expression);
  formData.append('translation', data.translation);
  formData.append('dialect', data.dialect);
  
  if (data.ipa) formData.append('ipa', data.ipa);
  if (data.romanization) formData.append('romanization', data.romanization);
  if (data.audio) formData.append('audio', data.audio);
  if (data.category) formData.append('category', data.category);
  if (data.usage) formData.append('usage', data.usage);
  if (data.example) formData.append('example', data.example);
  if (data.contributor) formData.append('contributor', data.contributor);
  
  return await pb.collection<DailyExpressionRecord>(Collections.DailyExpressions).create(formData);
}
