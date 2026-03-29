import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const saveDir = path.join(__dirname, "data", "saves");

await fs.mkdir(saveDir, { recursive: true });

app.use(express.json({ limit: "1mb" }));
app.use(express.static(publicDir));

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

function safeName(input = "autosave") {
  return String(input).replace(/[^a-zA-Z0-9_-]/g, "_");
}

function commentaryFallback({ decision, outcome, state, scenario }) {
  const solved = outcome.solved || "Sistem kısmen toparlandı.";
  const bottleneck = outcome.activeBottleneckLabel || "Yeni ana baskı belirsiz.";
  const nextRisk = outcome.nextRiskLabel || "Sistem dengesi izlenmeli.";
  const realism = `${scenario?.subtitle || scenario?.title || "Senaryo"} bağlamında karar sınırlı ama uygulanabilir görünüyor.`;

  let tone = "Karar sistemi hareket ettirdi ama tam çözüm üretmedi.";
  if (state.risk >= 70) tone = "Karar bir alanı rahatlattı ama sistem hâlâ kırılgan.";
  if (state.morale <= 35) tone = "Teknik ilerleme olsa bile insan tarafı baskı altında.";

  return {
    resultSummary: `${solved} ${tone}`,
    bottleneckAnalysis: `Aktif darboğaz şimdi ${bottleneck.toLowerCase()}.`,
    nextRisk: nextRisk,
    realismNote: realism,
    source: "fallback"
  };
}

function buildCommentaryPrompt({ decision, scenario, beforeState, afterState, outcome }) {
  return `
Sen tarihsel karar simülasyonunda sadece yorum katmanısın.

KURALLAR:
- Yeni sayı üretme.
- Yeni karar önerme.
- Oyuncunun yerine karar verme.
- Sadece verilen sonuçların ne anlama geldiğini açıkla.
- Ton analitik ve kısa olsun.
- JSON dışında hiçbir şey döndürme.

SENARYO:
${JSON.stringify({
  id: scenario?.id,
  title: scenario?.title,
  subtitle: scenario?.subtitle,
  role: scenario?.role,
  goal: scenario?.goal,
  constraints: scenario?.constraints
}, null, 2)}

OYUNCU KARARI:
${decision}

ÖNCEKİ DURUM:
${JSON.stringify(beforeState, null, 2)}

YENİ DURUM:
${JSON.stringify(afterState, null, 2)}

ENGINE ÇIKTISI:
${JSON.stringify(outcome, null, 2)}

JSON şeması:
{
  "resultSummary": "kısa Türkçe sonuç yorumu",
  "bottleneckAnalysis": "darboğazın neden kaydığını açıklayan kısa analiz",
  "nextRisk": "bir sonraki riskin kısa ifadesi",
  "realismNote": "kararın döneme ve fiziksel gerçekliğe uygunluğunu kısaca değerlendir"
}
  `.trim();
}

async function askOpenAICommentary(payload) {
  if (!client) throw new Error("OPENAI_API_KEY eksik.");

  const response = await client.responses.create({
    model: MODEL,
    input: buildCommentaryPrompt(payload),
    text: {
      format: {
        type: "json_schema",
        name: "commentary_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            resultSummary: { type: "string" },
            bottleneckAnalysis: { type: "string" },
            nextRisk: { type: "string" },
            realismNote: { type: "string" }
          },
          required: ["resultSummary", "bottleneckAnalysis", "nextRisk", "realismNote"]
        }
      }
    }
  });

  const text = response.output_text?.trim();
  if (!text) throw new Error("OpenAI cevabı boş geldi.");
  return JSON.parse(text);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(OPENAI_API_KEY), model: MODEL });
});

app.post("/api/commentary", async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.decision || !payload.outcome || !payload.state) {
      return res.status(400).json({ ok: false, error: "Eksik commentary payload." });
    }

    try {
      const result = await askOpenAICommentary(payload);
      return res.json({ ok: true, commentary: { ...result, source: "openai" } });
    } catch (err) {
      console.error("COMMENTARY ERROR:", err.message);
      const fallback = commentaryFallback({
        decision: payload.decision,
        outcome: payload.outcome,
        state: payload.state,
        scenario: payload.scenario
      });
      return res.json({ ok: true, commentary: fallback });
    }
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ ok: false, error: "Yorum servisi hata verdi." });
  }
});

app.get("/api/saves", async (_req, res) => {
  try {
    const files = await fs.readdir(saveDir);
    const items = [];

    for (const file of files.filter(name => name.endsWith(".json"))) {
      try {
        const fullPath = path.join(saveDir, file);
        const raw = await fs.readFile(fullPath, "utf8");
        const parsed = JSON.parse(raw);
        items.push({
          slot: file.replace(/\.json$/i, ""),
          scenarioId: parsed.scenarioId,
          updatedAt: parsed.updatedAt,
          turn: parsed.state?.turn || 0,
          dateLabel: parsed.state?.dateLabel || "-"
        });
      } catch {
        // skip broken files
      }
    }

    items.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    return res.json({ ok: true, saves: items });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Kayıt listesi okunamadı." });
  }
});

app.get("/api/save/:slot", async (req, res) => {
  try {
    const slot = safeName(req.params.slot);
    const fullPath = path.join(saveDir, `${slot}.json`);
    if (!existsSync(fullPath)) {
      return res.status(404).json({ ok: false, error: "Kayıt bulunamadı." });
    }

    const raw = await fs.readFile(fullPath, "utf8");
    const parsed = JSON.parse(raw);
    return res.json({ ok: true, ...parsed });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Kayıt okunamadı." });
  }
});

app.post("/api/save", async (req, res) => {
  try {
    const slot = safeName(req.body?.slot || "autosave");
    const scenarioId = String(req.body?.scenarioId || "unknown");
    const state = req.body?.state;
    if (!state) {
      return res.status(400).json({ ok: false, error: "Kaydedilecek state yok." });
    }

    const payload = {
      slot,
      scenarioId,
      updatedAt: new Date().toISOString(),
      state
    };

    const fullPath = path.join(saveDir, `${slot}.json`);
    await fs.writeFile(fullPath, JSON.stringify(payload, null, 2), "utf8");
    return res.json({ ok: true, slot, updatedAt: payload.updatedAt });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Kayıt yazılamadı." });
  }
});

app.delete("/api/save/:slot", async (req, res) => {
  try {
    const slot = safeName(req.params.slot);
    const fullPath = path.join(saveDir, `${slot}.json`);
    if (!existsSync(fullPath)) {
      return res.status(404).json({ ok: false, error: "Kayıt bulunamadı." });
    }
    await fs.unlink(fullPath);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Kayıt silinemedi." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Historical Operator Engine v3 listening on ${PORT}`);
});
