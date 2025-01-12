import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import QuizResults from '../QuizResults/QuizResults';
import './ExamList.css';
import { QuizData, Question } from '../../types/types';
import FirebaseService from '../../services/FirebaseService';

interface ExamListItem {
    id: string;
    createdAt: Date;
    successRate: number;
    name: string;
    questions: Question[] | undefined;
    course: string | undefined;
}

const ExamList: React.FC = () => {
    const [exams, setExams] = useState<ExamListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuiz, setSelectedQuiz] = useState<QuizData | null>(null);
    const [selectedExam, setSelectedExam] = useState<string | null>(null);
    const { currentUser } = useAuth();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [courseNames, setCourseNames] = useState<{[key: string]: string}>({});

    useEffect(() => {
        const fetchExams = async () => {
            if (!currentUser) {
                console.log('Kullanıcı giriş yapmamış');
                setExams([]);
                setLoading(false);
                return;
            }

            console.log('Giriş yapan kullanıcı ID:', currentUser.uid);

            try {
                setLoading(true);
                console.log('Sınavlar getiriliyor...');

                const allQuizzes = await FirebaseService.getAllQuizzes();
                console.log('Tüm sınavlar:', allQuizzes);

                const userQuizzes = allQuizzes.filter(quiz => quiz.userId === currentUser.uid);
                console.log('Kullanıcının sınavları:', userQuizzes);

                const examList = userQuizzes.map((quiz) => {
                    const examItem = {
                        id: quiz.id,
                        createdAt: new Date(quiz.timestamp || new Date().toISOString()),
                        successRate: quiz.score || 0, 
                        name: quiz.fileName || 'İsimsiz Quiz',
                        questions: quiz.questions,
                        course: quiz.course,
                    };
                    console.log('İşlenen sınav:', examItem);
                    return examItem;
                });

                const sortedExams = examList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                console.log('Sıralanmış sınav listesi:', sortedExams);

                setExams(sortedExams);
            } catch (error) {
                console.error('Sınav getirme hatası:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, [currentUser]);

    // Dersleri getir
    useEffect(() => {
        const fetchCourseNames = async () => {
            try {
                const coursesData = await FirebaseService.getAllCourses();
                const courseMap: {[key: string]: string} = {};
                coursesData.forEach(course => {
                    courseMap[course.id] = course.name;
                });
                setCourseNames(courseMap);
            } catch (error) {
                console.error('Ders isimleri alınamadı:', error);
            }
        };

        fetchCourseNames();
    }, []);

    // Ana dersi bulmak için yardımcı fonksiyon

    const handleQuizSelect = async (quizId: string) => {
        try {
            console.log('Sınav seçildi, ID:', quizId);
            const quizData = await FirebaseService.getQuizByIdWithCourseName(quizId);

            if (quizData) {
                console.log('Seçilen sınav verileri:', quizData);

                // Varsayılan preferences oluştur
                const defaultPreferences = {
                    questionTypes: {
                        multipleChoice: true
                    },
                    typeCount: {
                        multipleChoice: 10
                    }
                };

              
                const preferences = quizData.preferences || defaultPreferences;

                if (quizData.questions && quizData.userAnswers) {
                    const selectedQuizData = {
                        questions: quizData.questions,
                        userAnswers: quizData.userAnswers,
                        preferences: preferences,
                        fileName: quizData.fileName || 'İsimsiz Quiz',
                        results: quizData.results,
                        formattedTime: quizData.formattedTime,
                        course: quizData.course,
                        score: quizData.score,
                        elapsedTime: quizData.elapsedTime,
                        userLevel: quizData.userLevel,
                        timestamp: quizData.timestamp || new Date('2024-12-26T04:55:50+03:00').toISOString()
                    };
                    console.log('İşlenmiş sınav verileri:', selectedQuizData);

                    setSelectedQuiz(selectedQuizData);
                    setSelectedExam(quizId);
                } else {
                    console.error('Eksik sınav verileri:', {
                        hasQuestions: !!quizData.questions,
                        hasUserAnswers: !!quizData.userAnswers
                    });
                }
            } else {
                console.error('Sınav bulunamadı');
            }
        } catch (error) {
            console.error('Sınav seçme hatası:', error);
        }
    };

    const handleDeleteQuiz = async (quizId: string) => {
        try {
            await FirebaseService.quiz.deleteQuiz(quizId);
            setExams(prevExams => prevExams.filter(exam => exam.id !== quizId));
            setShowDeleteConfirm(false);
            setSelectedQuiz(null);
            setSelectedExam(null);
        } catch (error) {
            console.error('Sınav silme hatası:', error);
        }
    };

    return (
        <div className="exam-list-container">
            

            {selectedQuiz && selectedQuiz.userAnswers && (
                <div className="selected-quiz-details">
                    <QuizResults
                        formattedTime={selectedQuiz.formattedTime || '0 saniye'}
                        questions={selectedQuiz.questions}
                        userAnswers={selectedQuiz.userAnswers}
                        preferences={selectedQuiz.preferences}
                        fileName={selectedQuiz.fileName}
                        onRestartQuiz={() => setSelectedQuiz(null)}
                        course={selectedQuiz.course}
                    />
                </div>
            )}

            <div className="exam-list">
                <h2>Sınav Listesi</h2>
                <div className="exam-list-content">
                    {loading ? (
                        <p>Yükleniyor...</p>
                    ) : exams.length === 0 ? (
                        <p>Henüz sınav bulunmuyor.</p>
                    ) : (
                        <div className="exam-items">
                            {exams.map((exam) => {
                                const isSuccess = parseFloat(exam.successRate.toString()) >= 50;
                                const formattedDate = exam.createdAt.toLocaleString('tr-TR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                });

                                return (
                                    <div
                                        key={exam.id}
                                        className={`exam-item ${selectedExam === exam.id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedExam(exam.id);
                                            handleQuizSelect(exam.id);
                                        }}
                                    >
                                        <div className="exam-item-buttons">
                                            {selectedExam === exam.id && (
                                                <button
                                                    className="delete-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowDeleteConfirm(true);
                                                    }}
                                                >
                                                    Sil
                                                </button>
                                            )}
                                        </div>
                                        <div className="exam-item-info">
                                            <h3 title={exam.name}>{courseNames[exam.course || ''] || 'Genel'}</h3>
                                            <p className="exam-date">{formattedDate}</p>
                                            <p className={`success-rate ${isSuccess ? 'success' : 'fail'}`}>
                                                Başarı: {exam.successRate}%
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showDeleteConfirm && (
                <div className="delete-confirm-overlay">
                    <div className="delete-confirm-modal">
                        <h3>Sınavı Sil</h3>
                        <p>Bu sınavı silmek istediğinizden emin misiniz?</p>
                        <div className="delete-confirm-buttons">
                            <button className="cancel-button" onClick={() => setShowDeleteConfirm(false)}>
                                İptal
                            </button>
                            <button className="confirm-button" onClick={() => handleDeleteQuiz(selectedExam!)} >
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamList;