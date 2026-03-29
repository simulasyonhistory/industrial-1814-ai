import { formatMoney } from "./engine.js";

function money(v, scenario) {
  return formatMoney(v, scenario.currencySymbol);
}

function tagClass(validity) {
  if (!validity) return "warn";
  if (validity.status === "invalid") return "bad";
  if (validity.status === "risky") return "warn";
  return "good";
}

export function renderScenarioSelector(currentId, scenarios) {
  const select = document.getElementById("scenarioSelect");
  select.innerHTML = Object.values(scenarios).map(s => `<option value="${s.id}" ${s.id === currentId ? "selected" : ""}>${s.title}</option>`).join("");
}

export function renderIntroModal(scenario) {
  const modal = document.getElementById("introModal");
  document.getElementById("introModalTitle").textContent = scenario.title;
  document.getElementById("introModalDate").textContent = scenario.introTitle;
  document.getElementById("introModalBody").textContent = scenario.longIntro;
  modal.classList.remove("hidden");
}

export function hideIntroModal() {
  document.getElementById("introModal").classList.add("hidden");
}

export function renderHeader(scenario, state) {
  document.getElementById("scenarioTitle").textContent = scenario.title;
  document.getElementById("scenarioMeta").textContent = `${state.time.current} · Tur ${state.time.turn}`;
  document.getElementById("goalText").textContent = scenario.goal;
  document.getElementById("summaryIntro").textContent = scenario.longIntro.split("\n\n")[0];
}

export function renderState(scenario, state) {
  document.getElementById("cashVal").textContent = money(state.resources.cash, scenario);
  document.getElementById("productionVal").textContent = `${Math.round(state.system.production)} ton`;
  document.getElementById("logisticsVal").textContent = `${Math.round(state.system.logistics)} ton`;
  document.getElementById("riskVal").textContent = `${Math.round(state.system.risk)}/100`;

  document.getElementById("activeBottleneckTitle").textContent = state.activeBottleneck.label;
  document.getElementById("activeBottleneckReason").textContent = state.activeBottleneck.reason;
  document.getElementById("activeBottleneckFlow").textContent = `Satışa hazır akış: ${Math.round(state.capacities.shippable)} ton/gün`;

  document.getElementById("lastChangeVal").textContent = state.systemStatus.lastChange;
  document.getElementById("nextRiskVal").textContent = state.systemStatus.nextRisk;
  document.getElementById("maintenanceVal").textContent = `${Math.round(state.systemStatus.maintenancePressure)}/100`;

  document.getElementById("monthlyIncome").textContent = money(state.economy.monthlyIncome, scenario);
  document.getElementById("monthlyCost").textContent = money(state.economy.monthlyCost, scenario);
  document.getElementById("monthlyNet").textContent = money(state.economy.monthlyNet, scenario);
  document.getElementById("shippableVal").textContent = `${Math.round(state.capacities.shippable)} ton`;
}

export function renderLastOutcome(scenario, state) {
  const box = document.getElementById("resultBox");
  const outcome = state.lastOutcome;
  if (!outcome) {
    box.innerHTML = `<div class="emptyBox">Henüz karar uygulanmadı.</div>`;
    return;
  }

  const narration = outcome.narration || {
    summary: outcome.transition.solved,
    whyBottleneck: outcome.bottleneck.reason,
    realityNote: outcome.validity.reason
  };

  box.innerHTML = `
    <div class="sectionTitle">Sonuç</div>
    <div class="miniGrid">
      <div class="miniCard"><span>Nakit</span><strong>${money(outcome.result.delta.cash, scenario)}</strong></div>
      <div class="miniCard"><span>Üretim</span><strong>${outcome.result.delta.production >= 0 ? "+" : ""}${outcome.result.delta.production}</strong></div>
      <div class="miniCard"><span>Lojistik</span><strong>${outcome.result.delta.logistics >= 0 ? "+" : ""}${outcome.result.delta.logistics}</strong></div>
      <div class="miniCard"><span>Risk</span><strong>${outcome.result.delta.risk >= 0 ? "+" : ""}${outcome.result.delta.risk}</strong></div>
    </div>

    <div class="kvBlock">
      <div><strong>Çözülen:</strong> ${outcome.transition.solved}</div>
      <div><strong>Darboğaz kayması:</strong> ${outcome.transition.shift}</div>
      <div><strong>Yeni darboğaz:</strong> ${outcome.bottleneck.label}</div>
      <div><strong>Sonraki risk:</strong> ${outcome.transition.nextRisk}</div>
    </div>

    <div class="kvBlock">
      <div><strong>Anlık yatırım:</strong> ${money(-Math.abs(outcome.result.immediateCost), scenario)}</div>
      <div><strong>Aylık yük:</strong> ${money(outcome.result.monthlyDelta, scenario)}</div>
      <div><strong>Süre:</strong> ${outcome.result.duration} ${outcome.result.durationUnit}</div>
      <div><strong>Geçerlilik:</strong> <span class="chip ${tagClass(outcome.validity)}">${outcome.validity.status}</span></div>
    </div>

    <div class="aiBox">
      <div class="sectionSubTitle">AI Değerlendirmesi</div>
      <p><strong>Sonuç yorumu:</strong> ${narration.summary}</p>
      <p><strong>Neden bu darboğaz aktif:</strong> ${narration.whyBottleneck}</p>
      <p><strong>Gerçeklik notu:</strong> ${narration.realityNote}</p>
    </div>
  `;
}

export function renderHistory(scenario, state) {
  const box = document.getElementById("historyBox");
  if (!state.reports.length) {
    box.innerHTML = `<div class="emptyBox">Henüz geçmiş kayıt yok.</div>`;
    return;
  }

  box.innerHTML = state.reports.map(rep => `
    <details class="historyItem" ${rep.turn === state.time.turn ? "open" : ""}>
      <summary>Tur ${rep.turn} · ${rep.dateLabel}</summary>
      <div class="historyBody">
        <div><strong>Karar:</strong> ${rep.rawDecision}</div>
        <div><strong>Çözülen:</strong> ${rep.transition.solved}</div>
        <div><strong>Darboğaz:</strong> ${rep.bottleneck.label}</div>
        <div><strong>Sonraki risk:</strong> ${rep.transition.nextRisk}</div>
        <div><strong>Anlık yatırım:</strong> ${money(-Math.abs(rep.result.immediateCost), scenario)}</div>
        <div><strong>Aylık yük:</strong> ${money(rep.result.monthlyDelta, scenario)}</div>
      </div>
    </details>
  `).join("");
}

export function renderLog(state) {
  const box = document.getElementById("logBox");
  box.innerHTML = state.log.map(item => `
    <div class="logEntry">
      <div class="logTop">
        <strong>${item.title}</strong>
        <span class="chip ${item.tag}">${item.status}</span>
      </div>
      <div class="logBody">${item.body}</div>
    </div>
  `).join("");
}

export function renderSaveLabel(state) {
  document.getElementById("saveHint").textContent = `Kaydedildi: autosave-${state.scenarioId}`;
}

export function renderAll(scenario, state) {
  renderHeader(scenario, state);
  renderState(scenario, state);
  renderLastOutcome(scenario, state);
  renderHistory(scenario, state);
  renderLog(state);
  renderSaveLabel(state);
}
