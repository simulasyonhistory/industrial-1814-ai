# Historical Operator Engine v3

Bu sürüm mobile-first tasarım, çoklu senaryo, save/load, proje kuyruğu, aktif darboğaz, darboğaz kayması, maliyet takibi ve OpenAI destekli anlatıcı katmanı ile hazırlanmıştır.

## Temel Mantık
- Oyuncu kararı serbest metin olarak yazar.
- Engine sayısal sonucu ve zaman/maliyet etkisini hesaplar.
- OpenAI yalnızca sonucu yorumlar ve tarihsel uygunluk notu üretir.
- Her senaryo için autosave dosyası tutulur.

## Dosyalar
- `server.js` → Express backend + OpenAI anlatıcı + save/load API
- `public/index.html` → mobile-first arayüz
- `public/app.js` → istemci akışı
- `public/engine.js` → state, darboğaz, proje kuyruğu, maliyet motoru
- `public/scenarios.js` → senaryo verileri
- `public/ui.js` → ekran render katmanı
- `data/saves/` → senaryo bazlı autosave dosyaları

## Çalıştırma
1. `.env` dosyası oluştur:
   - `OPENAI_API_KEY=...`
   - `OPENAI_MODEL=gpt-4o-mini` (opsiyonel)
2. Terminal:
   - `npm install`
   - `npm start`
3. Tarayıcı:
   - `http://localhost:3000`
   - Sağlık testi: `http://localhost:3000/health`

## Render
- Build Command: `npm install`
- Start Command: `npm start`
- Persistent Disk önerilir. Save dosyaları aksi halde deploy sonrası sıfırlanabilir.
- `data/saves/` klasörü repo içinde boş da olsa bulunmalıdır.

## Not
Bu sürümde iki senaryo vardır:
- Industrial Operator: 1814
- Mekatronik Eşik: 1856 Osmanlı
