/**
 * Quiz API Service (Pocketbase)
 * 
 * Handles quizzes, test papers, and quiz records
 */

import getPocketBase, { buildFilter, type PaginationOptions } from '../pocketbase-client';
import type { QuizRecord, QuizPaperRecord, QuizRecordRecord } from '../../types/pocketbase';
import { Collections } from '../../types/pocketbase';

/**
 * Get quiz by ID
 */
export async function getQuiz(id: string): Promise<QuizRecord> {
  const pb = getPocketBase();
  return await pb.collection<QuizRecord>(Collections.Quizzes).getOne(id, {
    expand: 'dialect,contributor',
  });
}

/**
 * Search quizzes
 */
export async function searchQuiz(keyword: string): Promise<{ quizzes: string[] }> {
  const pb = getPocketBase();
  
  const quizzes = await pb.collection<QuizRecord>(Collections.Quizzes).getFullList({
    filter: `question~'${keyword}' && verified=true`,
    fields: 'id',
  });
  
  return { quizzes: quizzes.map(q => q.id) };
}

/**
 * Get random quiz
 */
export async function getRandomQuiz(): Promise<QuizRecord> {
  const pb = getPocketBase();
  
  // Get all verified quizzes
  const quizzes = await pb.collection<QuizRecord>(Collections.Quizzes).getFullList({
    filter: 'verified=true',
  });
  
  if (quizzes.length === 0) {
    throw new Error('No quizzes available');
  }
  
  // Return random quiz
  const randomIndex = Math.floor(Math.random() * quizzes.length);
  return quizzes[randomIndex];
}

/**
 * Get test paper (generate from quiz pool)
 */
export async function getTestPaper(dialectId?: string): Promise<QuizPaperRecord> {
  const pb = getPocketBase();
  
  // For now, get a random paper
  const filter = dialectId ? buildFilter({ dialect: dialectId, public: true }) : 'public=true';
  
  const papers = await pb.collection<QuizPaperRecord>(Collections.QuizPapers).getFullList({
    filter,
  });
  
  if (papers.length === 0) {
    throw new Error('No test papers available');
  }
  
  const randomIndex = Math.floor(Math.random() * papers.length);
  return papers[randomIndex];
}

/**
 * Get all papers
 */
export async function getAllPapers(options?: {
  dialect?: string;
  difficulty?: string;
  public?: boolean;
}): Promise<{ papers: QuizPaperRecord[] }> {
  const pb = getPocketBase();
  
  const conditions: Record<string, any> = {};
  if (options?.dialect) conditions.dialect = options.dialect;
  if (options?.difficulty) conditions.difficulty = options.difficulty;
  if (options?.public !== undefined) conditions.public = options.public;
  
  const filter = buildFilter(conditions);
  
  const papers = await pb.collection<QuizPaperRecord>(Collections.QuizPapers).getFullList({
    filter,
    expand: 'dialect,contributor',
  });
  
  return { papers };
}

/**
 * Get paper details
 */
export async function getPaperDetail(id: string): Promise<QuizPaperRecord> {
  const pb = getPocketBase();
  return await pb.collection<QuizPaperRecord>(Collections.QuizPapers).getOne(id, {
    expand: 'dialect,contributor',
  });
}

/**
 * Get all records for a user
 */
export async function getAllRecords(userId: string): Promise<{ records: QuizRecordRecord[] }> {
  const pb = getPocketBase();
  
  const records = await pb.collection<QuizRecordRecord>(Collections.QuizRecords).getFullList({
    filter: buildFilter({ user: userId }),
    expand: 'paper',
    sort: '-created',
  });
  
  return { records };
}

/**
 * Get specific record
 */
export async function getRecord(recordId: string): Promise<QuizRecordRecord> {
  const pb = getPocketBase();
  return await pb.collection<QuizRecordRecord>(Collections.QuizRecords).getOne(recordId, {
    expand: 'paper,user',
  });
}

/**
 * Upload answer for a quiz
 */
export async function uploadMyAnswer(data: {
  quiz_id: string;
  paper_record: string;
  contributor: string;
  answer: string;
  correctness: boolean;
}): Promise<any> {
  // This is handled within the paper record's answers array
  // Just return success for now
  return { success: true };
}

/**
 * Upload paper record
 */
export async function uploadPaper(data: {
  contributor: string;
  paper: string;
  answers: any[];
  score: number;
  time_spent?: number;
}): Promise<QuizRecordRecord> {
  const pb = getPocketBase();
  
  // Calculate if passed
  const paper = await pb.collection<QuizPaperRecord>(Collections.QuizPapers).getOne(data.paper);
  const passed = data.score >= (paper.passing_score || 60);
  
  return await pb.collection<QuizRecordRecord>(Collections.QuizRecords).create({
    paper: data.paper,
    user: data.contributor,
    answers: data.answers,
    score: data.score,
    time_spent: data.time_spent,
    passed,
  });
}

/**
 * Create quiz
 */
export async function createQuiz(data: {
  question: string;
  question_type: 'multiple_choice' | 'fill_blank' | 'listening';
  options?: any[];
  correct_answer: string;
  explanation?: string;
  dialect: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  tags?: string[];
  audio?: File;
  contributor: string;
}): Promise<QuizRecord> {
  const pb = getPocketBase();
  
  const formData = new FormData();
  formData.append('question', data.question);
  formData.append('question_type', data.question_type);
  formData.append('correct_answer', data.correct_answer);
  formData.append('dialect', data.dialect);
  formData.append('contributor', data.contributor);
  
  if (data.options) formData.append('options', JSON.stringify(data.options));
  if (data.explanation) formData.append('explanation', data.explanation);
  if (data.difficulty) formData.append('difficulty', data.difficulty);
  if (data.category) formData.append('category', data.category);
  if (data.tags) formData.append('tags', JSON.stringify(data.tags));
  if (data.audio) formData.append('audio', data.audio);
  
  return await pb.collection<QuizRecord>(Collections.Quizzes).create(formData);
}
