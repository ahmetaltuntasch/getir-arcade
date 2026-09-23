const limits={
  'getir-rush':{score:25000,duration:180,metrics:{deliveries:80,perks:12}},
  'depo-tetris':{score:50000,duration:180,metrics:{rowsCleared:80,productsCollected:1000,bestCombo:80}},
  'televole-wars':{score:100000,duration:90,metrics:{headlines:500,bestCombo:500,bursts:20}},
};
const integer=(value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;

export function validateRun(input,now=Date.now()){
  if(!input||typeof input!=='object')return{ok:false,error:'Geçersiz tur sonucu'};
  const gameId=String(input.gameId||''),rules=limits[gameId];
  const clientRunId=String(input.clientRunId||'');
  const score=Number(input.score),durationSeconds=Number(input.durationSeconds);
  const completedAt=new Date(input.completedAt),metrics=input.metrics;
  if(!rules||!/^[a-z0-9-]{8,100}$/i.test(clientRunId))return{ok:false,error:'Geçersiz tur kimliği'};
  if(!integer(score,0,rules.score)||!integer(durationSeconds,1,rules.duration))return{ok:false,error:'Şüpheli skor veya süre'};
  if(Number.isNaN(completedAt.getTime())||completedAt.getTime()>now+5*60_000||completedAt.getTime()<now-7*24*60*60_000)return{ok:false,error:'Geçersiz tur zamanı'};
  if(!metrics||typeof metrics!=='object'||Array.isArray(metrics))return{ok:false,error:'Geçersiz tur detayları'};
  for(const[key,max]of Object.entries(rules.metrics))if(!integer(Number(metrics[key]??0),0,max))return{ok:false,error:'Şüpheli tur detayları'};
  if(gameId==='getir-rush'){
    if(!['complete','energy'].includes(metrics.reason)||metrics.reason==='complete'&&durationSeconds<178)return{ok:false,error:'Tur süresi sonuçla uyuşmuyor'};
    if(score<metrics.deliveries*100)return{ok:false,error:'Skor teslimatlarla uyuşmuyor'};
  }else if(gameId==='depo-tetris'){
    if(!['time','overflow'].includes(metrics.reason)||metrics.reason==='time'&&durationSeconds<178)return{ok:false,error:'Tur süresi sonuçla uyuşmuyor'};
    if(metrics.productsCollected<metrics.rowsCleared*10)return{ok:false,error:'Raf ve ürün sayısı uyuşmuyor'};
  }else{
    if(!['time','energy'].includes(metrics.reason)||metrics.reason==='time'&&durationSeconds<88)return{ok:false,error:'Tur süresi sonuçla uyuşmuyor'};
    if(score<metrics.headlines*60||metrics.bestCombo>metrics.headlines)return{ok:false,error:'Skor manşetlerle uyuşmuyor'};
  }
  return{ok:true,value:{clientRunId,gameId,score,durationSeconds,completedAt:completedAt.toISOString(),metrics}};
}
