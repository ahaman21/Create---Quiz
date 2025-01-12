import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Course, FirestoreQuizData } from '../types/types';

export const getUserCourses = async (userId: string): Promise<Course[]> => {
  const coursesRef = collection(db, 'courses');
  const q = query(coursesRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    userId: doc.data().userId,
    createdAt: doc.data().createdAt,
  }));
};

export const addCourse = async (courseName: string, userId: string): Promise<void> => {
  const courseRef = doc(collection(db, 'courses'));
  const courseData = {
    id: courseRef.id,
    name: courseName,
    userId: userId,
    createdAt: new Date().toISOString(),
  };
  await setDoc(courseRef, courseData);
};

export const saveQuizToFirestore = async (quizData: FirestoreQuizData): Promise<string> => {
  const quizRef = doc(collection(db, 'quizzes'));
  await setDoc(quizRef, quizData);
  return quizRef.id;
};
