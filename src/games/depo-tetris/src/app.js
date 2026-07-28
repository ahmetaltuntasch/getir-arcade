import { DepoTetris } from './game.js';
import { GameAudio } from './audio.js';
import { arcadeStore } from '../../../shared/platform/store.js';
const $=id=>document.getElementById(id);const canvas=$('game');
const audio=new GameAudio();
const game=new DepoTetris(canvas,$('next'),{
  hud:s=>{$('time').textContent=s.time;$('score').textContent=s.score.toLocaleString('tr-TR');$('rows').textContent=s.rows;$('products').textContent=s.products;$('power').style.width=`${s.power*100}%`;},
  next:(pieces,labels)=>{game.drawNext(pieces);$('category').textContent=pieces.map((piece,i)=>`${i+1}. ${labels[i]}${piece.bonus?' · BONUS':''}`).join('  •  ');},
  bonus:([name,copy])=>{audio.play('bonus');$('bonus-card').innerHTML=`<b>${name}</b><p>${copy}</p>`;},
  alert:text=>{$('bonus-card').innerHTML=`<b>⚠️ ${text}</b><p>Picker rafları kurtardı, devam!</p>`;},
  sound:name=>audio.play(name),
  end:result=>{arcadeStore?.recordRun({clientRunId:`depo-${Date.now()}-${result.score}`,gameId:'depo-tetris',score:result.score,durationSeconds:180,completedAt:new Date().toISOString(),metrics:{rowsCleared:result.rowsCleared,productsCollected:result.productsCollected,bestCombo:result.bestCombo,reason:result.reason}});const best=Math.max(result.score,Number(localStorage.getItem('depo-tetris-best')||0));localStorage.setItem('depo-tetris-best',best);localStorage.setItem('getir-arcade-last-result',JSON.stringify({game:'depo-tetris',...result}));$('end-label').textContent=result.reason==='overflow'?'RAFLAR TAVANA ULAŞTI':'VARDİYA TAMAMLANDI';$('final-score').textContent=`${result.score.toLocaleString('tr-TR')} PUAN`;$('summary').innerHTML=`<span><b>${result.rowsCleared}</b>Toplanan raf</span><span><b>${result.productsCollected}</b>Ürün</span><span><b>x${result.bestCombo}</b>En iyi kombo</span><span><b>+${result.xp}</b>Arcade XP</span>`;$('end').classList.remove('hidden');$('hud').classList.add('hidden');}
});
function start(){audio.unlock();$('start').classList.add('hidden');$('end').classList.add('hidden');$('hud').classList.remove('hidden');game.start(); }
$('start-button').addEventListener('click',start);$('restart').addEventListener('click',start);
const keyMap={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'rotate',w:'rotate',W:'rotate',' ':'drop'};
addEventListener('keydown',e=>{if(['ArrowDown','s','S'].includes(e.key)){e.preventDefault();game.setSoftDrop(true);return;}const action=keyMap[e.key];if(action&&!e.repeat){e.preventDefault();game.command(action);}});
addEventListener('keyup',e=>{if(['ArrowDown','s','S'].includes(e.key))game.setSoftDrop(false);});addEventListener('blur',()=>game.setSoftDrop(false));
document.querySelectorAll('[data-action]').forEach(b=>{if(b.dataset.action==='down'){b.addEventListener('pointerdown',()=>game.setSoftDrop(true));b.addEventListener('pointerup',()=>game.setSoftDrop(false));b.addEventListener('pointercancel',()=>game.setSoftDrop(false));b.addEventListener('pointerleave',()=>game.setSoftDrop(false));}else b.addEventListener('pointerdown',()=>game.command(b.dataset.action));});
let touch=null;canvas.addEventListener('touchstart',e=>{const t=e.touches[0];touch={x:t.clientX,y:t.clientY};},{passive:true});canvas.addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y;if(Math.abs(dx)>35)game.command(dx>0?'right':'left');else if(dy>45)game.command('drop');else game.command('rotate');touch=null;},{passive:true});
let sound=true;$('sound').addEventListener('click',()=>{sound=!sound;audio.setEnabled(sound);$('sound').textContent=`SES: ${sound?'AÇIK':'KAPALI'}`;});
