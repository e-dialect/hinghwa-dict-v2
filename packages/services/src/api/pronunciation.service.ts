/**
 * Pronunciation API Service (Pocketbase)
 * 
 * Handles pronunciation recordings and management
 */

import getPocketBase, { buildFilter, createPaginationParams, type PaginationOptions } from '../pocketbase-client';
import type { PronunciationRecord, CharacterPronunciationRecord } from '../../types/pocketbase';
import { Collections } from '../../types/pocketbase';

/**
 * Create a new pronunciation recording
 */
export async function createPronunciation(data: {
  type: 'character' | 'word' | 'phrase' | 'sentence';
  content: string;
  ipa?: string;
  romanization?: string;
  dialect: string;
  audio: File;
  character?: string;
  word?: string;
  contributor: string;
  source?: string;
  quality?: 'high' | 'medium' | 'low';
}): Promise<PronunciationRecord> {
  const pb = getPocketBase();
  
  const formData = new FormData();
  formData.append('type', data.type);
  formData.append('content', data.content);
  formData.append('dialect', data.dialect);
  formData.append('audio', data.audio);
  formData.append('contributor', data.contributor);
  
  if (data.ipa) formData.append('ipa', data.ipa);
  if (data.romanization) formData.append('romanization', data.romanization);
  if (data.character) formData.append('character', data.character);
  if (data.word) formData.append('word', data.word);
  if (data.source) formData.append('source', data.source);
  if (data.quality) formData.append('quality', data.quality);
  
  return await pb.collection<PronunciationRecord>(Collections.Pronunciations).create(formData);
}

/**
 * Get pronunciations with filters
 */
export async function getPronunciations(
  filter?: {
    type?: string;
    dialect?: string;
    contributor?: string;
    verified?: boolean;
    word?: string;
  },
  options: PaginationOptions = {}
): Promise<{ items: PronunciationRecord[]; totalItems: number; totalPages: number }> {
  const pb = getPocketBase();
  
  const conditions: Record<string, any> = {};
  if (filter?.type) conditions.type = filter.type;
  if (filter?.dialect) conditions.dialect = filter.dialect;
  if (filter?.contributor) conditions.contributor = filter.contributor;
  if (filter?.verified !== undefined) conditions.verified = filter.verified;
  if (filter?.word) conditions.word = filter.word;
  
  const filterStr = buildFilter(conditions);
  const params = createPaginationParams({
    ...options,
    filter: filterStr,
  });
  
  return await pb.collection<PronunciationRecord>(Collections.Pronunciations).getList(
    params.page,
    params.perPage,
    {
      filter: params.filter,
      sort: params.sort || '-created',
      expand: options.expand || 'dialect,contributor,character,word',
    }
  );
}

/**
 * Get pronunciations with total count
 */
export async function getPronunciationsWithTotal(
  filter?: {
    type?: string;
    dialect?: string;
    contributor?: string;
    verified?: boolean;
  },
  options: PaginationOptions = {}
): Promise<{ items: PronunciationRecord[]; total: number }> {
  const result = await getPronunciations(filter, options);
  return {
    items: result.items,
    total: result.totalItems,
  };
}

/**
 * Get pronunciation details by ID
 */
export async function getPronunciationDetails(id: string): Promise<PronunciationRecord | null> {
  const pb = getPocketBase();
  try {
    return await pb.collection<PronunciationRecord>(Collections.Pronunciations).getOne(id, {
      expand: 'dialect,contributor,character,word',
    });
  } catch (error) {
    return null;
  }
}

/**
 * Get pronunciation ranking by contribution count
 */
export async function getPronunciationRanking(days: number): Promise<any[]> {
  const pb = getPocketBase();
  
  // Calculate date threshold
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  const dateStr = dateThreshold.toISOString();
  
  // Get pronunciations within the time range
  const pronunciations = await pb.collection(Collections.Pronunciations).getFullList({
    filter: `created >= '${dateStr}'`,
    expand: 'contributor',
  });
  
  // Count by contributor
  const contributorCounts: Record<string, { count: number; contributor: any }> = {};
  
  for (const pron of pronunciations) {
    const contributorId = pron.contributor;
    if (!contributorCounts[contributorId]) {
      contributorCounts[contributorId] = {
        count: 0,
        contributor: pron.expand?.contributor || null,
      };
    }
    contributorCounts[contributorId].count++;
  }
  
  // Convert to array and sort
  const ranking = Object.entries(contributorCounts)
    .map(([id, data]) => ({
      contributor: data.contributor,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);
  
  return ranking;
}

/**
 * Delete a pronunciation
 */
export async function deletePronunciation(id: string): Promise<boolean> {
  const pb = getPocketBase();
  await pb.collection(Collections.Pronunciations).delete(id);
  return true;
}

/**
 * Create character pronunciation
 */
export async function createCharacterPronunciation(data: {
  character: string;
  dialect: string;
  ipa: string;
  romanization?: string;
  initial?: string;
  final?: string;
  tone?: string;
  tone_value?: string;
  reading_type?: 'literary' | 'colloquial' | 'both';
  source?: string;
  source_text?: string;
  audio?: File;
  tags?: string[];
  notes?: string;
}): Promise<CharacterPronunciationRecord> {
  const pb = getPocketBase();
  
  const formData = new FormData();
  formData.append('character', data.character);
  formData.append('dialect', data.dialect);
  formData.append('ipa', data.ipa);
  
  if (data.romanization) formData.append('romanization', data.romanization);
  if (data.initial) formData.append('initial', data.initial);
  if (data.final) formData.append('final', data.final);
  if (data.tone) formData.append('tone', data.tone);
  if (data.tone_value) formData.append('tone_value', data.tone_value);
  if (data.reading_type) formData.append('reading_type', data.reading_type);
  if (data.source) formData.append('source', data.source);
  if (data.source_text) formData.append('source_text', data.source_text);
  if (data.audio) formData.append('audio', data.audio);
  if (data.tags) formData.append('tags', JSON.stringify(data.tags));
  if (data.notes) formData.append('notes', data.notes);
  
  return await pb.collection<CharacterPronunciationRecord>(Collections.CharacterPronunciations).create(formData);
}

/**
 * Get character pronunciations
 */
export async function getCharacterPronunciations(
  characterId: string,
  dialectId?: string
): Promise<CharacterPronunciationRecord[]> {
  const pb = getPocketBase();
  
  const conditions: Record<string, any> = { character: characterId };
  if (dialectId) conditions.dialect = dialectId;
  
  const filter = buildFilter(conditions);
  
  return await pb.collection<CharacterPronunciationRecord>(Collections.CharacterPronunciations).getFullList({
    filter,
    expand: 'character,dialect,source',
  });
}

/**
 * Combine pronunciation audio (calls external audio service)
 * This is a placeholder - actual implementation will call the audio microservice
 */
export async function combinePronunciation(params: {
  words?: string;
  ipas?: string;
  pinyins?: string;
}): Promise<{ url: string; contributor?: string; tts?: string }> {
  // TODO: Call audio synthesis microservice
  // For now, return a placeholder
  console.warn('combinePronunciation: Audio synthesis microservice not yet implemented');
  
  // In the future, this will call:
  // const response = await fetch('http://audio-service:8001/audio/combine', {
  //   method: 'GET',
  //   params: params
  // });
  // return response.json();
  
  return {
    url: '',
    contributor: 'null',
    tts: 'null',
  };
}

/**
 * Combine pronunciation by Chinese characters
 */
export async function combinePronunciationByChinese(chinese: string): Promise<string> {
  const result = await combinePronunciation({ words: chinese });
  return result.url;
}

/**
 * Combine pronunciation by pinyin
 */
export async function combinePronunciationByPinyin(pinyin: string): Promise<string> {
  const result = await combinePronunciation({ pinyins: pinyin });
  return result.url;
}

/**
 * Combine pronunciation by IPA
 */
export async function combinePronunciationByIpa(ipa: string): Promise<string> {
  const result = await combinePronunciation({ ipas: ipa });
  return result.url;
}
