import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FirebaseService from '../../services/FirebaseService';
import { AnalysisResult, QuizData, MainTopicStats, SubTopicPerformance } from '../../types/types';
import { authService } from '../../services/AuthService';
import './LearningProgress.css';
import { useDispatch } from 'react-redux';
import { clearAllTopics } from '../../store/quizSlice';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];
const RADIAN = Math.PI / 180;

const CustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

interface Section {
    title: string;
    content: React.ReactNode;
}


interface TopicDistributionItem {
    name: string;
    value: number;
    passRate: string;
    passed: number;
    failed: number;
    subTopics: Record<string, SubTopicPerformance>;
}

const LearningProgress: React.FC = () => {
    const dispatch = useDispatch();
    const { currentUser } = useAuth();
    const [quizzes, setQuizzes] = useState<QuizData[]>([]);
    const [weakTopics, setWeakTopics] = useState<string[]>([]);
    const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [performanceData, setPerformanceData] = useState<any[]>([]);
    const [topicDistribution, setTopicDistribution] = useState<TopicDistributionItem[]>([]);
    const [filteredQuizzes, setFilteredQuizzes] = useState<QuizData[]>([]);

    const [overallProgress, setOverallProgress] = useState(0);
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [timeFilter, setTimeFilter] = useState<string>('all');
    const [strongTopics, setStrongTopics] = useState<string[]>([]);
    const [examCountFilter, setExamCountFilter] = useState<string>('all');
    const [showSuccessful, setShowSuccessful] = useState<boolean>(true);
    const [showUnsuccessful, setShowUnsuccessful] = useState<boolean>(true);

    const sortedQuizzes = React.useMemo(() => {
        return [...quizzes].sort((a, b) => {
            const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
            const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
            return dateB.getTime() - dateA.getTime();
        });
    }, [quizzes]);

    const uniqueCourses = React.useMemo(() => {
        return Array.from(new Set(sortedQuizzes.map(quiz => quiz.course)));
    }, [sortedQuizzes]);

    const filteredQuizzesMemo = React.useMemo(() => {
        let filtered = [...sortedQuizzes];

        // Başarı durumu filtresi - ikisi de kapalıysa boş dizi döndür
        if (!showSuccessful && !showUnsuccessful) {
            return [];
        }

        // Başarı durumu filtresini uygula
        filtered = filtered.filter(quiz => {
            const isSuccessful = (quiz.score || 0) >= 50; // 50 ve üzeri başarılı
            return (showSuccessful && isSuccessful) || (showUnsuccessful && !isSuccessful);
        });

        // Kurs filtresi
        if (selectedCourse !== 'all') {
            filtered = filtered.filter(quiz => quiz.course === selectedCourse);
        }

        // Zaman filtresi
        const now = new Date();
        switch (timeFilter) {
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(quiz =>
                    quiz.timestamp ? new Date(quiz.timestamp) > weekAgo : false
                );
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(quiz =>
                    quiz.timestamp ? new Date(quiz.timestamp) > monthAgo : false
                );
                break;
            case 'year':
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(quiz =>
                    quiz.timestamp ? new Date(quiz.timestamp) > yearAgo : false
                );
                break;
        }

        // Sınav sayısı filtresi
        if (examCountFilter !== 'all') {
            filtered = filtered.slice(0, parseInt(examCountFilter));
        }

        return filtered;
    }, [sortedQuizzes, selectedCourse, timeFilter, examCountFilter, showSuccessful, showUnsuccessful]);

    useEffect(() => {
        setFilteredQuizzes(filteredQuizzesMemo);
    }, [filteredQuizzesMemo]);

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser) {
                try {
                    const userProfile = await authService.getUserProfile(currentUser.uid);
                    const quizzes = await FirebaseService.getUserQuizzes(currentUser.uid);
                    
                    if (userProfile) {
                        setWeakTopics(Object.keys(userProfile.weakTopics || {}));
                        setStrongTopics(userProfile.strongTopics || []);
                        setLastAnalysis(userProfile.lastAnalysis || null);
                    }

                    if (quizzes) {
                        const sortedQuizzes = [...quizzes].sort((a, b) => {
                            const dateA = new Date(a.timestamp || '').getTime();
                            const dateB = new Date(b.timestamp || '').getTime();
                            return dateB - dateA;
                        });

                        setQuizzes(sortedQuizzes);
                    }
                } catch (error) {
                    console.error('Veri yüklenirken hata oluştu:', error);
                    setError('Veriler yüklenirken bir hata oluştu.');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [currentUser]);

    // Performans ve konu dağılımı verilerini güncelle
    useEffect(() => {
        if (filteredQuizzes.length > 0) {
            // Performans verilerini hazırla
            const performanceData = filteredQuizzes.map(quiz => ({
                name: quiz.fileName,
                score: quiz.score,
                timestamp: quiz.timestamp
            }));

            setPerformanceData(performanceData);

            // Zayıf konuların sayısını hesapla
            


            // Ana konu istatistiklerini hesapla
            const stats: MainTopicStats = {};
            const subTopicStats: Record<string, {total: number; correct: number}> = {};

            // Alt konuların istatistiklerini topla
            filteredQuizzes.forEach(quiz => {
                quiz.questions?.forEach(question => {
                    const topic = question.topic || 'Genel';
                    const [mainTopic, subTopic] = topic.split('.');
                    
                    // Alt konu istatistikleri
                    if (subTopic) {
                        if (!subTopicStats[`${mainTopic}.${subTopic}`]) {
                            subTopicStats[`${mainTopic}.${subTopic}`] = { total: 0, correct: 0 };
                        }
                        subTopicStats[`${mainTopic}.${subTopic}`].total++;
                        if (quiz.userAnswers && quiz.userAnswers[question.id] === question.correctAnswer) {
                            subTopicStats[`${mainTopic}.${subTopic}`].correct++;
                        }
                    }

                    // Ana konu istatistikleri
                    if (!stats[mainTopic]) {
                        stats[mainTopic] = {
                            total: 0,
                            passed: 0,
                            failed: 0,
                            percentage: 0,
                            subTopics: {}
                        };
                    }

                    stats[mainTopic].total++;
                    if (quiz.userAnswers && quiz.userAnswers[question.id] === question.correctAnswer) {
                        stats[mainTopic].passed++;
                    } else {
                        stats[mainTopic].failed++;
                    }
                });
            });

            // Alt konuları ana konulara ekle
            Object.entries(subTopicStats).forEach(([topic, performance]) => {
                const [mainTopic, subTopic] = topic.split('.');
                if (stats[mainTopic] && subTopic) {
                    stats[mainTopic].subTopics[subTopic] = {
                        total: performance.total,
                        correct: performance.correct,
                        percentage: (performance.correct / performance.total) * 100
                    };
                }
            });

            // Ana konuların yüzdelerini hesapla
            Object.keys(stats).forEach(topic => {
                const performance = stats[topic];
                performance.percentage = (performance.passed / performance.total) * 100;
            });

          
            
            // Konu dağılımı verilerini güncelle
            const distributionData: TopicDistributionItem[] = Object.entries(stats)
                .filter(([name]) => name !== 'Genel')
                .map(([name, stats]) => ({
                    name,
                    value: stats.total,
                    passRate: stats.percentage.toFixed(1),
                    passed: stats.passed,
                    failed: stats.failed,
                    subTopics: stats.subTopics
                }))
                .sort((a, b) => b.value - a.value);

            setTopicDistribution(distributionData);
        } else {
            // Veriler boşsa state'leri sıfırla
            setPerformanceData([]);
            
            setTopicDistribution([]);
        }
    }, [filteredQuizzes, weakTopics]);

    useEffect(() => {
        const calculateProgress = () => {
            if (filteredQuizzes.length > 0) {
                const overall = (filteredQuizzes.reduce((acc, quiz) => acc + (quiz.score || 0), 0) / filteredQuizzes.length);
                setOverallProgress(overall);
            }
        };

        calculateProgress();
    }, [filteredQuizzes]);


    const handleResetTopics = async () => {
        try {
            if (!currentUser) {
                throw new Error('Kullanıcı bilgisi mevcut değil.');
            }
            await FirebaseService.cleanAllTopics(currentUser.uid);
            dispatch(clearAllTopics());

            setWeakTopics([]);
            setStrongTopics([]);
            setLastAnalysis(null);

            alert('Tüm konular başarıyla sıfırlandı.');
        } catch (error) {
            console.error('Konular sıfırlanırken hata oluştu:', error);
            alert('Konular sıfırlanırken bir hata oluştu.');
        }
    };

    const calculateWeakTopics = (quizzes: QuizData[]) => {
        const topicStats: Record<string, { total: number; correct: number }> = {};

        quizzes.forEach(quiz => {
            quiz.questions?.forEach(question => {
                if (!topicStats[question.topic]) {
                    topicStats[question.topic] = { total: 0, correct: 0 };
                }

                topicStats[question.topic].total++;
                if (quiz.userAnswers && quiz.userAnswers[question.id] === question.correctAnswer) {
                    topicStats[question.topic].correct++;
                }
            });
        });

        return Object.entries(topicStats)
            .filter(([_, stats]) => (stats.correct / stats.total) * 100 < 60)
            .map(([topic]) => topic);
    };

    const calculateFilteredProgress = (quizzes: QuizData[]) => {
        if (quizzes.length === 0) return 0;

        const totalScore = quizzes.reduce((sum, quiz) => {
            return sum + (quiz.score || 0);
        }, 0);

        return totalScore / quizzes.length;
    };

    useEffect(() => {
        // Genel ilerlemeyi güncelle
        const progress = calculateFilteredProgress(filteredQuizzes);
        setOverallProgress(progress);

        // Zayıf konuları güncelle
        const currentWeakTopics = calculateWeakTopics(filteredQuizzes);
        setWeakTopics(currentWeakTopics);

    }, [filteredQuizzes]);

    const topicDistributionSection = {
        title: 'Ana Konular Dağılımı',
        content: (
            <>
                <div className="chart-header">
                    <span className="chart-title">Ana Konular Performansı</span>
                    <div className="chart-legend">
                        {topicDistribution.map((entry, index) => (
                            <div key={index} className="chart-legend-item">
                                <div
                                    className="chart-legend-color"
                                    style={{ background: COLORS[index % COLORS.length] }}
                                />
                                <span>
                                    {entry.name} ({entry.passRate}% başarı)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="chart-content">
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={topicDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={CustomizedLabel}
                                outerRadius={160}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {topicDistribution.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ payload }) => {
                                    if (payload && payload.length > 0) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="custom-tooltip">
                                                <p><strong>{data.name}</strong></p>
                                                <p>Toplam Soru: {data.value}</p>
                                                <p>Başarı Oranı: {data.passRate}%</p>
                                                <p>Alt Konular:</p>
                                                <ul style={{ marginLeft: '15px', paddingLeft: '0' }}>
                                                    {Object.entries(data.subTopics).map(([subTopic, stats]: [string, any]) => (
                                                        <li key={subTopic} style={{ marginBottom: '5px' }}>
                                                            {subTopic}: {stats.percentage.toFixed(1)}% 
                                                            ({stats.correct}/{stats.total})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </>
        )
    };

    const sectionCards: Section[] = [
        {
            title: 'Özet',
            content: (
                <div className="stat-group">
                    <div className="stat-item">
                        <span>Toplam Sınav</span>
                        <strong>{filteredQuizzes.length}</strong>
                    </div>
                    <div className="stat-item">
                        <span>Ortalama Başarı</span>
                        <strong>
                            {filteredQuizzes.length > 0
                                ? `${(filteredQuizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0) / filteredQuizzes.length).toFixed(1)}%`
                                : '0%'}
                        </strong>
                    </div>
                </div>
            )
        },
        {
            title: 'Geliştirilmesi Gereken Konular',
            content: (
                weakTopics && weakTopics.length > 0 ? (
                    <ul className="topics-list">
                        {weakTopics.map((topic, index) => {
                            // Filtrelenmiş sınavlara göre performans hesapla
                            const topicPerformance = filteredQuizzes.reduce(
                                (acc, quiz) => {
                                    const topicQuestions = quiz.questions?.filter(q => q.topic === topic) || [];
                                    topicQuestions.forEach(question => {
                                        acc.total++;
                                        if (quiz.userAnswers?.[question.id] === question.correctAnswer) {
                                            acc.correct++;
                                        }
                                    });
                                    return acc;
                                },
                                { correct: 0, total: 0 }
                            );

                            const percentage = topicPerformance.total > 0
                                ? (topicPerformance.correct / topicPerformance.total) * 100
                                : 0;

                            return (
                                <li key={index} className="topic-item">
                                    <span className="topic-name">{topic}</span>
                                    <span className="topic-performance">
                                        {percentage.toFixed(1)}%
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="empty-state">Seçili filtrelerde eksik konu tespit edilmedi.</div>
                )
            )
        },
        {
            title: 'Başarılı Konular',
            content: (
                strongTopics && strongTopics.length > 0 ? (
                    <ul className="topics-list">
                        {strongTopics.map((topic, index) => (
                            <li key={index} className="topic-item">
                                <span className="topic-name">{topic}</span>
                                {lastAnalysis?.topicPerformance[topic] && (
                                    <span className="topic-performance">
                                        {lastAnalysis.topicPerformance[topic].percentage.toFixed(1)}%
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="empty-state">Henüz başarılı konu tespit edilmedi.</div>
                )
            )
        }
    ];

    const chartSections = [
        {
            title: 'Performans Grafiği',
            content: (
                <>
                    <div className="chart-header">
                        <span className="chart-title">Performans Grafiği</span>
                        <div className="chart-legend">
                            <div className="chart-legend-item">
                                <div className="chart-legend-color" style={{ background: '#8884d8' }}></div>
                                <span>Başarı Puanı</span>
                            </div>
                        </div>
                    </div>
                    <div className="chart-content">
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={performanceData}>
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )
        },
        topicDistributionSection
    ];

    if (loading) {
        return <div className="loading">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!currentUser) {
        return <div className="error">Lütfen giriş yapın</div>;
    }

    return (
        <div className="learning-progress">
            <section className="filters">
                <div className="filter-group">
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Tüm Dersler</option>
                        {uniqueCourses.map((course: string) => (
                            <option key={course} value={course}>{course}</option>
                        ))}
                    </select>

                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Tüm Zamanlar</option>
                        <option value="week">Son 1 Hafta</option>
                        <option value="month">Son 1 Ay</option>
                        <option value="year">Son 1 Yıl</option>
                    </select>

                    <select
                        value={examCountFilter}
                        onChange={(e) => setExamCountFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Tüm Sınavlar</option>
                        <option value="1">Son Sınav</option>
                        <option value="3">Son 3 Sınav</option>
                        <option value="5">Son 5 Sınav</option>
                        <option value="10">Son 10 Sınav</option>
                    </select>

                    <button
                        className={`filter-button ${showSuccessful ? 'active' : ''}`}
                        onClick={() => setShowSuccessful(!showSuccessful)}
                    >
                        Başarılı Sınavlar
                    </button>

                    <button
                        className={`filter-button ${showUnsuccessful ? 'active' : ''}`}
                        onClick={() => setShowUnsuccessful(!showUnsuccessful)}
                    >
                        Başarısız Sınavlar
                    </button>
                </div>
            </section>

            <section className="overall-progress">
                <div className="progress-bar">
                    <div
                        className="progress-bar-fill"
                        style={{
                            width: `${overallProgress}%`,
                            backgroundColor: `hsl(${overallProgress}, 70%, 50%)`
                        }}
                    />
                </div>
                <div className="progress-label">
                    Genel İlerleme: {overallProgress.toFixed(1)}%
                </div>
            </section>

            <div className="sections-wrapper">
                <div className="section-container">
                    {sectionCards.map((section, index) => (
                        <div key={index} className="section-card">
                            <h3>{section.title}</h3>
                            {section.content}
                        </div>
                    ))}
                </div>
                <div className="charts-container">
                    {chartSections.map((chart, index) => (
                        <div key={index} className="chart-section">
                            <h3>{chart.title}</h3>
                            {chart.content}
                        </div>
                    ))}
                </div>
            </div>

            <section className="recent-quizzes">
                <h3>Son Sınavlar</h3>
                {filteredQuizzes.length > 0 ? (
                    <div className="quizzes-list">
                        {filteredQuizzes.map((quiz, index) => (
                            <div key={index} className="quiz-item">
                                <div className="quiz-info">
                                    <h4>{quiz.fileName}</h4>
                                    <p className="quiz-date">
                                        {quiz.timestamp ? new Date(quiz.timestamp).toLocaleDateString('tr-TR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'Tarih bilgisi yok'}
                                    </p>
                                    <p className="quiz-course">{quiz.course}</p>
                                </div>
                                <div className="quiz-score">
                                    <span className={`score ${(quiz.score || 0) >= 50 ? 'good' : 'needs-improvement'}`}>
                                        {quiz.score || 0}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Seçilen filtrelere uygun sınav sonucu bulunmuyor.</p>
                )}
            </section>

            <section className="reset-topics">
                <button
                    className="reset-topics-button"
                    onClick={handleResetTopics}
                >
                    Konuları Sıfırla
                </button>
            </section>
        </div>
    );
};

export default LearningProgress;