import { Question, QuizPreferences, AnswerKey, QuizData, FirestoreQuizData, AnalysisResult, PerformanceByDifficulty, WeakTopic } from '../types/types';
import { generateQuestions } from './GeminiService';
import { DEFAULT_TOPICS } from '../constants/appConstants';
import { saveQuizToFirestore } from '../utils/firebaseHelpers'; // Ensure this import is correct
import { authService } from '../services/AuthService';
import { collection, doc, getDocs, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Define the structure of weakTopics
type WeakTopicsType = Record<string, WeakTopic>;

class QuizOpsService {
  private userLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed' = 'beginner';
  private readonly defaultTopics = DEFAULT_TOPICS;

  public async createQuiz(
    text: string,
    preferences: QuizPreferences,
    fileName: string = 'document.pdf',
    courseId?: string,
    prioritizeWeakTopics: boolean = false // Add this parameter
  ): Promise<Question[]> {
    try {
      if (!text || text.length < 10) {
        throw new Error('Metin çok kısa');
      }

      // Get user's weak and strong topics
      let weakTopics: WeakTopicsType = {};
      let strongTopics: string[] = [];
      
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const userProfile = await authService.getUserProfile(currentUser.uid);
        if (userProfile) {
          weakTopics = userProfile.weakTopics || {};
          strongTopics = userProfile.strongTopics || [];
        }
      }

      // Select top 5 weak topics based on failCount
      const topWeakTopics = Object.entries(weakTopics)
        .sort((a, b) => b[1].failCount - a[1].failCount)
        .slice(0, 5)
        .map(entry => entry[0]);

      const questions = await generateQuestions(
        text,
        preferences,
        fileName,
        this.userLevel as 'beginner' | 'intermediate' | 'advanced', // Type assertion here
        topWeakTopics.reduce((acc, topic) => {
          acc[topic] = weakTopics[topic].failCount;
          return acc;
        }, {} as Record<string, number>),
        strongTopics, // Başarılı konuları da gönder
        prioritizeWeakTopics // Pass the prioritizeWeakTopics flag
      );

      if (!questions || questions.length === 0) {
        throw new Error('Sorular oluşturulamadı');
      }

      return questions;
    } catch (error) {
      console.error('Error in createQuiz:', error);
      throw error;
    }
  }

  public setUserLevel(level: 'beginner' | 'intermediate' | 'advanced' | 'mixed'): void {
    this.userLevel = level;
  }

  public calculateScore(questions: Question[], answers: AnswerKey): number {
    let correctCount = 0;
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      if (question && question.correctAnswer === answer) {
        correctCount++;
      }
    });
    return (correctCount / questions.length) * 100;
  }

  public assessUserLevel(score: number): 'beginner' | 'intermediate' | 'advanced' {
    if (score < 50) return 'beginner';
    if (score < 70) return 'intermediate';
    return 'advanced';
  }

  private calculateAnalysisResult(questions: Question[], answers: AnswerKey): AnalysisResult {
    const topicPerformance: { [key: string]: { correct: number; total: number; percentage: number } } = {};
    const difficultyPerformance: { [key: string]: { correct: number; total: number } } = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    };

    questions.forEach((question, index) => {
      const questionId = question.id || index.toString();
      const isCorrect = answers[questionId] === question.correctAnswer;

      if (!topicPerformance[question.topic]) {
        topicPerformance[question.topic] = { correct: 0, total: 0, percentage: 0 };
      }
      topicPerformance[question.topic].total++;
      if (isCorrect) topicPerformance[question.topic].correct++;

      difficultyPerformance[question.difficulty].total++;
      if (isCorrect) difficultyPerformance[question.difficulty].correct++;
    });

    Object.keys(topicPerformance).forEach(topic => {
      const performance = topicPerformance[topic];
      performance.percentage = (performance.correct / performance.total) * 100;
    });

    const weakTopics: string[] = [];
    const masteredTopics: string[] = [];
    const recommendations: string[] = [];

    Object.entries(topicPerformance).forEach(([topic, performance]) => {
      if (performance.percentage < 60) {
        weakTopics.push(topic);
        recommendations.push(`${topic} konusunu tekrar çalışmanızı öneririz.`);
      } else if (performance.percentage >= 80) {
        masteredTopics.push(topic);
      }
    });

    const performanceByDifficulty: PerformanceByDifficulty = {
      easy: (difficultyPerformance.easy.correct / (difficultyPerformance.easy.total || 1)) * 100,
      medium: (difficultyPerformance.medium.correct / (difficultyPerformance.medium.total || 1)) * 100,
      hard: (difficultyPerformance.hard.correct / (difficultyPerformance.hard.total || 1)) * 100
    };

    const totalCorrect = Object.values(topicPerformance).reduce((sum, perf) => sum + perf.correct, 0);
    const totalQuestions = Object.values(topicPerformance).reduce((sum, perf) => sum + perf.total, 0);
    const overallPerformance = (totalCorrect / totalQuestions) * 100;
    const confidenceScore = (performanceByDifficulty.hard + overallPerformance) / 2;

    return {
      masteredTopics,
      weakTopics,
      learnedTopics: masteredTopics,
      gapTopics: weakTopics,
      overallPerformance,
      confidenceScore,
      recommendations,
      topicPerformance,
      recommendedFocus: weakTopics,
      performanceByDifficulty
    };
  }

  async saveQuiz(
    selectedCourse: string,
    questions: Question[],
    userAnswers: AnswerKey,
    fileName: string,
    elapsedTime: number,
    formattedTime: string,
    userId: string,
  ) {
    try {
      let correctAnswers = 0;
      questions.forEach(question => {
        if (userAnswers[question.id] === question.correctAnswer) {
          correctAnswers++;
        }
      });

      const successRate = (correctAnswers / questions.length) * 100;
      const userLevel = this.assessUserLevel(successRate);
      const analysisResult = this.calculateAnalysisResult(questions, userAnswers);

      const quizData: FirestoreQuizData = {
        questions,
        userAnswers,
        preferences: {
          questionTypes: { multipleChoice: true },
          typeCount: { multipleChoice: questions.length }
        },
        fileName,
        userId,
        timestamp: new Date().toISOString(),
        score: Math.round(successRate),
        elapsedTime,
        formattedTime,
        userLevel,
        courseId: selectedCourse,
        analysisResult
      };

      const quizId = await saveQuizToFirestore(quizData);

      // Convert weakTopics array to the correct format
      const weakTopics = analysisResult.weakTopics.reduce((acc, topic) => {
        acc[topic] = { failCount: 1, lastAttempt: new Date().toISOString(), status: 'active' };
        return acc;
      }, {} as Record<string, WeakTopic>);

      await authService.updateUserWeakTopics(userId, weakTopics);
      await authService.updateUserAnalysisResult(userId, analysisResult);

      return {
        success: true,
        data: { ...quizData, id: quizId }
      };
    } catch (error) {
      console.error('Error saving quiz:', error);
      return {
        success: false,
        error: 'Quiz kaydedilirken bir hata oluştu'
      };
    }
  }

  async getQuiz(quizId: string): Promise<QuizData & { id: string } | null> {
    try {
      const quizRef = doc(db, 'quizzes', quizId);
      const quizSnap = await getDoc(quizRef);

      if (quizSnap.exists()) {
        const data = quizSnap.data();
        const defaultPreferences = {
          questionTypes: {
            multipleChoice: true
          },
          typeCount: {
            multipleChoice: 10
          }
        };
        let timestamp: string;
        if (data.timestamp?.toDate) {
          timestamp = data.timestamp.toDate().toISOString();
        } else if (typeof data.timestamp === 'string') {
          timestamp = data.timestamp;
        } else {
          timestamp = new Date().toISOString();
        }
        const quiz: QuizData & { id: string } = {
          id: quizSnap.id,
          questions: data.questions || [],
          userAnswers: data.userAnswers || {},
          preferences: data.preferences || defaultPreferences,
          fileName: data.fileName || 'İsimsiz Quiz',
          results: data.results || null,
          timestamp: timestamp,
          userId: data.userId,
          formattedTime: data.formattedTime,
          course: data.courseId || 'Genel',
          score: data.score,
          elapsedTime: data.elapsedTime,
          userLevel: data.userLevel
        };
        return quiz;
      }
      return null;
    } catch (error) {
      console.error('getQuiz hatası:', error);
      throw error;
    }
  }

  async getAllQuizzes(): Promise<(QuizData & { id: string })[]> {
    try {
      const quizzesRef = collection(db, 'quizzes');
      const quizzesSnap = await getDocs(quizzesRef);

      const defaultPreferences = {
        questionTypes: {
          multipleChoice: true
        },
        typeCount: {
          multipleChoice: 10
        }
      };

      const quizzes = quizzesSnap.docs.map(doc => {
        const data = doc.data();
        let timestamp: string;
        if (data.timestamp?.toDate) {
          timestamp = data.timestamp.toDate().toISOString();
        } else if (typeof data.timestamp === 'string') {
          timestamp = data.timestamp;
        } else {
          timestamp = new Date().toISOString();
        }
        const quiz: QuizData & { id: string } = {
          id: doc.id,
          questions: data.questions || [],
          userAnswers: data.userAnswers || {},
          preferences: data.preferences || defaultPreferences,
          fileName: data.fileName || 'İsimisiz Quiz',
          results: data.results || null,
          timestamp: timestamp,
          userId: data.userId,
          formattedTime: data.formattedTime,
          course: data.courseId || 'Genel',
          score: data.score,
          elapsedTime: data.elapsedTime,
          userLevel: data.userLevel
        };
        return quiz;
      });
      return quizzes;
    } catch (error) {
      console.error('getAllQuizzes hatası:', error);
      throw error;
    }
  }

  async updateQuiz(quizId: string, data: any): Promise<void> {
    const quizRef = doc(db, 'quizzes', quizId);
    await updateDoc(quizRef, data);
  }

  async deleteQuiz(quizId: string): Promise<void> {
    const quizRef = doc(db, 'quizzes', quizId);
    await deleteDoc(quizRef);
  }

}

export const quizOpsService = new QuizOpsService();
