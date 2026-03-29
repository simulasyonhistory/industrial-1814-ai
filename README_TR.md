# Historical Operator Engine v3

Bu sürüm **mobile-first**, **save/load destekli** ve **AI yorum katmanlı** karar simülasyonu prototipidir.

## Temel mantık
- Oyuncu serbest karar yazar.
- `engine.js` sayısal sonucu deterministik olarak hesaplar.
- OpenAI yalnızca sonucu **yorumlar**, yeni aktif darboğazı açıklar ve sıradaki riski söyler.
- Her tur otomatik olarak kaydedilir.

## Dosyalar
- `server.js` → Express backend + OpenAI yorum endpoint'i + save/load API
- `public/index.html` → mobile-first arayüz
- `public/app.js` → uygulama akışı, autosave, API bağlantıları
- `public/engine.js` → state motoru, darboğaz ve event mantığı
- `public/scenarios.js` → senaryo verileri
- `public/ui.js` → arayüz render katmanı
- `data/saves/` → JSON kayıt dosyaları

## Çalıştırma
1. `.env.example` dosyasını `.env` olarak kopyala
2. `OPENAI_API_KEY` alanını doldur
3. terminal:
   - `npm install`
   - `npm start`
4. tarayıcı:
   - `http://localhost:3000`
   - sağlık testi: `http://localhost:3000/health`

## Render
- Build Command: `npm install`
- Start Command: `npm start`

## Not
OpenAI anahtarı yoksa sistem yine çalışır. Bu durumda sonuç yorumları yerel fallback metniyle üretilir.
