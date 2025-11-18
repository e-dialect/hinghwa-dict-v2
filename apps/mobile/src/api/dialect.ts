/**
 * Dialect API Module
 * Handles dialect hierarchy, regional variants, and user preferences
 */

import { pb, handleApiError, buildFilter } from './client';
import type { Dialect } from '../types/pocketbase';

/**
 * Get dialect hierarchy (parent and children)
 */
export async function getDialectHierarchy(dialectId: string): Promise<{
  dialect: Dialect;
  parent: Dialect | null;
  children: Dialect[];
}> {
  try {
    const dialect = await pb.collection('dialects').getOne<Dialect>(dialectId, {
      expand: 'parent',
    });

    // Get children
    const children = await pb.collection('dialects').getList<Dialect>(1, 100, {
      filter: `parent = "${dialectId}"`,
      sort: 'name',
    });

    return {
      dialect,
      parent: dialect.expand?.parent || null,
      children: children.items,
    };
  } catch (error) {
    handleApiError(error, '获取方言层级失败');
    throw error;
  }
}

/**
 * Get all sub-dialects (children) of a dialect
 */
export async function getSubDialects(dialectId: string): Promise<Dialect[]> {
  try {
    const result = await pb.collection('dialects').getList<Dialect>(1, 100, {
      filter: `parent = "${dialectId}"`,
      sort: 'name',
    });

    return result.items;
  } catch (error) {
    handleApiError(error, '获取子方言失败');
    throw error;
  }
}

/**
 * Get all dialects
 */
export async function getAllDialects(): Promise<Dialect[]> {
  try {
    const result = await pb.collection('dialects').getList<Dialect>(1, 200, {
      sort: 'name',
      expand: 'parent',
    });

    return result.items;
  } catch (error) {
    handleApiError(error, '获取方言列表失败');
    throw error;
  }
}

/**
 * Get dialect by ID
 */
export async function getDialect(id: string): Promise<Dialect> {
  try {
    const dialect = await pb.collection('dialects').getOne<Dialect>(id, {
      expand: 'parent',
    });

    return dialect;
  } catch (error) {
    handleApiError(error, '获取方言信息失败');
    throw error;
  }
}

/**
 * Search dialects by name or region
 */
export async function searchDialects(keyword: string): Promise<Dialect[]> {
  try {
    const filter = buildFilter({
      $or: [
        { name: { contains: keyword } },
        { region: { contains: keyword } },
      ],
    });

    const result = await pb.collection('dialects').getList<Dialect>(1, 50, {
      filter,
      sort: 'name',
    });

    return result.items;
  } catch (error) {
    handleApiError(error, '搜索方言失败');
    throw error;
  }
}

/**
 * Set user's preferred dialect
 */
export async function setUserPreferredDialect(
  userId: string,
  dialectId: string
): Promise<void> {
  try {
    // Update user profile
    const user = await pb.collection('users').getOne(userId, {
      expand: 'profile',
    });

    if (!user.expand?.profile) {
      throw new Error('用户资料不存在');
    }

    await pb.collection('user_profiles').update(user.expand.profile.id, {
      dialect: dialectId,
    });

    // Also save to local storage for quick access
    uni.setStorageSync('preferred_dialect', dialectId);

    uni.showToast({
      title: '偏好口音已设置',
      icon: 'success',
    });
  } catch (error) {
    handleApiError(error, '设置失败');
    throw error;
  }
}

/**
 * Get user's preferred dialect
 */
export async function getUserPreferredDialect(userId: string): Promise<Dialect | null> {
  try {
    // Try local storage first
    const cachedDialectId = uni.getStorageSync('preferred_dialect');
    if (cachedDialectId) {
      const dialect = await pb.collection('dialects').getOne<Dialect>(cachedDialectId);
      return dialect;
    }

    // Get from user profile
    const user = await pb.collection('users').getOne(userId, {
      expand: 'profile,profile.dialect',
    });

    if (user.expand?.profile?.expand?.dialect) {
      const dialect = user.expand.profile.expand.dialect;
      // Cache it
      uni.setStorageSync('preferred_dialect', dialect.id);
      return dialect;
    }

    return null;
  } catch (error) {
    console.error('Get preferred dialect failed:', error);
    return null;
  }
}

/**
 * Get dialect family (parent and all siblings)
 * Useful for searching across related dialects
 */
export async function getDialectFamily(dialectId: string): Promise<Dialect[]> {
  try {
    const dialect = await pb.collection('dialects').getOne<Dialect>(dialectId, {
      expand: 'parent',
    });

    // If has parent, get all siblings
    if (dialect.parent) {
      const siblings = await pb.collection('dialects').getList<Dialect>(1, 100, {
        filter: `parent = "${dialect.parent}"`,
      });
      return siblings.items;
    }

    // If no parent (top-level), get all children
    const children = await pb.collection('dialects').getList<Dialect>(1, 100, {
      filter: `parent = "${dialectId}"`,
    });

    return [dialect, ...children.items];
  } catch (error) {
    handleApiError(error, '获取方言家族失败');
    throw error;
  }
}

/**
 * Get dialect family IDs (for filtering queries)
 */
export async function getDialectFamilyIds(dialectId: string): Promise<string[]> {
  try {
    const family = await getDialectFamily(dialectId);
    return family.map(d => d.id);
  } catch (error) {
    console.error('Get dialect family IDs failed:', error);
    return [dialectId];
  }
}

/**
 * Create dialect (admin function)
 */
export async function createDialect(data: {
  name: string;
  region: string;
  parentId?: string;
  description?: string;
  metadata?: Record<string, any>;
}): Promise<Dialect> {
  try {
    const dialect = await pb.collection('dialects').create<Dialect>({
      name: data.name,
      region: data.region,
      parent: data.parentId || null,
      description: data.description,
      metadata: data.metadata || {},
    });

    uni.showToast({
      title: '创建成功',
      icon: 'success',
    });

    return dialect;
  } catch (error) {
    handleApiError(error, '创建失败');
    throw error;
  }
}

/**
 * Update dialect (admin function)
 */
export async function updateDialect(
  id: string,
  data: Partial<Dialect>
): Promise<Dialect> {
  try {
    const dialect = await pb.collection('dialects').update<Dialect>(id, data);

    uni.showToast({
      title: '更新成功',
      icon: 'success',
    });

    return dialect;
  } catch (error) {
    handleApiError(error, '更新失败');
    throw error;
  }
}

/**
 * Delete dialect (admin function)
 */
export async function deleteDialect(id: string): Promise<void> {
  try {
    await pb.collection('dialects').delete(id);

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
 * Get Puxian dialect regions
 * Helper function for the specific Puxian dialect hierarchy
 */
export async function getPuxianRegions(): Promise<{
  puxian: Dialect | null;
  putianCity: Dialect | null;
  xianyouCity: Dialect | null;
  xianyouYouyang: Dialect | null;
}> {
  try {
    // Get main Puxian dialect
    const puxianResult = await pb.collection('dialects').getList<Dialect>(1, 1, {
      filter: 'name = "莆仙话"',
    });

    if (puxianResult.items.length === 0) {
      return {
        puxian: null,
        putianCity: null,
        xianyouCity: null,
        xianyouYouyang: null,
      };
    }

    const puxian = puxianResult.items[0];

    // Get sub-regions
    const regions = await getSubDialects(puxian.id);

    return {
      puxian,
      putianCity: regions.find(r => r.name === '莆田城里') || null,
      xianyouCity: regions.find(r => r.name === '仙游城关') || null,
      xianyouYouyang: regions.find(r => r.name === '仙游游洋') || null,
    };
  } catch (error) {
    console.error('Get Puxian regions failed:', error);
    return {
      puxian: null,
      putianCity: null,
      xianyouCity: null,
      xianyouYouyang: null,
    };
  }
}
