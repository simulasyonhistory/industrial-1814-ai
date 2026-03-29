import { scenarios, getScenarioFromURL } from "./scenarios.js";
import { createInitialState, processDecision } from "./engine.js";
import { renderAll, renderScenarioSelector, renderIntroModal, hideIntroModal } from "./ui.js";

let scenario = getScenarioFromURL();
let state = null;

async function loadState() {
  const res = await fetch(`/api/save/${scenario.id}`);
  const data = await res.json();
  state = data.state || createInitialState(scenario);
  state.scenarioId = scenario.id;
}

async function saveState() {
  await fetch(`/api/save/${scenario.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state })
  });
}

async function deleteSave() {
  await fetch(`/api/save/${scenario.id}`, { method: "DELETE" });
}

async function narrate(outcome) {
  const res = await fetch("/api/narrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenario,
      rawDecision: outcome.rawDecision,
      validity: outcome.validity,
      transition: outcome.transition,
      bottleneck: outcome.bottleneck,
      previousBottleneck: outcome.previousBottleneck,
      economy: outcome.economy,
      result: outcome.result
    })
  });
  const data = await res.json();
  if (data.ok) {
    state.lastOutcome.narration = data.narration;
    state.reports[0].narration = data.narration;
  }
}

async function applyDecision() {
  const input = document.getElementById("decisionInput");
  const btn = document.getElementById("applyBtn");
  const raw = input.value.trim();
  if (!raw) return alert("Önce bir karar yaz.");

  btn.disabled = true;
  btn.textContent = "İşleniyor...";
  try {
    state = processDecision(state, raw, scenario);
    await narrate(state.lastOutcome);
    await saveState();
    renderAll(scenario, state);
    input.value = "";
  } catch (err) {
    console.error(err);
    alert("Karar işlenirken hata oluştu.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Kararı uygula";
  }
}

async function resetScenario() {
  if (!confirm("Bu senaryonun kaydını sıfırlamak istiyor musun?")) return;
  await deleteSave();
  state = createInitialState(scenario);
  state.scenarioId = scenario.id;
  renderAll(scenario, state);
  renderIntroModal(scenario);
}

async function changeScenario(id) {
  scenario = scenarios[id] || scenarios.newcastle1814;
  const url = new URL(window.location.href);
  url.searchParams.set("scenario", scenario.id);
  window.history.replaceState({}, "", url.toString());
  await loadState();
  renderScenarioSelector(scenario.id, scenarios);
  renderAll(scenario, state);
  if (!state.introSeen) renderIntroModal(scenario);
}

window.addEventListener("DOMContentLoaded", async () => {
  renderScenarioSelector(scenario.id, scenarios);
  await loadState();
  renderAll(scenario, state);
  if (!state.introSeen) renderIntroModal(scenario);

  document.getElementById("applyBtn").addEventListener("click", applyDecision);
  document.getElementById("resetBtn").addEventListener("click", resetScenario);
  document.getElementById("exampleBtn").addEventListener("click", () => {
    document.getElementById("decisionInput").value = scenario.examples[Math.floor(Math.random() * scenario.examples.length)];
  });
  document.getElementById("decisionInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      applyDecision();
    }
  });
  document.getElementById("scenarioSelect").addEventListener("change", (e) => changeScenario(e.target.value));
  document.getElementById("introCloseBtn").addEventListener("click", async () => {
    state.introSeen = true;
    await saveState();
    hideIntroModal();
  });
});
