import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const client = apiKey ? new OpenAI({ apiKey }) : null;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function fallbackDecisionEffects(input) {
  const text = String(input || '').toLowerCase();
  const effects = {
    cash: 0,
    production: 0,
    logistics: 0,
    pump: 0,
    rail: 0,
    morale: 0,
    risk: 0,
    expenses: 0,
    income: 0
  };
  let narrative = 'Karar yerel sistem tarafından yorumlandı.';
  let tag = 'warn';

  if (text.includes('pompa')) {
    effects.cash -= 3200;
    effects.pump += 28;
    effects.production += 70;
    effects.risk += 4;
    narrative += ' Pompa yatırımı üretimi artırır ama nakit baskısı yaratır.';
    tag = 'good';
  }
  if (text.includes('lojistik') || text.includes('taşıma') || text.includes('at') || text.includes('vagon')) {
    effects.cash -= 700;
    effects.logistics += 50;
    effects.expenses += 40;
    narrative += ' Lojistik hat güçlenir.';
    tag = 'good';
  }
  if (text.includes('ray') || text.includes('balast') || text.includes('altyapı')) {
    effects.cash -= 1100;
    effects.rail += 20;
    effects.risk -= 5;
    narrative += ' Ray ve zemin stabilitesi artar.';
    tag = 'good';
  }
  if (text.includes('işçi') || text.includes('maaş') || text.includes('erzak') || text.includes('bira')) {
    effects.cash -= 250;
    effects.morale += 14;
    effects.risk -= 6;
    narrative += ' İşçi morali yükselir.';
  }
  if (text.includes('temkin') || text.includes('yavaş') || text.includes('güvenli')) {
    effects.production -= 20;
    effects.risk -= 8;
    narrative += ' Daha güvenli ama daha yavaş bir yol seçildi.';
  }
  if (narrative === 'Karar yerel sistem tarafından yorumlandı.') {
    narrative += ' Etki belirsiz olduğu için dengeli bir sonuç üretildi.';
  }

  for (const key of Object.keys(effects)) {
    effects[key] = clamp(effects[key], -5000, 5000);
  }

  return {
    ok: true,
    rejected: false,
    tag,
    narrative,
    effects,
    secondary_events: []
  };
}

const SYSTEM_PROMPT = `
Sen 1814 Newcastle kömür ve lojistik simülasyonu için karar yorumlayıcısın.
Görevin: kullanıcının serbest metin kararını, 1814 tarihsel sınırları içinde oyun değişkenlerine çevirmek.
Kurallar:
1) Dönem dışı teknoloji varsa rejected=true döndür.
2) Etkiler küçük-orta ölçekli olsun. Tek kararla oyunu kırma.
3) Çıktı sadece JSON olsun.
4) effects alanında yalnızca şu anahtarlar olabilir:
cash, production, logistics, pump, rail, morale, risk, expenses, income
5) Her etki tamsayı olsun.
6) secondary_events en fazla 2 kısa olay içersin.
7) narrative kısa ama açıklayıcı olsun.
JSON şeması:
{
  "ok": true,
  "rejected": false,
  "tag": "good|warn|bad",
  "narrative": "kısa açıklama",
  "effects": {
    "cash": 0,
    "production": 0,
    "logistics": 0,
    "pump": 0,
    "rail": 0,
    "morale": 0,
    "risk": 0,
    "expenses": 0,
    "income": 0
  },
  "secondary_events": [
    {"title":"...","body":"...","tag":"warn","status":"Yan etki"}
  ]
}`;

app.get('/health', (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(apiKey), model });
});

app.post('/api/decision', async (req, res) => {
  const { decision, state } = req.body || {};

  if (!decision || typeof decision !== 'string') {
    return res.status(400).json({ ok: false, error: 'Karar metni eksik.' });
  }

  if (!client) {
    return res.json(fallbackDecisionEffects(decision));
  }

  try {
    const prompt = `Oyuncu kararı:\n${decision}\n\nMevcut state:\n${JSON.stringify(state || {}, null, 2)}`;

    const response = await client.responses.create({
      model,
      instructions: SYSTEM_PROMPT,
      input: prompt,
      max_output_tokens: 500
    });

    const raw = response.output_text?.trim();
    if (!raw) {
      throw new Error('Model boş yanıt verdi.');
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Model JSON dışında yanıt verdi: ${raw}`);
    }

    const safe = {
      ok: true,
      rejected: Boolean(parsed.rejected),
      tag: ['good', 'warn', 'bad'].includes(parsed.tag) ? parsed.tag : 'warn',
      narrative: typeof parsed.narrative === 'string' ? parsed.narrative : 'Karar yorumlandı.',
      effects: {},
      secondary_events: Array.isArray(parsed.secondary_events) ? parsed.secondary_events.slice(0, 2) : []
    };

    const allowedKeys = ['cash','production','logistics','pump','rail','morale','risk','expenses','income'];
    for (const key of allowedKeys) {
      const value = parsed.effects?.[key];
      safe.effects[key] = Number.isFinite(value) ? Math.round(clamp(value, -5000, 5000)) : 0;
    }

    return res.json(safe);
  } catch (error) {
    console.error('OpenAI error:', error?.message || error);
    const fallback = fallbackDecisionEffects(decision);
    fallback.narrative += ' (OpenAI bağlantısı sorunlu olduğu için yerel yorum kullanıldı.)';
    return res.json(fallback);
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Industrial Operator 1814 AI http://localhost:${port}`);
});
