/**
 * Services Package - Main Entry Point
 * 
 * This package provides API services for the Hinghwa Dictionary applications.
 */

// Export client
export * from './pocketbase-client';

// Export API services
export * from './api/word.service';
export * from './api/pronunciation.service';
export * from './api/user.service';
export * from './api/article.service';
export * from './api/quiz.service';
export * from './api/website.service';
export * from './api/dialect.service';

// Export types
export * from '../types/pocketbase';

// Export utils
export * from './utils/word-utils';
