(() => {
  'use strict';
  const layers = [
    ['H','Hydrogen','#ff647c'],['He','Helium','#ffb457'],['Li','Lithium','#f4e56d'],
    ['Be','Beryllium','#7cf5ac'],['B','Boron','#5de1d2'],['C','Carbon','#8ea4be'],
    ['N','Nitrogen','#6a9cff'],['O','Oxygen','#a779ff'],['F','Fluorine','#f06cff']
  ];
  const hull = document.getElementById('hull');
  const legend = document.getElementById('layerLegend');
  layers.slice().reverse().forEach((layer, reverseIndex) => {
    const originalIndex = layers.length - 1 - reverseIndex;
    const el = document.createElement('div');
    el.className = 'layer';
    el.style.setProperty('--inset', `${originalIndex * 4.4}%`);
    el.style.setProperty('--z', `${(8-originalIndex)*5}px`);
    el.style.setProperty('--fill', layer[2]);
    el.style.setProperty('--glow', `${layer[2]}55`);
    el.textContent = originalIndex < 4 ? layer[0] : '';
    hull.appendChild(el);
  });
  layers.forEach((l,i) => {
    const item = document.createElement('div');
    item.textContent = `${i+1}. ${l[0]} · ${l[1]}`;
    legend.appendChild(item);
  });

  const ids = ['core','boron','carbon','field','yb'];
  const controls = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  ids.forEach(id => controls[id].addEventListener('input', update));

  const gradient = document.getElementById('gradientChart');
  const gctx = gradient.getContext('2d');
  const star = document.getElementById('starChart');
  const sctx = star.getContext('2d');
  let target = {x: star.width * .77, y: star.height * .31};
  let locked = false;

  function values(){return Object.fromEntries(ids.map(id => [id, Number(controls[id].value)]));}
  function scores(v){
    const containment = Math.max(0, Math.min(100, 42 + v.boron*.35 + v.field*.22 + v.carbon*.18 - v.core*.24));
    const thermal = Math.max(0, Math.min(100, 35 + v.carbon*.55 + v.boron*.15 - v.core*.28));
    const loop = Math.max(0, Math.min(100, v.yb*.52 + containment*.27 + thermal*.21));
    return {containment,thermal,loop};
  }
  function update(){
    const v = values(), s = scores(v);
    ids.forEach(id => document.getElementById(`${id}Out`).textContent = v[id]);
    document.getElementById('containment').textContent = `${s.containment.toFixed(0)}%`;
    document.getElementById('thermal').textContent = `${s.thermal.toFixed(0)}%`;
    document.getElementById('loop').textContent = `${s.loop.toFixed(0)}%`;
    document.getElementById('clock').textContent = locked && s.loop > 72 ? 'LOCKED' : 'SEARCHING';
    drawGradient(v,s); drawStars(v,s);
  }
  function drawGradient(v,s){
    gctx.clearRect(0,0,gradient.width,gradient.height);
    const pad=50,w=gradient.width-pad*2,h=gradient.height-80;
    gctx.strokeStyle='rgba(180,200,255,.2)';gctx.lineWidth=1;
    for(let i=0;i<=5;i++){const y=30+h*i/5;gctx.beginPath();gctx.moveTo(pad,y);gctx.lineTo(pad+w,y);gctx.stroke();}
    const energy = layers.map((_,i)=> Math.max(8, v.core*(1-i*.065)+v.field*(i/12)-v.boron*(i===4?.22:.03)));
    const contain = layers.map((_,i)=> Math.min(100, s.containment*(.45+i*.065)+v.carbon*(i===5?.18:.02)));
    plot(energy,'#ffcf6b');plot(contain,'#77eaff');
    function plot(data,color){gctx.strokeStyle=color;gctx.lineWidth=4;gctx.beginPath();data.forEach((n,i)=>{const x=pad+w*i/8,y=30+h-(n/100)*h;i?gctx.lineTo(x,y):gctx.moveTo(x,y)});gctx.stroke();data.forEach((n,i)=>{const x=pad+w*i/8,y=30+h-(n/100)*h;gctx.fillStyle=color;gctx.beginPath();gctx.arc(x,y,5,0,Math.PI*2);gctx.fill();});}
    gctx.font='15px system-ui';gctx.fillStyle='#ffcf6b';gctx.fillText('Energy gradient',pad,gradient.height-18);gctx.fillStyle='#77eaff';gctx.fillText('Containment',pad+170,gradient.height-18);
  }
  function drawStars(v,s){
    sctx.clearRect(0,0,star.width,star.height);sctx.fillStyle='#050817';sctx.fillRect(0,0,star.width,star.height);
    let seed=19;for(let i=0;i<150;i++){seed=(seed*9301+49297)%233280;const x=seed/233280*star.width;seed=(seed*9301+49297)%233280;const y=seed/233280*star.height;sctx.fillStyle=`rgba(255,255,255,${.18+(i%7)/12})`;sctx.fillRect(x,y,i%11===0?2:1,i%11===0?2:1)}
    const origin={x:star.width*.2,y:star.height*.68};
    sctx.strokeStyle='rgba(113,226,255,.45)';sctx.lineWidth=2;sctx.setLineDash([8,8]);sctx.beginPath();sctx.moveTo(origin.x,origin.y);sctx.lineTo(target.x,target.y);sctx.stroke();sctx.setLineDash([]);
    const loops=2+Math.round(s.loop/30);sctx.strokeStyle=locked?'#b18cff':'rgba(177,140,255,.45)';sctx.lineWidth=3;sctx.beginPath();for(let t=0;t<=Math.PI*2;t+=.03){const r=75+Math.sin(t*loops)*22;const x=target.x+Math.cos(t)*r;const y=target.y+Math.sin(t)*r*.42;t?sctx.lineTo(x,y):sctx.moveTo(x,y)}sctx.stroke();
    orb(origin.x,origin.y,14,'#ffcf6b');orb(target.x,target.y,18,locked?'#75efff':'#8a65ff');
    sctx.fillStyle='#cbd5ff';sctx.font='14px system-ui';sctx.fillText('Origin pulse',origin.x-42,origin.y+34);sctx.fillText('True-end vector',target.x-52,target.y-30);
    function orb(x,y,r,c){sctx.fillStyle=c;sctx.shadowBlur=24;sctx.shadowColor=c;sctx.beginPath();sctx.arc(x,y,r,0,Math.PI*2);sctx.fill();sctx.shadowBlur=0;}
  }
  star.addEventListener('pointerdown',e=>{const r=star.getBoundingClientRect();target={x:(e.clientX-r.left)*star.width/r.width,y:(e.clientY-r.top)*star.height/r.height};locked=false;log('Destination vector moved; Ytterbium lock released.');update();});
  document.getElementById('lockBtn').addEventListener('click',()=>{
    const s=scores(values());locked=s.loop>72;
    const orb=document.getElementById('alertOrb'),title=document.getElementById('alertTitle'),text=document.getElementById('alertText');
    orb.classList.toggle('locked',locked);
    title.textContent=locked?'Infinity vector locked':'Lock rejected';
    text.textContent=locked?'Ytterbium clock, containment model, and thermal margin have crossed the simulated lock threshold.':'Increase Ytterbium stability, containment, or thermal margin. This is a fictional navigation score.';
    log(locked?'LOCK: Möbius route accepted by simulation.':'REJECT: stability threshold not met.');update();
  });
  function log(message){const li=document.createElement('li');li.textContent=`${new Date().toLocaleTimeString()} — ${message}`;document.getElementById('eventLog').prepend(li);}
  update();log('Laboratory initialized in simulation-only mode.');
})();