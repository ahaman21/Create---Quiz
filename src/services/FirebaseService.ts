import {
  collection,
  doc,
  getDocs,
  query,
  where,
  getFirestore,
  QueryDocumentSnapshot,
  getDoc,
  addDoc,
  updateDoc,
  DocumentData
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../config/firebase';
import { QuizData, Course, FirestoreQuizData, AnalysisResult, WeakTopic } from '../types/types';

// #region Servis İçe Aktarmaları

import { authService } from './AuthService';
import { courseService } from './CourseService';
import { quizOpsService } from './QuizOpsService';

// #endregion

// #region Firestore Veritabanı Örneği

// Firestore veritabanı örneğini oluştur
export const db = getFirestore(app);

// #endregion

// #region Arayüzler

// Firestore'daki ders verilerinin arayüzü
interface FirestoreCourseData {
  name: string;
  userId: string;
  createdAt: string;
}

// #endregion

// #region Firebase Servis Sınıfı

// Firebase servis sınıfı
class FirebaseService {
  // #region Genel Metotlar

  // Mevcut kullanıcıyı getir
  getCurrentUser() {
    return authService.getCurrentUser();
  }

  // #endregion

  // #region Singleton Yapısı

  private static instance: FirebaseService;
  private storage;
  private db;

  // Private constructor ile sınıfın dışarıdan new ile oluşturulmasını engelle
  private constructor() {
      this.storage = getStorage(app);
      this.db = getFirestore(app);
  }

  // Singleton örneğini döndüren metot
  public static getInstance(): FirebaseService {
      if (!FirebaseService.instance) {
          try {
              FirebaseService.instance = new FirebaseService();
          } catch (error) {
              throw error;
          }
      }
      return FirebaseService.instance;
  }

  // #endregion

  // #region Erişim Sağlayıcılar (Getters)

  // Auth metotlarına erişim
  get auth() {
      return authService;
  }

  // Ders metotlarına erişim
  get course() {
      return courseService;
  }

  // Sınav metotlarına erişim
  get quiz() {
      return quizOpsService;
  }

  // #endregion

  // #region Sınav İşlemleri

  // Belirli bir sınavı ID'sine göre getir
  async getQuiz(quizId: string): Promise<QuizData & { id: string } | null> {
      return this.quiz.getQuiz(quizId);
  }

  // Tüm sınavları getir
  async getAllQuizzes(): Promise<(QuizData & { id: string })[]> {
      return this.quiz.getAllQuizzes();
  }

  // Bir sınavı güncelle
  async updateQuiz(quizId: string, data: any): Promise<void> {
      return this.quiz.updateQuiz(quizId, data);
  }

  // Bir sınavı sil
  async deleteQuiz(quizId: string): Promise<void> {
      return this.quiz.deleteQuiz(quizId);
  }

  // Kullanıcının sınavlarını ders bilgileriyle birlikte getir
   async getUserQuizzesWithCourses(): Promise<{quiz: QuizData; course: Course | null}[]> {
    try {
      const currentUser = this.auth.getCurrentUser();
      if (!currentUser) {
        throw new Error('Oturum açmanız gerekiyor');
      }

      const quizzesRef = collection(this.db, 'quizzes');
      const q = query(quizzesRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);

      const quizzesWithCourses = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot: QueryDocumentSnapshot) => {
          const quizData = { id: docSnapshot.id, ...docSnapshot.data() } as QuizData;
          let course = null;

          try {
            if (quizData.courseId) {
              const courseRef = doc(this.db, 'courses', quizData.courseId);
              const courseSnap = await getDoc(courseRef);
　
              if (courseSnap.exists()) {
                course = {
                  id: courseSnap.id,
                  name: courseSnap.data().name,
                  userId: courseSnap.data().userId,
                  createdAt: courseSnap.data().createdAt
                };
              }
            }
          } catch (error) {
            // Ders bilgisi yüklenirken hata oluşursa sessizce geç
          }

          return { 
            quiz: {
              ...quizData,
              course: course?.name || 'Genel',
              // Bu metot burada tanımlanmış ancak herhangi bir işlem yapmıyor
              setUserLevel(level: 'beginner' | 'intermediate' | 'advanced' | 'mixed') {
               
              }
            }, 
            course 
          };
        })
      );

      return quizzesWithCourses;
    } catch (error) {
      throw new Error('Sınav ve ders bilgileri yüklenirken bir hata oluştu');
    }
  }

  // Tüm sınavları ders adlarıyla birlikte getir
     async getAllQuizzesWithCourseNames(): Promise<QuizData[]> {
      try {
          const quizSnapshot = await getDocs(collection(this.db, 'quizzes'));
          const quizzes: QuizData[] = [];

          await Promise.all(quizSnapshot.docs.map(async (doc) => {
              const data = doc.data();
              // Zaman damgasını yerel tarih formatına çevir
              const timestamp = data.timestamp
                  ? new Date(data.timestamp).toLocaleString()
                  : new Date().toLocaleString();

              // Dersin adını getir
              const courseName = await this.course.getCourseName(data.courseId);

              const quiz: QuizData = {
                  id: doc.id,
                  questions: data.questions || [],
                  userAnswers: data.userAnswers || {},
                  preferences: data.preferences || {},
                  fileName: data.fileName || 'İsimsiz Quiz',
                  results: data.results || null,
                  timestamp: timestamp,
                  userId: data.userId,
                  formattedTime: data.formattedTime,
                  course: courseName,
                  score: data.score,
                  elapsedTime: data.elapsedTime,
                  userLevel: data.userLevel
              };
              quizzes.push(quiz);
          }));

          return quizzes;
      } catch (error) {
          throw error;
      }
  }

  // ID'sine göre bir sınavı ders adıyla birlikte getir
  async getQuizByIdWithCourseName(quizId: string): Promise<QuizData | null> {
      try {
          const quizDoc = await getDoc(doc(this.db, 'quizzes', quizId));

          if (!quizDoc.exists()) {
              return null;
          }

          const data = quizDoc.data();
          // Zaman damgasını yerel tarih formatına çevir
          const timestamp = data.timestamp
              ? new Date(data.timestamp).toLocaleString()
              : new Date().toLocaleString();

          // Dersin adını getir
          const courseName = await this.course.getCourseName(data.courseId);

          const quiz: QuizData = {
              id: quizDoc.id,
              questions: data.questions || [],
              userAnswers: data.userAnswers || {},
              preferences: data.preferences || {},
              fileName: data.fileName || 'İsimsiz Quiz',
              results: data.results || null,
              timestamp: timestamp,
              userId: data.userId,
              formattedTime: data.formattedTime,
              course: courseName,
              score: data.score,
              elapsedTime: data.elapsedTime,
              userLevel: data.userLevel
          };

          return quiz;
      } catch (error) {
          throw error;
      }
  }

  // Yeni bir sınav oluştur
  async createQuiz(quizData: QuizData): Promise<string> {
    try {
      const currentUser = this.auth.getCurrentUser();
      if (!currentUser) {
        throw new Error('Oturum açmanız gerekiyor');
      }

      const quizRef = collection(this.db, 'quizzes');
      const quizDataWithUser = {
        ...quizData,
        userId: currentUser.uid,
        timestamp: new Date().toISOString()
      };

      const docRef = await addDoc(quizRef, quizDataWithUser);
      return docRef.id;
    } catch (error) {
      throw new Error('Sınav oluşturulurken bir hata oluştu');
    }
  }
  
  // Sınav sonuçlarını kaydet
  async saveQuizResults(quizId: string, analysisResult: AnalysisResult): Promise<void> {
    const quizRef = doc(this.db, 'quizzes', quizId);
    await updateDoc(quizRef, { analysisResult });
  }

  // #endregion

  // #region Kullanıcı Konu İşlemleri

  // Kullanıcının zayıf konularını getir
  async getUserWeakTopics(userId: string): Promise<Record<string, WeakTopic>> {
    const userRef = doc(this.db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data().weakTopics || {};
    } else {
      return {};
    }
  }

  // Kullanıcının zayıf konularını güncelle
  async updateUserWeakTopics(userId: string, weakTopics: Record<string, WeakTopic>): Promise<void> {
    const userRef = doc(this.db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const existingWeakTopics = userSnap.data().weakTopics || {};
      const updatedWeakTopics = { ...existingWeakTopics, ...weakTopics };
      await updateDoc(userRef, { weakTopics: updatedWeakTopics });
    } else {
      await updateDoc(userRef, { weakTopics });
    }
  }

  // Kullanıcının tüm konularını temizle (zayıf, güçlü, son analiz)
  async cleanAllTopics(userId: string): Promise<void> {
    const userRef = doc(this.db, 'users', userId);
    await updateDoc(userRef, {
      weakTopics: {},
      strongTopics: [],
      lastAnalysis: null,
    });
  }

  // #endregion

  // #region Kullanıcı İşlemleri

  // Tüm kullanıcıları getir
  async getAllUsers() {
    try {
      const usersCollection = collection(this.db, 'users');
      const querySnapshot = await getDocs(usersCollection);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Kullanıcılar alınırken hata:', error);
      throw error;
    }
  }

  // Kullanıcı profilini güncelle
  async updateUserProfile(userId: string, data: any) {
    try {
      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, data);
    } catch (error) {
      throw error;
    }
  }

  // #endregion

  // #region Yönetici İşlemleri

  // Admin istatistiklerini getir
  async getAdminStats() {
    try {
      const stats = {
        totalUsers: 0,
        totalQuizzes: 0,
        totalCourses: 0
      };

      const usersSnapshot = await getDocs(collection(this.db, 'users'));
      stats.totalUsers = usersSnapshot.size;

      const quizzesSnapshot = await getDocs(collection(this.db, 'quizzes'));
      stats.totalQuizzes = quizzesSnapshot.size;

      const coursesSnapshot = await getDocs(collection(this.db, 'courses'));
      stats.totalCourses = coursesSnapshot.size;

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // #endregion

  // #region Ders İşlemleri

  // Tüm dersleri getir
  async getAllCourses() {
    try {
      const coursesSnapshot = await getDocs(collection(this.db, 'courses'));
      return coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Dersler alınamadı:', error);
      throw error;
    }
  }

  // #endregion

  // #region Kullanıcının Sınav İşlemleri

  // Belirli bir kullanıcının tüm sınavlarını getir
  async getUserQuizzes(userId: string): Promise<QuizData[]> {
    try {
      const quizzesRef = collection(this.db, 'quizzes');
      const q = query(quizzesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const quizzes = await Promise.all(querySnapshot.docs.map(async (docSnapshot: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnapshot.data() as FirestoreQuizData;
        let courseName = 'Genel';

        // Ders adını getir
        if (data.courseId) {
          try {
            const courseRef = doc(this.db, 'courses', data.courseId);
            const courseSnap = await getDoc(courseRef);
            const courseData = courseSnap.data() as FirestoreCourseData;
            if (courseSnap.exists() && courseData) {
              courseName = courseData.name;
            }
          } catch (error) {
            // Ders adı alınırken hata oluşursa varsayılan değeri kullan
          }
        }

        return {
          id: docSnapshot.id,
          ...data,
          formattedTime: data.formattedTime || '',
          course: courseName,
          score: data.score || 0,
          elapsedTime: data.formattedTime || '' // formattedTime'ı elapsedTime olarak kullanma hatası düzeltildi
        };
      }));
      
      // Sınavları tarihe göre sırala (en yeni önce)
      return quizzes.sort((a, b) => {
        const dateA = new Date(a.timestamp || '').getTime();
        const dateB = new Date(b.timestamp || '').getTime();
        return dateB - dateA;
      });
    } catch (error) {
      throw error;
    }
  }

  // #endregion

  // #region Dosya Yükleme İşlemleri

  // Firebase Storage'a dosya yükle
  async uploadFile(path: string, file: File): Promise<string> {
      const storageRef = ref(this.storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
  }

  // #endregion
}

// #endregion

// #region Firebase Servis Örneği Dışa Aktarma

// FirebaseService sınıfının singleton örneğini dışa aktar
export default FirebaseService.getInstance();

// #endregion