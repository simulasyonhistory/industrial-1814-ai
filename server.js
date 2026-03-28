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

function detectTimeUnit(scenario = {}) {
  return scenario.timeUnit || "ay";
}

function fallbackDecision(decision, state = {}, scenario = {}) {
  const text = String(decision || "").toLowerCase();
  const unit = detectTimeUnit(scenario);

  let cash = 0;
  let production = 0;
  let logistics = 0;
  let infrastructure = 0;
  let morale = 0;
  let risk = 0;
  let duration = 1;
  let summary = "Karar yerel sistem tarafından yorumlandı.";

  if (text.includes("ray") || text.includes("altyapı") || text.includes("zemin") || text.includes("balast")) {
    infrastructure += 8;
    logistics += 18;
    cash -= 1400;
    risk -= 4;
    duration += 1;
    summary += " Hat stabilitesi arttı, taşıma hattı güçlendi.";
  }

  if (text.includes("pompa") || text.includes("bakım") || text.includes("watt")) {
    production += 24;
    infrastructure += 4;
    cash -= 900;
    risk += 3;
    duration += 1;
    summary += " Mekanik verim yükseldi fakat bakım maliyeti arttı.";
  }

  if (text.includes("işçi") || text.includes("maaş") || text.includes("erzak") || text.includes("barınma") || text.includes("moral")) {
    morale += 10;
    cash -= 450;
    risk -= 3;
    duration += 1;
    summary += " İşçi düzeni ve moral toparlandı.";
  }

  if (text.includes("lojistik") || text.includes("taşıma") || text.includes("vagon") || text.includes("at")) {
    logistics += 20;
    cash -= 700;
    duration += 1;
    summary += " Taşıma kapasitesi genişledi.";
  }

  if (text.includes("hız") || text.includes("acele") || text.includes("zorla")) {
    production += 14;
    logistics += 6;
    morale -= 4;
    risk += 8;
    summary += " Hız baskısı çıktıyı artırdı ama sistemi gerdi.";
  }

  if (text.includes("temkinli") || text.includes("yavaş") || text.includes("güvenli")) {
    production -= 6;
    risk -= 8;
    duration += 1;
    summary += " Daha güvenli ama daha yavaş bir yol seçildi.";
  }

  if (summary === "Karar yerel sistem tarafından yorumlandı.") {
    logistics += 8;
    risk -= 2;
    summary += " Sınırlı ama olumlu bir operasyon düzeltmesi oluştu.";
  }

  return {
    cash: clamp(Math.round(cash), -5000, 5000),
    production: clamp(Math.round(production), -80, 80),
    logistics: clamp(Math.round(logistics), -80, 80),
    infrastructure: clamp(Math.round(infrastructure), -30, 30),
    morale: clamp(Math.round(morale), -20, 20),
    risk: clamp(Math.round(risk), -20, 20),
    duration: clamp(Math.round(duration), 1, 24),
    durationUnit: unit,
    summary
  };
}

function buildPrompt(decision, state, scenario) {
  return `
Sen tarihsel bir operasyon simülasyonu için karar yorumlayıcısısın.

SENARYO:
${JSON.stringify(scenario, null, 2)}

MEVCUT DURUM:
${JSON.stringify(state, null, 2)}

OYUNCU KARARI:
${decision}

Görevin:
- Kararın tarihsel bağlam içinde olası etkilerini yorumla.
- Aşırı uçlara gitme.
- Trade-off üret: iyi etkiler ile yan etkiler dengeli olsun.
- Sadece JSON döndür.
- Dönüş alanları:
cash, production, logistics, infrastructure, morale, risk, duration, durationUnit, summary
- duration sayısal olsun.
- durationUnit şu değerlerden biri olsun: "gün", "hafta", "ay", "yıl"

JSON formatı:
{
  "cash": 0,
  "production": 0,
  "logistics": 0,
  "infrastructure": 0,
  "morale": 0,
  "risk": 0,
  "duration": 1,
  "durationUnit": "ay",
  "summary": "kısa Türkçe açıklama"
}
`.trim();
}

async function askOpenAI(decision, state, scenario) {
  if (!client) {
    throw new Error("OPENAI_API_KEY eksik.");
  }

  const response = await client.responses.create({
    model: MODEL,
    input: buildPrompt(decision, state, scenario)
  });

  const text = response.output_text?.trim();
  if (!text) throw new Error("OpenAI cevabı boş geldi.");

  const parsed = JSON.parse(text);

  return {
    cash: clamp(Number(parsed.cash || 0), -5000, 5000),
    production: clamp(Number(parsed.production || 0), -80, 80),
    logistics: clamp(Number(parsed.logistics || 0), -80, 80),
    infrastructure: clamp(Number(parsed.infrastructure || 0), -30, 30),
    morale: clamp(Number(parsed.morale || 0), -20, 20),
    risk: clamp(Number(parsed.risk || 0), -20, 20),
    duration: clamp(Number(parsed.duration || 1), 1, 24),
    durationUnit: ["gün","hafta","ay","yıl"].includes(parsed.durationUnit) ? parsed.durationUnit : detectTimeUnit(scenario),
    summary: String(parsed.summary || "AI karar yorumu oluşturdu.")
  };
}

app.post("/ai-decision", async (req, res) => {
  try {
    const { decision, state, scenario } = req.body || {};
    if (!decision || !String(decision).trim()) {
      return res.status(400).json({ ok: false, error: "Karar boş olamaz." });
    }

    let result;
    let source = "openai";

    try {
      result = await askOpenAI(String(decision), state || {}, scenario || {});
    } catch (err) {
      console.error("AI ERROR:", err.message);
      result = fallbackDecision(String(decision), state || {}, scenario || {});
      result.summary += " (OpenAI bağlantısı sorunlu olduğu için yerel yorum kullanıldı.)";
      source = "fallback";
    }

    return res.json({ ok: true, source, result });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ ok: false, error: "Sunucu yanıt veremedi." });
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
  console.log(`Historical Operator Engine listening on ${PORT}`);
});
