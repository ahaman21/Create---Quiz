import React from 'react';
import './LoadingScreen.css';

const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <h2>Sınav Hazırlanıyor...</h2>
        <p>Seçtiğiniz zorluk seviyesine göre sorular oluşturuluyor</p>
        <p className="loading-subtitle">Lütfen bekleyiniz</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
