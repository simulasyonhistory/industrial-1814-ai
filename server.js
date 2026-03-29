import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAVES_DIR = path.join(__dirname, "data", "saves");

fs.mkdirSync(SAVES_DIR, { recursive: true });

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

function safeId(value) {
  return String(value || "default").replace(/[^a-zA-Z0-9_-]/g, "");
}

function saveFileForScenario(scenarioId) {
  return path.join(SAVES_DIR, `autosave-${safeId(scenarioId)}.json`);
}

function loadSave(scenarioId) {
  const fp = saveFileForScenario(scenarioId);
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, "utf8"));
  } catch {
    return null;
  }
}

function writeSave(scenarioId, state) {
  const fp = saveFileForScenario(scenarioId);
  fs.writeFileSync(fp, JSON.stringify(state, null, 2), "utf8");
}

function buildNarrationPrompt(payload) {
  const {
    scenario,
    rawDecision,
    validity,
    transition,
    bottleneck,
    previousBottleneck,
    economy,
    result
  } = payload;

  return `
Sen tarihsel operasyon simülasyonunda sadece anlatıcı ve doğrulayıcısın.
Karar vermiyorsun, alternatif strateji önermiyorsun, sayı uydurmuyorsun.

SENARYO:
- Başlık: ${scenario.title}
- Dönem: ${scenario.startDateLabel}
- Yer: ${scenario.location}
- Açıklama: ${scenario.longIntro}

OYUNCU KARARI:
${rawDecision}

GEÇERLİLİK:
- durum: ${validity.status}
- gerekçe: ${validity.reason}

ENGINE SONUCU:
- çözülen: ${transition.solved || "belirsiz"}
- yeni darboğaz: ${bottleneck.label}
- darboğaz kayması: ${transition.shift || "yok"}
- sonraki risk: ${transition.nextRisk}
- anlık yatırım: ${result.immediateCost}
- aylık yük: ${result.monthlyDelta}
- süre: ${result.duration} ${result.durationUnit}
- nakit etkisi: ${result.delta.cash}
- üretim etkisi: ${result.delta.production}
- lojistik etkisi: ${result.delta.logistics}
- moral etkisi: ${result.delta.morale}
- risk etkisi: ${result.delta.risk}
- altyapı etkisi: ${result.delta.infrastructure}

EKONOMİ:
- aylık gelir: ${economy.monthlyIncome}
- aylık gider: ${economy.monthlyCost}
- aylık net: ${economy.monthlyNet}

Kurallar:
- Türkçe yaz.
- Dizi dili kullanma.
- Kısa, rapor tonunda, net yaz.
- JSON dışında hiçbir şey döndürme.
- Sayı uydurma, mevcut sayıları tekrar etme zorunlu değil.

İstenen JSON:
{
  "summary": "3-5 cümlelik kısa sonuç anlatımı",
  "whyBottleneck": "aktif darboğazın neden oluştuğu",
  "realityNote": "kararın tarihsel/fiziksel uygunluğu hakkında tek cümle"
}`.trim();
}

async function narrate(payload) {
  if (!client) {
    return {
      summary: `${payload.transition.solved || "Karar"} sonrası sistem ${payload.bottleneck.label.toLowerCase()} baskısı altında kaldı. ${payload.transition.nextRisk}`,
      whyBottleneck: `Aktif darboğaz şu anda ${payload.bottleneck.label.toLowerCase()} çünkü sistemin taşıyıcı sınırı bu alanda oluştu.`,
      realityNote: payload.validity.status === "invalid"
        ? payload.validity.reason
        : "Karar döneme göre sınırlı ama uygulanabilir görünüyor."
    };
  }

  const response = await client.responses.create({
    model: MODEL,
    input: buildNarrationPrompt(payload),
    temperature: 0.3
  });

  const text = response.output_text?.trim();
  if (!text) throw new Error("AI anlatımı boş geldi.");
  return JSON.parse(text);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, model: MODEL, hasKey: Boolean(OPENAI_API_KEY) });
});

app.get("/api/save/:scenarioId", (req, res) => {
  const scenarioId = req.params.scenarioId;
  const state = loadSave(scenarioId);
  res.json({ ok: true, state });
});

app.post("/api/save/:scenarioId", (req, res) => {
  const scenarioId = req.params.scenarioId;
  const { state } = req.body || {};
  if (!state) return res.status(400).json({ ok: false, error: "State boş olamaz." });
  writeSave(scenarioId, state);
  res.json({ ok: true });
});

app.delete("/api/save/:scenarioId", (req, res) => {
  const fp = saveFileForScenario(req.params.scenarioId);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
  res.json({ ok: true });
});

app.post("/api/narrate", async (req, res) => {
  try {
    const payload = req.body || {};
    const narration = await narrate(payload);
    res.json({ ok: true, narration });
  } catch (err) {
    console.error("NARRATE ERROR:", err);
    res.status(500).json({ ok: false, error: "Anlatım üretilemedi." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Historical Operator Engine v3 listening on ${PORT}`);
});
