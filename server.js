import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function localFallback(decision) {
  const text = String(decision || "").toLowerCase();

  let production = 0;
  let logistics = 0;
  let morale = 0;
  let risk = 0;
  let summary = "Karar yerel sistem tarafından yorumlandı.";

  if (text.includes("pompa") || text.includes("watt") || text.includes("bakım")) {
    production += 35;
    risk += 4;
    summary += " Pompa ve üretim baskısı arttı.";
  }

  if (text.includes("lojistik") || text.includes("taşıma") || text.includes("vagon") || text.includes("at")) {
    logistics += 30;
    summary += " Taşıma hattı güçlendi.";
  }

  if (text.includes("ray") || text.includes("balast") || text.includes("zemin") || text.includes("altyapı")) {
    logistics += 12;
    risk -= 6;
    summary += " Hat stabilitesi arttı.";
  }

  if (text.includes("işçi") || text.includes("maaş") || text.includes("erzak") || text.includes("bira") || text.includes("moral")) {
    morale += 12;
    risk -= 4;
    summary += " İşçi morali yükseldi.";
  }

  if (text.includes("temkinli") || text.includes("yavaş") || text.includes("güvenli")) {
    production -= 8;
    risk -= 8;
    summary += " Daha güvenli ama daha yavaş bir yol seçildi.";
  }

  return {
    production: clamp(production, -100, 100),
    logistics: clamp(logistics, -100, 100),
    morale: clamp(morale, -30, 30),
    risk: clamp(risk, -30, 30),
    summary
  };
}

async function askOpenAI(decision, state) {
  if (!client) {
    throw new Error("OPENAI_API_KEY eksik.");
  }

  const prompt = `
Sen 1814 Newcastle kömür ve lojistik simülasyonunda karar yorumlayıcısısın.

Oyuncu kararı:
"${decision}"

Mevcut durum:
${JSON.stringify(state, null, 2)}

Görev:
Oyuncu kararının 1814 koşullarına uygun etkilerini hesapla.

Kurallar:
- Dönem dışı teknoloji kabul etme.
- Sadece şu alanları döndür:
  production, logistics, morale, risk, summary
- production, logistics, morale, risk tam sayı olsun.
- Aşırı uç değer verme.
- summary kısa Türkçe açıklama olsun.
- SADECE JSON döndür. Başka hiçbir metin yazma.

JSON formatı:
{
  "production": 0,
  "logistics": 0,
  "morale": 0,
  "risk": 0,
  "summary": "kısa açıklama"
}
`.trim();

  const response = await client.responses.create({
    model: MODEL,
    input: prompt
  });

  const text = response.output_text?.trim();

  if (!text) {
    throw new Error("OpenAI cevabı boş geldi.");
  }

  const parsed = JSON.parse(text);

  return {
    production: clamp(Number(parsed.production || 0), -100, 100),
    logistics: clamp(Number(parsed.logistics || 0), -100, 100),
    morale: clamp(Number(parsed.morale || 0), -30, 30),
    risk: clamp(Number(parsed.risk || 0), -30, 30),
    summary: String(parsed.summary || "AI yorumladı.")
  };
}

app.post("/ai-decision", async (req, res) => {
  try {
    const { decision, state } = req.body || {};

    if (!decision || !String(decision).trim()) {
      return res.status(400).json({
        ok: false,
        error: "Karar boş olamaz."
      });
    }

    let result;

    try {
      result = await askOpenAI(String(decision), state || {});
    } catch (err) {
      console.error("AI ERROR:", err.message);
      result = localFallback(String(decision));
      result.summary += " (OpenAI bağlantısı sorunlu olduğu için yerel yorum kullanıldı.)";
    }

    return res.json({
      ok: true,
      result
    });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Sunucu yanıt veremedi."
    });
  }
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    hasKey: Boolean(OPENAI_API_KEY),
    model: MODEL
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
