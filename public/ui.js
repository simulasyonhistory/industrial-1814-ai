import { formatMoney, computeEconomy } from "./engine.js";

function pct(part, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

export function renderScenarioHeader(scenario) {
  document.getElementById("title").textContent = scenario.title;
  document.getElementById("subtitle").textContent = scenario.subtitle;
  document.getElementById("intro").textContent = scenario.intro;
  document.getElementById("crisis").textContent = scenario.crisis;
  document.getElementById("goal").textContent = scenario.goal;
  document.getElementById("flowA").textContent = scenario.flowLabels[0];
  document.getElementById("flowB").textContent = scenario.flowLabels[1];
  document.getElementById("flowC").textContent = scenario.flowLabels[2];
}

export function fillExample(scenario) {
  const input = document.getElementById("decisionInput");
  input.value = scenario.examples[Math.floor(Math.random() * scenario.examples.length)];
}

export function renderAll(state) {
  document.getElementById("dateLabel").textContent = state.dateLabel;
  document.getElementById("stageLabel").textContent = `${state.stage} / ?`;
  document.getElementById("cashVal").textContent = formatMoney(state.cash);
  document.getElementById("productionVal").textContent = `${Math.round(state.production)} ton`;
  document.getElementById("logisticsVal").textContent = `${Math.round(state.logistics)} ton`;
  document.getElementById("infraVal").textContent = `${Math.round(state.infrastructure)}/100`;
  document.getElementById("moraleVal").textContent = `${Math.round(state.morale)}/100`;
  document.getElementById("riskVal").textContent = `${Math.round(state.risk)}/100`;

  document.getElementById("prodBar").style.width = `${pct(state.production, Math.max(state.production, 1))}%`;
  document.getElementById("flowBar").style.width = `${pct(state.logistics, Math.max(state.production, 1))}%`;
  document.getElementById("infraBar").style.width = `${state.infrastructure}%`;
  document.getElementById("moraleBar").style.width = `${state.morale}%`;
  document.getElementById("riskBar").style.width = `${state.risk}%`;

  document.getElementById("riskBar").className = "fill " + (state.risk >= 70 ? "bad" : state.risk >= 45 ? "warn" : "good");

  const loss = Math.max(0, state.production - state.logistics);
  const lossPct = state.production ? Math.round((loss / state.production) * 100) : 0;
  document.getElementById("flowLoss").textContent =
    loss > 0
      ? `Darboğaz: ${loss} ton kayıp (%${lossPct})`
      : "Darboğaz görünmüyor.";

  document.getElementById("productionVal2").textContent = `${Math.round(state.production)} ton`;
  document.getElementById("logisticsVal2").textContent = `${Math.round(state.logistics)} ton`;
  document.getElementById("shippableVal").textContent = `${Math.min(state.production, state.logistics)} ton`;

  const eco = computeEconomy(state);
  document.getElementById("summaryBox").innerHTML = `
    <p><strong>Aylık gelir:</strong> ${formatMoney(eco.income)}</p>
    <p><strong>Aylık gider:</strong> ${formatMoney(eco.expenses)}</p>
    <p><strong>Aylık net:</strong> ${formatMoney(eco.net)}</p>
    <p><strong>Nehre ulaşan satışa hazır kömür:</strong> ${eco.shippable} ton/gün</p>
  `;

  document.getElementById("logBox").innerHTML = state.log.map(item => `
    <div class="logEntry">
      <h4>${item.title}<span class="tag ${item.tag}">${item.status}</span></h4>
      <div class="muted">${item.body}</div>
    </div>
  `).join("");

  const last = state.lastReport;
  document.getElementById("lastReportBox").innerHTML = last ? `
    <div class="reportTitle">Sonuç Raporu</div>
    <div class="muted"><strong>Karar:</strong> ${last.rawDecision}</div>
    <div class="muted"><strong>Yorum:</strong> ${last.summary}</div>
    <div class="muted"><strong>Süre:</strong> ${last.duration}</div>
    <div class="muted"><strong>Nakit:</strong> ${formatMoney(last.changes.cash[0])} → ${formatMoney(last.changes.cash[1])}</div>
    <div class="muted"><strong>Üretim:</strong> ${last.changes.production[0]} → ${last.changes.production[1]}</div>
    <div class="muted"><strong>Lojistik:</strong> ${last.changes.logistics[0]} → ${last.changes.logistics[1]}</div>
    <div class="muted"><strong>Altyapı:</strong> ${last.changes.infrastructure[0]} → ${last.changes.infrastructure[1]}</div>
    <div class="muted"><strong>Moral:</strong> ${last.changes.morale[0]} → ${last.changes.morale[1]}</div>
    <div class="muted"><strong>Risk:</strong> ${last.changes.risk[0]} → ${last.changes.risk[1]}</div>
  ` : `
    <div class="reportTitle">Sonuç Raporu</div>
    <div class="muted">Henüz yeni bir karar uygulanmadı.</div>
  `;

  document.getElementById("historyBox").innerHTML = state.reports.length
    ? state.reports.map(rep => `
      <details class="historyItem">
        <summary>Tur ${rep.turn} — ${rep.fromDate} → ${rep.toDate}</summary>
        <div class="historyBody">
          <div><strong>Karar:</strong> ${rep.rawDecision}</div>
          <div><strong>Yorum:</strong> ${rep.summary}</div>
          <div><strong>Süre:</strong> ${rep.duration}</div>
          <div><strong>Nakit:</strong> ${formatMoney(rep.changes.cash[0])} → ${formatMoney(rep.changes.cash[1])}</div>
          <div><strong>Üretim:</strong> ${rep.changes.production[0]} → ${rep.changes.production[1]}</div>
          <div><strong>Lojistik:</strong> ${rep.changes.logistics[0]} → ${rep.changes.logistics[1]}</div>
          <div><strong>Altyapı:</strong> ${rep.changes.infrastructure[0]} → ${rep.changes.infrastructure[1]}</div>
          <div><strong>Moral:</strong> ${rep.changes.morale[0]} → ${rep.changes.morale[1]}</div>
          <div><strong>Risk:</strong> ${rep.changes.risk[0]} → ${rep.changes.risk[1]}</div>
        </div>
      </details>
    `).join("")
    : `<div class="muted">Henüz geçmiş rapor yok.</div>`;
}
