import { collection, doc, getDocs, setDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Course, QuizData, FirestoreQuizData } from '../types/types';

interface FirestoreCourseData {
  name: string;
  userId: string;
  createdAt: string;
}

class CourseService {
  async addCourse(courseName: string, userId: string): Promise<Course> {
    try {
      const courseRef = doc(collection(db, 'courses'));
      const courseData = {
        id: courseRef.id,
        name: courseName,
        userId: userId,
        createdAt: new Date().toISOString()
      };
      await setDoc(courseRef, courseData);
      return courseData;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          throw new Error('Ders ekleme izniniz yok. Lütfen oturum açın.');
        }
      }
      throw new Error('Ders eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }

  async getUserCourses(userId: string): Promise<Course[]> {
    try {
      const coursesRef = collection(db, 'courses');
      const q = query(coursesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const courses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        userId: doc.data().userId,
        createdAt: doc.data().createdAt
      }));

      return courses;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          throw new Error('Dersleri görüntüleme izniniz yok. Lütfen oturum açın.');
        }
      }
      throw new Error('Dersler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }

  async getCourseQuizzes(courseId: string, userId: string): Promise<QuizData[]> {
    try {
      const quizzesRef = collection(db, 'quizzes');
      const q = query(
        quizzesRef,
        where('courseId', '==', courseId),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const quizzes = querySnapshot.docs.map((docSnapshot: any) => {
        const data = docSnapshot.data() as FirestoreQuizData;
        return {
          ...data,
          id: docSnapshot.id,
          course: data.courseId,
          elapsedTime: data.formattedTime || data.elapsedTime.toString(),
          userLevel: data.userLevel || 'beginner'
        } as QuizData;
      });
      return quizzes;
    } catch (error) {
      throw new Error('Ders sınavları yüklenirken bir hata oluştu');
    }
  }

  async getQuizCourse(quizId: string): Promise<Course | null> {
    try {
      const quizRef = doc(db, 'quizzes', quizId);
      const quizSnap = await getDoc(quizRef);

      if (!quizSnap.exists()) {
        throw new Error('Sınav bulunamadı');
      }

      const quizData = quizSnap.data() as FirestoreQuizData;
      if (!quizData.courseId) {
        return null;
      }

      const courseRef = doc(db, 'courses', quizData.courseId);
      const courseSnap = await getDoc(courseRef);

      if (!courseSnap.exists()) {
        return null;
      }

      const courseData = courseSnap.data() as FirestoreCourseData;
      return {
        id: courseSnap.id,
        name: courseData.name,
        userId: courseData.userId,
        createdAt: courseData.createdAt
      };
    } catch (error) {
      throw new Error('Sınava ait ders bilgisi alınırken bir hata oluştu');
    }
  }

  async getCourseName(courseId: string): Promise<string> {
    try {
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        return courseDoc.data().name || 'Bilinmeyen Ders';
      }
      return 'Bilinmeyen Ders';
    } catch (error) {
      return 'Bilinmeyen Ders';
    }
  }
}

export const courseService = new CourseService();