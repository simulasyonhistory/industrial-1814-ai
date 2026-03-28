import { getScenarioFromURL } from "./scenarios.js";
import { createInitialState, applyDecision } from "./engine.js";
import { renderAll, renderScenarioHeader, fillExample } from "./ui.js";

const scenario = getScenarioFromURL();
let state = createInitialState(scenario);

function resetState() {
  state = createInitialState(scenario);
  renderAll(state);
}

async function submitDecision() {
  const input = document.getElementById("decisionInput");
  const btn = document.getElementById("applyBtn");
  const raw = input.value.trim();

  if (!raw) {
    alert("Önce bir karar yaz.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "İşleniyor...";

  try {
    const res = await fetch("/ai-decision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        decision: raw,
        state,
        scenario
      })
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.error || "Karar işlenemedi.");
      return;
    }

    state = applyDecision(state, data.result, raw);
    input.value = "";
    renderAll(state);
  } catch (err) {
    console.error(err);
    alert("Sunucuya bağlanırken hata oluştu.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Serbest kararı uygula";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  renderScenarioHeader(scenario);
  renderAll(state);

  document.getElementById("applyBtn").addEventListener("click", submitDecision);
  document.getElementById("resetBtn").addEventListener("click", resetState);
  document.getElementById("helpBtn").addEventListener("click", () => {
    alert("Kararını yaz. Sistem bunun üretim, lojistik, altyapı, moral, risk ve nakit etkisini yorumlar. Her karar geçmiş raporlara eklenir.");
  });
  document.getElementById("exampleBtn").addEventListener("click", () => fillExample(scenario));
  document.getElementById("decisionInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitDecision();
    }
  });
});
