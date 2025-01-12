import { db } from '../../config/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { DB_TABLES, DBSchema } from '../schema';

export class AnalyticsOperations {
  private analyticsCollection = collection(db, DB_TABLES.ANALYTICS);

  async trackQuizCompletion(data: Omit<DBSchema['analytics'], 'timestamp'>): Promise<void> {
    await addDoc(this.analyticsCollection, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  async getUserAnalytics(userId: string, startDate: Date): Promise<DBSchema['analytics'][]> {
    const q = query(
      this.analyticsCollection,
      where("userId", "==", userId),
      where("timestamp", ">=", startDate.toISOString())
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as DBSchema['analytics']);
  }
}

export const analyticsOperations = new AnalyticsOperations();
