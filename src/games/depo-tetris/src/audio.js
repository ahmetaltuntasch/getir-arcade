export class GameAudio {
  constructor(){this.context=null;this.enabled=true;this.master=null;}
  unlock(){if(!this.context){const AudioContext=window.AudioContext||window.webkitAudioContext;this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=.16;this.master.connect(this.context.destination);}if(this.context.state==='suspended')this.context.resume();}
  setEnabled(value){this.enabled=value;if(value)this.unlock();}
  tone(frequency,duration=.08,{type='sine',volume=.25,delay=0,slide=0}={}){if(!this.enabled)return;this.unlock();const now=this.context.currentTime+delay,osc=this.context.createOscillator(),gain=this.context.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,now);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(40,frequency+slide),now+duration);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.008);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(gain);gain.connect(this.master);osc.start(now);osc.stop(now+duration+.02);}
  play(name){if(!this.enabled)return;const patterns={
    rotate:()=>{this.tone(360,.045,{type:'triangle',volume:.12,slide:90});},
    drop:()=>{this.tone(115,.1,{type:'triangle',volume:.28,slide:-45});this.tone(70,.08,{type:'sine',volume:.12,delay:.025});},
    row:()=>[420,560,720].forEach((f,i)=>this.tone(f,.09,{type:'triangle',volume:.2,delay:i*.045,slide:35})),
    cascade:()=>[500,650,820,1040].forEach((f,i)=>this.tone(f,.11,{type:'sine',volume:.18,delay:i*.05,slide:50})),
    category:()=>[330,495,660,880].forEach((f,i)=>this.tone(f,.15,{type:'triangle',volume:.22,delay:i*.045,slide:80})),
    product:()=>{[260,390,520,780,1040].forEach((f,i)=>this.tone(f,.2,{type:i%2?'sine':'triangle',volume:.2,delay:i*.04,slide:120}));this.tone(95,.28,{type:'sawtooth',volume:.1,slide:-40});},
    bonus:()=>[660,880,1100].forEach((f,i)=>this.tone(f,.1,{volume:.16,delay:i*.07})),
    gameOver:()=>[420,330,245,165].forEach((f,i)=>this.tone(f,.22,{type:'triangle',volume:.19,delay:i*.14,slide:-25})),
    complete:()=>[392,523,659,784].forEach((f,i)=>this.tone(f,.2,{type:'sine',volume:.18,delay:i*.11,slide:30})),
  };patterns[name]?.();}
}
