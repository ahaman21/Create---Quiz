import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuizTimer } from '../../contexts/QuizTimerContext';
import './Header.css';

const Header: React.FC = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const { isQuizActive, getFormattedTime } = useQuizTimer();
  const navigate = useNavigate();
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser) {
        const adminStatus = await isAdmin(currentUser.uid);
        setIsAdminUser(adminStatus);
      } else {
        setIsAdminUser(false);
      }
    };

    checkAdminStatus();
  }, [currentUser, isAdmin]);

  const handleAuth = async () => {
    if (currentUser) {
      try {
        await logout();
        navigate('/');
      } catch (error) {
        console.error('Çıkış yapılırken hata oluştu:', error);
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="App-header">
      <div className="header-container">
        <div className="logo">
          <h1>Quiz </h1>
          {isQuizActive && (
            <div className="timer">
              Geçen Süre: {getFormattedTime()}
            </div>
          )}
        </div>
        <nav className="nav-menu">
          <ul>
            <li>
              <a href="/" className="nav-link">
                Ana Sayfa
              </a>
            </li>
            
            {currentUser && (
              <>
                <li>
                  <a href="/learning-progress" className="nav-link">
                    Öğrenme Takibi
                  </a>
                </li>
                {isAdminUser && (
                  <li>
                    <a href="/admin/dashboard" className="nav-link admin-link">
                      Admin Panel
                    </a>
                  </li>
                )}
              </>
            )}
            <li className="auth-item">
              <button onClick={handleAuth} className={`auth-button ${currentUser ? 'logout' : 'login'}`}>
                {currentUser ? (
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/10233/10233766.png" 
                    alt="Çıkış Yap"
                    className="logout-icon"
                  />
                ) : 'Giriş Yap'}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
