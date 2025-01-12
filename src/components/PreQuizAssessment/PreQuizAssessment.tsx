import React, { useState } from 'react';
import './PreQuizAssessment.css';

interface PreQuizAssessmentProps {
  onAssessmentComplete: (level: 'beginner' | 'intermediate' | 'advanced' | 'mixed') => void;
  setIsGeneratingQuiz: (value: boolean) => void; // Yeni prop ekliyoruz
}

const PreQuizAssessment: React.FC<PreQuizAssessmentProps> = ({ 
  onAssessmentComplete, 
  setIsGeneratingQuiz 
}) => {
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'mixed'>('beginner');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAssessmentSubmit = () => {
    setIsSubmitting(true); // Önce submitting state'ini true yap
    setIsGeneratingQuiz(true); // Loading screen'i göster
    onAssessmentComplete(selectedLevel); // Seviye seçimini tamamla
  };

  // Eğer submitting true ise boş bir div döndür
  if (isSubmitting) {
    return <div></div>;
  }

  return (
    <div className="pre-quiz-assessment">
      <h2>Bilgi Seviyesi Seçimi</h2>
      
     
      <div className="level-selection">
        <h3>Bilgi Seviyeniz</h3>
        <div className="level-buttons">
          <button
            className={selectedLevel === 'mixed' ? 'active mixed' : 'mixed'}
            onClick={() => setSelectedLevel('mixed')}
          >
            Karışık Zorluk
            <span className="level-description">Kolay, orta ve zor soruları karışık olarak getir</span>
          </button>
          <button
            className={selectedLevel === 'beginner' ? 'active' : ''}
            onClick={() => setSelectedLevel('beginner')}
          >
            Başlangıç
            <span className="level-description">Konuya yeni başladım veya temel bilgilerim var</span>
          </button>
          <button
            className={selectedLevel === 'intermediate' ? 'active' : ''}
            onClick={() => setSelectedLevel('intermediate')}
          >
            Orta
            <span className="level-description">Konuyu biliyorum ama daha öğrenecek çok şey var</span>
          </button>
          <button
            className={selectedLevel === 'advanced' ? 'active' : ''}
            onClick={() => setSelectedLevel('advanced')}
          >
            İleri
            <span className="level-description">Konuya hakimim ve detaylı bilgiye sahibim</span>
          </button>
        </div>
      </div>

      <div className="navigation-buttons">
        
        <button 
          className="submit-button" 
          onClick={handleAssessmentSubmit}
        >
          Sınava Başla
        </button>
      </div>
    </div>
  );
};

export default PreQuizAssessment;
