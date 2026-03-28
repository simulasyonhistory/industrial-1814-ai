function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function createInitialState(scenario) {
  return {
    ...scenario.startState,
    stage: 1,
    turn: 0,
    dateLabel: scenario.startDateLabel,
    lastReport: null,
    log: [scenario.introLog],
    reports: []
  };
}

export function formatMoney(value) {
  return `${Math.round(value).toLocaleString("tr-TR")} £`;
}

export function computeEconomy(state) {
  const shippable = Math.min(state.production, state.logistics);
  const income = Math.round((shippable / 180) * state.incomeBase);
  const expenses = Math.round(state.expenseBase);
  const net = income - expenses;
  return { shippable, income, expenses, net };
}

function addMonths(label, amount) {
  const parts = label.split(" ");
  const monthNames = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  const monthIndex = monthNames.indexOf(parts[0]);
  let year = Number(parts[1]);
  let next = monthIndex + amount;
  while (next >= 12) {
    next -= 12;
    year += 1;
  }
  return `${monthNames[next]} ${year}`;
}

export function advanceTime(currentLabel, duration, unit) {
  if (unit === "ay") return addMonths(currentLabel, duration);
  if (unit === "yıl") return addMonths(currentLabel, duration * 12);
  if (unit === "hafta") return `${currentLabel} (+${duration} hafta)`;
  return `${currentLabel} (+${duration} gün)`;
}

export function applyDecision(state, result, rawDecision) {
  const before = {
    cash: state.cash,
    production: state.production,
    logistics: state.logistics,
    infrastructure: state.infrastructure,
    morale: state.morale,
    risk: state.risk,
    dateLabel: state.dateLabel
  };

  state.cash = clamp(state.cash + Number(result.cash || 0), -999999, 999999);
  state.production = clamp(state.production + Number(result.production || 0), 0, 5000);
  state.logistics = clamp(state.logistics + Number(result.logistics || 0), 0, 5000);
  state.infrastructure = clamp(state.infrastructure + Number(result.infrastructure || 0), 0, 100);
  state.morale = clamp(state.morale + Number(result.morale || 0), 0, 100);
  state.risk = clamp(state.risk + Number(result.risk || 0), 0, 100);

  state.turn += 1;
  state.stage = state.turn + 1;
  state.dateLabel = advanceTime(state.dateLabel, Number(result.duration || 1), result.durationUnit || "ay");

  const report = {
    turn: state.turn,
    fromDate: before.dateLabel,
    toDate: state.dateLabel,
    rawDecision,
    summary: result.summary,
    changes: {
      cash: [before.cash, state.cash],
      production: [before.production, state.production],
      logistics: [before.logistics, state.logistics],
      infrastructure: [before.infrastructure, state.infrastructure],
      morale: [before.morale, state.morale],
      risk: [before.risk, state.risk]
    },
    duration: `${result.duration || 1} ${result.durationUnit || "ay"}`
  };

  state.lastReport = report;
  state.reports.unshift(report);
  state.log.unshift({
    title: "Serbest Karar Uygulandı",
    status: "OpenAI yorumu",
    tag: "good",
    body: result.summary
  });

  return state;
}
