export const scenarios = {
  newcastle1814: {
    id: "newcastle1814",
    title: "Industrial Operator: 1814",
    subtitle: "Newcastle upon Tyne, 25 Temmuz 1814",
    intro:
      "Napolyon Savaşları'nın sonuna yaklaşılırken Britanya sanayisi kömüre aç. Grand Allies maden konsorsiyumunun operasyonel direktörü olarak üretimi limana akıtmak zorundasın.",
    crisis:
      "Madenler günde 500 ton kömür çıkarıyor ama nehre ulaşan miktar sadece 180 ton. Atlı lojistik çökmüş durumda, pompalar verimsiz, raylar kırılgan, işçiler huzursuz.",
    goal: "Sistemi stabilize et ve satışa hazır akışı yükselt.",
    goalLabel: "Krizi yönet",
    timeUnit: "ay",
    startDateLabel: "Temmuz 1814",
    startState: {
      cash: 15000,
      production: 500,
      logistics: 180,
      infrastructure: 25,
      morale: 48,
      risk: 28,
      incomeBase: 2160,
      expenseBase: 2320
    },
    introLog: {
      title: "Başlangıç Raporu",
      status: "Krize giriş",
      tag: "warn",
      body: "Sistem zararda. Günde 500 ton kömür çıkarılıyor ama nehre sadece 180 ton ulaşıyor. Atlı lojistik yetersiz, pompalar verimsiz, işçiler huzursuz."
    },
    flowLabels: ["Maden", "Ray Hattı", "Nehir/Liman"],
    examples: [
      "Ray altyapısını güçlendirip lojistiği iyileştiriyorum.",
      "İşçi moralini artırmak için erzak ve maaş düzenlemesi yapıyorum.",
      "Pompa bakımını artırıp üretim kaybını azaltıyorum."
    ]
  }
};

export function getScenarioFromURL() {
  const params = new URLSearchParams(window.location.search);
  const key = params.get("scenario") || "newcastle1814";
  return scenarios[key] || scenarios.newcastle1814;
}
