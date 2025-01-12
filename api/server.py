from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import PyPDF2
import io
import os
import logging

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"], "methods": ["GET", "POST", "OPTIONS"]}})

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        # Dosya kontrolü
        if 'file' not in request.files:
            return jsonify({'error': 'Dosya bulunamadı', 'details': 'Lütfen bir PDF dosyası yükleyin'}), 400
        
        file = request.files['file']
        
        # Dosya adı kontrolü
        if file.filename == '':
            return jsonify({'error': 'Dosya seçilmedi', 'details': 'Lütfen bir dosya seçin'}), 400
        
        # Dosya uzantısı kontrolü
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Geçersiz dosya formatı', 'details': 'Sadece PDF dosyaları desteklenir'}), 400
        
        # Dosya boyutu kontrolü (10MB)
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        file_content = file.read()
        if len(file_content) > MAX_FILE_SIZE:
            return jsonify({'error': 'Dosya çok büyük', 'details': 'Maksimum dosya boyutu 10MB olmalıdır'}), 400
        
        try:
            # PDF okuma işlemi
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            
            # Sayfa sayısı kontrolü
            MAX_PAGES = 50
            if len(pdf_reader.pages) > MAX_PAGES:
                return jsonify({'error': 'Çok fazla sayfa', 'details': f'PDF maksimum {MAX_PAGES} sayfa olmalıdır'}), 400
            
            # Metin çıkarma
            text = ""
            total_chars = 0
            MAX_CHARS = 100000  # Maksimum karakter sayısı
            
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                total_chars += len(page_text)
                
                if total_chars > MAX_CHARS:
                    return jsonify({'error': 'Çok fazla metin', 'details': 'PDF çok fazla metin içeriyor'}), 400
                
                text += page_text + "\n\n"
            
            # Boş PDF kontrolü
            if not text.strip():
                return jsonify({'error': 'PDF boş', 'details': 'Yüklenen PDF dosyası boş veya metin içermiyor'}), 400
            
            # Başarılı yanıt
            return jsonify({
                'success': True,
                'text': text,
                'fileName': file.filename,
                'pageCount': len(pdf_reader.pages),
                'charCount': total_chars
            })
            
        except PyPDF2.PdfReadError as e:
            logger.error(f"PDF okuma hatası: {str(e)}")
            return jsonify({'error': 'PDF okuma hatası', 'details': str(e)}), 400
        except Exception as e:
            logger.error(f"Beklenmeyen hata: {str(e)}")
            return jsonify({'error': 'Sistem hatası', 'details': 'PDF işlenirken bir hata oluştu'}), 500
            
    except Exception as e:
        logger.error(f"Genel hata: {str(e)}")
        return jsonify({'error': 'Sistem hatası', 'details': 'Dosya işlenirken bir hata oluştu'}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=False)
