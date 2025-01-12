import { db } from '../../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  DocumentData 
} from 'firebase/firestore';
import { DB_TABLES, WeakTopic } from '../schema';

export class ProgressOperations {
  private progressCollection = collection(db, DB_TABLES.STUDENT_PROGRESS);
  private weakTopicsCollection = collection(db, DB_TABLES.WEAK_TOPICS);

  async updateWeakTopic(userId: string, topic: string, isSuccess: boolean): Promise<void> {
    const topicRef = doc(this.weakTopicsCollection, `${userId}_${topic}`);
    const topicDoc = await getDoc(topicRef);

    if (topicDoc.exists()) {
      const data = topicDoc.data() as WeakTopic;
      if (isSuccess) {
        // Başarılı olunca sayacı sıfırla
        await updateDoc(topicRef, {
          failCount: 0,
          lastAttempt: new Date().toISOString(),
          status: data.failCount > 3 ? 'active' : 'mastered',
          // successCount alanını da burada artırabilirsiniz
          successCount: (data.successCount || 0) + 1
        });
      } else {
        // Başarısız olunca sayacı artır
        await updateDoc(topicRef, {
          failCount: data.failCount + 1,
          lastAttempt: new Date().toISOString(),
          status: 'active'
        });
      }
    } else {
      // İlk kez karşılaşılan konu
      await setDoc(topicRef, {
        userId,
        topic,
        failCount: isSuccess ? 0 : 1,
        lastAttempt: new Date().toISOString(),
        status: 'active'
      });
    }
  }

  async getWeakTopics(userId: string): Promise<WeakTopic[]> {
    const q = query(this.weakTopicsCollection, where("userId", "==", userId), where("status", "==", "active"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: DocumentData) => doc.data() as WeakTopic);
  }
}

export const progressOperations = new ProgressOperations();
