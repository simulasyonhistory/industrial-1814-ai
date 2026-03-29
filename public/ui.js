import { computeEconomy, formatMoney } from "./engine.js";

function byId(id) {
  return document.getElementById(id);
}

function statCard(label, value, tone = "") {
  return `<div class="statCard ${tone}"><div class="statLabel">${label}</div><div class="statValue">${value}</div></div>`;
}

function renderDelta(value, scenario) {
  const num = Number(value || 0);
  if (num === 0) return "0";
  const sign = num > 0 ? "+" : "";
  return sign + formatMoney(num, scenario);
}

export function renderShell(scenario) {
  byId("scenarioTitle").textContent = scenario.title;
  byId("scenarioSubtitle").textContent = scenario.subtitle;
  byId("goalText").textContent = scenario.goal;
  byId("introText").textContent = scenario.intro;
}

export function fillExample(scenario) {
  const examples = scenario.decisionExamples || [];
  if (!examples.length) return;
  byId("decisionInput").value = examples[Math.floor(Math.random() * examples.length)];
}

export function renderAll(state, scenario, saveMeta = {}) {
  const eco = computeEconomy(state);

  byId("headerMeta").innerHTML = `${state.dateLabel} · Tur ${state.turn}`;
  byId("statusGrid").innerHTML = [
    statCard("Nakit", formatMoney(state.cash, scenario), state.cash < 0 ? "bad" : ""),
    statCard("Üretim", `${Math.round(state.production)} ton`),
    statCard("Lojistik", `${Math.round(state.logistics)} ton`),
    statCard("Risk", `${Math.round(state.risk)}/100`, state.risk >= 70 ? "bad" : state.risk >= 45 ? "warn" : "good")
  ].join("");

  byId("bottleneckBox").innerHTML = `
    <div class="blockTitle">Aktif Darboğaz</div>
    <div class="bottleneckTitle">${state.activeBottleneckLabel}</div>
    <div class="mutedText">${state.bottleneckReason}</div>
    <div class="tinyStat">Satışa hazır akış: <strong>${eco.shippable} ton/gün</strong></div>
  `;

  byId("systemShiftBox").innerHTML = `
    <div class="blockTitle">Sistem Durumu</div>
    <div class="stackLine"><span>Son değişim</span><strong>${state.lastSummary || "-"}</strong></div>
    <div class="stackLine"><span>Sonraki risk</span><strong>${state.nextRiskLabel || "-"}</strong></div>
    <div class="stackLine"><span>Bakım baskısı</span><strong>${state.maintenance}/100</strong></div>
  `;

  byId("summaryBox").innerHTML = `
    <div class="stackLine"><span>Aylık gelir</span><strong>${formatMoney(eco.income, scenario)}</strong></div>
    <div class="stackLine"><span>Aylık gider</span><strong>${formatMoney(eco.expenses, scenario)}</strong></div>
    <div class="stackLine"><span>Aylık net</span><strong>${formatMoney(eco.net, scenario)}</strong></div>
    <div class="stackLine"><span>Liman kapasitesi</span><strong>${Math.round(state.portCapacity)} ton</strong></div>
  `;

  const latest = state.reports?.[0];
  if (!latest) {
    byId("resultBox").innerHTML = `<div class="mutedText">Henüz karar uygulanmadı.</div>`;
  } else {
    const c = latest.commentary;
    byId("resultBox").innerHTML = `
      <div class="blockTitle">Sonuç</div>
      <div class="deltaGrid">
        <div class="deltaItem"><span>Nakit</span><strong>${renderDelta(latest.outcome.changedBy.cash, scenario)}</strong></div>
        <div class="deltaItem"><span>Üretim</span><strong>${latest.outcome.changedBy.production > 0 ? "+" : ""}${latest.outcome.changedBy.production}</strong></div>
        <div class="deltaItem"><span>Lojistik</span><strong>${latest.outcome.changedBy.logistics > 0 ? "+" : ""}${latest.outcome.changedBy.logistics}</strong></div>
        <div class="deltaItem"><span>Risk</span><strong>${latest.outcome.changedBy.risk > 0 ? "+" : ""}${latest.outcome.changedBy.risk}</strong></div>
      </div>
      <div class="resultText"><strong>Çözülen:</strong> ${latest.outcome.solved}</div>
      <div class="resultText"><strong>Darboğaz kayması:</strong> ${latest.outcome.bottleneckShift}</div>
      <div class="resultText"><strong>Yeni darboğaz:</strong> ${latest.outcome.activeBottleneckLabel}</div>
      <div class="resultText"><strong>Sonraki risk:</strong> ${latest.outcome.nextRiskLabel}</div>
      ${c ? `
        <div class="aiBox">
          <div class="aiTitle">AI Değerlendirmesi</div>
          <div class="resultText"><strong>Sonuç yorumu:</strong> ${c.resultSummary}</div>
          <div class="resultText"><strong>Neden bu darboğaz aktif:</strong> ${c.bottleneckAnalysis}</div>
          <div class="resultText"><strong>Gerçeklik notu:</strong> ${c.realismNote}</div>
        </div>
      ` : `<div class="mutedText">AI değerlendirmesi bekleniyor...</div>`}
    `;
  }

  byId("saveInfo").textContent = saveMeta.label || "Autosave aktif";

  byId("historyBox").innerHTML = (state.reports || []).length
    ? state.reports.map((rep) => `
      <details class="historyItem">
        <summary>Tur ${rep.turn} · ${rep.dateLabel}</summary>
        <div class="historyBody">
          <div><strong>Karar:</strong> ${rep.decision}</div>
          <div><strong>Çözülen:</strong> ${rep.outcome.solved}</div>
          <div><strong>Darboğaz:</strong> ${rep.outcome.activeBottleneckLabel}</div>
          <div><strong>Sonraki risk:</strong> ${rep.outcome.nextRiskLabel}</div>
        </div>
      </details>
    `).join("")
    : `<div class="mutedText">Henüz geçmiş kayıt yok.</div>`;

  byId("logBox").innerHTML = (state.log || []).map((item) => `
    <div class="logItem ${item.tag || ""}">
      <div class="logTop"><strong>${item.title}</strong><span>${item.status}</span></div>
      <div class="mutedText">${item.body}</div>
    </div>
  `).join("");
}
