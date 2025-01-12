import { quizOperations } from './operations/quizOperations';
import { progressOperations } from './operations/progressOperations';
import { analyticsOperations } from './operations/analyticsOperations';

export * from './operations/quizOperations';
export * from './operations/progressOperations';
export * from './operations/analyticsOperations';
export * from './schema';

export const DatabaseService = {
  quiz: quizOperations,
  progress: progressOperations,
  analytics: analyticsOperations,
};
