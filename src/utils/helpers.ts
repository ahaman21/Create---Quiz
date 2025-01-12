import { Notification } from '../types/types';

// Bir bildirim mesajı göstermek için kullanılan fonksiyon
export const showNotification = (message: string, type: 'success' | 'error', setNotification: React.Dispatch<React.SetStateAction<Notification | null>>) => {
  setNotification({ message, type });
  // 5 saniye sonra bildirimi otomatik olarak kaldır
  setTimeout(() => setNotification(null), 5000);
};

// API hatalarını ele almak için kullanılan fonksiyon
export const handleApiError = (error: any) => {
  if (error instanceof Error) {
    // Hata bir Error nesnesi ise, hata mesajını döner
    return error.message;
  } else if (typeof error === 'string') {
    // Hata bir string ise, doğrudan döner
    return error;
  }
  // Aksi takdirde, bilinmeyen bir hata mesajı döner
  return 'Bilinmeyen bir hata oluştu';
};

// Zaman damgalarını belirli bir formata dönüştürmek için kullanılan fonksiyon
export const formatTimestamp = (timestamp: any) => {
  try {
    if (timestamp?.toDate) {
      // Zaman damgası bir toDate fonksiyonuna sahipse, ISO formatında bir string döner
      return timestamp.toDate().toISOString();
    } else if (typeof timestamp === 'string') {
      // Zaman damgası bir string ise, doğrudan döner
      return timestamp;
    } else {
      // Aksi takdirde, mevcut tarih ve saati ISO formatında döner
      return new Date().toISOString();
    }
  } catch (err) {
    // Hata durumunda, mevcut tarih ve saati ISO formatında döner
    return new Date().toISOString();
  }
};

export const truncateFileName = (name: string, maxLength: number = 40): string => {
  if (name.length <= maxLength) return name;
  const extension = name.split('.').pop();
  const nameWithoutExt = name.slice(0, name.lastIndexOf('.'));
  return `${nameWithoutExt.slice(0, maxLength)}...${extension ? `.${extension}` : ''}`;
};

export const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs} saat ${mins} dakika ${secs} saniye`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR');
};