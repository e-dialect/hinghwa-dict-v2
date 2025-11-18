/**
 * Article API Module
 * Handles articles, comments, and likes
 */

import { pb, handleApiError, buildFilter } from './client';
import type { Article, Comment, ExpandedArticle, ExpandedComment } from '../types/pocketbase';

/**
 * Get article by ID
 */
export async function getArticle(id: string): Promise<ExpandedArticle> {
  try {
    const article = await pb.collection('articles').getOne<ExpandedArticle>(id, {
      expand: 'author,author.profile,related_words',
    });

    // Increment views
    pb.collection('articles').update(id, {
      views: (article.views || 0) + 1,
    }).catch(() => {
      // Silent fail for view count
    });

    return article;
  } catch (error) {
    handleApiError(error, '获取文章失败');
    throw error;
  }
}

/**
 * Search articles
 */
export async function searchArticles(params: {
  keyword?: string;
  authorId?: string;
  tag?: string;
  page?: number;
  perPage?: number;
}): Promise<{
  items: Article[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const { keyword, authorId, tag, page = 1, perPage = 20 } = params;
    const filterParts: string[] = [];

    if (keyword) {
      filterParts.push(`(title ~ "${keyword}" || content ~ "${keyword}")`);
    }
    if (authorId) {
      filterParts.push(`author = "${authorId}"`);
    }
    if (tag) {
      filterParts.push(`tags ~ "${tag}"`);
    }

    const filter = filterParts.join(' && ') || undefined;

    const result = await pb.collection('articles').getList<Article>(page, perPage, {
      filter,
      sort: '-created',
      expand: 'author,author.profile',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '搜索文章失败');
    throw error;
  }
}

/**
 * Create article
 */
export async function createArticle(data: {
  title: string;
  content: string;
  authorId: string;
  tags?: string[];
  relatedWords?: string[];
}): Promise<Article> {
  try {
    const article = await pb.collection('articles').create<Article>({
      title: data.title,
      content: data.content,
      author: data.authorId,
      tags: data.tags || [],
      related_words: data.relatedWords || [],
      views: 0,
      likes: 0,
    });

    uni.showToast({
      title: '发布成功',
      icon: 'success',
    });

    return article;
  } catch (error) {
    handleApiError(error, '发布失败');
    throw error;
  }
}

/**
 * Update article
 */
export async function updateArticle(
  id: string,
  data: Partial<Article>
): Promise<Article> {
  try {
    const article = await pb.collection('articles').update<Article>(id, data);

    uni.showToast({
      title: '更新成功',
      icon: 'success',
    });

    return article;
  } catch (error) {
    handleApiError(error, '更新失败');
    throw error;
  }
}

/**
 * Delete article
 */
export async function deleteArticle(id: string): Promise<void> {
  try {
    await pb.collection('articles').delete(id);

    uni.showToast({
      title: '删除成功',
      icon: 'success',
    });
  } catch (error) {
    handleApiError(error, '删除失败');
    throw error;
  }
}

/**
 * Like article
 */
export async function likeArticle(articleId: string, userId: string): Promise<void> {
  try {
    // Check if already liked
    const existingLikes = await pb.collection('article_likes').getList(1, 1, {
      filter: `article = "${articleId}" && user = "${userId}"`,
    });

    if (existingLikes.items.length > 0) {
      uni.showToast({
        title: '已经点赞过了',
        icon: 'none',
      });
      return;
    }

    // Create like record
    await pb.collection('article_likes').create({
      article: articleId,
      user: userId,
    });

    // Increment likes count
    const article = await pb.collection('articles').getOne<Article>(articleId);
    await pb.collection('articles').update(articleId, {
      likes: (article.likes || 0) + 1,
    });

    uni.showToast({
      title: '点赞成功',
      icon: 'success',
    });
  } catch (error) {
    handleApiError(error, '点赞失败');
    throw error;
  }
}

/**
 * Unlike article
 */
export async function unlikeArticle(articleId: string, userId: string): Promise<void> {
  try {
    // Find like record
    const likes = await pb.collection('article_likes').getList(1, 1, {
      filter: `article = "${articleId}" && user = "${userId}"`,
    });

    if (likes.items.length === 0) {
      uni.showToast({
        title: '未点赞',
        icon: 'none',
      });
      return;
    }

    // Delete like record
    await pb.collection('article_likes').delete(likes.items[0].id);

    // Decrement likes count
    const article = await pb.collection('articles').getOne<Article>(articleId);
    await pb.collection('articles').update(articleId, {
      likes: Math.max((article.likes || 0) - 1, 0),
    });

    uni.showToast({
      title: '取消点赞',
      icon: 'success',
    });
  } catch (error) {
    handleApiError(error, '取消点赞失败');
    throw error;
  }
}

/**
 * Check if user liked article
 */
export async function checkArticleLiked(articleId: string, userId: string): Promise<boolean> {
  try {
    const likes = await pb.collection('article_likes').getList(1, 1, {
      filter: `article = "${articleId}" && user = "${userId}"`,
    });

    return likes.items.length > 0;
  } catch (error) {
    console.error('Check like failed:', error);
    return false;
  }
}

/**
 * Get article comments
 */
export async function getComments(
  articleId: string,
  page: number = 1,
  perPage: number = 20
): Promise<{
  items: ExpandedComment[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const filter = buildFilter({
      article: articleId,
      parent: null, // Only top-level comments
    });

    const result = await pb.collection('comments').getList<ExpandedComment>(page, perPage, {
      filter,
      sort: '-created',
      expand: 'author,author.profile,replies,replies.author',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '获取评论失败');
    throw error;
  }
}

/**
 * Create comment
 */
export async function createComment(data: {
  articleId: string;
  authorId: string;
  content: string;
  parentId?: string;
}): Promise<Comment> {
  try {
    const comment = await pb.collection('comments').create<Comment>({
      article: data.articleId,
      author: data.authorId,
      content: data.content,
      parent: data.parentId || null,
    });

    uni.showToast({
      title: '评论成功',
      icon: 'success',
    });

    return comment;
  } catch (error) {
    handleApiError(error, '评论失败');
    throw error;
  }
}

/**
 * Delete comment
 */
export async function deleteComment(id: string): Promise<void> {
  try {
    await pb.collection('comments').delete(id);

    uni.showToast({
      title: '删除成功',
      icon: 'success',
    });
  } catch (error) {
    handleApiError(error, '删除失败');
    throw error;
  }
}

/**
 * Get hot articles
 */
export async function getHotArticles(limit: number = 10): Promise<Article[]> {
  try {
    const result = await pb.collection('articles').getList<Article>(1, limit, {
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
 * Get user's liked articles
 */
export async function getUserLikedArticles(
  userId: string,
  page: number = 1,
  perPage: number = 20
): Promise<{
  items: Article[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    // Get liked article IDs
    const likes = await pb.collection('article_likes').getList(1, 100, {
      filter: `user = "${userId}"`,
    });

    const articleIds = likes.items.map(like => like.article);

    if (articleIds.length === 0) {
      return {
        items: [],
        totalPages: 0,
        totalItems: 0,
      };
    }

    // Get articles
    const filter = articleIds.map(id => `id="${id}"`).join(' || ');
    const result = await pb.collection('articles').getList<Article>(page, perPage, {
      filter,
      expand: 'author,author.profile',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '获取点赞文章失败');
    throw error;
  }
}
