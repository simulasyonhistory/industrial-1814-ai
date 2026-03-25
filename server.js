import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function localFallback(decision, state = {}) {
  const text = String(decision || "").toLowerCase();

  let production = 0;
  let logistics = 0;
  let morale = 0;
  let risk = 0;
  let summary = "Karar yerel sistem tarafından yorumlandı.";

  if (
    text.includes("pompa") ||
    text.includes("watt") ||
    text.includes("bakım")
  ) {
    production += 40;
    risk += 4;
    summary += " Pompa verimi ve üretim baskısı arttı.";
  }

  if (
    text.includes("lojistik") ||
    text.includes("taşıma") ||
    text.includes("vagon") ||
    text.includes("at") ||
    text.includes("hat")
  ) {
    logistics += 35;
    summary += " Lojistik hat güçlendi.";
  }

  if (
    text.includes("ray") ||
    text.includes("balast") ||
    text.includes("zemin") ||
    text.includes("altyapı")
  ) {
    logistics += 15;
    risk -= 6;
    summary += " Ray ve zemin stabilitesi arttı.";
  }

  if (
    text.includes("işçi") ||
    text.includes("maaş") ||
    text.includes("erzak") ||
    text.includes("bira") ||
    text.includes("moral")
  ) {
    morale += 12;
    risk -= 4;
    summary += " İşçi morali yükseldi.";
  }

  if (
    text.includes("temkinli") ||
    text.includes("yavaş") ||
    text.includes("güvenli")
  ) {
    production -= 10;
    risk -= 8;
    summary += " Daha güvenli ama daha yavaş bir yol seçildi.";
  }

  return {
    production,
    logistics,
    morale,
    risk,
    summary
  };
}

async function askOpenAI(decision, state) {
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

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();

  let text = "";

  if (typeof data.output_text === "string" && data.output_text.trim()) {
    text = data.output_text.trim();
  } else if (Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item.type === "message" && Array.isArray(item.content)) {
        for (const part of item.content) {
          if (part.type === "output_text" && part.text) {
            text = part.text.trim();
            break;
          }
        }
      }
      if (text) break;
    }
  }

  if (!text) {
    throw new Error("OpenAI cevabı boş geldi.");
  }

  const parsed = JSON.parse(text);

  return {
    production: Number(parsed.production || 0),
    logistics: Number(parsed.logistics || 0),
    morale: Number(parsed.morale || 0),
    risk: Number(parsed.risk || 0),
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
      if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY eksik.");
      }

      result = await askOpenAI(String(decision), state || {});
    } catch (aiError) {
      console.error("AI ERROR:", aiError.message);
      result = localFallback(String(decision), state || {});
      result.summary += " (OpenAI bağlantısı sorunlu olduğu için yerel yorum kullanıldı.)";
    }

    result.production = clamp(result.production, -100, 100);
    result.logistics = clamp(result.logistics, -100, 100);
    result.morale = clamp(result.morale, -30, 30);
    result.risk = clamp(result.risk, -30, 30);

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
    model: OPENAI_MODEL,
    hasKey: Boolean(OPENAI_API_KEY)
  });
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/ai-decision") || req.path.startsWith("/health")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
