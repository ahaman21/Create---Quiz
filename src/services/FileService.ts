import { MAX_FILE_SIZE, UPLOAD_TIMEOUT } from '../constants/appConstants';
import { handleApiError } from '../utils/helpers';

interface FileUploadResponse {
  success: boolean;
  text?: string;
  error?: string;
}

class FileService {
  private static readonly UPLOAD_URL = process.env.REACT_APP_UPLOAD_URL || 'http://localhost:5000/upload';

  public async uploadFile(file: File): Promise<FileUploadResponse> {
    try {
      // Genişletilmiş dosya türü kontrolü
      const allowedTypes = ['.pdf', '.txt', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop()!.toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        throw new Error('Desteklenmeyen dosya türü. Lütfen PDF, TXT, DOC veya DOCX dosyası yükleyin.');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`Dosya boyutu ${MAX_FILE_SIZE / (1024 * 1024)}MB'dan küçük olmalıdır`);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT);

      try {
        const response = await fetch(FileService.UPLOAD_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Dosya yükleme hatası');
        }

        const data = await response.json();

        if (!data.success || !data.text) {
          throw new Error('PDF içeriği alınamadı');
        }

        return {
          success: true,
          text: data.text
        };
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error('Dosya yükleme zaman aşımına uğradı');
          }
          throw error;
        }
        throw new Error('Beklenmeyen bir hata oluştu');
      }
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error)
      };
    }
  }
}

export const fileService = new FileService();