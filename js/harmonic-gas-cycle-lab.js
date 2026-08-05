(() => {
  'use strict';

  const gasData = {
    neon: { label: 'Neon', color: '#ff5c32', emission: 'Orange-red', mass: 20.18 },
    argon: { label: 'Argon', color: '#8f78ff', emission: 'Blue-violet', mass: 39.95 },
    nitrogen: { label: 'Nitrogen', color: '#8b66ff', emission: 'Violet-blue', mass: 28.01 },
    oxygen: { label: 'Oxygen', color: '#b8d8ff', emission: 'Pale blue / green lines', mass: 32.0 },
    helium: { label: 'Helium', color: '#ffd27d', emission: 'Peach-yellow', mass: 4.0 },
    hydrogen: { label: 'Hydrogen', color: '#ff6b7d', emission: 'Pink-red', mass: 2.02 }
  };

  const $ = (id) => document.getElementById(id);
  const controls = {
    gas: $('gasSelect'), excitation: $('excitation'), expansion: $('expansion'),
    retention: $('retention'), returnPull: $('returnPull')
  };
  const outputs = {
    excitation: $('excitationOut'), expansion: $('expansionOut'),
    retention: $('retentionOut'), returnPull: $('returnOut')
  };

  const gasCanvas = $('gasCanvas');
  const gasCtx = gasCanvas.getContext('2d');
  const volumeCanvas = $('volumeCanvas');
  const volumeCtx = volumeCanvas.getContext('2d');
  const flowCanvas = $('flowCanvas');
  const flowCtx = flowCanvas.getContext('2d');
  const particles = Array.from({ length: 90 }, (_, i) => ({
    x: (i * 83) % gasCanvas.width,
    y: (i * 47) % gasCanvas.height,
    vx: ((i % 7) - 3) * 0.12,
    vy: (((i * 3) % 9) - 4) * 0.1,
    r: 1.7 + (i % 4) * 0.7
  }));

  let sparkFlash = 0;

  function state() {
    return {
      gas: gasData[controls.gas.value],
      excitation: Number(controls.excitation.value) / 100,
      expansion: Number(controls.expansion.value),
      retention: Number(controls.retention.value) / 100,
      returnPull: Number(controls.returnPull.value) / 100
    };
  }

  function updateLabels() {
    outputs.excitation.value = controls.excitation.value;
    outputs.expansion.value = controls.expansion.value;
    outputs.retention.value = controls.retention.value;
    outputs.returnPull.value = controls.returnPull.value;
  }

  function drawGas() {
    const s = state();
    const ctx = gasCtx;
    const w = gasCanvas.width;
    const h = gasCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.55);
    glow.addColorStop(0, `${s.gas.color}${Math.round(40 + s.excitation * 150).toString(16).padStart(2, '0')}`);
    glow.addColorStop(1, '#05091400');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    const speed = 0.35 + s.excitation * 2.2;
    const spread = Math.min(2.4, 0.7 + s.expansion / 35);
    particles.forEach((p, index) => {
      p.x += p.vx * speed * spread;
      p.y += p.vy * speed * spread;
      if (p.x < 0) p.x += w;
      if (p.x > w) p.x -= w;
      if (p.y < 0) p.y += h;
      if (p.y > h) p.y -= h;
      const alpha = 0.18 + s.excitation * 0.75;
      ctx.beginPath();
      ctx.fillStyle = `${s.gas.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.arc(p.x, p.y, p.r * (1 + s.expansion / 180), 0, Math.PI * 2);
      ctx.fill();
      if (s.excitation > 0.65 && index % 8 === 0) {
        ctx.strokeStyle = `${s.gas.color}70`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 25, p.y - p.vy * 25);
        ctx.stroke();
      }
    });

    if (sparkFlash > 0) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.8);
      for (let i = 1; i < 11; i++) {
        ctx.lineTo(w * (0.2 + i * 0.055), h * (0.8 - i * 0.055) + (i % 2 ? -22 : 18));
      }
      ctx.stroke();
      sparkFlash -= 1;
    }

    const density = (1 + s.excitation * 4.5) / s.expansion;
    const outward = (s.excitation * 1.2 + 0.15) / Math.sqrt(s.gas.mass);
    const capture = outward > s.returnPull ? 'Rising' : 'Returning';
    $('stageReadout').textContent = s.excitation < 0.08 ? 'Quiet' : 'Electrified';
    $('colorReadout').textContent = s.excitation < 0.08 ? 'Invisible / quiet' : s.gas.emission;
    $('densityReadout').textContent = density.toFixed(3);
    $('captureReadout').textContent = capture;
  }

  function axes(ctx, canvas, xLabel, yLabel) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#33466f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(54, 18); ctx.lineTo(54, canvas.height - 42); ctx.lineTo(canvas.width - 20, canvas.height - 42); ctx.stroke();
    ctx.fillStyle = '#9fb0cc';
    ctx.font = '14px system-ui';
    ctx.fillText(yLabel, 12, 20);
    ctx.fillText(xLabel, canvas.width - 120, canvas.height - 14);
  }

  function drawVolumeGraph() {
    const s = state();
    axes(volumeCtx, volumeCanvas, 'Volume', 'Density');
    const ctx = volumeCtx;
    const maxX = volumeCanvas.width - 76;
    const maxY = volumeCanvas.height - 72;
    ctx.strokeStyle = s.gas.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 1; i <= 100; i++) {
      const x = 54 + (i / 100) * maxX;
      const volume = 1 + (i / 100) * Math.max(2, s.expansion);
      const density = (1 + s.excitation * 4.5) / volume;
      const y = 18 + maxY - Math.min(1, density) * maxY;
      if (i === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#eef4ff';
    ctx.fillText('Project view: local intensity falls as occupied volume expands', 74, 42);
  }

  function drawFlowGraph() {
    const s = state();
    axes(flowCtx, flowCanvas, 'Distance / territory', 'Relative tendency');
    const ctx = flowCtx;
    const left = 54, right = flowCanvas.width - 22, top = 24, bottom = flowCanvas.height - 42;
    let crossX = left;
    let minDelta = Infinity;

    const drawLine = (fn, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        const x = left + t * (right - left);
        const value = Math.max(0, Math.min(1, fn(t)));
        const y = bottom - value * (bottom - top);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const outwardFn = (t) => Math.max(0, s.excitation * 1.15 * Math.exp(-t * (1.2 + 30 / s.expansion)) + 0.08);
    const returnFn = (t) => Math.min(1, s.returnPull * (0.2 + t * 1.25));
    drawLine(outwardFn, '#ff8266');
    drawLine(returnFn, '#78a7ff');

    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const d = Math.abs(outwardFn(t) - returnFn(t));
      if (d < minDelta) { minDelta = d; crossX = left + t * (right - left); }
    }
    ctx.strokeStyle = '#74f2ce';
    ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.moveTo(crossX, top); ctx.lineTo(crossX, bottom); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#74f2ce'; ctx.fillText('capture point', Math.min(crossX + 8, right - 90), top + 16);
    ctx.fillStyle = '#ff8266'; ctx.fillText('outward / long-jump', 74, 44);
    ctx.fillStyle = '#78a7ff'; ctx.fillText('return / pull-in', 74, 64);
  }

  function updateStaticGasket() {
    const s = state();
    const stored = s.retention * (0.25 + s.excitation * 0.75);
    const capacitor = $('capacitor');
    capacitor.style.filter = `drop-shadow(0 0 ${10 + stored * 28}px rgba(115,154,255,${0.2 + stored * 0.55}))`;
    $('chargeLabel').textContent = `Stored tension ${(stored * 100).toFixed(0)}%`;
    $('sparkMessage').textContent = stored > 0.76
      ? 'The simulated charge is near its breakdown threshold.'
      : 'Charge remains below the simulated breakdown threshold.';
  }

  function render() {
    updateLabels();
    drawGas();
    drawVolumeGraph();
    drawFlowGraph();
    updateStaticGasket();
  }

  Object.values(controls).forEach((control) => control.addEventListener('input', render));
  $('dischargeBtn').addEventListener('click', () => {
    const s = state();
    if (s.retention * (0.25 + s.excitation * 0.75) > 0.4) {
      sparkFlash = 8;
      $('sparkMessage').textContent = 'Simulated discharge: stored potential returned toward equilibrium.';
    } else {
      $('sparkMessage').textContent = 'Not enough simulated stored potential for a visible spark.';
    }
  });

  function animate() {
    drawGas();
    requestAnimationFrame(animate);
  }

  render();
  requestAnimationFrame(animate);
})();