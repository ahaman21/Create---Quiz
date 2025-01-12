import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store, { RootState, AppDispatch } from './store';
import { Question, AnswerKey } from './types/types';





import QuizFeatures from "./components/Quiz/QuizFeatures/QuizFeatures";
import QuizOutput from "./components/Quiz/QuizOutput/QuizOutput";
import Header from "./components/Header/Header";
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminRoute from './pages/Auth/AdminRoute';




import { useAuth } from './contexts/AuthContext';
import { useQuizTimer } from './contexts/QuizTimerContext';


// #region Bileşen İçe Aktarmaları (Yükleme ve Listeler)

import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import ExamList from './components/ExamList/ExamList';

// #endregion



import PreQuizAssessment from './components/PreQuizAssessment/PreQuizAssessment';
import LearningProgress from './components/LearningProgress/LearningProgress';



import { fileService } from './services/FileService';
import { preferencesService } from './services/PreferencesService';
import FirebaseService from './services/FirebaseService';
import { authService } from './services/AuthService';



import { DEFAULT_MULTIPLE_CHOICE_COUNT } from './constants/appConstants';



// #region Redux 

import {
  setQuestions,
  setCurrentAnswers,
  setPreferences,
  setFileName,
  setCourse,
  setShowResults,
  setShowQuiz,
  setIsGeneratingQuiz,
  setPrioritizeWeakTopics,
} from './store/quizSlice';
import { setCurrentUser, setLoading } from './store/userSlice';

// #endregion

// #region App Bileşeni Tanımı

const App: React.FC = () => {


  const dispatch = useDispatch<AppDispatch>();
  const { elapsedTime, getFormattedTime, startQuiz, stopQuiz } = useQuizTimer();
  const { currentUser } = useAuth();
  const {
    questions,
    currentAnswers,
    preferences,
    fileName,
    course,
    showResults,
    showQuiz,
    isGeneratingQuiz,
    prioritizeWeakTopics,
  } = useSelector((state: RootState) => state.quiz);



  // #region State 

  const [uploadedText, setUploadedText] = useState<string>("");
  const [showPreAssessment, setShowPreAssessment] = useState(false);
  const [refreshExamList, setRefreshExamList] = useState(0);
  const [quizResultsData, setQuizResultsData] = useState<{ questions: Question[], currentAnswers: AnswerKey } | null>(null);
  const [isSavingResults, setIsSavingResults] = useState(false);
  const [hasSavedResults, setHasSavedResults] = useState(false);

  // #endregion

  // #region Mevcut Kullanıcıyı Ayarlamak İçin useEffect

  useEffect(() => {
    if (currentUser) {
      const { uid, email, displayName } = currentUser;
      const serileştirilebilirKullanıcı = { uid, email, displayName };
      dispatch(setCurrentUser(serileştirilebilirKullanıcı)); // Sadece serileştirilebilir özellikleri sakla
      dispatch(setLoading(false));
    }
  }, [currentUser, dispatch]);

  // #endregion

  // #region Sınav Sonuçlarını Kaydetmek İçin useEffect

  useEffect(() => {
    if (currentUser && showResults && quizResultsData && !isSavingResults && !hasSavedResults) {
      setIsSavingResults(true);
      (async () => {
        try {
          const result = await FirebaseService.quiz.saveQuiz(
            course,
            quizResultsData.questions,
            quizResultsData.currentAnswers,
            fileName,
            elapsedTime,
            getFormattedTime(),
            currentUser.uid
          );
          if (result.success) {
            setRefreshExamList(prev => prev + 1);
            setHasSavedResults(true);
          } else {
            throw new Error(result.error || 'Sınav kaydedilirken bir hata oluştu');
          }
        } catch (error) {
          console.error('Sınav kaydetme hatası:', error);
        } finally {
          setIsSavingResults(false);
        }
      })();
    }
  }, [showResults, currentUser, quizResultsData, isSavingResults, course, fileName, elapsedTime, getFormattedTime, hasSavedResults]);

  // #endregion

  // #region handleCountChange Fonksiyonu

  // Kullanıcı tercihlerine göre soru sayılarındaki değişiklikleri yönetir
  const handleCountChange = (type: 'multipleChoice', value: number) => {
    const newPreferences = preferencesService.updateQuestionCount(preferences, type, value);
    dispatch(setPreferences(newPreferences));
    preferencesService.savePreferences(newPreferences);
  };

  // #endregion

  // #region handleFileUpload Fonksiyonu

  // Dosya yüklemeyi ve metin çıkarmayı yönetir
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      const result = await fileService.uploadFile(file);
      if (!result.success || !result.text) {
        return;
      }
      dispatch(setFileName(file.name));
      setUploadedText(result.text);
    } catch (error) {
    }
  };

  // #endregion

  // #region handleCreateExam Fonksiyonu

  // Yüklenen metin ve tercihlere göre yeni bir sınav oluşturur
  const handleCreateExam = async () => {
    if (!uploadedText) {
      return;
    }
    dispatch(setIsGeneratingQuiz(true));
    try {
      const newQuestions = await FirebaseService.quiz.createQuiz(
        uploadedText,
        {
          ...preferences,
          typeCount: {
            multipleChoice: preferences?.typeCount?.multipleChoice || DEFAULT_MULTIPLE_CHOICE_COUNT
          }
        },
        fileName,
        course,
        prioritizeWeakTopics // prioritizeWeakTopics bayrağını geçir
      );
      dispatch(setQuestions(newQuestions));
      dispatch(setShowQuiz(true));
      setShowPreAssessment(false);
      startQuiz();
    } catch (error) {
    } finally {
      dispatch(setIsGeneratingQuiz(false));
    }
  };

  // #endregion

  // #region handleAssessmentComplete Fonksiyonu

  // Ön Değerlendirme tamamlandığında çağrılacak fonksiyon
  const handleAssessmentComplete = (level: 'beginner' | 'intermediate' | 'advanced' | 'mixed') => {
    dispatch(setIsGeneratingQuiz(true)); // LoadingScreen'i göster
    FirebaseService.quiz.setUserLevel(level);
    handleCreateExam();
  };

  // #endregion

  // #region handleAnswerSubmit Fonksiyonu

  // Cevapları gönderir ve sonuçları işler
  const handleAnswerSubmit = (currentAnswers: AnswerKey, questions: Question[]) => {
    if (Object.keys(currentAnswers).length !== questions.length) {
      return;
    }
    stopQuiz();
    setQuizResultsData({ questions: questions, currentAnswers: currentAnswers });
    dispatch(setShowResults(true));
    dispatch(setShowQuiz(false));
    setHasSavedResults(false);
  };

  // #endregion

  // #region truncateFileName Fonksiyonu

  // Görüntülemek için uzun dosya adlarını kısaltır
  const truncateFileName = (fileName: string, maxLength: number = 20) => {
    if (fileName.length <= maxLength) return fileName;
    const extIndex = fileName.lastIndexOf('.');
    const ext = extIndex !== -1 ? fileName.slice(extIndex) : '';
    return fileName.slice(0, maxLength - ext.length) + '...' + ext;
  };

  // #endregion

  // #region handleCreateWeakTopicsQuiz Fonksiyonu

  // Sonuçlara göre bir tekrar sınavı oluşturur
  const handleCreateWeakTopicsQuiz = async () => {
    if (!currentUser || !course) return;

    try {
      const userProfile = await authService.getUserProfile(currentUser.uid);
      const weakTopics = userProfile?.weakTopics || {};

      if (Object.keys(weakTopics).length === 0) {
        alert('Henüz zayıf konu tespit edilmedi.');
        return;
      }

      // Zayıf konuları önceliklendir ve SADECE zayıf konulardan soru oluştur
      dispatch(setPrioritizeWeakTopics(true));
      setShowPreAssessment(true);

      // preferences'ı güncelle - sadece zayıf konulardan soru üret
      dispatch(setPreferences({
        ...preferences,
        onlyWeakTopics: true, // Yeni bayrak ekle
        weakTopicsList: Object.keys(weakTopics) // Zayıf konuların listesini ekle
      }));
    } catch (error) {
      console.error('Zayıf konular alınırken hata:', error);
      alert('Zayıf konular alınırken bir hata oluştu.');
    }
  };

  // #endregion

  // #region JSX Yapısı

  return (
    <Provider store={store}>
      <div className="app">
        <Header />
        {isGeneratingQuiz && <LoadingScreen />}

        {showPreAssessment && (
          <div className="pre-assessment-overlay">
            <PreQuizAssessment
              onAssessmentComplete={handleAssessmentComplete}
              setIsGeneratingQuiz={(value) => dispatch(setIsGeneratingQuiz(value))}
            />
          </div>
        )}

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="/learning-progress" element={<LearningProgress />} />
          <Route
            path="/"
            element={
              <div className="main-content">
                <div className="quiz-setup">
                  <div className="file-upload-section">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".txt,.doc,.docx,.pdf"
                      className="file-input"
                    />
                    {fileName && (
                      <p className="file-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {truncateFileName(fileName)}
                      </p>
                    )}
                  </div>
                  <QuizFeatures
                    preferences={preferences}
                    onCountChange={handleCountChange}
                    onCourseSelect={(courseId) => dispatch(setCourse(courseId))}
                    onWeakTopicsChange={(value) => dispatch(setPrioritizeWeakTopics(value))}
                    onCreateQuiz={handleCreateExam}
                    onShowPreAssessment={() => setShowPreAssessment(true)} // Yeni prop ekleniyor
                    isGeneratingQuiz={isGeneratingQuiz}
                    hasUploadedText={!!uploadedText}
                    course={course}
                    onCreateWeakTopicsQuiz={handleCreateWeakTopicsQuiz}
                  />
                </div>
                <ExamList key={refreshExamList} />
              </div>
            }
          />
        </Routes>
        {showQuiz && (
          <QuizOutput
            questions={questions}
            currentAnswers={currentAnswers}
            onAnswerSelect={(id, answer) =>
              dispatch(setCurrentAnswers({ ...currentAnswers, [id]: answer }))
            }
            onClose={() => dispatch(setShowQuiz(false))}
            onShowResults={handleAnswerSubmit}
            showResults={showResults}
          />
        )}

      </div>
    </Provider>
  );

  // #endregion
};

// #endregion

export default App;
