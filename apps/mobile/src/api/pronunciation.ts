/**
 * Pronunciation API Module
 * Handles pronunciation records, audio uploads, and synthesis
 */

import { pb, handleApiError, buildFilter } from './client';
import type { Pronunciation, CharacterPronunciation, ExpandedPronunciation } from '../types/pocketbase';

/**
 * Get pronunciations for a word
 */
export async function getWordPronunciations(
  wordId: string,
  page: number = 1,
  perPage: number = 20
): Promise<{
  items: Pronunciation[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const filter = buildFilter({
      type: 'word',
      content: wordId,
    });

    const result = await pb.collection('pronunciations').getList<Pronunciation>(page, perPage, {
      filter,
      sort: '-created',
      expand: 'contributor,contributor.profile,dialect',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '获取发音失败');
    throw error;
  }
}

/**
 * Get pronunciations for a character
 */
export async function getCharacterPronunciations(
  characterId: string,
  dialectId?: string
): Promise<CharacterPronunciation[]> {
  try {
    const filterParts: string[] = [`character = "${characterId}"`];
    
    if (dialectId) {
      filterParts.push(`dialect = "${dialectId}"`);
    }

    const result = await pb.collection('character_pronunciations').getList<CharacterPronunciation>(
      1,
      100,
      {
        filter: filterParts.join(' && '),
        expand: 'dialect,character,source_pronunciation',
      }
    );

    return result.items;
  } catch (error) {
    handleApiError(error, '获取字发音失败');
    throw error;
  }
}

/**
 * Create pronunciation record
 */
export async function createPronunciation(data: {
  type: 'word' | 'character';
  content: string;
  ipa?: string;
  romanization?: string;
  dialectId: string;
  audioFile?: File;
  contributorId: string;
  readingType?: string;
  tags?: string[];
}): Promise<Pronunciation> {
  try {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('content', data.content);
    formData.append('dialect', data.dialectId);
    formData.append('contributor', data.contributorId);

    if (data.ipa) formData.append('ipa', data.ipa);
    if (data.romanization) formData.append('romanization', data.romanization);
    if (data.readingType) formData.append('reading_type', data.readingType);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    if (data.audioFile) formData.append('audio', data.audioFile);

    const pronunciation = await pb.collection('pronunciations').create<Pronunciation>(formData);

    uni.showToast({
      title: '上传成功',
      icon: 'success',
    });

    return pronunciation;
  } catch (error) {
    handleApiError(error, '上传发音失败');
    throw error;
  }
}

/**
 * Create character pronunciation
 */
export async function createCharacterPronunciation(data: {
  characterId: string;
  dialectId: string;
  ipa?: string;
  romanization?: string;
  initial?: string;
  final?: string;
  tone?: string;
  readingType?: string;
  sourcePronunciationId?: string;
  tags?: string[];
}): Promise<CharacterPronunciation> {
  try {
    const charPron = await pb.collection('character_pronunciations').create<CharacterPronunciation>({
      character: data.characterId,
      dialect: data.dialectId,
      ipa: data.ipa,
      romanization: data.romanization,
      initial: data.initial,
      final: data.final,
      tone: data.tone,
      reading_type: data.readingType,
      source_pronunciation: data.sourcePronunciationId,
      tags: data.tags,
    });

    uni.showToast({
      title: '创建成功',
      icon: 'success',
    });

    return charPron;
  } catch (error) {
    handleApiError(error, '创建字发音失败');
    throw error;
  }
}

/**
 * Get pronunciation ranking by contributor
 */
export async function getPronunciationRanking(
  page: number = 1,
  perPage: number = 20
): Promise<Array<{
  contributor: any;
  count: number;
}>> {
  try {
    // This would typically call a custom endpoint that aggregates counts
    const response = await fetch(`${pb.baseUrl}/api/pronunciation/ranking?page=${page}&perPage=${perPage}`, {
      headers: {
        'Authorization': pb.authStore.token,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get ranking');
    }

    const data = await response.json();
    return data.ranking || [];
  } catch (error) {
    handleApiError(error, '获取排行榜失败');
    return [];
  }
}

/**
 * Combine pronunciation audio (calls audio microservice)
 */
export async function combinePronunciation(params: {
  words?: string;
  ipas?: string;
  pinyins?: string;
}): Promise<string> {
  try {
    const audioServiceUrl = process.env.AUDIO_SERVICE_URL || 'http://localhost:8001';
    const queryParams = new URLSearchParams();

    if (params.words) queryParams.append('words', params.words);
    if (params.ipas) queryParams.append('ipas', params.ipas);
    if (params.pinyins) queryParams.append('pinyins', params.pinyins);

    const response = await fetch(`${audioServiceUrl}/audio/combine?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error('Audio synthesis failed');
    }

    const data = await response.json();
    return data.audio_url;
  } catch (error) {
    handleApiError(error, '语音合成失败');
    throw error;
  }
}

/**
 * Play pronunciation audio
 */
export async function playPronunciation(pronunciation: Pronunciation | CharacterPronunciation): Promise<void> {
  try {
    let audioUrl: string;

    if ('audio' in pronunciation && pronunciation.audio) {
      // Pronunciation record with audio file
      audioUrl = pb.files.getUrl(pronunciation as any, pronunciation.audio);
    } else if ('ipa' in pronunciation && pronunciation.ipa) {
      // Synthesize from IPA
      audioUrl = await combinePronunciation({ ipas: pronunciation.ipa });
    } else if ('romanization' in pronunciation && pronunciation.romanization) {
      // Synthesize from romanization
      audioUrl = await combinePronunciation({ pinyins: pronunciation.romanization });
    } else {
      throw new Error('No audio source available');
    }

    // Play audio using uni-app API
    const innerAudioContext = uni.createInnerAudioContext();
    innerAudioContext.src = audioUrl;
    innerAudioContext.play();
    
    innerAudioContext.onError((error) => {
      console.error('Audio play error:', error);
      uni.showToast({
        title: '播放失败',
        icon: 'error',
      });
    });
  } catch (error) {
    handleApiError(error, '播放失败');
    throw error;
  }
}

/**
 * Get user's pronunciation contributions
 */
export async function getUserPronunciations(
  userId: string,
  page: number = 1,
  perPage: number = 20
): Promise<{
  items: Pronunciation[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const filter = buildFilter({ contributor: userId });
    const result = await pb.collection('pronunciations').getList<Pronunciation>(page, perPage, {
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
    handleApiError(error, '获取发音记录失败');
    throw error;
  }
}

/**
 * Delete pronunciation record
 */
export async function deletePronunciation(id: string): Promise<void> {
  try {
    await pb.collection('pronunciations').delete(id);

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
 * Update pronunciation record
 */
export async function updatePronunciation(
  id: string,
  data: Partial<Pronunciation>
): Promise<Pronunciation> {
  try {
    const pronunciation = await pb.collection('pronunciations').update<Pronunciation>(id, data);

    uni.showToast({
      title: '更新成功',
      icon: 'success',
    });

    return pronunciation;
  } catch (error) {
    handleApiError(error, '更新失败');
    throw error;
  }
}
