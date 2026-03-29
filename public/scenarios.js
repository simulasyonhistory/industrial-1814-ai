export const scenarios = {
  newcastle1814: {
    id: "newcastle1814",
    title: "Industrial Operator: 1814",
    shortTitle: "Mekanik Lojistik Krizi",
    location: "Newcastle upon Tyne",
    subtitle: "Newcastle upon Tyne, 25 Temmuz 1814",
    startDateLabel: "Temmuz 1814",
    timeUnit: "hafta",
    currencySymbol: "£",
    goal: "Sistemi stabilize et ve satışa hazır akışı yükselt.",
    introTitle: "Newcastle, 25 Temmuz 1814",
    longIntro: `Napolyon Savaşları'nın sonuna yaklaşılırken Britanya sanayisi kömüre aç. Grand Allies maden konsorsiyumunun operasyonel direktörü olarak önünde dağınık ama üretken bir sistem buluyorsun.

Madenler günde yaklaşık 500 ton kömür çıkarıyor. Fakat bu üretimin yalnızca 180 tonu nehre ve gemilere ulaşabiliyor. Sorun kazma gücü değil; sistemin kendisi birbirine uymayan, kırılgan ve pahalı halkalardan oluşuyor.

Atlı taşıma hattı yetersiz. Raylar kırılgan. Pompalar verimsiz. İşçiler huzursuz. Bir yeri rahatlatınca başka bir yer tıkanıyor.

Bu simülasyonda amaç tek tek rakam büyütmek değil. Amaç, darboğazı bir halkadan alıp diğerine kontrolsüzce kaydırmadan sistemi ayakta tutmak.`,
    introLog: {
      title: "Başlangıç Raporu",
      status: "Krize giriş",
      tag: "warn",
      body: "Günde 500 ton üretim var ama nehre sadece 180 ton ulaşıyor. Asıl sorun üretim değil, akış."
    },
    examples: [
      "Ray altyapısını güçlendirip taşıma hattını stabilize ediyorum.",
      "Pompa bakımını artırıp su baskını riskini azaltıyorum.",
      "İşçi moralini erzak ve barınma düzeniyle toparlıyorum."
    ],
    invalidKeywords: ["uçak", "helikopter", "internet", "radar", "dizel", "kamyon", "elektrik motoru"],
    decisionProfiles: {
      infrastructure: {
        keywords: ["ray", "altyapı", "zemin", "balast", "köprü", "rampa", "hat", "tahkimat"],
        immediateCost: 1400,
        monthlyDelta: 40,
        duration: 2,
        durationUnit: "hafta",
        delta: { cash: -1400, production: 0, logistics: 0, infrastructure: 2, morale: 0, risk: -1 },
        projectEffect: { logistics: 32, infrastructure: 8, risk: -4 },
        solvedText: "Hat stabilitesi kısmen güçlendi.",
        nextRiskText: "İnşa süreci uzarsa nakit ve bakım baskısı artabilir."
      },
      maintenance: {
        keywords: ["pompa", "bakım", "onarım", "watt", "newcomen", "şaft", "kazan"],
        immediateCost: 900,
        monthlyDelta: 25,
        duration: 2,
        durationUnit: "hafta",
        delta: { cash: -900, production: 6, logistics: 0, infrastructure: 1, morale: 0, risk: 1 },
        projectEffect: { production: 18, technicalRisk: -10, maintenance: 4 },
        solvedText: "Mekanik verim kısmen toparlandı.",
        nextRiskText: "Üretim artışı taşıma hattını zorlayabilir."
      },
      social: {
        keywords: ["işçi", "maaş", "erzak", "barınma", "moral", "fon", "eğitim"],
        immediateCost: 450,
        monthlyDelta: 18,
        duration: 1,
        durationUnit: "hafta",
        delta: { cash: -450, production: 0, logistics: 0, infrastructure: 0, morale: 8, risk: -5 },
        projectEffect: { morale: 8, socialRisk: -12 },
        solvedText: "İnsan tarafındaki baskı kısmen azaldı.",
        nextRiskText: "Sosyal baskı gevşese de ana akış sorunu sürüyor."
      },
      logistics: {
        keywords: ["vagon", "at", "taşıma", "lojistik", "aktarma", "liman"],
        immediateCost: 700,
        monthlyDelta: 30,
        duration: 1,
        durationUnit: "hafta",
        delta: { cash: -700, production: 0, logistics: 12, infrastructure: 1, morale: 0, risk: 0 },
        projectEffect: { logistics: 18, maintenance: 2 },
        solvedText: "Taşıma hattı kısmen rahatladı.",
        nextRiskText: "Hat yorgunluğu ve bakım ihtiyacı büyüyebilir."
      },
      finance: {
        keywords: ["kredi", "borç", "satış", "tahvil", "nakit", "sermaye"],
        immediateCost: -600,
        monthlyDelta: -30,
        duration: 1,
        durationUnit: "hafta",
        delta: { cash: 600, production: 0, logistics: 0, infrastructure: 0, morale: -1, risk: 2 },
        projectEffect: { financialRisk: -4, politicalRisk: 4 },
        solvedText: "Nakit baskısı geçici olarak hafifledi.",
        nextRiskText: "Finansal rahatlama siyasi veya sözleşmesel baskı yaratabilir."
      }
    },
    startState: {
      resources: { cash: 15000 },
      system: { production: 500, logistics: 180, infrastructure: 25, morale: 48, risk: 28, standardization: 22 },
      pressures: { maintenance: 19, financial: 36, social: 42, technical: 54, political: 18 },
      economy: { incomeBase: 2160, expenseBase: 2320, monthlyIncome: 2160, monthlyCost: 2320, monthlyNet: -160 },
      capacities: { port: 180, shippable: 180 },
      ledger: { investmentSpent: 0, monthlyBurden: 0, maintenanceCost: 220 },
      projects: [],
      history: [],
      reports: [],
      log: []
    }
  },
  ottoman1856: {
    id: "ottoman1856",
    title: "Mekatronik Eşik: 1856 Osmanlı",
    shortTitle: "Standartlaşma Krizi",
    location: "İstanbul",
    subtitle: "İstanbul, 15 Mayıs 1856",
    startDateLabel: "Mayıs 1856",
    timeUnit: "hafta",
    currencySymbol: "$",
    goal: "Standartlı üretim omurgasını kur ve sistemi iflas etmeden büyüt.",
    introTitle: "İstanbul, 15 Mayıs 1856",
    longIntro: `Kırım Savaşı'nın ardından Osmanlı sanayisi kırılgan bir eşikte duruyor. Atölyeler çalışıyor, sipariş baskısı artıyor, yabancı uzmanlar geliyor; ama üretim güvenilir değil.

Sorun makine eksikliği kadar ölçü ve standart eksikliği. Bir parçanın yedeği diğerine uymuyor. Kaliteli kömür kesintili geliyor. Yerli hammadde değişken. Lonca düzeni sessiz ama gerçek bir sürtünme üretiyor.

Elinde atıl iş gücü, sınırlı nakit ve büyümek isteyen bir üretim yapısı var. Fakat sistem parça parça çalışıyor; bir halkayı düzeltince diğer halka baskı üretiyor.

Bu simülasyonda asıl hedef sadece sipariş almak değil. Hedef, standardizasyonu kurmak, enerji kalitesini istikrara kavuşturmak ve büyümeyi taşıyacak güvenilir bir sanayi omurgası kurmak.`,
    introLog: {
      title: "Başlangıç Raporu",
      status: "Mekatronik eşik",
      tag: "warn",
      body: "Asıl problem makine sayısı değil, standardizasyon eksikliği ve enerji kalitesizliği."
    },
    examples: [
      "Whitworth ölçü sistemini kurup standardizasyonu artırıyorum.",
      "Kömür kurutma kazanı yatırımıyla buhar kalitesini yükseltiyorum.",
      "Atıl memur iş gücünü lojistik ve odun mangasına çeviriyorum."
    ],
    invalidKeywords: ["uçak", "helikopter", "mikroçip", "bilgisayar", "internet", "jet", "nükleer"],
    decisionProfiles: {
      infrastructure: {
        keywords: ["ölçü", "standart", "whitworth", "tezgah", "freze", "resimhane", "prototip", "makine parkı"],
        immediateCost: 1200,
        monthlyDelta: 55,
        duration: 3,
        durationUnit: "hafta",
        delta: { cash: -1200, production: 0, logistics: 0, infrastructure: 4, morale: 0, risk: -1 },
        projectEffect: { production: 22, standardization: 18, technicalRisk: -8, infrastructure: 10 },
        solvedText: "Standart üretim omurgası kısmen kuruldu.",
        nextRiskText: "Kurulum sürecinde üretim yavaşlayabilir ve nakit baskısı artabilir."
      },
      maintenance: {
        keywords: ["şaft", "bakım", "onarım", "kalibrasyon", "soğutma", "yağlama"],
        immediateCost: 380,
        monthlyDelta: 20,
        duration: 1,
        durationUnit: "hafta",
        delta: { cash: -380, production: -4, logistics: 0, infrastructure: 0, morale: 0, risk: -3 },
        projectEffect: { technicalRisk: -10, maintenance: 5, production: 8 },
        solvedText: "Ani mekanik kırılma riski sınırlı kaldı.",
        nextRiskText: "Bakım rahatladı ama enerji kalitesi düzelmezse sorun geri dönebilir."
      },
      energy: {
        keywords: ["kömür", "kurutma", "kazan", "yakıt", "ereğli", "cardiff"],
        immediateCost: 1850,
        monthlyDelta: 35,
        duration: 3,
        durationUnit: "hafta",
        delta: { cash: -1850, production: -6, logistics: 0, infrastructure: 1, morale: 0, risk: 2 },
        projectEffect: { production: 28, technicalRisk: -6, financialRisk: 4 },
        solvedText: "Buhar kalitesi ve enerji verimi için omurga yatırımı başladı.",
        nextRiskText: "Kurulum tamamlanana kadar kapasite baskısı ve teslim riski sürecek."
      },
      social: {
        keywords: ["işçi", "usta", "lonca", "manga", "eğitim", "moral", "ikramiye"],
        immediateCost: 520,
        monthlyDelta: 22,
        duration: 1,
        durationUnit: "hafta",
        delta: { cash: -520, production: 0, logistics: 4, infrastructure: 0, morale: 10, risk: -4 },
        projectEffect: { morale: 10, socialRisk: -14, logistics: 8 },
        solvedText: "İnsan direnci ve saha sürtünmesi bir miktar azaldı.",
        nextRiskText: "Sosyal rahatlama sağlansa da standardizasyon krizi çözülmeden sistem güvenilir olmaz."
      },
      finance: {
        keywords: ["mısır", "sipariş", "nakit", "tahvil", "esham", "sözleşme", "borç"],
        immediateCost: -900,
        monthlyDelta: -40,
        duration: 2,
        durationUnit: "hafta",
        delta: { cash: 900, production: 0, logistics: 0, infrastructure: 0, morale: -1, risk: 3 },
        projectEffect: { financialRisk: -6, politicalRisk: 5 },
        solvedText: "Kısa vadeli nakit baskısı hafifledi.",
        nextRiskText: "Dış sipariş baskısı kalite ve zamanlama krizini büyütebilir."
      }
    },
    startState: {
      resources: { cash: 10000 },
      system: { production: 120, logistics: 90, infrastructure: 30, morale: 58, risk: 46, standardization: 18 },
      pressures: { maintenance: 24, financial: 52, social: 34, technical: 57, political: 30 },
      economy: { incomeBase: 2378, expenseBase: 3556, monthlyIncome: 2378, monthlyCost: 3556, monthlyNet: -1178 },
      capacities: { port: 110, shippable: 90 },
      ledger: { investmentSpent: 0, monthlyBurden: 0, maintenanceCost: 280 },
      projects: [],
      history: [],
      reports: [],
      log: []
    }
  }
};

export function getScenarioFromURL() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("scenario") || "newcastle1814";
  return scenarios[id] || scenarios.newcastle1814;
}
