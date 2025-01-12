# Akıllı Sınav Hazırlama Platformu

Akıllı Sınav Hazırlama Platformu, PDF belgelerinden otomatik soru üretimi yapabilen, yapay zeka destekli bir eğitim aracıdır.

## Özellikler

- PDF belgelerinden otomatik soru üretimi
- Kişiselleştirilmiş sınav hazırlama
- Gerçek zamanlı performans analizi
- Adaptif zorluk seviyesi ayarlaması

## Sistem Gereksinimleri

- Node.js 16.x veya üzeri
- Python 3.8 veya üzeri
- Modern web tarayıcısı (Chrome, Firefox, Edge)
- Minimum 4GB RAM
- 1GB boş disk alanı

## Detaylı Kurulum Adımları

### 1. Node.js Kurulumu

1. [Node.js web sitesinden](https://nodejs.org/) en son LTS sürümünü indirin

### 2. Python Kurulumu

1. [Python web sitesinden](https://www.python.org/downloads/) Python 3.8 veya üzeri sürümü indirin


### 3. Proje Kurulumu


1. Node.js paketlerini yükleyin:
```bash
npm install
```

2. Python paketlerini yükleyin:
```bash
pip install -r requirements.txt
```

### 3. Çevresel Değişkenlerin Ayarlanması

1. Proje klasöründe `.env` dosyası oluşturun
2. Aşağıdaki içeriği `.env` dosyasına ekleyin:
```env
PORT=3001
HOST=localhost
REACT_APP_API_URL=http://localhost:5000
WDS_SOCKET_PORT=0
DANGEROUSLY_DISABLE_HOST_CHECK=true

# Firebase Config
REACT_APP_FIREBASE_API_KEY=[firebase-api-key]
REACT_APP_FIREBASE_AUTH_DOMAIN=[firebase-auth-domain]
REACT_APP_FIREBASE_PROJECT_ID=[firebase-project-id]
REACT_APP_FIREBASE_STORAGE_BUCKET=[firebase-storage-bucket]

# Google Gemini API
REACT_APP_GEMINI_API_KEY=[gemini-api-key]
```

3. Gerekli API anahtarlarını temin edin:
   - [Google Cloud Console](https://console.cloud.google.com/)'dan Gemini API anahtarı
   - [Firebase Console](https://console.firebase.google.com/)'dan Firebase yapılandırma bilgileri

### 5. Veritabanı Ayarları

1. [Firebase Console](https://console.firebase.google.com/)'da yeni bir proje oluşturun
2. Authentication ve Realtime Database servislerini etkinleştirin
3. Firebase yapılandırma bilgilerini `.env` dosyasına ekleyin

## Uygulamayı Başlatma

1. Geliştirme modunda başlatmak için:
```bash
npm run dev
```

2. Uygulama otomatik olarak tarayıcınızda açılacaktır
3. Açılmazsa `http://localhost:3000` adresine gidin

## Olası Sorunlar ve Çözümleri

### Node.js Paket Kurulum Hataları

Eğer `npm install` sırasında hata alırsanız:
1. Node.js sürümünüzün uyumlu olduğunu kontrol edin
2. npm önbelleğini temizleyin:
```bash
npm cache clean --force
```
3. node_modules klasörünü silip tekrar deneyin:
```bash
rm -rf node_modules
npm install
```

### Python Paket Kurulum Hataları

Eğer `pip install` sırasında hata alırsanız:
1. pip'i güncelleyin:
```bash
python -m pip install --upgrade pip
```
2. Sanal ortam kullanmayı deneyin:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### API Bağlantı Hataları

1. `.env` dosyasındaki API anahtarlarının doğru olduğunu kontrol edin
2. Firebase ve Gemini API servislerinin aktif olduğunu doğrulayın
3. Internet bağlantınızı kontrol edin
