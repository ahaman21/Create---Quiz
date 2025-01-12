import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { ExamSettings } from '../../types/types';

const AdminDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showExamSettings, setShowExamSettings] = useState(false);
  const [examSettings, setExamSettings] = useState<ExamSettings>({
    optionCount: 4,
    questionTypes: {
      multipleChoice: true,
      
    },
    questionCounts: {
      multipleChoice: 5,
     
    }
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  const handleOptionCountChange = (value: number) => {
    if (value >= 2 && value <= 6) {
      setExamSettings(prev => ({
        ...prev,
        optionCount: value
      }));
      
      // Preferences'ı localStorage'a kaydet
      const preferences = {
        questionTypes: examSettings.questionTypes,
        difficultyLevels: {
          easy: true,
          medium: true,
          hard: false,
        },
        typeCount: {
          multipleChoice: examSettings.questionCounts.multipleChoice,
         
        },
        optionCount: value
      };
      localStorage.setItem('quizPreferences', JSON.stringify(preferences));
    }
  };

  const handleQuestionTypeChange = (type: 'multipleChoice' | 'trueFalse', checked: boolean) => {
    setExamSettings(prev => ({
      ...prev,
      questionTypes: {
        ...prev.questionTypes,
        [type]: checked
      }
    }));
  };

  const handleQuestionCountChange = (type: 'multipleChoice' | 'trueFalse', value: number) => {
    if (value >= 0 && value <= 20) {
      setExamSettings(prev => ({
        ...prev,
        questionCounts: {
          ...prev.questionCounts,
          [type]: value
        }
      }));
    }
  };

  const handleSaveSettings = async () => {
    try {
        setIsLoading(true);

        const preferences = {
            questionTypes: examSettings.questionTypes,
            difficultyLevels: {
                easy: true,
                medium: true,
                hard: false,
            },
            typeCount: {
                multipleChoice: examSettings.questionCounts.multipleChoice,
            },
            optionCount: examSettings.optionCount
        };

         // await FirebaseService.updateExamSettings(preferences); // Firebase servisini kullan
        localStorage.setItem('quizPreferences', JSON.stringify(preferences));
       

        setShowExamSettings(false);
    } catch (error) {
       
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav">
        <div className="nav-container">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="nav-title">Admin Paneli</h1>
            </div>
            <div className="flex items-center">
              <span className="user-email">{currentUser?.email}</span>
              <button
                onClick={handleLogout}
                className="logout-btn"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="cards-grid">
          {/* Sınav Yönetimi Kartı */}
          <div className="dashboard-card">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="card-title">Sınav Yönetimi</h3>
              <p className="card-description">
                Sınavları oluştur, düzenle ve yönet
              </p>
              <div className="card-actions">
                <button
                  onClick={() => setShowExamSettings(true)}
                  className="card-button"
                >
                  Sınav Ayarları
                </button>
                <button
                  onClick={() => navigate('/admin/exams')}
                  className="card-button"
                >
                  Sınavları Yönet
                </button>
              </div>
            </div>
          </div>

          {/* Kullanıcı Yönetimi Kartı */}
          <div className="dashboard-card">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="card-title">Kullanıcı Yönetimi</h3>
              <p className="card-description">
                Kullanıcıları görüntüle ve yönet
              </p>
              <button
                onClick={() => navigate('/admin/users')}
                className="card-button"
              >
                Kullanıcıları Yönet
              </button>
            </div>
          </div>

          {/* Raporlar Kartı */}
          <div className="dashboard-card">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="card-title">Raporlar</h3>
              <p className="card-description">
                Sınav ve kullanıcı istatistiklerini görüntüle
              </p>
              <button
                onClick={() => navigate('/admin/reports')}
                className="card-button"
              >
                Raporları Görüntüle
              </button>
            </div>
          </div>
        </div>

        {/* Sınav Ayarları Modal */}
        {showExamSettings && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-title">Sınav Ayarları</h2>
              
              <div className="settings-section">
                <label className="setting-label">
                  Seçenek Sayısı (2-6):
                  <input
                    type="number"
                    min="2"
                    max="6"
                    value={examSettings.optionCount}
                    onChange={(e) => handleOptionCountChange(parseInt(e.target.value))}
                    className="setting-input"
                  />
                </label>
              </div>

              <div className="settings-section">
                <h3 className="section-title">Soru Tipleri</h3>
                
                <div className="question-type">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={examSettings.questionTypes.multipleChoice}
                      onChange={(e) => handleQuestionTypeChange('multipleChoice', e.target.checked)}
                    />
                    Çoktan Seçmeli
                  </label>
                  {examSettings.questionTypes.multipleChoice && (
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={examSettings.questionCounts.multipleChoice}
                      onChange={(e) => handleQuestionCountChange('multipleChoice', parseInt(e.target.value))}
                      className="count-input"
                    />
                  )}
                </div>

               
              </div>

              <div className="modal-actions">
                <button onClick={handleSaveSettings} className="save-button" disabled={isLoading}>
                 {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button onClick={() => setShowExamSettings(false)} className="cancel-button">
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;