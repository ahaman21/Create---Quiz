import React from 'react';
import './AnalysisResults.css';
import { AnalysisResultsProps } from './../../../types/types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
    analysisResult
}) => {
    if (!analysisResult) return null;

    const {
        weakTopics = [],
        masteredTopics = [],
        recommendations = [],
        topicPerformance = {}
    } = analysisResult;

  const radarChartData = Object.entries(topicPerformance).map(([topic, performance]: [string, any]) => ({
      topic,
      correct: performance.correct,
      total: performance.total,
      percentage: Number(((performance.correct / performance.total) * 100).toFixed(1)),
    })).sort((a, b) => b.percentage - a.percentage).slice(0, 5);


    return (
        <div className="analysis-results">
            <h2>Analiz Sonuçları</h2>

          <div className="radar-chart-container" style={{ width: '100%', height: '400px'}}>
             <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarChartData} >
                 <PolarGrid />
                 <PolarAngleAxis dataKey="topic" />
                 <PolarRadiusAxis />
                 <Radar name="Başarı Oranı" dataKey="percentage" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </RadarChart>
            </ResponsiveContainer>
          </div>


            {masteredTopics.length > 0 && (
                <div className="result-section">
                    <h3>Başarılı Olduğunuz Konular</h3>
                    <ul>
                        {masteredTopics.map((topic: string, index: number) => (
                            <li key={index}>{topic}</li>
                        ))}
                    </ul>
                </div>
            )}

            {weakTopics.length > 0 && (
                <div className="result-section">
                    <h3>Geliştirilmesi Gereken Konular</h3>
                    <ul>
                        {weakTopics.map((topic: string, index: number) => (
                            <li key={index}>{topic}</li>
                        ))}
                    </ul>
                </div>
            )}

            {recommendations.length > 0 && (
                <div className="result-section">
                    <h3>Öneriler</h3>
                    <ul>
                        {recommendations.map((recommendation: string, index: number) => (
                            <li key={index}>{recommendation}</li>
                        ))}
                    </ul>
                </div>
            )}

            {Object.keys(topicPerformance).length > 0 && (
                <div className="result-section">
                    <h3>Konu Bazlı Performans</h3>
                    {Object.entries(topicPerformance).map(([topic, performance]: [string, any]) => (
                        <div key={topic} className="topic-performance">
                            <h4>{topic}</h4>
                            <p>
                                Doğru: {performance.correct}/{performance.total}
                                ({((performance.correct / performance.total) * 100).toFixed(1)}%)
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnalysisResults;