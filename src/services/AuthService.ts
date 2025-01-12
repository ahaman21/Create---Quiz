import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, UserCredential, onAuthStateChanged, Unsubscribe } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { app, db } from '../config/firebase';
import { AnalysisResult, UserData, WeakTopic } from '../types/types';

class AuthService {
  private auth = getAuth(app);

  async register(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      await this.createUserProfile(userCredential.user.uid, { 
        email: userCredential.user.email || email // email null ise parametre olarak gelen email'i kullan
      });
      return userCredential.user;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Bu e-posta adresi zaten kullanılıyor.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Geçersiz e-posta adresi.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('E-posta/şifre girişi etkin değil.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Şifre çok zayıf.');
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout(): Promise<void> {
    return await signOut(this.auth);
  }

  onAuthStateChange(callback: (user: User | null) => void): Unsubscribe {
    return onAuthStateChanged(this.auth, callback);
  }

  async createUserProfile(uid: string, data: Partial<UserData>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Varolan profili güncelle
        await updateDoc(userRef, {
          ...data,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Yeni profil oluştur
        await setDoc(userRef, {
          ...data,
          weakTopics: {},
          strongTopics: [],
          lastAnalysis: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Kullanıcı profili oluşturulurken hata:', error);
      throw new Error('Kullanıcı profili oluşturulamadı.');
    }
  }

  async getUserProfile(uid: string): Promise<UserData | null> {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    } else {
      return null;
    }
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  async updateUserWeakTopics(uid: string, weakTopics: Record<string, WeakTopic>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const existingWeakTopics = userSnap.data().weakTopics || {};
      const updatedWeakTopics = { ...existingWeakTopics, ...weakTopics };
      await updateDoc(userRef, { weakTopics: updatedWeakTopics });
    } else {
      await updateDoc(userRef, { weakTopics });
    }
  }

  async updateUserStrongTopics(uid: string, strongTopics: string[]): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const existingStrongTopics = userSnap.data().strongTopics || [];
      const updatedStrongTopics = Array.from(new Set([...existingStrongTopics, ...strongTopics]));
      await updateDoc(userRef, { strongTopics: updatedStrongTopics });
    } else {
      await updateDoc(userRef, { strongTopics });
    }
  }

  async updateUserAnalysisResult(uid: string, analysisResult: AnalysisResult): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { lastAnalysis: analysisResult });
  }

  async getUserWeakTopics(uid: string): Promise<Record<string, WeakTopic>> {
    const userProfile = await this.getUserProfile(uid);
    return userProfile?.weakTopics || {};
  }

  async getUserStrongTopics(uid: string): Promise<string[]> {
    const userProfile = await this.getUserProfile(uid);
    return userProfile?.strongTopics || [];
  }

  async getUserLastAnalysisResult(uid: string): Promise<AnalysisResult | null> {
    const userProfile = await this.getUserProfile(uid);
    return userProfile?.lastAnalysis || null;
  }
}

export const authService = new AuthService();