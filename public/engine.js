function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function formatMoney(value, scenario) {
  const unit = scenario?.moneyUnit || "£";
  const locale = scenario?.moneyLocale || "tr-TR";
  return `${Math.round(value).toLocaleString(locale)} ${unit}`;
}

export function createInitialState(scenario) {
  return clone(scenario.startState);
}

export function advanceTime(label, amount = 1, unit = "hafta") {
  if (unit === "hafta") return `${label} (+${amount} hafta)`;
  if (unit === "gün") return `${label} (+${amount} gün)`;
  if (unit === "ay") return `${label} (+${amount} ay)`;
  return `${label} (+${amount} yıl)`;
}

export function computeEconomy(state) {
  const shippable = Math.max(0, Math.min(state.production, state.logistics, state.portCapacity || state.logistics));
  const income = Math.round((shippable / Math.max(state.production || 1, 1)) * state.incomeBase + (state.infrastructure * 4));
  const maintenancePenalty = Math.round(state.maintenance * 6);
  const riskPenalty = Math.round(Math.max(0, state.risk - 50) * 3);
  const moralePenalty = Math.round(Math.max(0, 50 - state.morale) * 2);
  const expenses = Math.round(state.expenseBase + maintenancePenalty + riskPenalty + moralePenalty);
  const net = income - expenses;
  return { shippable, income, expenses, net };
}

function keywordEffects(text) {
  const t = String(text || "").toLowerCase();
  const delta = {
    cash: 0,
    production: 0,
    logistics: 0,
    portCapacity: 0,
    infrastructure: 0,
    morale: 0,
    risk: 0,
    maintenance: 0,
    politicalPressure: 0,
    solved: "Karar sistemde sınırlı bir düzeltme yarattı.",
    duration: 1,
    durationUnit: "hafta"
  };

  if (/(ray|altyapı|zemin|balast|hat)/.test(t)) {
    delta.cash -= 1300;
    delta.logistics += 26;
    delta.infrastructure += 8;
    delta.maintenance += 4;
    delta.risk -= 3;
    delta.solved = "Taşıma hattı daha sağlam hale geldi.";
  }

  if (/(pompa|drenaj|watt|bakım|şaft)/.test(t)) {
    delta.cash -= 900;
    delta.production += 22;
    delta.infrastructure += 4;
    delta.maintenance += 6;
    delta.risk -= 2;
    delta.solved = "Enerji ve drenaj tarafı kısmen rahatladı.";
  }

  if (/(işçi|erzak|maaş|moral|eğitim|sosyal)/.test(t)) {
    delta.cash -= 500;
    delta.morale += 12;
    delta.risk -= 6;
    delta.production += 4;
    delta.solved = "İnsan tarafındaki baskı kısmen azaldı.";
  }

  if (/(liman|iskele|rampa|oluk|yükleme|staith|gemi)/.test(t)) {
    delta.cash -= 1000;
    delta.portCapacity += 32;
    delta.logistics += 8;
    delta.infrastructure += 4;
    delta.maintenance += 3;
    delta.solved = "Liman ve yükleme hattı kısmen rahatladı.";
  }

  if (/(standart|ölçü|whitworth|kalibrasyon|prototip|ar-ge|resimhane)/.test(t)) {
    delta.cash -= 850;
    delta.infrastructure += 7;
    delta.production += 10;
    delta.risk -= 1;
    delta.politicalPressure += 2;
    delta.solved = "Teknik standardizasyon seviyesi yükseldi.";
  }

  if (/(hammadde|kömür|cardiff|ereğli|samakov|bilecik|lojistik manga)/.test(t)) {
    delta.cash -= 700;
    delta.production += 8;
    delta.logistics += 10;
    delta.risk += 1;
    delta.solved = "Besleme zinciri kısmen güçlendi.";
  }

  if (/(hız|acele|zorla|tam kapasite|saldırı)/.test(t)) {
    delta.production += 12;
    delta.logistics += 6;
    delta.risk += 10;
    delta.morale -= 5;
    delta.maintenance += 8;
    delta.solved = "Çıktı yükseldi ama sistem gerildi.";
  }

  if (/(temkinli|kademeli|kontrollü|güvenli)/.test(t)) {
    delta.production -= 4;
    delta.risk -= 7;
    delta.maintenance -= 2;
    delta.solved = "Sistem daha güvenli ama daha yavaş ilerledi.";
  }

  if (/(danışmanlık|lisans|satış|sözleşme|diplomasi|parlamento|kartel)/.test(t)) {
    delta.cash += 600;
    delta.politicalPressure -= 8;
    delta.production += 2;
    delta.risk += 1;
    delta.solved = "Dış baskı kısmen yönetildi.";
  }

  if (delta.solved === "Karar sistemde sınırlı bir düzeltme yarattı.") {
    delta.logistics += 6;
    delta.risk -= 1;
  }

  return delta;
}

function applyDecay(state) {
  const next = clone(state);
  next.maintenance = clamp(next.maintenance + 1, 0, 100);
  next.infrastructure = clamp(next.infrastructure - (next.maintenance > 60 ? 1 : 0), 0, 100);
  next.morale = clamp(next.morale - (next.risk > 65 ? 1 : 0), 0, 100);
  next.politicalPressure = clamp(next.politicalPressure + (next.cash < 0 ? 2 : 0), 0, 100);
  return next;
}

function detectActiveBottleneck(state) {
  const candidates = [
    { key: "production", score: state.production, label: "Üretim hattı" },
    { key: "logistics", score: state.logistics, label: "Taşıma hattı" },
    { key: "portCapacity", score: state.portCapacity || state.logistics, label: "Liman ve yükleme" },
    { key: "morale", score: state.morale + 80, label: "İnsan ve iş gücü" },
    { key: "cash", score: Math.max(0, state.cash / 50), label: "Nakit ve ödeme gücü" },
    { key: "infrastructure", score: state.infrastructure + 40, label: "Altyapı ve standardizasyon" }
  ];

  candidates.sort((a, b) => a.score - b.score);
  const chosen = candidates[0];

  let reason = "";
  if (chosen.key === "production") reason = "Sistemin iç kapasitesi istenen akışı üretemiyor.";
  if (chosen.key === "logistics") reason = "Üretim var ama taşıma hattı akışı boğuyor.";
  if (chosen.key === "portCapacity") reason = "Hat çalışsa da liman yüklemeyi yetiştiremiyor.";
  if (chosen.key === "morale") reason = "Teknik ilerleme olsa bile insan tarafı sistemi yavaşlatıyor.";
  if (chosen.key === "cash") reason = "Sistem çalışsa bile finansal baskı manevra alanını daraltıyor.";
  if (chosen.key === "infrastructure") reason = "Altyapı ve standart seviyesi yeni yükü taşımakta zorlanıyor.";

  return {
    key: chosen.key,
    label: chosen.label,
    reason
  };
}

function detectNextRisk(state, activeBottleneck) {
  if (state.risk >= 75) return "Risk seviyesi kritik. Bir sonraki turda dış şok veya arıza tetiklenebilir.";
  if (state.maintenance >= 70) return "Bakım yorgunluğu büyüyor. Arıza ve verim kaybı riski artıyor.";
  if (state.morale <= 35) return "İnsan tarafı kırılgan. Sabotaj, yavaşlatma veya verim düşüşü doğabilir.";
  if (activeBottleneck.key === "logistics") return "Akış sıkışması stok ve nakit baskısını büyütebilir.";
  if (activeBottleneck.key === "portCapacity") return "Liman birikmesi kalite kaybı ve ceza baskısı üretebilir.";
  if (activeBottleneck.key === "cash") return "Yeni yatırım atılamazsa büyüme tersine dönebilir.";
  return "Sistem dengede görünüyor ama yeni büyüme başka bir darboğaz üretebilir.";
}

function maybeTriggerEvent(state) {
  const events = [];

  if (state.risk >= 70) {
    events.push({
      title: "Kritik Risk Uyarısı",
      status: "Dış baskı",
      tag: "bad",
      body: "Sistem aşırı gerildi. Küçük bir hata daha büyük kırılma doğurabilir."
    });
  }

  if (state.morale <= 35) {
    events.push({
      title: "İş Gücü Gerilimi",
      status: "İç sürtünme",
      tag: "warn",
      body: "İş gücünde sessiz direnç büyüyor. Teknik kararların sosyal bedeli artıyor."
    });
  }

  if (state.portCapacity < state.production - 80) {
    events.push({
      title: "Akış Sıkışması",
      status: "Darboğaz",
      tag: "warn",
      body: "Çıktı birikiyor. Sistem artık üretim değil, son aktarım tarafından sınırlanıyor."
    });
  }

  return events;
}

export function evaluateDecision(state, decision, scenario) {
  const before = clone(state);
  const delta = keywordEffects(decision);

  let next = clone(state);
  next.cash = clamp(next.cash + delta.cash, -999999, 999999);
  next.production = clamp(next.production + delta.production, 0, 99999);
  next.logistics = clamp(next.logistics + delta.logistics, 0, 99999);
  next.portCapacity = clamp((next.portCapacity || next.logistics) + delta.portCapacity, 0, 99999);
  next.infrastructure = clamp(next.infrastructure + delta.infrastructure, 0, 100);
  next.morale = clamp(next.morale + delta.morale, 0, 100);
  next.risk = clamp(next.risk + delta.risk, 0, 100);
  next.maintenance = clamp(next.maintenance + delta.maintenance, 0, 100);
  next.politicalPressure = clamp((next.politicalPressure || 0) + delta.politicalPressure, 0, 100);
  next.turn += 1;
  next.stage = next.turn + 1;
  next.dateLabel = advanceTime(before.dateLabel || scenario.startDateLabel, delta.duration, delta.durationUnit);

  next = applyDecay(next);
  const eco = computeEconomy(next);
  next.cash = clamp(next.cash + eco.net, -999999, 999999);

  const active = detectActiveBottleneck(next);
  const previousBottleneck = before.activeBottleneckLabel || "-";
  next.activeBottleneck = active.key;
  next.activeBottleneckLabel = active.label;
  next.bottleneckReason = active.reason;
  next.nextRiskLabel = detectNextRisk(next, active);

  const events = maybeTriggerEvent(next);

  const outcome = {
    solved: delta.solved,
    changedBy: {
      cash: next.cash - before.cash,
      production: next.production - before.production,
      logistics: next.logistics - before.logistics,
      portCapacity: (next.portCapacity || 0) - (before.portCapacity || 0),
      infrastructure: next.infrastructure - before.infrastructure,
      morale: next.morale - before.morale,
      risk: next.risk - before.risk,
      maintenance: next.maintenance - before.maintenance,
      politicalPressure: (next.politicalPressure || 0) - (before.politicalPressure || 0)
    },
    activeBottleneck: active.key,
    activeBottleneckLabel: active.label,
    bottleneckReason: active.reason,
    bottleneckShift: `${previousBottleneck} → ${active.label}`,
    nextRiskLabel: next.nextRiskLabel,
    shippable: eco.shippable,
    income: eco.income,
    expenses: eco.expenses,
    net: eco.net,
    duration: `${delta.duration} ${delta.durationUnit}`,
    events
  };

  const report = {
    turn: next.turn,
    dateLabel: next.dateLabel,
    decision,
    outcome,
    commentary: null,
    before: {
      cash: before.cash,
      production: before.production,
      logistics: before.logistics,
      portCapacity: before.portCapacity,
      infrastructure: before.infrastructure,
      morale: before.morale,
      risk: before.risk
    },
    after: {
      cash: next.cash,
      production: next.production,
      logistics: next.logistics,
      portCapacity: next.portCapacity,
      infrastructure: next.infrastructure,
      morale: next.morale,
      risk: next.risk
    }
  };

  next.lastSummary = delta.solved;
  next.reports = [report, ...(next.reports || [])];
  next.log = [
    {
      title: "Karar uygulandı",
      status: active.label,
      tag: next.risk >= 70 ? "bad" : next.risk >= 45 ? "warn" : "good",
      body: `${delta.solved} Aktif darboğaz: ${active.label}.`
    },
    ...events,
    ...(next.log || [])
  ].slice(0, 40);

  return { nextState: next, outcome, report };
}

export function attachCommentary(state, commentary) {
  if (!state?.reports?.length) return state;
  const next = clone(state);
  next.reports[0].commentary = commentary;
  next.log.unshift({
    title: "AI değerlendirmesi",
    status: commentary.source === "openai" ? "OpenAI" : "Fallback",
    tag: "good",
    body: commentary.resultSummary
  });
  next.log = next.log.slice(0, 40);
  return next;
}
