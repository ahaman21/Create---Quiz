import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { QuizPreferences, Course, QuizData } from '../../../types/types'; // Add QuizData import
import { setCourses, addCourse } from '../../../store/quizSlice';
import { courseService } from '../../../services/CourseService';
import FirebaseService from '../../../services/FirebaseService'; // Add this import
import { useAuth } from '../../../contexts/AuthContext';
import './QuizFeatures.css';

interface QuizFeaturesProps {
  preferences: QuizPreferences;
  onCountChange: (type: 'multipleChoice', value: number) => void;
  onCourseSelect: (courseId: string) => void;
  onWeakTopicsChange: (value: boolean) => void;
  onCreateQuiz: () => void;
  onShowPreAssessment: () => void; // Yeni prop ekliyoruz
  onCreateWeakTopicsQuiz: () => void; // Yeni prop ekliyoruz
  isGeneratingQuiz: boolean;
  hasUploadedText: boolean;
  course: string;
}

const QuizFeatures: React.FC<QuizFeaturesProps> = ({
  preferences,
  onCountChange,
  onCourseSelect,
  onWeakTopicsChange,
  onCreateQuiz,
  onShowPreAssessment,
  onCreateWeakTopicsQuiz,
  isGeneratingQuiz,
  hasUploadedText,
  course,
}) => {
  const { currentUser } = useAuth();
  const courses = useSelector((state: RootState) => state.quiz.courses) as Course[];
  const dispatch = useDispatch();
  const [newCourseName, setNewCourseName] = useState('');
  const [courseHasPreviousExams, setCourseHasPreviousExams] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'personalized'>('quick');

  useEffect(() => {
    const fetchCourses = async () => {
      if (currentUser) {
        const userCourses = await courseService.getUserCourses(currentUser.uid);
        dispatch(setCourses(userCourses));
      }
    };
    fetchCourses();
  }, [currentUser, dispatch]);

  useEffect(() => {
    const checkCourseExams = async () => {
      if (currentUser && course) {
        try {
          const quizzes = await FirebaseService.getAllQuizzes();
          const hasExams = quizzes.some((quiz: QuizData) => quiz.course === course);
          setCourseHasPreviousExams(hasExams);
          
          if (!hasExams) {
            onWeakTopicsChange(false);
          }
        } catch (error) {
          console.error('Ders sınavları kontrol edilirken hata:', error);
          setCourseHasPreviousExams(false);
        }
      }
    };

    checkCourseExams();
  }, [currentUser, course, onWeakTopicsChange]);

  
  const handleCourseSelect = (courseId: string) => {
    onCourseSelect(courseId);
  };

  const handleWeakTopicsChange = (value: boolean) => {
    onWeakTopicsChange(value);
  };

  const handleAddCourse = async () => {
    try {
      if (!currentUser) {
        throw new Error('Kullanıcı girişi gerekli');
      }
      if (!newCourseName.trim()) return;

      const newCourse = await courseService.addCourse(newCourseName, currentUser.uid);
      dispatch(addCourse(newCourse));
      
      onCourseSelect(newCourse.id);
      
      setNewCourseName('');
    } catch (error) {
      console.error('Kurs eklenirken hata:', error);
    }
  };

  return (
    <div className="quiz-features">
      <div className="quiz-features-tabs">
        <button 
          className={`tab-button ${activeTab === 'quick' ? 'active' : ''}`}
          onClick={() => setActiveTab('quick')}
        >
          Hızlı Sınav Oluştur
        </button>
        <button 
          className={`tab-button ${activeTab === 'personalized' ? 'active' : ''}`}
          onClick={() => setActiveTab('personalized')}
        >
          Kişiselleştirilmiş Sınav
        </button>
      </div>

      {activeTab === 'quick' ? (
        // Hızlı Sınav Seçenekleri
        <>
          <div className="feature">
            <label htmlFor="courseSelect" className="feature-label">
              Ders Seçin
            </label>
            <select 
              id="courseSelect" 
              onChange={(e) => handleCourseSelect(e.target.value)}
              value={course || ""} 
              aria-label="Ders seçimi"
            >
              <option value="">Ders Seçin</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="feature-group">
            <label className="feature-label">
              Soru Sayısı: {preferences.typeCount.multipleChoice}
            </label>
            <div className="range-slider">
              <input
                type="range"
                min={3}
                max={15}
                step={1}
                value={preferences.typeCount.multipleChoice}
                onChange={(e) => onCountChange('multipleChoice', parseInt(e.target.value))}
                className="range-input"
              />
              <div className="range-marks">
                {[3, 6, 9, 12, 15].map(num => (
                  <span key={num} className="mark">{num}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="feature">
            <button
              onClick={onShowPreAssessment}
              className="create-quiz-button"
              disabled={!hasUploadedText || isGeneratingQuiz || !course}
              title={!hasUploadedText ? 'Lütfen önce bir dosya yükleyin' : !course ? 'Lütfen bir ders seçin' : ''}
            >
              {isGeneratingQuiz ? 'Sınav Oluşturuluyor...' : 'Sınav Oluştur'}
            </button>
          </div>

          <div className="feature add-course">
            <label htmlFor="newCourseName" className="feature-label">
              Yeni Ders Ekle
            </label>
            <div className="add-course-input-group">
              <input
                type="text"
                id="newCourseName"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Ders adı girin"
                aria-label="Yeni ders adı"
              />
              <button
                className="add-course-button"
                onClick={handleAddCourse}
                disabled={!newCourseName.trim()}
                aria-label="Yeni ders ekle"
              >
                Ekle
              </button>
            </div>
          </div>
        </>
      ) : (
        // Kişiselleştirilmiş Sınav Seçenekleri
        <>
          <div className="feature">
            <label htmlFor="courseSelect" className="feature-label">
              Ders Seçin
            </label>
            <select 
              id="courseSelect" 
              onChange={(e) => handleCourseSelect(e.target.value)}
              value={course || ""} 
            >
              <option value="">Ders Seçin</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="feature">
            <label className={`feature-label ${!courseHasPreviousExams ? 'disabled' : ''}`} htmlFor="prioritizeWeakTopics">
              <div className="label-with-checkbox">
                <span>Zayıf Konuları Önceliklendir</span>
                <input
                  type="checkbox"
                  id="prioritizeWeakTopics"
                  checked={preferences.prioritizeWeakTopics && courseHasPreviousExams}
                  onChange={(e) => handleWeakTopicsChange(e.target.checked)}
                  disabled={!courseHasPreviousExams}
                />
              </div>
              
            </label>
          </div>

          <div className="feature-group">
            <label className="feature-label">
              Soru Sayısı: {preferences.typeCount.multipleChoice}
            </label>
            <div className="range-slider">
              <input
                type="range"
                min={3}
                max={15}
                step={1}
                value={preferences.typeCount.multipleChoice}
                onChange={(e) => onCountChange('multipleChoice', parseInt(e.target.value))}
                className="range-input"
              />
              <div className="range-marks">
                {[3, 6, 9, 12, 15].map(num => (
                  <span key={num} className="mark">{num}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="feature">
            <button
              onClick={onCreateQuiz}
              className="create-quiz-button"
              disabled={!hasUploadedText || isGeneratingQuiz || !course}
              title={!hasUploadedText ? 'Lütfen önce bir dosya yükleyin' : !course ? 'Lütfen bir ders seçin' : ''}
            >
              {isGeneratingQuiz ? 'Sınav Oluşturuluyor...' : 'Sınav Oluştur'}
            </button>
          </div>

          <div className="featurea">
            <button
              onClick={onCreateWeakTopicsQuiz}
              className="create-quiz-button weak-topics"
              disabled={!courseHasPreviousExams || isGeneratingQuiz}
              title={!courseHasPreviousExams ? 'Bu ders için henüz zayıf konu tespit edilmedi' : ''}
            >
              Eksik Konulardan Sınav Oluştur
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default QuizFeatures;