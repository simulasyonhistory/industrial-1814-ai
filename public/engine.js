function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function advanceDateLabel(label, amount, unit) {
  const [monthName, yearText] = String(label).split(" ");
  let year = Number(yearText || 0);
  let monthIndex = MONTHS.indexOf(monthName);
  if (monthIndex < 0) return `${label} (+${amount} ${unit})`;

  let monthsToAdd = 0;
  if (unit === "hafta") monthsToAdd = Math.max(1, Math.round(amount / 4));
  else if (unit === "ay") monthsToAdd = amount;
  else if (unit === "yıl") monthsToAdd = amount * 12;
  else monthsToAdd = 0;

  monthIndex += monthsToAdd;
  while (monthIndex >= 12) {
    monthIndex -= 12;
    year += 1;
  }
  return `${MONTHS[monthIndex]} ${year}`;
}

export function formatMoney(value, currencySymbol = "£") {
  const rounded = Math.round(value).toLocaleString("tr-TR");
  return `${rounded} ${currencySymbol}`;
}

export function createInitialState(scenario) {
  const start = clone(scenario.startState);
  return {
    scenarioId: scenario.id,
    time: {
      current: scenario.startDateLabel,
      turn: 0
    },
    resources: start.resources,
    system: start.system,
    pressures: start.pressures,
    economy: start.economy,
    capacities: start.capacities,
    ledger: start.ledger,
    projects: start.projects,
    reports: [],
    log: [scenario.introLog],
    lastOutcome: null,
    introSeen: false,
    activeBottleneck: computeBottleneck(start, scenario),
    systemStatus: {
      lastChange: scenario.id === "ottoman1856"
        ? "Sistem teknik olarak büyümek istiyor ama standardizasyon eksik."
        : "Sistem üretim yapıyor ama akış kırılgan.",
      nextRisk: scenario.id === "ottoman1856"
        ? "Hammadde zinciri ve kalite sapması yeni kırılma yaratabilir."
        : "Bakım ve lojistik yorgunluğu yeni kırılmalar yaratabilir.",
      maintenancePressure: start.pressures.maintenance
    }
  };
}

function totalRisk(system, pressures) {
  const raw = (pressures.maintenance + pressures.financial + pressures.social + pressures.technical + pressures.political) / 5;
  return clamp(Math.round(raw), 0, 100);
}

export function computeEconomy(state) {
  const shippable = Math.min(state.system.production, state.system.logistics, state.capacities.port || Number.MAX_SAFE_INTEGER);
  const income = Math.round((shippable / Math.max(1, state.capacities.shippable || shippable || 1)) * state.economy.incomeBase);
  const cost = Math.round(state.economy.expenseBase + state.ledger.monthlyBurden + state.ledger.maintenanceCost);
  const net = income - cost;
  return {
    shippable,
    monthlyIncome: income,
    monthlyCost: cost,
    monthlyNet: net
  };
}

function computeBottleneckFromValues({ system, capacities, pressures }, scenario) {
  const candidates = [];
  if (system.production > system.logistics) {
    candidates.push({ key: "logistics", score: system.production - system.logistics, label: scenario.id === "ottoman1856" ? "Standartsız üretim ve ölçü sistemi" : "Altyapı ve standardizasyon", reason: scenario.id === "ottoman1856" ? "Parça standardı kurulmadığı için üretim akışı güvenilir değil." : "Altyapı ve standart seviyesi yeni yükü taşımakta zorlanıyor." });
  }
  if (system.logistics > capacities.port) {
    candidates.push({ key: "port", score: system.logistics - capacities.port + 10, label: "Liman ve son aktarım", reason: "Üretim hattının son halkası taşıma akışını aşağı çekiyor." });
  }
  candidates.push({ key: "technical", score: pressures.technical, label: scenario.id === "ottoman1856" ? "Standartsız üretim ve ölçü sistemi" : "Mekanik verim ve bakım", reason: scenario.id === "ottoman1856" ? "Üretim iskeleti standarda bağlanmadığı için kalite ve akış kırılıyor." : "Mekanik verim ve bakım baskısı sistemin sınırını oluşturuyor." });
  candidates.push({ key: "financial", score: pressures.financial, label: "Nakit ve işletme yükü", reason: "Aylık yük ve nakit baskısı hareket alanını daraltıyor." });
  candidates.push({ key: "social", score: pressures.social, label: "İnsan tarafı ve saha disiplini", reason: "İnsan tarafındaki sürtünme kapasiteyi aşağı çekiyor." });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

export function computeBottleneck(input, scenario) {
  if (input.system) return computeBottleneckFromValues(input, scenario);
  return computeBottleneckFromValues({ system: input.system || input.startState.system, capacities: input.capacities || input.startState.capacities, pressures: input.pressures || input.startState.pressures }, scenario);
}

function classifyDecision(rawDecision, scenario) {
  const text = String(rawDecision || "").toLowerCase();

  const invalid = scenario.invalidKeywords.find((kw) => text.includes(kw));
  if (invalid) {
    return {
      type: "invalid",
      valid: false,
      status: "invalid",
      reason: `${invalid} bu senaryonun dönem ve teknoloji sınırları içinde yer almıyor.`
    };
  }

  for (const [type, profile] of Object.entries(scenario.decisionProfiles)) {
    if (profile.keywords.some((kw) => text.includes(kw))) {
      return {
        type,
        valid: true,
        status: "valid",
        reason: "Karar döneme uygun ve işlenebilir görünüyor."
      };
    }
  }

  return {
    type: "generic",
    valid: true,
    status: "risky",
    reason: "Karar serbest yorumla işlendi; etkisi sınırlı ve belirsiz olabilir."
  };
}

function genericProfile(scenario) {
  return {
    immediateCost: 300,
    monthlyDelta: 12,
    duration: 1,
    durationUnit: scenario.timeUnit || "hafta",
    delta: { cash: -300, production: 4, logistics: 0, infrastructure: 0, morale: 1, risk: 1 },
    projectEffect: {},
    solvedText: "Karar sistemde sınırlı bir düzeltme yarattı.",
    nextRiskText: "Sistem dengede görünüyor ama yeni büyüme başka darboğaz üretebilir."
  };
}

function applyImmediateEffects(state, delta) {
  state.resources.cash = clamp(state.resources.cash + (delta.cash || 0), -9999999, 9999999);
  state.system.production = clamp(state.system.production + (delta.production || 0), 0, 999999);
  state.system.logistics = clamp(state.system.logistics + (delta.logistics || 0), 0, 999999);
  state.system.infrastructure = clamp(state.system.infrastructure + (delta.infrastructure || 0), 0, 100);
  state.system.morale = clamp(state.system.morale + (delta.morale || 0), 0, 100);
  state.system.risk = clamp(state.system.risk + (delta.risk || 0), 0, 100);
}

function applyPressureDelta(state, delta) {
  if (!delta) return;
  if (delta.maintenance) state.pressures.maintenance = clamp(state.pressures.maintenance + delta.maintenance, 0, 100);
  if (delta.financialRisk) state.pressures.financial = clamp(state.pressures.financial + delta.financialRisk, 0, 100);
  if (delta.socialRisk) state.pressures.social = clamp(state.pressures.social + delta.socialRisk, 0, 100);
  if (delta.technicalRisk) state.pressures.technical = clamp(state.pressures.technical + delta.technicalRisk, 0, 100);
  if (delta.politicalRisk) state.pressures.political = clamp(state.pressures.political + delta.politicalRisk, 0, 100);
  if (delta.standardization) state.system.standardization = clamp(state.system.standardization + delta.standardization, 0, 100);
}

function advanceProjects(state) {
  const completed = [];
  state.projects = state.projects.filter((project) => {
    project.remaining -= 1;
    if (project.remaining <= 0) {
      completed.push(project);
      return false;
    }
    return true;
  });

  for (const project of completed) {
    state.system.production = clamp(state.system.production + (project.effect.production || 0), 0, 999999);
    state.system.logistics = clamp(state.system.logistics + (project.effect.logistics || 0), 0, 999999);
    state.system.infrastructure = clamp(state.system.infrastructure + (project.effect.infrastructure || 0), 0, 100);
    state.system.morale = clamp(state.system.morale + (project.effect.morale || 0), 0, 100);
    applyPressureDelta(state, project.effect);
  }
  return completed;
}

export function processDecision(currentState, rawDecision, scenario) {
  const state = clone(currentState);
  const previousBottleneck = clone(state.activeBottleneck);
  const classification = classifyDecision(rawDecision, scenario);

  let result;

  if (!classification.valid) {
    result = {
      valid: classification,
      immediateCost: 0,
      monthlyDelta: 0,
      duration: 0,
      durationUnit: scenario.timeUnit,
      delta: { cash: 0, production: 0, logistics: 0, infrastructure: 0, morale: 0, risk: 1 },
      solvedText: "Karar uygulanmadı.",
      nextRiskText: classification.reason,
      projectCreated: null
    };
    applyImmediateEffects(state, result.delta);
    state.pressures.political = clamp(state.pressures.political + 1, 0, 100);
  } else {
    const profile = scenario.decisionProfiles[classification.type] || genericProfile(scenario);
    result = {
      valid: classification,
      immediateCost: profile.immediateCost,
      monthlyDelta: profile.monthlyDelta,
      duration: profile.duration,
      durationUnit: profile.durationUnit,
      delta: profile.delta,
      solvedText: profile.solvedText,
      nextRiskText: profile.nextRiskText,
      projectCreated: {
        name: rawDecision,
        remaining: profile.duration,
        effect: profile.projectEffect,
        costMonthly: profile.monthlyDelta
      }
    };

    applyImmediateEffects(state, profile.delta);
    state.ledger.investmentSpent += profile.immediateCost;
    state.ledger.monthlyBurden += profile.monthlyDelta;
    state.projects.push(result.projectCreated);
  }

  const completedProjects = advanceProjects(state);
  state.time.turn += 1;
  state.time.current = advanceDateLabel(state.time.current, 1, scenario.timeUnit || "hafta");

  const eco = computeEconomy(state);
  state.economy.monthlyIncome = eco.monthlyIncome;
  state.economy.monthlyCost = eco.monthlyCost;
  state.economy.monthlyNet = eco.monthlyNet;
  state.capacities.shippable = eco.shippable;
  state.system.risk = totalRisk(state.system, state.pressures);

  const newBottleneck = computeBottleneck(state, scenario);
  state.activeBottleneck = newBottleneck;

  const transition = {
    solved: result.solvedText,
    shift: previousBottleneck.label !== newBottleneck.label
      ? `${previousBottleneck.label} → ${newBottleneck.label}`
      : `${newBottleneck.label} sabit kaldı`,
    nextRisk: result.nextRiskText,
    completedProjects: completedProjects.map((p) => p.name)
  };

  state.systemStatus = {
    lastChange: result.solvedText,
    nextRisk: result.nextRiskText,
    maintenancePressure: state.pressures.maintenance
  };

  const report = {
    turn: state.time.turn,
    dateLabel: state.time.current,
    rawDecision,
    validity: classification,
    result,
    transition,
    bottleneck: newBottleneck,
    previousBottleneck,
    economy: eco
  };

  state.lastOutcome = report;
  state.reports.unshift(report);
  state.log.unshift({
    title: classification.valid ? "Karar uygulandı" : "Karar reddedildi",
    status: newBottleneck.label,
    tag: classification.valid ? "good" : "bad",
    body: result.solvedText
  });

  return state;
}
