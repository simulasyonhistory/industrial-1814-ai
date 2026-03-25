import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

app.post("/ai-decision", async (req, res) => {
  const { decision, state } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `
Sen 1814 yılında çalışan bir endüstri simülasyon motorusun.

Oyuncu kararı:
"${decision}"

Mevcut durum:
- Üretim: ${state.production}
- Lojistik: ${state.logistics}
- Moral: ${state.morale}
- Risk: ${state.risk}

Kurallar:
- Kararın mantıklı etkilerini hesapla
- Sayısal değişim ver
- Kısa yorum yap

JSON formatında dön:
{
  "production": number,
  "logistics": number,
  "morale": number,
  "risk": number,
  "summary": "kısa yorum"
}
        `
      })
    });

    const data = await response.json();

    const text = data.output[0].content[0].text;

    const parsed = JSON.parse(text);

    res.json({
      success: true,
      result: parsed
    });

  } catch (err) {
    console.log("AI ERROR:", err);

    // fallback
    res.json({
      success: false,
      result: {
        production: +5,
        logistics: +3,
        morale: +2,
        risk: +1,
        summary: "Yerel sistem yorumladı (AI fallback)"
      }
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
