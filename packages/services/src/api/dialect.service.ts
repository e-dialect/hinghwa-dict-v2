/**
 * Dialect API Service (Pocketbase)
 * 
 * Handles dialect management and hierarchical relationships
 */

import getPocketBase, { buildFilter } from '../pocketbase-client';
import type { DialectRecord } from '../../types/pocketbase';
import { Collections } from '../../types/pocketbase';

/**
 * Get all dialects
 */
export async function getAllDialects(): Promise<DialectRecord[]> {
  const pb = getPocketBase();
  
  return await pb.collection<DialectRecord>(Collections.Dialects).getFullList({
    sort: 'name',
  });
}

/**
 * Get dialect by code
 */
export async function getDialectByCode(code: string): Promise<DialectRecord | null> {
  const pb = getPocketBase();
  
  try {
    return await pb.collection<DialectRecord>(Collections.Dialects).getFirstListItem(
      buildFilter({ code }),
      { expand: 'parent' }
    );
  } catch (error) {
    return null;
  }
}

/**
 * Get dialect by ID
 */
export async function getDialectById(id: string): Promise<DialectRecord | null> {
  const pb = getPocketBase();
  
  try {
    return await pb.collection<DialectRecord>(Collections.Dialects).getOne(id, {
      expand: 'parent',
    });
  } catch (error) {
    return null;
  }
}

/**
 * Get all sub-dialects (children) of a parent dialect
 */
export async function getSubDialects(
  parentDialectId: string,
  options?: { sort?: string }
): Promise<DialectRecord[]> {
  const pb = getPocketBase();
  
  return await pb.collection<DialectRecord>(Collections.Dialects).getFullList({
    filter: buildFilter({ parent: parentDialectId }),
    sort: options?.sort || 'metadata.priority,name',
  });
}

/**
 * Get dialect hierarchy (parent and children)
 */
export async function getDialectHierarchy(dialectCode: string): Promise<{
  dialect: DialectRecord;
  parent?: DialectRecord;
  children: DialectRecord[];
}> {
  const pb = getPocketBase();
  
  // Get the dialect with parent expanded
  const dialect = await pb.collection<DialectRecord>(Collections.Dialects)
    .getFirstListItem(buildFilter({ code: dialectCode }), {
      expand: 'parent'
    });
  
  // Get children
  const children = await getSubDialects(dialect.id);
  
  return {
    dialect,
    parent: dialect.expand?.parent as DialectRecord | undefined,
    children,
  };
}

/**
 * Get all dialects in the same family (parent + all siblings, or current + all children)
 */
export async function getDialectFamily(dialectId: string): Promise<DialectRecord[]> {
  const pb = getPocketBase();
  
  // Get dialect info
  const dialect = await pb.collection<DialectRecord>(Collections.Dialects).getOne(dialectId);
  
  if (dialect.parent) {
    // Has parent: get parent + all siblings (including self)
    const family = await pb.collection<DialectRecord>(Collections.Dialects).getFullList({
      filter: `parent='${dialect.parent}' || id='${dialect.parent}'`,
      sort: 'metadata.priority,name',
    });
    return family;
  } else {
    // Is parent: get self + all children
    const children = await getSubDialects(dialectId);
    return [dialect, ...children];
  }
}

/**
 * Get IDs of all dialects in the family for filtering
 */
export async function getDialectFamilyIds(dialectId: string): Promise<string[]> {
  const family = await getDialectFamily(dialectId);
  return family.map(d => d.id);
}

/**
 * Create a new dialect
 */
export async function createDialect(data: {
  name: string;
  code: string;
  description?: string;
  parent?: string;
  region?: string;
  speakers?: number;
  status?: 'active' | 'inactive';
  metadata?: any;
}): Promise<DialectRecord> {
  const pb = getPocketBase();
  
  return await pb.collection<DialectRecord>(Collections.Dialects).create(data);
}

/**
 * Update dialect
 */
export async function updateDialect(id: string, data: Partial<{
  name: string;
  description: string;
  region: string;
  speakers: number;
  status: 'active' | 'inactive';
  metadata: any;
}>): Promise<DialectRecord> {
  const pb = getPocketBase();
  
  return await pb.collection<DialectRecord>(Collections.Dialects).update(id, data);
}

/**
 * Set up Puxian dialect with regional variants
 * This is a helper function for initial setup
 */
export async function setupPuxianDialectRegions(): Promise<{
  puxian: DialectRecord;
  putianCity: DialectRecord;
  xianyouCity: DialectRecord;
  xianyouYouyang: DialectRecord;
}> {
  const pb = getPocketBase();
  
  // Create or get main Puxian dialect
  let puxian: DialectRecord;
  try {
    puxian = await pb.collection<DialectRecord>(Collections.Dialects)
      .getFirstListItem(buildFilter({ code: 'puxian' }));
  } catch (error) {
    puxian = await pb.collection<DialectRecord>(Collections.Dialects).create({
      name: '莆仙话',
      code: 'puxian',
      description: '莆田市及周边地区的莆仙方言',
      region: '福建省莆田市',
      speakers: 5000000,
      status: 'active',
      metadata: {
        iso_code: 'cpx',
        alternative_names: ['兴化话', '莆仙语', 'Hinghwa'],
      },
    });
  }
  
  // Create regional variants
  let putianCity: DialectRecord;
  try {
    putianCity = await pb.collection<DialectRecord>(Collections.Dialects)
      .getFirstListItem(buildFilter({ code: 'putian-chengshi' }));
  } catch (error) {
    putianCity = await pb.collection<DialectRecord>(Collections.Dialects).create({
      name: '莆田城里',
      code: 'putian-chengshi',
      description: '莆田市区（城厢区）的口音',
      parent: puxian.id,
      region: '福建省莆田市城厢区',
      speakers: 500000,
      status: 'active',
      metadata: {
        is_standard: true,
        representative_area: '城厢区',
        priority: 1,
      },
    });
  }
  
  let xianyouCity: DialectRecord;
  try {
    xianyouCity = await pb.collection<DialectRecord>(Collections.Dialects)
      .getFirstListItem(buildFilter({ code: 'xianyou-chengguan' }));
  } catch (error) {
    xianyouCity = await pb.collection<DialectRecord>(Collections.Dialects).create({
      name: '仙游城关',
      code: 'xianyou-chengguan',
      description: '仙游县城关地区的口音',
      parent: puxian.id,
      region: '福建省莆田市仙游县城关',
      speakers: 300000,
      status: 'active',
      metadata: {
        representative_area: '仙游县城',
        priority: 2,
      },
    });
  }
  
  let xianyouYouyang: DialectRecord;
  try {
    xianyouYouyang = await pb.collection<DialectRecord>(Collections.Dialects)
      .getFirstListItem(buildFilter({ code: 'xianyou-youyang' }));
  } catch (error) {
    xianyouYouyang = await pb.collection<DialectRecord>(Collections.Dialects).create({
      name: '仙游游洋',
      code: 'xianyou-youyang',
      description: '仙游县游洋镇的口音',
      parent: puxian.id,
      region: '福建省莆田市仙游县游洋镇',
      speakers: 50000,
      status: 'active',
      metadata: {
        representative_area: '游洋镇',
        priority: 3,
      },
    });
  }
  
  return {
    puxian,
    putianCity,
    xianyouCity,
    xianyouYouyang,
  };
}

/**
 * Get user's preferred dialect
 */
export async function getUserPreferredDialect(userId: string): Promise<DialectRecord | null> {
  const pb = getPocketBase();
  
  try {
    const profile = await pb.collection('user_profiles')
      .getFirstListItem(buildFilter({ user: userId }), {
        expand: 'dialect',
      });
    
    return profile.expand?.dialect as DialectRecord | null;
  } catch (error) {
    return null;
  }
}

/**
 * Set user's preferred dialect
 */
export async function setUserPreferredDialect(
  userId: string,
  dialectId: string
): Promise<boolean> {
  const pb = getPocketBase();
  
  try {
    const profile = await pb.collection('user_profiles')
      .getFirstListItem(buildFilter({ user: userId }));
    
    await pb.collection('user_profiles').update(profile.id, {
      dialect: dialectId,
    });
    
    return true;
  } catch (error) {
    console.error('Failed to set preferred dialect:', error);
    return false;
  }
}
