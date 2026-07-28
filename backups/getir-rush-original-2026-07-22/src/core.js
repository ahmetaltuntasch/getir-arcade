export const RUN_DURATION = 180;
export const PERKS = [
  {id:"scooter",name:"E-Scooter Hızı",emoji:"🛵",desc:"Hareket hızın %18 artar.",stat:"speed",amount:.18},
  {id:"ice",name:"Dondurma Kalkanı",emoji:"🍦",desc:"Bir sonraki çarpışmayı engeller.",stat:"shield",amount:1},
  {id:"coffee",name:"Süper Kahve",emoji:"☕",desc:"Hız ve toplama alanı %10 artar.",stat:"coffee",amount:.1},
  {id:"bag",name:"Dev Getir Çantası",emoji:"🎒",desc:"Sipariş toplama alanı %30 büyür.",stat:"pickup",amount:.3},
  {id:"combo",name:"Seri Teslimat",emoji:"⚡",desc:"Kombo puanı %25 artar.",stat:"combo",amount:.25},
  {id:"raincoat",name:"Mor Yağmurluk",emoji:"🌧️",desc:"Hasarı %20 azaltır.",stat:"armor",amount:.2},
  {id:"map",name:"Kestirme Ustası",emoji:"🗺️",desc:"Teslimat hedefi daha yakında belirir.",stat:"distance",amount:.12},
  {id:"snack",name:"Enerji Atıştırması",emoji:"🍌",desc:"25 enerji yeniler.",stat:"heal",amount:25},
  {id:"magnet",name:"Sipariş Mıknatısı",emoji:"🧲",desc:"Siparişler uzaktan sana yaklaşır.",stat:"magnet",amount:.25},
  {id:"helmet",name:"Sağlam Kask",emoji:"⛑️",desc:"Maksimum enerji 20 artar.",stat:"maxHealth",amount:20},
  {id:"tip",name:"Bol Bahşiş",emoji:"💸",desc:"Her teslimat %20 fazla puan verir.",stat:"score",amount:.2},
  {id:"clock",name:"Zaman Bükücü",emoji:"⏱️",desc:"Trafik %12 yavaşlar.",stat:"slow",amount:.12}
];

export function calculateDeliveryScore(deliveries, multipliers={combo:0,score:0}) {
  const streak = Math.min(deliveries, 10);
  return Math.round((100 + streak * 12) * (1 + multipliers.combo + multipliers.score));
}
export function difficultyAt(elapsed) {
  const wave = Math.min(6, Math.floor(elapsed / 30));
  return { wave, spawnEvery: Math.max(.34, 1.18-wave*.13), speed: 105+wave*18, rush: elapsed>=150 };
}
export function samplePerks(perks, count=3, random=Math.random) {
  const pool=[...perks]; const result=[];
  while(result.length<count&&pool.length){result.push(pool.splice(Math.floor(random()*pool.length),1)[0]);}
  return result;
}
export function formatTime(seconds){const s=Math.max(0,Math.ceil(seconds));return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;}
