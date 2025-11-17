/**
 * Services Package - Main Entry Point
 * 
 * This package provides API services for the Hinghwa Dictionary applications.
 * 
 * Structure:
 * - api/: Low-level API request functions
 * - types/: TypeScript type definitions
 * - src/: Business logic and service layer (future)
 */

// Export types
export * from './types';

// Export API functions
export * from './api/base';
export * from './api/word';
export * from './api/user';

// Note: Additional API modules will be added as they are migrated
// - api/article.ts
// - api/pronunciation.ts
// - api/quiz.ts
// etc.
