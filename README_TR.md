# Historical Operator Engine v2

Bu sürüm tek motor + tek senaryo mantığıyla hazırlanmıştır.

## Dosyalar
- `server.js` → Express + OpenAI backend
- `public/index.html` → ana arayüz
- `public/app.js` → uygulama akışı
- `public/engine.js` → state / ekonomi / zaman motoru
- `public/scenarios.js` → senaryo verileri
- `public/ui.js` → arayüz render katmanı

## Çalıştırma
1. `.env` dosyanı olduğu gibi bırak
2. terminal:
   - `npm install`
   - `npm start`
3. tarayıcı:
   - `http://localhost:3000`
   - sağlık testi: `http://localhost:3000/health`

## Render
- Build Command: `npm install`
- Start Command: `npm start`
