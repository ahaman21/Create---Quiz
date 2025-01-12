import { db } from '../../config/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { DB_TABLES } from '../schema';
import { QuizData } from '../../types/types';

export class QuizOperations {
  private quizCollection = collection(db, DB_TABLES.QUIZZES);

  async createQuiz(quizData: QuizData): Promise<string> {
    const docRef = await addDoc(this.quizCollection, {
      ...quizData,
      timestamp: new Date().toISOString()
    });
    return docRef.id;
  }

  async getQuizzesByUser(userId: string): Promise<QuizData[]> {
    const q = query(this.quizCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as QuizData);
  }

  async updateQuizScore(quizId: string, score: number): Promise<void> {
    const quizRef = doc(this.quizCollection, quizId);
    await updateDoc(quizRef, { score });
  }

  async deleteQuiz(quizId: string): Promise<void> {
    await deleteDoc(doc(this.quizCollection, quizId));
  }
}

export const quizOperations = new QuizOperations();
