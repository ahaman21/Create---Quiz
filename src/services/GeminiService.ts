import { GoogleGenerativeAI } from "@google/generative-ai";
import { Question, QuizPreferences } from '../types/types';
import { API_RATE_LIMIT_ERROR, DEFAULT_OPTION_COUNT, GENERIC_ERROR_MESSAGE } from '../constants/appConstants';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : undefined;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) throw error;

    if (error.message?.includes(API_RATE_LIMIT_ERROR)) {
      await wait(delay);
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }

    throw error;
  }
};

export const generateQuestions = async (
  text: string,
  preferences: QuizPreferences,
  fileName: string,
  userLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed',
  weakTopics: Record<string, number>,
  strongTopics: string[],            
  prioritizeWeakTopics: boolean //zayıf konulara öncelik verilip verilmeyeceğini 
): Promise<Question[]> => {

  if (!genAI) {
    console.error('API key bulunamadı.');
    throw new Error("API key bulunamadı.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const optionCount = preferences.optionCount || DEFAULT_OPTION_COUNT;
    const baseQuestionCount = preferences.typeCount.multipleChoice; 
    const adjustedQuestionCount = Math.max(3, Math.min(15, baseQuestionCount));
    const difficultyDistribution = calculateDifficultyDistribution(userLevel, adjustedQuestionCount);

    const prompt = `
Verilen metinden bir sınav oluştur. Aşağıdaki kurallara dikkat et:

1. METİN ANALİZİ:
   - Metni dikkatlice analiz et
   - Ana konuları belirle (örn: "Veri Yapıları", "Algoritmalar")
   - Her ana konu için alt konuları belirle (örn: "Veri Yapıları.Diziler", "Veri Yapıları.Bağlı Listeler")

2. SORU DAĞILIMI:
   - Toplam ${adjustedQuestionCount} soru oluştur
   - Zorluk dağılımı:
     * Kolay (easy): ${difficultyDistribution.easy} soru
     * Orta (medium): ${difficultyDistribution.medium} soru
     * Zor (hard): ${difficultyDistribution.hard} soru

3. SORU FORMATI:
   - Her soru için tam ${optionCount} seçenek olmalı (A, B, C, D)
   - Her seçenek "A) ", "B) ", "C) ", "D) " şeklinde başlamalı
   - Doğru cevap mutlaka seçeneklerden biri olmalı

4. KONU ÖNCELİKLENDİRME:
   ${preferences.onlyWeakTopics 
     ? `- SADECE bu konulardan soru sor: ${preferences.weakTopicsList?.join(', ')}`
     : prioritizeWeakTopics 
       ? `- Zayıf konulara öncelik ver: ${Object.keys(weakTopics).join(', ')}`
       : ''
   }
   ${strongTopics.length > 0 ? `- Bu konulardan soru sorma: ${strongTopics.join(', ')}` : ''}

5. KULLANICI SEVİYESİ: ${userLevel}

Yanıtını aşağıdaki JSON formatında ver:

{
  "exam": {
    "topics": [
      {
        "topicName": "Ana Konu",
        "subtopics": [
          {
            "subtopicName": "Alt Konu",
            "questions": [
              {
                "id": "1",
                "type": "multiple-choice",
                "difficulty": "easy",
                "topic": "Ana Konu.Alt Konu",
                "question": "Soru metni buraya gelecek?",
                "options": [
                  "A) Birinci seçenek",
                  "B) İkinci seçenek",
                  "C) Üçüncü seçenek",
                  "D) Dördüncü seçenek"
                ],
                "correctAnswer": "A) Birinci seçenek"
              }
            ]
          }
        ]
      }
    ]
  }
}

METİN: ${text}`;

    const result = await retryWithBackoff(async () => {
      const response = await model.generateContent(prompt);
      return response.response.text();
    });

    try {
      // JSON yanıtını temizle
      let cleanResult = result
        .replace(/```json\n?|\n?```/g, '') // JSON blok işaretlerini kaldır
        .replace(/[\u201C\u201D\u2018\u2019]/g, '"') 
        .trim(); // Baştaki ve sondaki boşlukları kaldır

      // JSON başlangıcını bul
      const jsonStart = cleanResult.indexOf('{');
      if (jsonStart === -1) {
        throw new Error('JSON yapısı bulunamadı');
      }
      cleanResult = cleanResult.substring(jsonStart);

      // JSON sonunu bul
      const jsonEnd = cleanResult.lastIndexOf('}');
      if (jsonEnd === -1) {
        throw new Error('JSON yapısı tamamlanmamış');
      }
      cleanResult = cleanResult.substring(0, jsonEnd + 1);

      const parsedResult = JSON.parse(cleanResult);
      
      if (!parsedResult.exam?.topics) {
        throw new Error('Geçersiz sınav yapısı');
      }

      const questions: Question[] = [];

      parsedResult.exam.topics.forEach((topic: any) => {
        if (!topic?.subtopics) return;

        topic.subtopics.forEach((subtopic: any) => {
          if (!subtopic?.questions) return;

          subtopic.questions.forEach((q: any) => {
            // Soru validasyonu
            if (!q.question || !Array.isArray(q.options) || !q.correctAnswer) {
              console.warn('Geçersiz soru yapısı:', q);
              return;
            }

            // Seçenek sayısını kontrol et
            if (q.options.length !== optionCount) {
              q.options = Array(optionCount).fill('').map((_, i) => {
                return q.options[i] || `${String.fromCharCode(65 + i)}) Boş seçenek`;
              });
            }

            // Zorluk seviyesini kontrol et
            if (!['easy', 'medium', 'hard'].includes(q.difficulty)) {
              q.difficulty = 'medium';
            }

            questions.push({
              id: q.id || String(questions.length + 1),
              type: 'multiple-choice',
              difficulty: q.difficulty,
              topic: `${topic.topicName}.${subtopic.subtopicName}`,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              text: q.question
            });
          });
        });
      });

      // Soru sayısını kontrol et ve ayarla
      if (questions.length > adjustedQuestionCount) {
        questions.length = adjustedQuestionCount;
      } else if (questions.length < adjustedQuestionCount) {
        console.warn(`Beklenen soru sayısından az soru üretildi: ${questions.length}/${adjustedQuestionCount}`);
      }

      // Zorluk dağılımını kontrol et
      const difficultyCount = {
        easy: questions.filter(q => q.difficulty === 'easy').length,
        medium: questions.filter(q => q.difficulty === 'medium').length,
        hard: questions.filter(q => q.difficulty === 'hard').length
      };

      // Eksik zorluk seviyelerini tamamla
      if (difficultyCount.easy < difficultyDistribution.easy) {
        const diff = difficultyDistribution.easy - difficultyCount.easy;
        questions.filter(q => q.difficulty !== 'easy').slice(0, diff).forEach(q => q.difficulty = 'easy');
      }
      if (difficultyCount.medium < difficultyDistribution.medium) {
        const diff = difficultyDistribution.medium - difficultyCount.medium;
        questions.filter(q => q.difficulty !== 'medium').slice(0, diff).forEach(q => q.difficulty = 'medium');
      }
      if (difficultyCount.hard < difficultyDistribution.hard) {
        const diff = difficultyDistribution.hard - difficultyCount.hard;
        questions.filter(q => q.difficulty !== 'hard').slice(0, diff).forEach(q => q.difficulty = 'hard');
      }

      if (questions.length === 0) {
        throw new Error('Hiç geçerli soru üretilemedi');
      }

      return questions;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error(GENERIC_ERROR_MESSAGE);
    }
  } catch (error) {
    console.error('Error in generateQuestions:', error);
    throw error;
  }
};

// Kullanıcı seviyesine göre zorluk dağılımını hesapla
function calculateDifficultyDistribution(
  userLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed',
  totalQuestions: number
) {
  let distribution = {
    easy: 0.4,
    medium: 0.4,
    hard: 0.2
  };

  switch (userLevel) {
    case 'mixed':
      distribution = {
        easy: 0.33,
        medium: 0.34,
        hard: 0.33
      };
      break;
    case 'beginner':
      distribution = {
        easy: 0.6,
        medium: 0.3,
        hard: 0.1
      };
      break;
    case 'intermediate':
      distribution = {
        easy: 0.3,
        medium: 0.5,
        hard: 0.2
      };
      break;
    case 'advanced':
      distribution = {
        easy: 0.2,
        medium: 0.4,
        hard: 0.4
      };
      break;
  }

  return {
    easy: Math.round(totalQuestions * distribution.easy),
    medium: Math.round(totalQuestions * distribution.medium),
    hard: Math.round(totalQuestions * distribution.hard)
  };
}
