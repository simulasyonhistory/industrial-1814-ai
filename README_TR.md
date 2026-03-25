# Industrial Operator 1814 — Baştan Başlama Paketi

Bu paket temizlenmiş ve tekrar kuruluma uygun sürümdür.

## 1) Klasörü aç
Zip'i çıkar.

## 2) .env oluştur
`.env.example` dosyasını kopyalayıp adını `.env` yap.

## 3) API key yaz
`.env` dosyasını Not Defteri ile aç.
Sadece ilk satırı değiştir:

OPENAI_API_KEY=BURAYA_YENI_API_KEY_YAZ

Not:
- Key tek satır olmalı.
- Eski paylaşılan key'i kullanma.
- İstersen key yazmasan da oyun fallback ile çalışır.

## 4) Terminal aç
Klasörde boş yere sağ tık -> Terminal / PowerShell aç.

## 5) Kur
npm install

## 6) Başlat
npm start

## 7) Aç
http://localhost:3000

## Test
Sağlık kontrolü için:
http://localhost:3000/health

Beklenen cevap:
{"ok":true,"hasKey":true,"model":"gpt-4o-mini"}

## Önemli
Oyuncular API key girmez. Key sadece sunucuda kalır.
Canlıya aldığında ziyaretçiler doğrudan siteyi kullanır.
