/**
 * Article API Service (Pocketbase)
 * 
 * Handles articles, comments, and likes
 */

import getPocketBase, { buildFilter, createPaginationParams, type PaginationOptions } from '../pocketbase-client';
import type { ArticleRecord, ArticleCommentRecord, ArticleLikeRecord } from '../../types/pocketbase';
import { Collections } from '../../types/pocketbase';

/**
 * Create article
 */
export async function createArticle(data: {
  title: string;
  description?: string;
  content: string;
  cover?: File;
  author: string;
  dialect?: string;
  tags?: string[];
}): Promise<ArticleRecord> {
  const pb = getPocketBase();
  
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('content', data.content);
  formData.append('author', data.author);
  formData.append('status', 'published');
  
  if (data.description) formData.append('description', data.description);
  if (data.cover) formData.append('cover', data.cover);
  if (data.dialect) formData.append('dialect', data.dialect);
  if (data.tags) formData.append('tags', JSON.stringify(data.tags));
  
  const now = new Date().toISOString();
  formData.append('published_at', now);
  
  return await pb.collection<ArticleRecord>(Collections.Articles).create(formData);
}

/**
 * Delete article
 */
export async function deleteArticle(id: string): Promise<boolean> {
  const pb = getPocketBase();
  await pb.collection(Collections.Articles).delete(id);
  return true;
}

/**
 * Update article
 */
export async function updateArticle(id: string, data: {
  title?: string;
  description?: string;
  content?: string;
  cover?: File;
  tags?: string[];
}): Promise<ArticleRecord> {
  const pb = getPocketBase();
  
  const formData = new FormData();
  if (data.title) formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  if (data.content) formData.append('content', data.content);
  if (data.cover) formData.append('cover', data.cover);
  if (data.tags) formData.append('tags', JSON.stringify(data.tags));
  
  return await pb.collection<ArticleRecord>(Collections.Articles).update(id, formData);
}

/**
 * Get article details
 */
export async function getArticle(id: string): Promise<{ article: ArticleRecord; me?: any }> {
  const pb = getPocketBase();
  
  try {
    const article = await pb.collection<ArticleRecord>(Collections.Articles).getOne(id, {
      expand: 'author,dialect',
    });
    
    // Increment views
    await pb.collection<ArticleRecord>(Collections.Articles).update(id, {
      views: (article.views || 0) + 1,
    });
    
    // Check if current user liked this article
    let me = null;
    if (pb.authStore.isValid && pb.authStore.model) {
      const likes = await pb.collection(Collections.ArticleLikes).getFullList({
        filter: buildFilter({
          article: id,
          user: pb.authStore.model.id,
        }),
      });
      me = { liked: likes.length > 0 };
    }
    
    return { article, me };
  } catch (error) {
    return { article: {} as ArticleRecord };
  }
}

/**
 * Search articles by keyword
 */
export async function searchArticleId(keyword?: string): Promise<{ articles: string[] }> {
  const pb = getPocketBase();
  
  const filter = keyword ? `title~'${keyword}' || content~'${keyword}'` : '';
  
  const articles = await pb.collection<ArticleRecord>(Collections.Articles).getFullList({
    filter: filter && `(${filter}) && status='published'` || `status='published'`,
    fields: 'id',
  });
  
  return { articles: articles.map(a => a.id) };
}

/**
 * Get articles by IDs
 */
export async function getArticles(ids: string[]): Promise<{ articles: ArticleRecord[] }> {
  const pb = getPocketBase();
  
  if (ids.length === 0) {
    return { articles: [] };
  }
  
  const filter = buildFilter({ id: { in: ids } });
  
  const articles = await pb.collection<ArticleRecord>(Collections.Articles).getFullList({
    filter,
    expand: 'author',
  });
  
  return { articles };
}

/**
 * Search articles and return full data
 */
export async function searchArticles(keyword?: string): Promise<ArticleRecord[]> {
  try {
    const { articles: ids } = await searchArticleId(keyword);
    const { articles } = await getArticles(ids);
    return articles;
  } catch (error) {
    return [];
  }
}

/**
 * Like article
 */
export async function likeArticle(id: string): Promise<boolean> {
  const pb = getPocketBase();
  
  if (!pb.authStore.isValid || !pb.authStore.model) {
    throw new Error('Must be logged in to like articles');
  }
  
  // Check if already liked
  const existing = await pb.collection(Collections.ArticleLikes).getFullList({
    filter: buildFilter({
      article: id,
      user: pb.authStore.model.id,
    }),
  });
  
  if (existing.length > 0) {
    return true; // Already liked
  }
  
  // Create like
  await pb.collection<ArticleLikeRecord>(Collections.ArticleLikes).create({
    article: id,
    user: pb.authStore.model.id,
  });
  
  // Increment likes count
  const article = await pb.collection<ArticleRecord>(Collections.Articles).getOne(id);
  await pb.collection<ArticleRecord>(Collections.Articles).update(id, {
    likes: (article.likes || 0) + 1,
  });
  
  return true;
}

/**
 * Unlike article
 */
export async function unlikeArticle(id: string): Promise<boolean> {
  const pb = getPocketBase();
  
  if (!pb.authStore.isValid || !pb.authStore.model) {
    throw new Error('Must be logged in');
  }
  
  // Find like record
  const likes = await pb.collection<ArticleLikeRecord>(Collections.ArticleLikes).getFullList({
    filter: buildFilter({
      article: id,
      user: pb.authStore.model.id,
    }),
  });
  
  if (likes.length === 0) {
    return true; // Not liked
  }
  
  // Delete like
  await pb.collection(Collections.ArticleLikes).delete(likes[0].id);
  
  // Decrement likes count
  const article = await pb.collection<ArticleRecord>(Collections.Articles).getOne(id);
  await pb.collection<ArticleRecord>(Collections.Articles).update(id, {
    likes: Math.max(0, (article.likes || 0) - 1),
  });
  
  return true;
}

/**
 * Create comment
 */
export async function createComment(
  articleId: string,
  content: string,
  parentId?: string
): Promise<ArticleCommentRecord> {
  const pb = getPocketBase();
  
  if (!pb.authStore.isValid || !pb.authStore.model) {
    throw new Error('Must be logged in to comment');
  }
  
  const comment = await pb.collection<ArticleCommentRecord>(Collections.ArticleComments).create({
    article: articleId,
    author: pb.authStore.model.id,
    content,
    parent: parentId || undefined,
  });
  
  // Increment comments count
  const article = await pb.collection<ArticleRecord>(Collections.Articles).getOne(articleId);
  await pb.collection<ArticleRecord>(Collections.Articles).update(articleId, {
    comments_count: (article.comments_count || 0) + 1,
  });
  
  return comment;
}

/**
 * Get comments by IDs
 */
export async function getComment(commentIds: string[]): Promise<{ comments: ArticleCommentRecord[] }> {
  const pb = getPocketBase();
  
  if (commentIds.length === 0) {
    return { comments: [] };
  }
  
  const filter = buildFilter({ id: { in: commentIds } });
  
  const comments = await pb.collection<ArticleCommentRecord>(Collections.ArticleComments).getFullList({
    filter,
    expand: 'author',
  });
  
  return { comments };
}

/**
 * Get article comments with hierarchy
 */
export async function getComments(articleId: string): Promise<{ comments: any[]; map: number[] }> {
  const pb = getPocketBase();
  
  const comments = await pb.collection<ArticleCommentRecord>(Collections.ArticleComments).getFullList({
    filter: buildFilter({ article: articleId }),
    expand: 'author',
    sort: 'created',
  });
  
  // Build hierarchy
  const commentsWithKids = comments.map(c => ({ ...c, kids: [] as any[] }));
  const map: number[] = [];
  
  // Create index map
  for (let i = 0; i < commentsWithKids.length; i++) {
    map[commentsWithKids[i].id as any] = i;
  }
  
  // Build tree structure
  for (let i = 0; i < commentsWithKids.length; i++) {
    if (commentsWithKids[i].parent) {
      let p = commentsWithKids[i].parent;
      
      // Find root parent
      while (commentsWithKids[map[p as any]]?.parent) {
        p = commentsWithKids[map[p as any]].parent;
      }
      
      // Add to root's kids
      if (map[p as any] !== undefined) {
        commentsWithKids[map[p as any]].kids.push(commentsWithKids[i]);
      }
    }
  }
  
  return { comments: commentsWithKids, map };
}
