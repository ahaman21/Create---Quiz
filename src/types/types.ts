import { User as FirebaseUser } from 'firebase/auth';

// Bildirim arayüzü
export interface Notification {
  message: string;
  type: 'success' | 'error';
}

export interface FirestoreQuizData {
  questions: Question[];
  userAnswers: AnswerKey; 
  preferences: QuizPreferences;
  fileName: string;
  userId: string;
  courseId: string;
  timestamp: string;
  score: number;
  elapsedTime: number;
  formattedTime: string;
  userLevel: UserLevel;
  analysisResult: AnalysisResult;
}

export interface FirestoreCourseData {
  name: string;
  userId: string;
  createdAt: string;
}

// Soru arayüzü
export interface Question {
  id: string;
  text: string;
  question: string;
  options: string[];
  correctAnswer: string;
  type: 'multiple-choice';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Cevap anahtarı arayüzü
export type AnswerKey = {
  [key: string]: string;
};

// Temel kullanıcı arayüzü
export interface BaseUser {
  email: string;
  role: 'admin' | 'user';
}

// Kullanıcı arayüzü
export interface User extends BaseUser {
  id: string;
}

// Kullanıcı verileri arayüzü
export interface WeakTopic {
  failCount: number;
  successCount?: number; // Yeni alan örneği
  lastAttempt: string;
  status: 'active' | 'mastered';
}

// Kullanıcı verileri arayüzü
export interface UserData extends BaseUser {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  createdAt?: string;
  lastLogin?: string;
  weakTopics?: Record<string, WeakTopic>;
  strongTopics?: string[];
  lastAnalysis?: AnalysisResult;
}

// Soru türü ayarları arayüzü
export interface QuestionTypeSettings {
  multipleChoice: boolean;
}

// Zorluk seviyesine göre performans arayüzü
export interface PerformanceByDifficulty {
  easy: number;
  medium: number;
  hard: number;
}

// Sınav sonucu arayüzü
export interface ExamResult {
  id: string;
  userId: string;
  fileName: string;
  date: Date;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  answers: AnswerKey;
  questions: Question[];
}

// Sınav istatistikleri arayüzü
export interface ExamStats {
  totalExams: number;
  averageScore: number;
  bestScore: number;
  recentExams: ExamResult[]; 
}

// Analiz sonucu arayüzü
export interface AnalysisResult {
  masteredTopics: string[];
  weakTopics: string[];
  learnedTopics: string[];
  gapTopics: string[];
  overallPerformance: number;
  confidenceScore: number;
  recommendations: string[];
  topicPerformance: {
    [topic: string]: {
      correct: number;
      total: number;
      percentage: number;
    };
  };
  recommendedFocus: string[];
  performanceByDifficulty: PerformanceByDifficulty;
}

// Sınav ayarları arayüzü
export interface ExamSettings {
  optionCount: number;
  questionTypes: QuestionTypeSettings;
  questionCounts: {
    multipleChoice: number;
  };
}

// Quiz verileri arayüzü
export interface QuizData {
  id?: string;
  questions: Question[];
  userAnswers?: AnswerKey;
  preferences: QuizPreferences;
  fileName: string;
  results?: any;
  timestamp?: string;
  userId?: string;
  courseId?: string;
  formattedTime: string;
  course: string;
  score:  number;
  elapsedTime: string;
  userLevel: string;
}

// Quiz tercihleri arayüzü
export interface QuizPreferences {
  typeCount: {
    multipleChoice: number;
  };
  optionCount?: number;
  prioritizeWeakTopics?: boolean;
  selectedCourseId?: string;
  courses?: Course[];
  questionTypes?: {
    multipleChoice: boolean;
  };
  onlyWeakTopics?: boolean;    // Yeni eklenen
  weakTopicsList?: string[];   // Yeni eklenen
}

// Analiz sonuçları bileşeni için props arayüzü
export interface AnalysisResultsProps {
  analysisResult: AnalysisResult | null;
}

// Kimlik doğrulama bağlamı türü arayüzü
export interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, isAdmin: boolean) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: (uid: string) => Promise<boolean>;
}

// Quiz zamanlayıcı bağlamı türü arayüzü
export interface QuizTimerContextType {
  isQuizActive: boolean;
  elapsedTime: number;
  startQuiz: () => void;
  stopQuiz: () => void;
  resetQuiz: () => void;
  getFormattedTime: () => string;
}

// Ders arayüzü
export interface Course {
  id: string;
  name: string;
  userId: string; 
  createdAt: string;
}

// Ders dizisi arayüzü
export interface CourseArray {
  courses: Course[];
}

export interface StudentProgress {
  userId: string;
  weakTopics: {
    [topic: string]: {
      failCount: number;
      lastAttemptDate: string;
      quizzes: {
        quizId: string;
        date: string;
        score: number;
      }[];
    };
  };
  strongTopics: string[];
  weeklyProgress: {
    weekStartDate: string;
    completedQuizzes: number;
    averageScore: number;
    totalTime: number;
    weakestTopics: string[];
  }[];
  timeStats: {
    averageQuizTime: number;
    fastestQuiz: number;
    slowestQuiz: number;
  };
}

// Quiz durumu arayüzü
export interface QuizState {
  preferences: QuizPreferences;
  questions: Question[];
  currentAnswers: AnswerKey;
  showQuiz: boolean;
  showResults: boolean;
  isGeneratingQuiz: boolean;
  course: string;
  fileName: string;
  uploadedFile: File | null;
  hasUploadedText: boolean;
  isQuizCompleted: boolean;
}

export type UserLevel = 'beginner' | 'intermediate' | 'advanced' | 'mixed';

// Konu performansı arayüzü
export interface TopicPerformance {
  total: number;
  passed: number;
  failed: number;
  percentage: number;
  subTopics: Record<string, SubTopicPerformance>;
}

// Alt konu performansı arayüzü
export interface SubTopicPerformance {
  total: number;
  correct: number;
  percentage: number;
}

// Ana konu istatistikleri arayüzü
export interface MainTopicStats {
  [key: string]: TopicPerformance;
}
