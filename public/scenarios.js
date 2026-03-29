export const scenarios = {
  newcastle1814: {
    id: "newcastle1814",
    title: "Industrial Operator: 1814",
    subtitle: "Newcastle upon Tyne, 25 Temmuz 1814",
    role: "Grand Allies maden konsorsiyumunun operasyon direktörü",
    intro:
      "Britanya sanayisi kömüre aç. Senin görevin, üretimi limana akıtan sistemi darboğazlar arasında dengede tutmak.",
    crisis:
      "Madenler günde 500 ton kömür çıkarıyor ama nehre ulaşan miktar yalnızca 180 ton. Atlı lojistik yetersiz, pompalar verimsiz, liman kırılgan, işçiler huzursuz.",
    goal: "Sistemi stabilize et, darboğazı kaydır ama kontrolü kaybetme.",
    constraints: [
      "Mucize çözüm yok",
      "Her büyümenin bir bakım maliyeti var",
      "İnsan ve teknik sistem birlikte düşünülmeli"
    ],
    startDateLabel: "Temmuz 1814",
    timeUnit: "hafta",
    moneyUnit: "£",
    moneyLocale: "tr-TR",
    flowLabels: ["Maden", "Hat", "Liman"],
    decisionExamples: [
      "Pompa bakımını artırıp su baskısını azaltıyorum.",
      "Ray altyapısını güçlendirip taşıma hattını sağlamlaştırıyorum.",
      "İşçilere erzak ve eğitim verip sabotaj riskini düşürüyorum.",
      "Liman yüklemesini hızlandırmak için rampa ve oluk sistemi kuruyorum."
    ],
    startState: {
      cash: 15000,
      production: 500,
      logistics: 180,
      portCapacity: 180,
      infrastructure: 25,
      morale: 48,
      risk: 42,
      maintenance: 18,
      politicalPressure: 20,
      incomeBase: 2160,
      expenseBase: 2320,
      stage: 1,
      turn: 0,
      activeBottleneck: "logistics",
      activeBottleneckLabel: "Ray hattı ve atlı lojistik",
      bottleneckReason: "Üretim var ama taşıma hattı akışı boğuyor.",
      nextRiskLabel: "İşçi huzursuzluğu ve bakım yorgunluğu artabilir.",
      lastSummary: "Sistem zararda ve darboğaz ray hattında.",
      reports: [],
      log: [
        {
          title: "Başlangıç Raporu",
          status: "Krize giriş",
          tag: "warn",
          body: "Günde 500 ton üretim var ama nehre sadece 180 ton ulaşıyor. Asıl sorun üretim değil, akış." 
        }
      ]
    }
  },
  ottoman1856: {
    id: "ottoman1856",
    title: "Mekatronik Eşik: 1856 Osmanlı",
    subtitle: "İstanbul, 15 Mayıs 1856",
    role: "Tam yetkili baş mühendis ve sanayi koordinatörü",
    intro:
      "Kırım Savaşı sonrasında Osmanlı sanayisi standartsızlık, yakıt krizi ve insan direnci arasında sıkışmış durumda.",
    crisis:
      "Parça değişebilirliği yok, enerji verimi düşük, hammadde zinciri kırılgan ve lonca sürtünmesi üretimi yavaşlatıyor.",
    goal: "Standartlı üretim omurgasını kur ve sistemi iflas etmeden büyüt.",
    constraints: [
      "Tarihsel teknoloji sınırları geçilemez",
      "Yabancı uzman pahalıdır ama gereklidir",
      "Her kapasite artışı yeni bir kalite baskısı üretir"
    ],
    startDateLabel: "Mayıs 1856",
    timeUnit: "hafta",
    moneyUnit: "$",
    moneyLocale: "en-US",
    flowLabels: ["Döküm", "İşleme", "Montaj/Satış"],
    decisionExamples: [
      "Whitworth ölçü aletlerini merkeze alıp standardizasyon başlatıyorum.",
      "Kritik dökümler için Cardiff kömürü, genel üretim için yerli hibrit model uyguluyorum.",
      "Atıl iş gücünü lojistik ve odun mangasına kaydırıyorum.",
      "Yabancı uzmanları Ar-Ge hattına alıp Model-01 standardını öne çıkarıyorum."
    ],
    startState: {
      cash: 10000,
      production: 120,
      logistics: 90,
      portCapacity: 110,
      infrastructure: 32,
      morale: 44,
      risk: 46,
      maintenance: 24,
      politicalPressure: 35,
      incomeBase: 3000,
      expenseBase: 3400,
      stage: 1,
      turn: 0,
      activeBottleneck: "infrastructure",
      activeBottleneckLabel: "Standartsız üretim ve ölçü sistemi",
      bottleneckReason: "Parça standardı kurulmadığı için üretim akışı güvenilir değil.",
      nextRiskLabel: "Hammadde zinciri ve kalite sapması yeni kırılma yaratabilir.",
      lastSummary: "Sistem teknik olarak büyümek istiyor ama standardizasyon eksik.",
      reports: [],
      log: [
        {
          title: "Başlangıç Raporu",
          status: "Mekatronik eşik",
          tag: "warn",
          body: "Asıl problem makine sayısı değil, standardizasyon eksikliği ve enerji kalitesizliği." 
        }
      ]
    }
  }
};

export function getScenarioFromURL() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("scenario") || "newcastle1814";
  return scenarios[id] || scenarios.newcastle1814;
}

export function listScenarios() {
  return Object.values(scenarios).map(({ id, title, subtitle }) => ({ id, title, subtitle }));
}
