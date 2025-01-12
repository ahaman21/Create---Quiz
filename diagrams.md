# Sistem Diyagramları

## 1. Sistem Mimarisi
```mermaid
graph TB
    subgraph Frontend
        UI[User Interface]
        React[React Components]
        Redux[Redux Store]
        UI --> React
        React --> Redux
    end

    subgraph Backend
        API[Flask API]
        AI[Gemini AI]
        PDF[PDF Processor]
        API --> AI
        API --> PDF
    end

    subgraph Database
        FB[Firebase]
        FS[Firestore]
        ST[Storage]
        FB --> FS
        FB --> ST
    end

    React --> API
    API --> FB
```

## 2. Veri Akış Şeması
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant AI
    participant Database

    User->>Frontend: Yükle PDF
    Frontend->>Backend: PDF Dosyası
    Backend->>AI: Metin İçeriği
    AI->>Backend: Üretilen Sorular
    Backend->>Database: Kaydet
    Backend->>Frontend: Quiz Hazır
    Frontend->>User: Göster Quiz
```

## 3. Bileşen İlişkileri
```mermaid
graph LR
    subgraph Components
        Quiz[Quiz Module]
        Progress[Learning Progress]
        Assessment[Pre Assessment]
        Results[Quiz Results]
    end

    subgraph Services
        Auth[Auth Service]
        File[File Service]
        AI[AI Service]
        DB[Database Service]
    end

    Quiz --> File
    Quiz --> AI
    Quiz --> DB
    Progress --> DB
    Assessment --> DB
    Results --> DB
    All --> Auth
```

## 4. PDF İşleme Süreci
```mermaid
flowchart TD
    A[PDF Yükleme] --> B{Format Kontrolü}
    B -->|Geçerli| C[Metin Çıkarma]
    B -->|Geçersiz| H[Hata]
    C --> D[Metin Analizi]
    D --> E[AI İşleme]
    E --> F[Soru Üretimi]
    F --> G[Quiz Oluşturma]
```

## 5. Quiz Oluşturma Algoritması
```mermaid
graph TD
    A[Başla] --> B[PDF Analizi]
    B --> C{Zorluk Seviyesi}
    C -->|Kolay| D[Temel Sorular]
    C -->|Orta| E[Karma Sorular]
    C -->|Zor| F[İleri Sorular]
    D --> G[Soru Havuzu]
    E --> G
    F --> G
    G --> H[Quiz Oluştur]
```

## 6. Kullanıcı Etkileşim Modeli
```mermaid
stateDiagram-v2
    [*] --> Login
    Login --> Dashboard
    Dashboard --> PDFUpload
    Dashboard --> QuizList
    PDFUpload --> QuizCreation
    QuizCreation --> QuizTaking
    QuizTaking --> Results
    Results --> Analytics
    Analytics --> Dashboard
```

## 7. Veritabanı Şeması
```mermaid
erDiagram
    USERS ||--o{ QUIZZES : creates
    USERS {
        string id
        string name
        string email
        string role
    }
    QUIZZES ||--|{ QUESTIONS : contains
    QUIZZES {
        string id
        string title
        string creator_id
        date created_at
    }
    QUESTIONS {
        string id
        string quiz_id
        string question
        string[] options
        string correct_answer
        string difficulty
    }
    USERS ||--o{ RESULTS : takes
    RESULTS {
        string id
        string user_id
        string quiz_id
        int score
        date completed_at
    }
```

## 8. CI/CD Pipeline
```mermaid
graph LR
    A[Code] -->|Push| B[Git]
    B -->|Trigger| C[Build]
    C -->|Success| D[Test]
    D -->|Pass| E[Deploy]
    E -->|Success| F[Production]
    D -->|Fail| G[Notify]
    C -->|Fail| G
```

## 9. Performans Optimizasyon Akışı
```mermaid
graph TD
    A[İstek] --> B{Cache?}
    B -->|Evet| C[Cache'den Al]
    B -->|Hayır| D[İşle]
    D --> E{Rate Limit?}
    E -->|Evet| F[Kuyruk]
    E -->|Hayır| G[Hemen İşle]
    F --> G
    G --> H[Sonuç]
    C --> H
```

## 10. Öğrenme Analitikleri Süreci
```mermaid
graph LR
    A[Quiz Data] --> B[Analiz]
    B --> C[Performans]
    B --> D[Zayıf Konular]
    B --> E[İlerleme]
    C --> F[Rapor]
    D --> F
    E --> F
    F --> G[Öneriler]
```
