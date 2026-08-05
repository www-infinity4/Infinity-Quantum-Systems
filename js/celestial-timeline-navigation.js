(() => {
  const $ = (id) => document.getElementById(id);
  const solar = $('solarClock');
  const sctx = solar.getContext('2d');
  const vector = $('vectorMap');
  const vctx = vector.getContext('2d');
  const forces = $('forcesGraph');
  const fctx = forces.getContext('2d');
  const clock = $('clockGraph');
  const cctx = clock.getContext('2d');
  let running = true;
  let phase = 0;

  const controls = ['alpha','beta','gamma','delta','moonCount','regularity','stress','ybStability','phaseDrift','destinationMatch'];
  controls.forEach((id) => $(id).addEventListener('input', renderAll));

  $('animateBtn').addEventListener('click', () => {
    running = !running;
    $('animateBtn').textContent = running ? 'Pause orbit' : 'Resume orbit';
  });

  $('lockBtn').addEventListener('click', () => {
    const lockScore = (+$('ybStability').value * .45) + (+$('destinationMatch').value * .4) - (+$('phaseDrift').value * .3);
    const el = $('lockStatus');
    if (lockScore >= 60) {
      el.textContent = `Chamber locked · score ${Math.round(lockScore)}`;
      el.className = 'lock-status locked';
    } else {
      el.textContent = `Lock incomplete · score ${Math.round(lockScore)}`;
      el.className = 'lock-status warning';
    }
  });

  function clear(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawSolarClock() {
    clear(sctx, solar);
    const cx = solar.width / 2;
    const cy = solar.height / 2;
    const orbits = [55, 90, 128, 170, 215];
    sctx.strokeStyle = '#26314d';
    sctx.lineWidth = 2;
    orbits.forEach((r) => {
      sctx.beginPath(); sctx.arc(cx, cy, r, 0, Math.PI * 2); sctx.stroke();
    });
    sctx.fillStyle = '#ffd66b';
    sctx.beginPath(); sctx.arc(cx, cy, 24, 0, Math.PI * 2); sctx.fill();

    const colors = ['#65e8ff','#77f0b1','#b98cff','#ff6a7b','#f5f7ff'];
    orbits.forEach((r, i) => {
      const a = phase * (.22 + i * .06) + i * 1.1;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      sctx.fillStyle = colors[i];
      sctx.beginPath(); sctx.arc(x, y, 9 + i, 0, Math.PI * 2); sctx.fill();
      const moons = Math.min(5, Math.round(+$('moonCount').value / 16));
      for (let m = 0; m < moons; m++) {
        const ma = a * 2 + m * (Math.PI * 2 / Math.max(1, moons));
        sctx.fillStyle = '#aab4ca';
        sctx.beginPath(); sctx.arc(x + Math.cos(ma) * (17 + i), y + Math.sin(ma) * (17 + i), 2.5, 0, Math.PI * 2); sctx.fill();
      }
    });

    sctx.strokeStyle = '#b98cff';
    sctx.setLineDash([10, 8]);
    sctx.beginPath();
    sctx.moveTo(cx, cy);
    const d = +$('delta').value;
    sctx.lineTo(cx + 250, cy - d * 2.5);
    sctx.stroke();
    sctx.setLineDash([]);
  }

  function drawVectorMap() {
    clear(vctx, vector);
    const a = +$('alpha').value, b = +$('beta').value, g = +$('gamma').value, d = +$('delta').value;
    const pts = {
      A: [90 + a * 1.2, 330],
      B: [250, 330 - b * 2.2],
      G: [500 - g * 1.1, 100],
      D: [390 + d * 2, 210 - d]
    };
    const order = ['A','B','G','A'];
    vctx.strokeStyle = '#65e8ff'; vctx.lineWidth = 3;
    vctx.beginPath();
    order.forEach((k, i) => i ? vctx.lineTo(...pts[k]) : vctx.moveTo(...pts[k]));
    vctx.stroke();
    vctx.strokeStyle = '#b98cff'; vctx.setLineDash([8,6]);
    vctx.beginPath(); vctx.moveTo(...pts.G); vctx.lineTo(...pts.D); vctx.stroke(); vctx.setLineDash([]);
    const colors = {A:'#ffd66b',B:'#65e8ff',G:'#ff6a7b',D:'#b98cff'};
    Object.entries(pts).forEach(([k,p]) => {
      vctx.fillStyle = colors[k]; vctx.beginPath(); vctx.arc(p[0],p[1],12,0,Math.PI*2); vctx.fill();
      vctx.fillStyle = '#eef3ff'; vctx.font = 'bold 18px system-ui'; vctx.fillText(k,p[0]+16,p[1]-12);
    });
    const area = Math.abs((pts.A[0]*(pts.B[1]-pts.G[1])+pts.B[0]*(pts.G[1]-pts.A[1])+pts.G[0]*(pts.A[1]-pts.B[1]))/2);
    const displacement = Math.hypot(pts.D[0]-pts.G[0],pts.D[1]-pts.G[1]);
    const proximity = 100/(1+displacement/70);
    $('area').textContent = Math.round(area).toLocaleString();
    $('displacement').textContent = displacement.toFixed(1);
    $('proximity').textContent = `${Math.round(proximity)}%`;
  }

  function drawForces() {
    clear(fctx, forces);
    const vals = [+$('alpha').value,+$('beta').value,+$('gamma').value,Math.abs(+$('delta').value),+$('ybStability').value];
    const labels = ['Alpha weight','Beta activity','Gamma pull','Delta shift','Yb lock'];
    const colors = ['#ffd66b','#65e8ff','#ff6a7b','#b98cff','#77f0b1'];
    const bw = 145, gap = 45, baseY = 270;
    vals.forEach((v,i)=>{
      const h = v*2.1; const x = 75+i*(bw+gap);
      fctx.fillStyle = colors[i]; fctx.fillRect(x,baseY-h,bw,h);
      fctx.fillStyle = '#eef3ff'; fctx.font='bold 16px system-ui'; fctx.fillText(String(v),x+8,baseY-h-10);
      fctx.fillStyle = '#9ca8c5'; fctx.font='14px system-ui'; fctx.fillText(labels[i],x,baseY+26);
    });
  }

  function drawClock() {
    clear(cctx, clock);
    const stability = +$('ybStability').value;
    const drift = +$('phaseDrift').value;
    const match = +$('destinationMatch').value;
    cctx.strokeStyle='#77f0b1'; cctx.lineWidth=3; cctx.beginPath();
    for(let x=0;x<clock.width;x++){
      const y=clock.height/2 + Math.sin((x+phase*45)/22)*(drift*.35) + Math.sin(x/7)*(100-stability)*.06 - match*.08;
      x?cctx.lineTo(x,y):cctx.moveTo(x,y);
    }
    cctx.stroke();
  }

  function updateMoonModel() {
    const moons=+$('moonCount').value, regularity=+$('regularity').value, stress=+$('stress').value;
    const stability=Math.max(0,Math.min(100,regularity*.55+Math.log2(moons+1)*9-stress*.38));
    const duration=(stability*(1+moons/40)).toFixed(1);
    $('stability').textContent=`${Math.round(stability)}%`;
    $('durationIndex').textContent=duration;
    $('anchorDensity').textContent=(moons/Math.max(1,100-stress)).toFixed(2);
  }

  function renderAll(){drawSolarClock();drawVectorMap();drawForces();drawClock();updateMoonModel();}
  function loop(){if(running){phase+=.01;drawSolarClock();drawClock();}requestAnimationFrame(loop)}
  renderAll(); loop();
})();