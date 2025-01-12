import { QuizPreferences } from '../types/types';

class PreferencesService {
  private readonly STORAGE_KEY = 'quizPreferences';

  public getStoredPreferences(): QuizPreferences {
    const savedPreferences = localStorage.getItem(this.STORAGE_KEY);
    return savedPreferences ? JSON.parse(savedPreferences) : this.getDefaultPreferences();
  }

  public savePreferences(preferences: QuizPreferences): void {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
  }

  public getDefaultPreferences(): QuizPreferences {
    return {
      questionTypes: { multipleChoice: true },
      typeCount: { multipleChoice: 10 },
      optionCount: 4
    };
  }

  public updateQuestionType(
    preferences: QuizPreferences,
    type: 'multipleChoice',
    checked: boolean
  ): QuizPreferences {
    return {
      ...preferences,
      questionTypes: { ...preferences.questionTypes, [type]: checked },
      typeCount: {
        ...preferences.typeCount,
        [type]: checked ? preferences.typeCount[type] || 5 : 0
      }
    };
  }

  public updateQuestionCount(
    preferences: QuizPreferences,
    type: 'multipleChoice',
    value: number
  ): QuizPreferences {
    const maxValue = 50;
    const limitedValue = Math.min(Math.max(1, value), maxValue);
    return {
      ...preferences,
      typeCount: { ...preferences.typeCount, [type]: limitedValue }
    };
  }
}

export const preferencesService = new PreferencesService();
