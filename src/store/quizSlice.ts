import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Question, AnswerKey, QuizPreferences } from '../types/types';
import { Course } from '../models/Course'; // Import Course

// ...existing code...
interface QuizState {
  questions: Question[];
  currentAnswers: AnswerKey;
  preferences: QuizPreferences;
  fileName: string;
  course: string;
  showResults: boolean;
  showQuiz: boolean;
  isGeneratingQuiz: boolean;
  prioritizeWeakTopics: boolean;
  courses: Course[]; // Add courses property
  weakTopics: Record<string, { failCount: number; lastAttempt: string; status: string }>;
  uploadedFile: File | null;
}

const initialState: QuizState = {
  questions: [],
  currentAnswers: {},
  preferences: {
    questionTypes: { multipleChoice: true },
    typeCount: { multipleChoice: 10 },
  },
  fileName: '',
  course: '',
  showResults: false,
  showQuiz: false,
  isGeneratingQuiz: false,
  prioritizeWeakTopics: false,
  courses: [], // Initialize courses
  weakTopics: {},
  uploadedFile: null,
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setQuestions(state, action: PayloadAction<Question[]>) {
      state.questions = action.payload;
    },
    setCurrentAnswers(state, action: PayloadAction<AnswerKey>) {
      state.currentAnswers = action.payload;
    },
    setPreferences(state, action: PayloadAction<QuizPreferences>) {
      state.preferences = action.payload;
    },
    setFileName(state, action: PayloadAction<string>) {
      state.fileName = action.payload;
    },
    setCourse(state, action: PayloadAction<string>) {
      state.course = action.payload;
    },
    setShowResults(state, action: PayloadAction<boolean>) {
      state.showResults = action.payload;
    },
    setShowQuiz(state, action: PayloadAction<boolean>) {
      state.showQuiz = action.payload;
    },
    setIsGeneratingQuiz(state, action: PayloadAction<boolean>) {
      state.isGeneratingQuiz = action.payload;
    },
    setPrioritizeWeakTopics(state, action: PayloadAction<boolean>) {
      state.prioritizeWeakTopics = action.payload;
    },
    setCourses(state, action: PayloadAction<Course[]>) {
      state.courses = action.payload;
    },
    addCourse(state, action: PayloadAction<Course>) {
      state.courses.push(action.payload);
    },
    clearAllTopics(state) {
      state.weakTopics = {};
    },
    setUploadedFile(state, action: PayloadAction<File | null>) {
      state.uploadedFile = action.payload;
    },
  },
});

export const {
  setQuestions,
  setCurrentAnswers,
  setPreferences,
  setFileName,
  setCourse,
  setShowResults,
  setShowQuiz,
  setIsGeneratingQuiz,
  setPrioritizeWeakTopics,
  setCourses,
  addCourse,
  clearAllTopics,
  setUploadedFile,
} = quizSlice.actions;

export default quizSlice.reducer;
