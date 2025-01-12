import { Question, AnswerKey } from '../types/types';


export interface QuizAnalysis {
  weakTopics: string[];
  masteredTopics: string[];
  performance: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export const analyzeQuizResults = async (
  questions: Question[],
  userAnswers: AnswerKey
): Promise<QuizAnalysis> => {
  const topicPerformance: { [key: string]: { correct: number; total: number } } = {};
  const difficultyPerformance = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  };

  // Her soru için performans analizi
  questions.forEach((question) => {
    const isCorrect = userAnswers[question.id] === question.correctAnswer;
    const topic = question.topic || 'genel';
    const difficulty = question.difficulty || 'medium';

    // Konu bazlı performans
    if (!topicPerformance[topic]) {
      topicPerformance[topic] = { correct: 0, total: 0 };
    }
    topicPerformance[topic].total++;
    if (isCorrect) {
      topicPerformance[topic].correct++;
    }

    // Zorluk seviyesi bazlı performans
    difficultyPerformance[difficulty].total++;
    if (isCorrect) {
      difficultyPerformance[difficulty].correct++;
    }
  });

  // Zayıf ve güçlü konuları belirleme
  const weakTopics: string[] = [];
  const masteredTopics: string[] = [];
  Object.entries(topicPerformance).forEach(([topic, performance]) => {
    const percentage = (performance.correct / performance.total) * 100;
    if (percentage < 60) {
      weakTopics.push(topic);
    } else if (percentage >= 80) {
      masteredTopics.push(topic);
    }
  });

  // Zorluk seviyesi bazlı performans yüzdeleri
  const performance = {
    easy: (difficultyPerformance.easy.correct / (difficultyPerformance.easy.total || 1)) * 100,
    medium: (difficultyPerformance.medium.correct / (difficultyPerformance.medium.total || 1)) * 100,
    hard: (difficultyPerformance.hard.correct / (difficultyPerformance.hard.total || 1)) * 100,
  };

  return {
    weakTopics,
    masteredTopics,
    performance,
  };
};

// API çağrısı için yardımcı fonksiyon
export async function sendAnalysisToServer(analysisResult: QuizAnalysis): Promise<void> {
  try {
    const response = await fetch('http://localhost:5000/analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisResult),
    });

    if (!response.ok) {
     
      throw new Error('Analiz sonuçları kaydedilemedi');
    }

    const data = await response.json();
  
    console.log('Analiz sonuçları başarıyla kaydedildi:', data);
  } catch (error) {
 
    console.error('Analiz gönderimi sırasında hata:', error);
    throw error;
  }
}