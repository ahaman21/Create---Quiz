import React, { useState, useEffect } from 'react';
import { useQuizTimer } from '../../contexts/QuizTimerContext';
import type { Question, QuizPreferences, AnswerKey } from '../../types/types';
import AnalysisResults from '../Quiz/AnalysisResults/AnalysisResults';
import { quizResultsService } from '../../services/QuizResultsService';
import { analyzeQuizResults } from '../../utils/analysis';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './QuizResults.css';

interface QuizResultsProps {
    formattedTime?: string;
    questions: Question[];
    userAnswers: AnswerKey;
    onRestartQuiz: () => void;
    preferences: QuizPreferences;
    fileName: string;
    course: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A0522D'];

const QuizResults: React.FC<QuizResultsProps> = ({
    formattedTime,
    questions,
    userAnswers,
    onRestartQuiz,
    preferences,
    fileName,
    course,
}) => {
    const { getFormattedTime } = useQuizTimer();
    const [results, setResults] = useState({
        correct: 0,
        wrong: 0,
        total: 0,
        percentage: 0,
    });
    const displayTime = getFormattedTime() || '0 saniye';
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    useEffect(() => {
        const calculateAndSetResults = () => {
            if (questions && userAnswers) {
                try {
                    const calculatedResults = quizResultsService.calculateResults(questions, userAnswers);
                    setResults({
                        correct: calculatedResults.correct,
                        wrong: calculatedResults.wrong,
                        total: calculatedResults.total,
                        percentage: Number(calculatedResults.percentage),
                    });
                } catch (e) {
                    const errorMessage = e instanceof Error ? e.message : 'Sonuçlar hesaplanırken bir hata oluştu';
                    setError(errorMessage);

                }
            }
        };

        calculateAndSetResults();

    }, [questions, userAnswers]);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (questions && userAnswers) {
                try {
                    const analysis = await analyzeQuizResults(questions, userAnswers);

                    setAnalysisResult(analysis);
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Analiz oluşturulurken bir hata oluştu';
                    setError(errorMessage);

                }
            }
        };

        fetchAnalysis();
    }, [questions, userAnswers]);

    if (!questions || !userAnswers) {
        return <div className="error-message">Sınav verileri yüklenemedi</div>;
    }

    const pieChartData = [
        { name: 'Doğru', value: results.correct },
        { name: 'Yanlış', value: results.wrong }
    ];

    const QuestionHeader: React.FC<{ question: Question }> = ({ question }) => {
        // Ana konu ve alt konu ayrıştırması
        const topicParts = question.topic?.split('.') || ['Genel'];
        const mainTopic = topicParts[0];
        const subTopic = topicParts.slice(1).join('.');

        return (
            <div className="question-header">
                <div className="topic-info">
                    <span className="main-topic">{mainTopic}</span>
                    {subTopic && (
                        <>
                            <span className="topic-separator">•</span>
                            <span className="sub-topic">{subTopic}</span>
                        </>
                    )}
                </div>
                <div className="difficulty-badge">
                    <span className={`difficulty-level ${question.difficulty || 'medium'}`}>
                        {question.difficulty === 'easy' ? 'Kolay' :
                         question.difficulty === 'hard' ? 'Zor' : 'Orta'}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="quiz-results">
            <h2>Sınav Sonuçları</h2>

            <div className="results-summary">
                <div className="score-section">
                    <h3>Puan Özeti</h3>
                    <p>Toplam Soru: {results.total}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        <div style={{ width: '50%', height: '200px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                    </div>

                    <p>Başarı Yüzdesi: %{results.percentage}</p>
                </div>

                <div className="time-section">
                    <h3>Süre Bilgisi</h3>
                    <p>Toplam Süre: {displayTime}</p>
                </div>
                <div>
                    <h3>Ders</h3>
                    <p>Ders İsmi: {course}</p>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {analysisResult && (
                <div className="analysis-section">
                    <h3>Detaylı Analiz</h3>
                    <AnalysisResults analysisResult={analysisResult} />
                </div>
            )}

            <div className="questions-review">
                <h3>Soru Detayları</h3>
                {questions.map((question, index) => (
                    <div key={question.id} className="question-container">
                        <QuestionHeader question={question} />
                        <div className="question-content">
                            <div
                                className={`question-review ${userAnswers[question.id] === question.correctAnswer ? 'correct' : 'incorrect'}`}
                            >
                                <p><strong>Soru {question.id}:</strong> {question.question}</p>
                                <p>Sizin Cevabınız: {userAnswers[question.id]}</p>
                                <p>Doğru Cevap: {question.correctAnswer}</p>
                                <p>
                                    <small style={{ color: userAnswers[question.id] === question.correctAnswer ? '#48bb78' : '#f56565' }}>
                                        {userAnswers[question.id] === question.correctAnswer ? '✓ Doğru cevapladınız' : '✗ Yanlış cevapladınız'}
                                    </small>
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

           
        </div>
    );
};

export default QuizResults;