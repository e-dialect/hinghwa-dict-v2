/**
 * Quiz API Module
 * Handles quizzes, quiz papers, and quiz records
 */

import { pb, handleApiError, buildFilter } from './client';
import type { Quiz, QuizPaper, QuizRecord } from '../types/pocketbase';

/**
 * Get quiz by ID
 */
export async function getQuiz(id: string): Promise<Quiz> {
  try {
    const quiz = await pb.collection('quizzes').getOne<Quiz>(id, {
      expand: 'creator,creator.profile',
    });

    return quiz;
  } catch (error) {
    handleApiError(error, '获取题目失败');
    throw error;
  }
}

/**
 * Search quizzes
 */
export async function searchQuiz(params: {
  keyword?: string;
  type?: string;
  creatorId?: string;
  page?: number;
  perPage?: number;
}): Promise<{
  items: Quiz[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const { keyword, type, creatorId, page = 1, perPage = 20 } = params;
    const filterParts: string[] = [];

    if (keyword) {
      filterParts.push(`(question ~ "${keyword}" || answer ~ "${keyword}")`);
    }
    if (type) {
      filterParts.push(`type = "${type}"`);
    }
    if (creatorId) {
      filterParts.push(`creator = "${creatorId}"`);
    }

    const filter = filterParts.join(' && ') || undefined;

    const result = await pb.collection('quizzes').getList<Quiz>(page, perPage, {
      filter,
      sort: '-created',
      expand: 'creator,creator.profile',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '搜索题目失败');
    throw error;
  }
}

/**
 * Get random quiz
 */
export async function getRandomQuiz(count: number = 1, type?: string): Promise<Quiz[]> {
  try {
    // Get total count
    const countResult = await pb.collection('quizzes').getList(1, 1, {
      filter: type ? `type = "${type}"` : undefined,
    });

    if (countResult.totalItems === 0) {
      return [];
    }

    // Generate random offsets
    const randomOffsets = Array.from({ length: Math.min(count, countResult.totalItems) }, () =>
      Math.floor(Math.random() * countResult.totalItems)
    );

    // Fetch quizzes at random offsets
    const quizzes: Quiz[] = [];
    for (const offset of randomOffsets) {
      const result = await pb.collection('quizzes').getList<Quiz>(offset + 1, 1, {
        filter: type ? `type = "${type}"` : undefined,
      });
      if (result.items.length > 0) {
        quizzes.push(result.items[0]);
      }
    }

    return quizzes;
  } catch (error) {
    handleApiError(error, '获取随机题目失败');
    return [];
  }
}

/**
 * Create quiz
 */
export async function createQuiz(data: {
  question: string;
  answer: string;
  type: string;
  options?: string[];
  creatorId: string;
  explanation?: string;
}): Promise<Quiz> {
  try {
    const quiz = await pb.collection('quizzes').create<Quiz>({
      question: data.question,
      answer: data.answer,
      type: data.type,
      options: data.options || [],
      creator: data.creatorId,
      explanation: data.explanation,
    });

    uni.showToast({
      title: '创建成功',
      icon: 'success',
    });

    return quiz;
  } catch (error) {
    handleApiError(error, '创建失败');
    throw error;
  }
}

/**
 * Get all quiz papers
 */
export async function getAllPapers(
  page: number = 1,
  perPage: number = 20
): Promise<{
  items: QuizPaper[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const result = await pb.collection('quiz_papers').getList<QuizPaper>(page, perPage, {
      sort: '-created',
      expand: 'creator,creator.profile',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '获取试卷失败');
    throw error;
  }
}

/**
 * Get quiz paper detail
 */
export async function getPaperDetail(id: string): Promise<QuizPaper & {
  expandedQuizzes?: Quiz[];
}> {
  try {
    const paper = await pb.collection('quiz_papers').getOne<QuizPaper>(id, {
      expand: 'creator,creator.profile',
    });

    // Get all quizzes in the paper
    if (paper.quizzes && paper.quizzes.length > 0) {
      const filter = paper.quizzes.map(qid => `id="${qid}"`).join(' || ');
      const quizzesResult = await pb.collection('quizzes').getList<Quiz>(1, paper.quizzes.length, {
        filter,
      });

      return {
        ...paper,
        expandedQuizzes: quizzesResult.items,
      };
    }

    return paper;
  } catch (error) {
    handleApiError(error, '获取试卷详情失败');
    throw error;
  }
}

/**
 * Create quiz paper
 */
export async function createPaper(data: {
  title: string;
  description: string;
  quizIds: string[];
  creatorId: string;
}): Promise<QuizPaper> {
  try {
    const paper = await pb.collection('quiz_papers').create<QuizPaper>({
      title: data.title,
      description: data.description,
      quizzes: data.quizIds,
      creator: data.creatorId,
    });

    uni.showToast({
      title: '创建成功',
      icon: 'success',
    });

    return paper;
  } catch (error) {
    handleApiError(error, '创建失败');
    throw error;
  }
}

/**
 * Upload quiz paper (submit answers)
 */
export async function uploadPaper(data: {
  paperId: string;
  userId: string;
  answers: Record<string, string>; // quizId -> answer
  score: number;
  totalScore: number;
}): Promise<QuizRecord> {
  try {
    const record = await pb.collection('quiz_records').create<QuizRecord>({
      paper: data.paperId,
      user: data.userId,
      answers: data.answers,
      score: data.score,
      total_score: data.totalScore,
    });

    uni.showToast({
      title: '提交成功',
      icon: 'success',
    });

    return record;
  } catch (error) {
    handleApiError(error, '提交失败');
    throw error;
  }
}

/**
 * Get all quiz records for a user
 */
export async function getAllRecords(
  userId: string,
  page: number = 1,
  perPage: number = 20
): Promise<{
  items: QuizRecord[];
  totalPages: number;
  totalItems: number;
}> {
  try {
    const filter = buildFilter({ user: userId });
    const result = await pb.collection('quiz_records').getList<QuizRecord>(page, perPage, {
      filter,
      sort: '-created',
      expand: 'paper',
    });

    return {
      items: result.items,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (error) {
    handleApiError(error, '获取答题记录失败');
    throw error;
  }
}

/**
 * Get single quiz record
 */
export async function getRecord(id: string): Promise<QuizRecord> {
  try {
    const record = await pb.collection('quiz_records').getOne<QuizRecord>(id, {
      expand: 'paper,user,user.profile',
    });

    return record;
  } catch (error) {
    handleApiError(error, '获取答题记录失败');
    throw error;
  }
}

/**
 * Delete quiz
 */
export async function deleteQuiz(id: string): Promise<void> {
  try {
    await pb.collection('quizzes').delete(id);

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
 * Update quiz
 */
export async function updateQuiz(id: string, data: Partial<Quiz>): Promise<Quiz> {
  try {
    const quiz = await pb.collection('quizzes').update<Quiz>(id, data);

    uni.showToast({
      title: '更新成功',
      icon: 'success',
    });

    return quiz;
  } catch (error) {
    handleApiError(error, '更新失败');
    throw error;
  }
}
