import React from 'react';
import { AnalysisResult } from '../../../types/types';
import './QuizAnalysis.css';

interface QuizAnalysisProps {
  analysisResult: AnalysisResult | null;
}

const QuizAnalysis: React.FC<QuizAnalysisProps> = ({ analysisResult }) => {
  if (!analysisResult) return null;

  return (
    <div className="quiz-analysis">
      <h2>Quiz Analizi</h2>
      
      <div className="analysis-section">
        <h3>Başarılı Konular</h3>
        <ul>
          {analysisResult.masteredTopics.map((topic, index) => (
            <li key={index}>{topic}</li>
          ))}
        </ul>
      </div>

      <div className="analysis-section">
        <h3>Geliştirilmesi Gereken Konular</h3>
        <ul>
          {analysisResult.weakTopics.map((topic, index) => (
            <li key={index}>{topic}</li>
          ))}
        </ul>
      </div>

      <div className="analysis-section">
        <h3>Konu Bazlı Performans</h3>
        {Object.entries(analysisResult.topicPerformance).map(([topic, stats]) => (
          <div key={topic} className="topic-performance">
            <h4>{topic}</h4>
            <p>Doğru: {stats.correct}/{stats.total} ({stats.percentage.toFixed(1)}%)</p>
          </div>
        ))}
      </div>

      <div className="analysis-section">
        <h3>Zorluk Seviyesine Göre Performans</h3>
        <p>Kolay: {analysisResult.performanceByDifficulty.easy.toFixed(1)}%</p>
        <p>Orta: {analysisResult.performanceByDifficulty.medium.toFixed(1)}%</p>
        <p>Zor: {analysisResult.performanceByDifficulty.hard.toFixed(1)}%</p>
      </div>

      <div className="analysis-section">
        <h3>Öneriler</h3>
        <ul>
          {analysisResult.recommendations.map((recommendation, index) => (
            <li key={index}>{recommendation}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default QuizAnalysis;
