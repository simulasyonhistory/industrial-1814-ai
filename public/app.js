import { getScenarioFromURL, listScenarios } from "./scenarios.js";
import { createInitialState, evaluateDecision, attachCommentary } from "./engine.js";
import { renderAll, renderShell, fillExample } from "./ui.js";

const scenario = getScenarioFromURL();
let state = createInitialState(scenario);
let activeSlot = `autosave-${scenario.id}`;

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || "İşlem başarısız.");
  }
  return data;
}

async function loadSave(slot) {
  try {
    const data = await api(`/api/save/${encodeURIComponent(slot)}`);
    if (data?.state) {
      state = data.state;
      activeSlot = slot;
      renderAll(state, scenario, { label: `Kayıt: ${slot}` });
      return true;
    }
  } catch {
    // ignore missing autosave
  }
  return false;
}

async function saveState() {
  try {
    await api("/api/save", {
      method: "POST",
      body: JSON.stringify({
        slot: activeSlot,
        scenarioId: scenario.id,
        state
      })
    });
    renderAll(state, scenario, { label: `Kaydedildi: ${activeSlot}` });
  } catch (err) {
    console.error(err);
  }
}

function resetState() {
  state = createInitialState(scenario);
  renderAll(state, scenario, { label: `Yeni oyun · ${activeSlot}` });
  saveState();
}

async function submitDecision() {
  const input = document.getElementById("decisionInput");
  const button = document.getElementById("applyBtn");
  const decision = input.value.trim();
  if (!decision) {
    alert("Önce bir karar yaz.");
    return;
  }

  button.disabled = true;
  button.textContent = "İşleniyor...";

  try {
    const beforeState = JSON.parse(JSON.stringify(state));
    const { nextState, outcome } = evaluateDecision(state, decision, scenario);
    state = nextState;
    renderAll(state, scenario, { label: `Kaydediliyor: ${activeSlot}` });
    input.value = "";

    try {
      const data = await api("/api/commentary", {
        method: "POST",
        body: JSON.stringify({
          decision,
          scenario,
          beforeState,
          state,
          outcome
        })
      });
      state = attachCommentary(state, data.commentary);
    } catch (err) {
      console.error("commentary fail", err);
    }

    renderAll(state, scenario, { label: `Aktif kayıt: ${activeSlot}` });
    await saveState();
  } catch (err) {
    console.error(err);
    alert("Karar işlenirken hata oluştu.");
  } finally {
    button.disabled = false;
    button.textContent = "Kararı uygula";
  }
}

async function populateScenarioSelect() {
  const select = document.getElementById("scenarioSelect");
  select.innerHTML = listScenarios().map(item => `
    <option value="${item.id}" ${item.id === scenario.id ? "selected" : ""}>${item.title}</option>
  `).join("");

  select.addEventListener("change", (e) => {
    const id = e.target.value;
    const url = new URL(window.location.href);
    url.searchParams.set("scenario", id);
    window.location.href = url.toString();
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  renderShell(scenario);
  await populateScenarioSelect();

  const loaded = await loadSave(activeSlot);
  if (!loaded) {
    renderAll(state, scenario, { label: `Yeni oyun · ${activeSlot}` });
    await saveState();
  }

  document.getElementById("applyBtn").addEventListener("click", submitDecision);
  document.getElementById("resetBtn").addEventListener("click", resetState);
  document.getElementById("exampleBtn").addEventListener("click", () => fillExample(scenario));
  document.getElementById("decisionInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitDecision();
    }
  });
});
