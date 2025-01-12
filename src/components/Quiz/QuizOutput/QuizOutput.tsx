import React, { useEffect, useState } from 'react';
import './QuizOutput.css';
import { Question, AnswerKey } from '../../../types/types';
import { useQuizTimer } from '../../../contexts/QuizTimerContext';
import { useAuth } from '../../../contexts/AuthContext';
import { authService } from '../../../services/AuthService';

interface QuizOutputProps {
  questions: Question[];
  currentAnswers: { [key: string]: string };
  onAnswerSelect: (questionId: string, answer: string) => void;
  onClose: () => void;
  onShowResults: (currentAnswers: AnswerKey, questions: Question[]) => void;
  showResults: boolean;
}

const QuizOutput: React.FC<QuizOutputProps> = ({
  questions,
  currentAnswers,
  onAnswerSelect,
  onClose,
  onShowResults,
  showResults,
}) => {
  const { getFormattedTime, stopQuiz } = useQuizTimer(); // stopQuiz fonksiyonunu ekleyelim
  const { currentUser } = useAuth();
  const [weakTopics, setWeakTopics] = useState<string[]>([]);

  useEffect(() => {
    const fetchWeakTopics = async () => {
      if (currentUser) {
        const userProfile = await authService.getUserProfile(currentUser.uid);
        if (userProfile && userProfile.weakTopics) {
          setWeakTopics(Object.keys(userProfile.weakTopics));
        }
      }
    };

    fetchWeakTopics();
  }, [currentUser]);

  if (!questions || questions.length === 0) {
    return null;
  }

  const handleSubmit = () => {
    if (Object.keys(currentAnswers).length !== questions.length) {
      return;
    }
    onShowResults(currentAnswers, questions);
  }

  const handleClose = () => {
    stopQuiz(); // Zamanlayıcıyı durdur
    onClose();
  }

  const isWeakTopic = (topic: string) => weakTopics.includes(topic);

  return (
    <div className="quiz-output-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="quiz-container">
        <button className="close-button" onClick={handleClose}>×</button>
        
        <div className="timer-display">
          <span className="timer-icon">⏱</span>
          {getFormattedTime()}
        </div>

        <div className="questions-section">
          {questions.map((q) => (
            <div 
              key={q.id} 
              className={`question-box ${isWeakTopic(q.topic) ? 'weak-topic' : ''}`}
            >
              <div className="question-header">
                <div className={`difficulty-indicator difficulty-${q.difficulty || 'medium'}`}>
                  {q.difficulty === 'easy' ? 'kolay' : 
                   q.difficulty === 'hard' ? 'zor' : 'orta'}
                </div>
                <div className="question-title">
                  <h3>Soru {q.id}</h3>
                  {isWeakTopic(q.topic) && (
                    <span className="weak-topic-badge" title="Zayıf konu">
                      ⚠️
                    </span>
                  )}
                </div>
                <p className="question-text">{q.question}</p>
              </div>
              <div className="options">
                {q.options.map((option) => (
                  <label key={option} className="option-label">
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={option}
                      checked={currentAnswers[q.id] === option}
                      onChange={() => onAnswerSelect(q.id, option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={Object.keys(currentAnswers).length !== questions.length}
          >
            Sınavı Bitir
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizOutput;