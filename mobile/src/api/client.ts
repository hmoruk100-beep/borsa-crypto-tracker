import axios, { AxiosInstance } from 'axios';

// Backend'in IP adresini buraya yazın
// Windows'ta: ipconfig → IPv4 Address
// Örnek: 192.168.1.50
const BACKEND_IP = '192.168.1.100';  // ⚠️ BU SATIRI KÖNDİ BİLGİSAYARINIZIN IP'Sİ İLE DEĞİŞTİRİN
const API_URL = `http://${BACKEND_IP}:8000`;

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek öncesi
client.interceptors.request.use(
  (config) => {
    console.log(`📤 İstek: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ İstek Hatası:', error);
    return Promise.reject(error);
  }
);

// Cevap sonrası
client.interceptors.response.use(
  (response) => {
    console.log(`📥 Cevap (${response.status}): ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`❌ Sunucu Hatası (${error.response.status}):`, error.response.data);
    } else if (error.request) {
      console.error('❌ Bağlantı Hatası - Backend yanıt vermedi');
      console.error('Lütfen backend çalışıyor mu kontrol edin:');
      console.error(`http://${BACKEND_IP}:8000/health`);
    } else {
      console.error('❌ Hata:', error.message);
    }
    return Promise.reject(error);
  }
);

export default client;
