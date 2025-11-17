/**
 * Word API endpoints
 * 
 * Handles API calls related to words, characters, and dictionary functionality.
 */

import { api } from './base';
import type { Word, Character } from '../types';

/**
 * Get word details by ID
 */
export async function getWordDetails(id: number): Promise<Word> {
  return api.get<{ word: Word }>(`/words/${id}`).then((res) => res.word);
}

/**
 * Search words by keyword
 */
export async function searchWords(keyword: string): Promise<Word[]> {
  return api.get<{ words: Word[] }>('/words', { search: keyword }).then((res) => res.words);
}

/**
 * Filter words by user/contributor
 */
export async function filterUserWords(userId: number): Promise<Word[]> {
  return api.get<{ words: Word[] }>('/words', { contributor: userId }).then((res) => res.words);
}

/**
 * Batch get words by IDs
 */
export async function getWordsByIds(ids: number[]): Promise<Word[]> {
  return api.put<{ words: Word[] }>('/words', { words: ids }).then((res) => res.words);
}

/**
 * Get phonetic ordering table
 */
export async function getPhoneticOrder(): Promise<any> {
  try {
    return api.get<{ record: any }>('/words/phonetic_ordering').then((res) => res.record);
  } catch {
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
    return api
      .post<{ words: Word[] }>('/words/dictionary', { order, prefix, recursion })
      .then((res) => res.words);
  } catch (_error: any) {
    if (_error?.data?.words) {
      return _error.data.words;
    }
    return [];
  }
}

/**
 * Get character details
 */
export async function getCharacterDetails(id: number): Promise<Character> {
  return api.get<{ character: Character }>(`/characters/${id}`).then((res) => res.character);
}
