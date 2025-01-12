export const DB_TABLES = {
  USERS: 'users',
  QUIZZES: 'quizzes',
  COURSES: 'courses',
  STUDENT_PROGRESS: 'studentProgress',
  ANALYTICS: 'analytics',
  WEAK_TOPICS: 'weakTopics',
  TOPIC_HISTORY: 'topicHistory'
} as const;

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin: string;
}

export interface Quiz {
  id: string;
  userId: string;
  courseId: string;
  questions: Question[];
  userAnswers: AnswerKey;
  score: number;
  timestamp: string;
  duration: number;
  fileName: string;
  formattedTime: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  analysisResult: AnalysisResult;
}

export interface Course {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface StudentProgress {
  id: string;
  userId: string;
  courseId: string;
  progressData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  id: string;
  userId: string;
  quizId: string;
  timeSpent: number;
  accuracy: number;
  topicPerformance: Record<string, number>;
  createdAt: string;
}

export interface WeakTopic {
  id: string;
  userId: string;
  topic: string;
  failCount: number;
  successCount: number;
  lastAttempt: string;
  status: 'active' | 'mastered';
  createdAt: string;
  updatedAt: string;
}

export interface TopicHistory {
  id: string;
  userId: string;
  quizId: string;
  topic: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AnswerKey {
  [questionId: string]: string;
}

export interface AnalysisResult {
  masteredTopics: string[];
  weakTopics: string[];
  overallPerformance: number;
  topicPerformance: Record<string, TopicPerformance>;
  performanceByDifficulty: PerformanceByDifficulty;
}

export interface TopicPerformance {
  correct: number;
  total: number;
  percentage: number;
}

export interface PerformanceByDifficulty {
  easy: number;
  medium: number;
  hard: number;
}

export interface DBSchema {
  users: User;
  quizzes: Quiz;
  courses: Course;
  studentProgress: StudentProgress;
  analytics: Analytics;
  weakTopics: WeakTopic;
  topicHistory: TopicHistory;
}
