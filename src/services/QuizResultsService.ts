import { Question, AnswerKey, AnalysisResult } from '../types/types';

export class QuizResultsService {
  public calculateResults(questions: Question[], userAnswers: AnswerKey) {
    let correct = 0;
    const topicPerformance: Record<string, { correct: number; total: number }> = {};

    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correct++;
      }

      if (!topicPerformance[q.topic]) {
        topicPerformance[q.topic] = { correct: 0, total: 0 };
      }
      topicPerformance[q.topic].total++;
      if (userAnswers[q.id] === q.correctAnswer) {
        topicPerformance[q.topic].correct++;
      }
    });

    const weakTopics: string[] = [];
    const strongTopics: string[] = [];
    const recommendations: string[] = [];

    Object.entries(topicPerformance).forEach(([topic, performance]) => {
      const percentage = (performance.correct / performance.total) * 100;
      if (percentage < 60) {
        weakTopics.push(topic);
        recommendations.push(`${topic} konusunu tekrar çalışmanızı öneririz.`);
      } else if (percentage >= 80) {
        strongTopics.push(topic);
      }
    });

    const analysisResult: AnalysisResult = {
      masteredTopics: strongTopics,
      weakTopics,
      learnedTopics: strongTopics,
      gapTopics: weakTopics,
      overallPerformance: (correct / questions.length) * 100,
      confidenceScore: (correct / questions.length) * 100,
      recommendations,
      topicPerformance: Object.fromEntries(
        Object.entries(topicPerformance).map(([topic, performance]) => [
          topic,
          {
            correct: performance.correct,
            total: performance.total,
            percentage: (performance.correct / performance.total) * 100,
          },
        ])
      ),
      recommendedFocus: weakTopics,
      performanceByDifficulty: {
        easy: 0,
        medium: 0,
        hard: 0,
      },
    };

    return {
      correct,
      total: questions.length,
      wrong: questions.length - correct,
      percentage: ((correct / questions.length) * 100).toFixed(2),
      analysisResult,
    };
  }
}

export const quizResultsService = new QuizResultsService();
