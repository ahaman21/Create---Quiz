import React, { createContext, useContext, useState, useEffect } from 'react';
import { QuizTimerContextType } from '../types/types';

const QuizTimerContext = createContext<QuizTimerContextType | undefined>(undefined);

export const QuizTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isQuizActive) {
      timer = setInterval(() => {
        setElapsedTime(prevTime => {
          const newTime = Number(prevTime) + 1;
          return isNaN(newTime) ? 0 : newTime;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isQuizActive]);

  const startQuiz = () => {
    setElapsedTime(0);
    setIsQuizActive(true);
  };

  const stopQuiz = () => {
    setIsQuizActive(false);
  };

  const resetQuiz = () => {
    setElapsedTime(0);
    setIsQuizActive(false);
  };

  const getFormattedTime = () => {
    const totalSeconds = Number(elapsedTime) || 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <QuizTimerContext.Provider value={{ 
      isQuizActive, 
      elapsedTime: Number(elapsedTime) || 0, 
      startQuiz, 
      stopQuiz, 
      resetQuiz, 
      getFormattedTime 
    }}>
      {children}
    </QuizTimerContext.Provider>
  );
};

export const useQuizTimer = () => {
  const context = useContext(QuizTimerContext);
  if (!context) {
    throw new Error('useQuizTimer bir QuizTimerProvider içinde kullanılmalıdır');
  }
  return context;
};
