/**
 * Word API Service (Pocketbase)
 * 
 * Handles all API calls related to words and dictionary functionality
 */

import getPocketBase, { buildFilter, createPaginationParams, type PaginationOptions } from '../pocketbase-client';
import type {
  WordRecord,
  ExpandedWord,
  CharacterRecord,
  WordListRecord,
} from '../../types/pocketbase';
import { Collections } from '../../types/pocketbase';
import { splitDefinition } from '../utils/word-utils';

/**
 * Get word details by ID
 */
export async function getWordDetails(id: string): Promise<ExpandedWord> {
  const pb = getPocketBase();
  const word = await pb.collection<ExpandedWord>(Collections.Words).getOne(id, {
    expand: 'dialect,contributor,related_words,related_articles',
  });
  
  // Process definitions if needed
  if (word.definition && !word.definitions) {
    word.definitions = splitDefinition(word.definition);
  }
  
  return word;
}

/**
 * Search words by keyword
 */
export async function searchWords(
  keyword: string,
  options: PaginationOptions = {}
): Promise<{ items: WordRecord[]; totalItems: number; totalPages: number }> {
  const pb = getPocketBase();
  const filter = buildFilter({
    word: { contains: keyword },
  });
  
  const params = createPaginationParams({
    ...options,
    filter,
  });
  
  return await pb.collection<WordRecord>(Collections.Words).getList(
    params.page,
    params.perPage,
    {
      filter: params.filter,
      sort: params.sort,
      expand: options.expand,
    }
  );
}

/**
 * Filter words by user/contributor
 */
export async function filterUserWords(
  userId: string,
  options: PaginationOptions = {}
): Promise<{ items: WordRecord[]; totalItems: number; totalPages: number }> {
  const pb = getPocketBase();
  const filter = buildFilter({
    contributor: userId,
  });
  
  const params = createPaginationParams({
    ...options,
    filter,
  });
  
  return await pb.collection<WordRecord>(Collections.Words).getList(
    params.page,
    params.perPage,
    {
      filter: params.filter,
      sort: params.sort,
      expand: options.expand || 'dialect,contributor',
    }
  );
}

/**
 * Get words by multiple IDs
 */
export async function getWordsByIds(ids: string[]): Promise<WordRecord[]> {
  const pb = getPocketBase();
  const filter = buildFilter({
    id: { in: ids },
  });
  
  const result = await pb.collection<WordRecord>(Collections.Words).getFullList({
    filter,
    expand: 'dialect,contributor',
  });
  
  return result;
}

/**
 * Search words by phonetic filters
 * @param filters Phonetic filters (initial, final, tone)
 */
export async function searchWordsByPhonetic(
  filters: {
    dialect?: string;
    initial?: string;
    final?: string;
    tone?: string;
  },
  options: PaginationOptions = {}
): Promise<{ items: WordRecord[]; totalItems: number; totalPages: number }> {
  const pb = getPocketBase();
  
  // Build filter based on provided phonetic filters
  const conditions: Record<string, any> = {};
  
  if (filters.dialect) {
    conditions.dialect = filters.dialect;
  }
  
  // For phonetic search, we need to search through character_pronunciations
  // This is a complex query that might need to be done in two steps
  // For now, we'll do a simpler approach
  
  const filter = buildFilter(conditions);
  const params = createPaginationParams({
    ...options,
    filter,
  });
  
  return await pb.collection<WordRecord>(Collections.Words).getList(
    params.page,
    params.perPage,
    {
      filter: params.filter,
      sort: params.sort,
      expand: options.expand,
    }
  );
}

/**
 * Get phonetic ordering table
 * This might need to be restructured for Pocketbase
 */
export async function getPhoneticOrder(dialectCode: string = 'puxian'): Promise<any> {
  // TODO: Implement phonetic ordering system
  // This might be stored in a separate collection or generated dynamically
  console.warn('getPhoneticOrder not yet implemented for Pocketbase');
  return null;
}

/**
 * Search dictionary by phonetic order
 */
export async function searchDictionary(
  order: string[],
  prefix: string = '',
  recursion: boolean = false
): Promise<WordRecord[]> {
  // TODO: Implement phonetic ordering search
  console.warn('searchDictionary not yet implemented for Pocketbase');
  return [];
}

/**
 * Create a new word
 */
export async function createWord(data: Partial<WordRecord>): Promise<WordRecord> {
  const pb = getPocketBase();
  return await pb.collection<WordRecord>(Collections.Words).create(data);
}

/**
 * Update a word
 */
export async function updateWord(id: string, data: Partial<WordRecord>): Promise<WordRecord> {
  const pb = getPocketBase();
  return await pb.collection<WordRecord>(Collections.Words).update(id, data);
}

/**
 * Delete a word
 */
export async function deleteWord(id: string): Promise<boolean> {
  const pb = getPocketBase();
  await pb.collection(Collections.Words).delete(id);
  return true;
}

/**
 * Increment word view count
 */
export async function incrementWordViews(id: string): Promise<void> {
  const pb = getPocketBase();
  const word = await pb.collection<WordRecord>(Collections.Words).getOne(id);
  await pb.collection<WordRecord>(Collections.Words).update(id, {
    views: (word.views || 0) + 1,
  });
}

/**
 * Get character details
 */
export async function getCharacterDetails(id: string): Promise<CharacterRecord> {
  const pb = getPocketBase();
  return await pb.collection<CharacterRecord>(Collections.Characters).getOne(id, {
    expand: 'phonological_position',
  });
}

/**
 * Search characters
 */
export async function searchCharacters(
  keyword: string,
  options: PaginationOptions = {}
): Promise<{ items: CharacterRecord[]; totalItems: number; totalPages: number }> {
  const pb = getPocketBase();
  const filter = `simplified~'${keyword}' || traditional~'${keyword}'`;
  
  const params = createPaginationParams({
    ...options,
    filter,
  });
  
  return await pb.collection<CharacterRecord>(Collections.Characters).getList(
    params.page,
    params.perPage,
    {
      filter: params.filter,
      sort: params.sort,
    }
  );
}

/**
 * Search characters by phonetic filters
 */
export async function searchCharactersByFilters(filters: {
  dialect?: string;
  initial?: string;
  final?: string;
  tone?: string;
}): Promise<any[]> {
  const pb = getPocketBase();
  
  // Build filter for character_pronunciations
  const conditions: Record<string, any> = {};
  
  if (filters.dialect) conditions.dialect = filters.dialect;
  if (filters.initial && filters.initial !== 'all') conditions.initial = filters.initial;
  if (filters.final && filters.final !== 'all') conditions.final = filters.final;
  if (filters.tone && filters.tone !== 'all') conditions.tone = filters.tone;
  
  const filter = buildFilter(conditions);
  
  // Get character pronunciations matching the filters
  const pronunciations = await pb.collection(Collections.CharacterPronunciations).getFullList({
    filter,
    expand: 'character',
  });
  
  return pronunciations;
}

/**
 * Get characters by multiple IDs
 */
export async function getCharacters(ids: string[]): Promise<CharacterRecord[]> {
  const pb = getPocketBase();
  const filter = buildFilter({
    id: { in: ids },
  });
  
  return await pb.collection<CharacterRecord>(Collections.Characters).getFullList({
    filter,
  });
}

/**
 * Get word lists
 */
export async function getWordLists(
  options: PaginationOptions & { owner?: string; public?: boolean } = {}
): Promise<{ items: WordListRecord[]; totalItems: number; totalPages: number }> {
  const pb = getPocketBase();
  
  const conditions: Record<string, any> = {};
  if (options.owner) conditions.owner = options.owner;
  if (options.public !== undefined) conditions.public = options.public;
  
  const filter = buildFilter(conditions);
  const params = createPaginationParams({
    ...options,
    filter,
  });
  
  return await pb.collection<WordListRecord>(Collections.WordLists).getList(
    params.page,
    params.perPage,
    {
      filter: params.filter,
      sort: params.sort,
      expand: 'owner,dialect',
    }
  );
}

/**
 * Get word list details
 */
export async function getWordListDetails(id: string): Promise<WordListRecord> {
  const pb = getPocketBase();
  return await pb.collection<WordListRecord>(Collections.WordLists).getOne(id, {
    expand: 'owner,dialect',
  });
}

/**
 * Create word list
 */
export async function createWordList(data: Partial<WordListRecord>): Promise<WordListRecord> {
  const pb = getPocketBase();
  return await pb.collection<WordListRecord>(Collections.WordLists).create(data);
}

/**
 * Update word list
 */
export async function updateWordList(id: string, data: Partial<WordListRecord>): Promise<WordListRecord> {
  const pb = getPocketBase();
  return await pb.collection<WordListRecord>(Collections.WordLists).update(id, data);
}

/**
 * Delete word list
 */
export async function deleteWordList(id: string): Promise<boolean> {
  const pb = getPocketBase();
  await pb.collection(Collections.WordLists).delete(id);
  return true;
}
