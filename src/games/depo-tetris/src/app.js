import { DepoTetris } from './game.js';
import { GameAudio } from './audio.js';
import { arcadeStore } from '../../../shared/platform/store.js';
const $=id=>document.getElementById(id);const canvas=$('game');
const audio=new GameAudio();
const game=new DepoTetris(canvas,{
  hud:s=>{$('time').textContent=s.time;$('score').textContent=s.score.toLocaleString('tr-TR');$('rows').textContent=s.rows;$('products').textContent=s.products;$('power').style.width=`${s.power*100}%`;},
  bonus:([name,copy])=>{audio.play('bonus');$('bonus-card').innerHTML=`<b>${name}</b><p>${copy}</p>`;},
  alert:text=>{$('bonus-card').innerHTML=`<b>⚠️ ${text}</b><p>Picker rafları kurtardı, devam!</p>`;},
  sound:name=>audio.play(name),
  end:result=>{releaseJoystick();releaseKeyboard();document.body.classList.remove('game-running');arcadeStore?.recordRun({clientRunId:`depo-${Date.now()}-${result.score}`,gameId:'depo-tetris',score:result.score,durationSeconds:result.durationSeconds,completedAt:new Date().toISOString(),metrics:{rowsCleared:result.rowsCleared,productsCollected:result.productsCollected,bestCombo:result.bestCombo,reason:result.reason}});const best=Math.max(result.score,Number(localStorage.getItem('depo-tetris-best')||0));localStorage.setItem('depo-tetris-best',best);localStorage.setItem('getir-arcade-last-result',JSON.stringify({game:'depo-tetris',...result}));$('end-label').textContent=result.reason==='overflow'?'RAFLAR TAVANA ULAŞTI':'VARDİYA TAMAMLANDI';$('final-score').textContent=`${result.score.toLocaleString('tr-TR')} PUAN`;$('summary').innerHTML=`<span><b>${result.rowsCleared}</b>Toplanan raf</span><span><b>${result.productsCollected}</b>Ürün</span><span><b>x${result.bestCombo}</b>En iyi kombo</span><span><b>+${result.xp}</b>Arcade XP</span>`;$('end').classList.remove('hidden');$('hud').classList.add('hidden');}
});
function start(){if(portraitQuery.matches)return;audio.unlock();$('start').classList.add('hidden');$('end').classList.add('hidden');$('hud').classList.remove('hidden');document.body.classList.add('game-running');game.start();}
$('start-button').addEventListener('click',start);$('restart').addEventListener('click',start);
const keyMap={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'rotate',w:'rotate',W:'rotate',' ':'drop'};
const horizontalKeys=new Map(),downKeys=new Set();
function currentHorizontal(){const values=[...horizontalKeys.values()];return values.at(-1)||0;}
function releaseKeyboard(){horizontalKeys.clear();downKeys.clear();game.resetInput();}
addEventListener('keydown',e=>{if(['ArrowDown','s','S'].includes(e.key)){e.preventDefault();downKeys.add(e.key);game.setSoftDrop(true);return;}const action=keyMap[e.key];if(!action)return;e.preventDefault();if(e.repeat)return;if(action==='left'||action==='right'){horizontalKeys.delete(e.key);horizontalKeys.set(e.key,action==='left'?-1:1);game.setHorizontal(currentHorizontal());}else if(action==='rotate')game.queueRotate();else game.hardDrop();});
addEventListener('keyup',e=>{if(horizontalKeys.delete(e.key))game.setHorizontal(currentHorizontal());if(downKeys.delete(e.key)&&!downKeys.size)game.setSoftDrop(false);});addEventListener('blur',releaseKeyboard);
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();if(b.dataset.action==='rotate')game.queueRotate();else game.hardDrop();}));
let touch=null;canvas.addEventListener('touchstart',e=>{const t=e.touches[0];touch={x:t.clientX,y:t.clientY};},{passive:true});canvas.addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y;if(Math.abs(dx)>35){game.setHorizontal(dx>0?1:-1);game.setHorizontal(0);}else if(dy>45)game.hardDrop();else game.queueRotate();touch=null;},{passive:true});
const portraitQuery=matchMedia('(pointer: coarse) and (orientation: portrait)');
function syncOrientation(){document.body.classList.toggle('needs-landscape',portraitQuery.matches);game.setOrientationPaused(portraitQuery.matches&&game.running);}
portraitQuery.addEventListener?.('change',syncOrientation);syncOrientation();
const joystick=$('joystick'),knob=joystick.querySelector('.joystick-knob');let joystickPointer=null;
function moveJoystick(e){const r=joystick.getBoundingClientRect(),radius=r.width*.34,dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),distance=Math.hypot(dx,dy),scale=distance>radius?radius/distance:1,x=dx*scale,y=dy*scale,deadzone=radius*.18;knob.style.transform=`translate(${x}px,${y}px)`;game.setHorizontal(Math.abs(x)>deadzone&&Math.abs(x)>Math.abs(y)*.65?Math.sign(x):0);game.setSoftDrop(y>deadzone&&Math.abs(y)>Math.abs(x)*.65);}
function releaseJoystick(e){if(joystickPointer!==null&&e?.pointerId!==undefined&&e.pointerId!==joystickPointer)return;joystickPointer=null;knob.style.transform='translate(0,0)';game.setHorizontal(0);game.setSoftDrop(false);}
joystick.addEventListener('pointerdown',e=>{if(joystickPointer!==null)return;joystickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);moveJoystick(e);});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===joystickPointer)moveJoystick(e);});
joystick.addEventListener('pointerup',releaseJoystick);joystick.addEventListener('pointercancel',releaseJoystick);joystick.addEventListener('lostpointercapture',releaseJoystick);
addEventListener('blur',releaseJoystick);
let sound=true;$('sound').addEventListener('click',()=>{sound=!sound;audio.setEnabled(sound);$('sound').textContent=`SES: ${sound?'AÇIK':'KAPALI'}`;});
