/**
 * Word API Module
 * Handles word search, details, and word list management
 */

import { pb, handleApiError, buildFilter, buildPaginationParams } from './client';
import type { Word, Character, WordList, ExpandedWord, ExpandedCharacter } from '../types/pocketbase';

/**
 * Parse definition string into structured format
 */
function splitDefinition(definition: string): Array<{
  content: string;
  example?: Array<{
    type: string;
    content: string;
    explain: string;
  }>;
}> {
  // Simple implementation - can be enhanced
  return definition.split('\n').filter(d => d.trim()).map(d => ({
    content: d.trim(),
  }));
}

/**
 * Get word details by ID
 */
export async function getWordDetails(id: string): Promise<ExpandedWord & {
  definitions: ReturnType<typeof splitDefinition>;
}> {
  try {
    const word = await pb.collection('words').getOne<ExpandedWord>(id, {
      expand: 'contributor,contributor.profile,dialect,related_words,pronunciations',
    });

    // Parse definitions
    const wordWithDefs = {
      ...word,
      definitions: splitDefinition(word.definition || ''),
    };

    // Increment views
    pb.collection('words').update(id, {
      views: (word.views || 0) + 1,
    }).catch(() => {
      // Silent fail for view count
    });

    return wordWithDefs;
  } catch (error) {
    handleApiError(error, '获取词语详情失败');
    throw error;
  }
}

/**
 * Search words by keyword
 */
export async function searchWords(
  keyword: string,
  page: number = 1,
  perPage: number = 20
): Promise<{
  items: Word[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const filter = buildFilter({
      word: { contains: keyword },
    });

    const result = await pb.collection('words').getList<Word>(page, perPage, {
      filter,
      sort: '-views',
      expand: 'contributor,contributor.profile,dialect',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '搜索失败');
    throw error;
  }
}

/**
 * Filter words by contributor
 */
export async function filterUserWords(
  userId: string,
  page: number = 1,
  perPage: number = 20
): Promise<{
  items: Word[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const filter = buildFilter({
      contributor: userId,
    });

    const result = await pb.collection('words').getList<Word>(page, perPage, {
      filter,
      sort: '-created',
      expand: 'dialect',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '获取用户词语失败');
    throw error;
  }
}

/**
 * Get multiple words by IDs
 */
export async function getWords(idList: string[]): Promise<Word[]> {
  try {
    if (idList.length === 0) return [];

    const filter = idList.map(id => `id="${id}"`).join(' || ');
    const result = await pb.collection('words').getList<Word>(1, idList.length, {
      filter,
      expand: 'contributor,contributor.profile,dialect',
    });

    return result.items;
  } catch (error) {
    handleApiError(error, '批量获取词语失败');
    throw error;
  }
}

/**
 * Get phonetic ordering table
 * Note: This needs custom implementation based on Django logic
 */
export async function getPhoneticOrder(): Promise<Record<string, any> | null> {
  try {
    // This would typically call a custom endpoint that generates
    // phonetic ordering from character pronunciations
    const response = await fetch(`${pb.baseUrl}/api/phonetic-ordering`, {
      headers: {
        'Authorization': pb.authStore.token,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.record;
  } catch (error) {
    console.error('Failed to get phonetic order:', error);
    return null;
  }
}

/**
 * Search dictionary by phonetic order
 */
export async function searchDictionary(
  order: string[],
  prefix: string = '',
  recursion: boolean = false
): Promise<Word[]> {
  try {
    // This would call a custom endpoint for phonetic search
    const response = await fetch(`${pb.baseUrl}/api/dictionary/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': pb.authStore.token,
      },
      body: JSON.stringify({ order, prefix, recursion }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return errorData.words || [];
    }

    const data = await response.json();
    return data.words || [];
  } catch (error) {
    console.error('Dictionary search failed:', error);
    return [];
  }
}

/**
 * Get character details by ID
 */
export async function getCharacterDetails(id: string): Promise<ExpandedCharacter> {
  try {
    const character = await pb.collection('characters').getOne<ExpandedCharacter>(id, {
      expand: 'phonological_position,pronunciations,pronunciations.dialect',
    });

    return character;
  } catch (error) {
    handleApiError(error, '获取字详情失败');
    throw error;
  }
}

/**
 * Search characters by filters
 */
export async function searchCharactersByFilters(filters: {
  simplified?: string;
  traditional?: string;
  initial?: string;
  final?: string;
  tone?: string;
  dialectId?: string;
}): Promise<Character[]> {
  try {
    const filterParts: string[] = [];

    if (filters.simplified) {
      filterParts.push(`simplified = "${filters.simplified}"`);
    }
    if (filters.traditional) {
      filterParts.push(`traditional = "${filters.traditional}"`);
    }

    const filterStr = filterParts.join(' && ');
    
    const result = await pb.collection('characters').getList<Character>(1, 100, {
      filter: filterStr || undefined,
      expand: 'phonological_position,pronunciations',
    });

    // Additional filtering by pronunciation attributes if needed
    let characters = result.items;
    
    if (filters.initial || filters.final || filters.tone || filters.dialectId) {
      // Filter based on character pronunciations
      characters = characters.filter(char => {
        if (!char.expand?.pronunciations) return false;
        
        return char.expand.pronunciations.some(pron => {
          if (filters.initial && pron.initial !== filters.initial) return false;
          if (filters.final && pron.final !== filters.final) return false;
          if (filters.tone && pron.tone !== filters.tone) return false;
          if (filters.dialectId && pron.dialect !== filters.dialectId) return false;
          return true;
        });
      });
    }

    return characters;
  } catch (error) {
    handleApiError(error, '搜索字失败');
    throw error;
  }
}

/**
 * Get all characters (paginated)
 */
export async function getCharacters(
  page: number = 1,
  perPage: number = 50
): Promise<{
  items: Character[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const result = await pb.collection('characters').getList<Character>(page, perPage, {
      sort: 'simplified',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '获取字列表失败');
    throw error;
  }
}

/**
 * Create a word list
 */
export async function createWordList(
  name: string,
  description: string,
  userId: string
): Promise<WordList> {
  try {
    const wordList = await pb.collection('word_lists').create<WordList>({
      name,
      description,
      creator: userId,
      words: [],
    });

    uni.showToast({
      title: '创建成功',
      icon: 'success',
    });

    return wordList;
  } catch (error) {
    handleApiError(error, '创建词单失败');
    throw error;
  }
}

/**
 * Add word to word list
 */
export async function addWordToList(listId: string, wordId: string): Promise<void> {
  try {
    const wordList = await pb.collection('word_lists').getOne<WordList>(listId);
    
    const words = wordList.words || [];
    if (!words.includes(wordId)) {
      words.push(wordId);
      await pb.collection('word_lists').update(listId, { words });
      
      uni.showToast({
        title: '添加成功',
        icon: 'success',
      });
    } else {
      uni.showToast({
        title: '词语已在词单中',
        icon: 'none',
      });
    }
  } catch (error) {
    handleApiError(error, '添加失败');
    throw error;
  }
}

/**
 * Remove word from word list
 */
export async function removeWordFromList(listId: string, wordId: string): Promise<void> {
  try {
    const wordList = await pb.collection('word_lists').getOne<WordList>(listId);
    
    const words = wordList.words || [];
    const index = words.indexOf(wordId);
    
    if (index > -1) {
      words.splice(index, 1);
      await pb.collection('word_lists').update(listId, { words });
      
      uni.showToast({
        title: '移除成功',
        icon: 'success',
      });
    }
  } catch (error) {
    handleApiError(error, '移除失败');
    throw error;
  }
}

/**
 * Get user's word lists
 */
export async function getUserWordLists(
  userId: string,
  page: number = 1,
  perPage: number = 20
): Promise<{
  items: WordList[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const filter = buildFilter({ creator: userId });
    const result = await pb.collection('word_lists').getList<WordList>(page, perPage, {
      filter,
      sort: '-created',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '获取词单失败');
    throw error;
  }
}

/**
 * Get word list details with words
 */
export async function getWordListDetails(id: string): Promise<WordList & {
  expandedWords?: Word[];
}> {
  try {
    const wordList = await pb.collection('word_lists').getOne<WordList>(id);
    
    // Get all words in the list
    if (wordList.words && wordList.words.length > 0) {
      const words = await getWords(wordList.words);
      return {
        ...wordList,
        expandedWords: words,
      };
    }

    return wordList;
  } catch (error) {
    handleApiError(error, '获取词单详情失败');
    throw error;
  }
}
