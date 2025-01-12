import  { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { AuthContextType } from '../types/types';
import FirebaseService from '../services/FirebaseService';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = FirebaseService.auth.onAuthStateChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email: string, password: string, firstName: string, lastName: string, isAdmin: boolean = false): Promise<void> => {
    try {
      // Önce kullanıcıyı kaydet ve oturum aç
      const user = await FirebaseService.auth.register(email, password);

      if (user) {
        // Kullanıcı profilini güncelle
        await FirebaseService.auth.createUserProfile(user.uid, {
          email,
          firstName,
          lastName,
          displayName: `${firstName} ${lastName}`,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          role: isAdmin ? 'admin' : 'user'
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const { user } = await FirebaseService.auth.login(email, password);

      // Kullanıcının son giriş zamanını güncelle
      if (user) {
        await FirebaseService.auth.createUserProfile(user.uid, {
          lastLogin: new Date().toISOString()
        });
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Hatalı şifre.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Geçersiz e-posta adresi.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('Bu hesap devre dışı bırakılmış.');
      }
      throw error;
    }
  };

  const logout = (): Promise<void> => {
    return FirebaseService.auth.logout()
      .then(() => {})
      .catch((error) => {
        throw error;
      });
  };

  // Admin kontrolü için yardımcı fonksiyon
  const isAdmin = async (uid: string): Promise<boolean> => {
    const userData = await FirebaseService.auth.getUserProfile(uid);
    return userData?.role === 'admin';
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    register,
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
