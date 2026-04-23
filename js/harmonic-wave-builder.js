/* ============================================================
   RESONANT OS — Harmonic Wave Builder
   tools/harmonic-wave-builder.html
   ============================================================ */

(function () {
  'use strict';

  /* ── Element definitions (from drawings: H, H², L, B, B², C) */
  const WAVE_ELEMENTS = [
    {
      id: 'H',    label: 'H',    title: 'Hydrogen',    z: 1,
      freq: 1,    amp: 1.0,  phase: 0,
      color: '#06b6d4', desc: 'Fundamental — the base carrier wave.',
      container: 'bottle'
    },
    {
      id: 'H2',   label: 'H²',   title: 'Heavy Hydrogen', z: 1,
      freq: 2,    amp: 0.75, phase: Math.PI / 4,
      color: '#38bdf8', desc: 'First overtone — deuterium doubling.',
      container: 'bottle'
    },
    {
      id: 'Li',   label: 'L',    title: 'Lithium',     z: 3,
      freq: 3,    amp: 0.6,  phase: Math.PI / 3,
      color: '#f59e0b', desc: 'Lithium — triple harmonic, compressed Helium-3 store.',
      container: 'box'
    },
    {
      id: 'Be',   label: 'B',    title: 'Beryllium',   z: 4,
      freq: 4,    amp: 0.5,  phase: Math.PI / 2,
      color: '#10b981', desc: 'Beryllium — 4th harmonic static base, preload store.',
      container: 'box'
    },
    {
      id: 'Be2',  label: 'B²',   title: 'Be²',         z: 4,
      freq: 8,    amp: 0.35, phase: Math.PI * 0.6,
      color: '#34d399', desc: 'Beryllium squared — 8th harmonic, deep static charge.',
      container: 'box'
    },
    {
      id: 'C',    label: 'C',    title: 'Carbon',      z: 6,
      freq: 6,    amp: 0.4,  phase: Math.PI * 0.75,
      color: '#8b5cf6', desc: 'Carbon — 6th harmonic, organic lattice anchor.',
      container: 'box'
    }
  ];

  /* ── State ───────────────────────────────────────────────── */
  let activeIds = new Set();
  let canvas, ctxMain, ctxLayer, canvasLayer;
  let animFrame = null;
  let tick = 0;
  let waveSpeed = 1;
  let waveZoom  = 1;

  /* ── DOM refs ────────────────────────────────────────────── */
  let waveContainers, waveClearStack, waveAddAll,
      waveSpeedIn, waveZoomIn, waveSpeedVal, waveZoomVal, waveStats;

  /* ── Init on ros:ready ───────────────────────────────────── */
  document.addEventListener('ros:ready', () => {
    initDom();
    buildContainerRow();
    attachEvents();
    startLoop();
    updateStats();
  });

  function initDom() {
    waveContainers = document.getElementById('waveContainers');
    waveClearStack = document.getElementById('waveClearStack');
    waveAddAll     = document.getElementById('waveAddAll');
    waveSpeedIn    = document.getElementById('waveSpeed');
    waveZoomIn     = document.getElementById('waveZoom');
    waveSpeedVal   = document.getElementById('waveSpeedVal');
    waveZoomVal    = document.getElementById('waveZoomVal');
    waveStats      = document.getElementById('waveStats');
    canvas         = document.getElementById('waveCanvas');
    canvasLayer    = document.getElementById('waveLayerCanvas');

    if (canvas) {
      ctxMain = canvas.getContext('2d');
      resizeCanvas(canvas, 720, 320);
      window.addEventListener('resize', () => resizeCanvas(canvas, 720, 320));
    }
    if (canvasLayer) {
      ctxLayer = canvasLayer.getContext('2d');
      resizeCanvas(canvasLayer, 720, 180);
      window.addEventListener('resize', () => resizeCanvas(canvasLayer, 720, 180));
    }
  }

  function resizeCanvas(c, nativeW, nativeH) {
    if (!c) return;
    const wrap = c.parentElement;
    const w    = Math.min(nativeW, wrap.clientWidth - 8);
    c.width    = w;
    c.height   = Math.round(w * (nativeH / nativeW));
  }

  /* ── Container row ───────────────────────────────────────── */
  function buildContainerRow() {
    if (!waveContainers) return;
    waveContainers.innerHTML = '';
    WAVE_ELEMENTS.forEach(el => {
      const isActive = activeIds.has(el.id);
      const wrapper  = document.createElement('div');
      wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0.3rem;cursor:pointer;transition:transform 0.2s;';
      wrapper.dataset.id = el.id;
      wrapper.title = `${el.title}: ${el.desc}`;

      // Container shape (bottle or box)
      const shape = document.createElement('div');
      if (el.container === 'bottle') {
        shape.style.cssText = `
          width:52px;height:80px;
          border:2.5px solid ${isActive ? el.color : 'rgba(100,116,139,0.4)'};
          border-radius:8px 8px 6px 6px;
          background:${isActive ? el.color + '22' : 'transparent'};
          position:relative;
          box-shadow:${isActive ? `0 0 14px ${el.color}88` : 'none'};
          transition:all 0.25s;
          display:flex;align-items:center;justify-content:center;flex-direction:column;
        `;
        // Bottle neck
        const neck = document.createElement('div');
        neck.style.cssText = `
          position:absolute;top:-14px;left:50%;transform:translateX(-50%);
          width:22px;height:14px;
          border:2.5px solid ${isActive ? el.color : 'rgba(100,116,139,0.4)'};
          border-bottom:none;border-radius:4px 4px 0 0;
          background:${isActive ? el.color + '22' : 'transparent'};
        `;
        shape.appendChild(neck);
      } else {
        shape.style.cssText = `
          width:52px;height:54px;
          border:2.5px solid ${isActive ? el.color : 'rgba(100,116,139,0.4)'};
          border-radius:6px;
          background:${isActive ? el.color + '22' : 'transparent'};
          box-shadow:${isActive ? `0 0 14px ${el.color}88` : 'none'};
          transition:all 0.25s;
          display:flex;align-items:center;justify-content:center;
        `;
      }

      // Label inside
      const lbl = document.createElement('div');
      lbl.style.cssText = `font-family:var(--font-sans);font-size:1rem;font-weight:900;color:${isActive ? el.color : '#64748b'};`;
      lbl.textContent = el.label;
      shape.appendChild(lbl);

      // Bottom label
      const sub = document.createElement('div');
      sub.style.cssText = `font-size:0.68rem;color:${isActive ? el.color : '#475569'};font-family:var(--font-mono);max-width:60px;text-align:center;`;
      sub.textContent = `H${el.freq}`;

      wrapper.appendChild(shape);
      wrapper.appendChild(sub);

      wrapper.addEventListener('click', () => toggleElement(el.id));
      wrapper.addEventListener('mouseover', () => { wrapper.style.transform = 'scale(1.08)'; });
      wrapper.addEventListener('mouseout',  () => { wrapper.style.transform = 'scale(1)'; });

      waveContainers.appendChild(wrapper);
    });
  }

  function toggleElement(id) {
    if (activeIds.has(id)) activeIds.delete(id);
    else                    activeIds.add(id);
    buildContainerRow();
    updateStats();
  }

  function clearStack() {
    activeIds.clear();
    buildContainerRow();
    updateStats();
  }

  function addAll() {
    WAVE_ELEMENTS.forEach(el => activeIds.add(el.id));
    buildContainerRow();
    updateStats();
  }

  /* ── Events ──────────────────────────────────────────────── */
  function attachEvents() {
    if (waveClearStack) waveClearStack.addEventListener('click', clearStack);
    if (waveAddAll)     waveAddAll.addEventListener('click',     addAll);
    if (waveSpeedIn) {
      waveSpeedIn.addEventListener('input', () => {
        waveSpeed = parseFloat(waveSpeedIn.value) || 1;
        if (waveSpeedVal) waveSpeedVal.textContent = waveSpeed.toFixed(1) + '×';
      });
    }
    if (waveZoomIn) {
      waveZoomIn.addEventListener('input', () => {
        waveZoom = parseFloat(waveZoomIn.value) || 1;
        if (waveZoomVal) waveZoomVal.textContent = waveZoom.toFixed(1) + '×';
      });
    }
  }

  /* ── Active element list ─────────────────────────────────── */
  function getActiveElements() {
    return WAVE_ELEMENTS.filter(el => activeIds.has(el.id));
  }

  /* ── Wave function ───────────────────────────────────────── */
  function sampleWave(x, t) {
    const elems = getActiveElements();
    if (elems.length === 0) return 0;
    let sum = 0;
    elems.forEach(el => {
      sum += el.amp * Math.sin(el.freq * x + el.phase + t * el.freq * waveSpeed * 0.6);
    });
    return sum;
  }

  /* ── Animation loop ──────────────────────────────────────── */
  function startLoop() {
    function loop() {
      animFrame = requestAnimationFrame(loop);
      tick += 0.016 * waveSpeed;
      drawMainCanvas();
      drawLayerCanvas();
    }
    loop();
  }

  /* ── Main composite wave canvas ──────────────────────────── */
  function drawMainCanvas() {
    if (!ctxMain || !canvas) return;
    const W = canvas.width, H = canvas.height;
    const pad = 30;
    const midY = H / 2;
    const plotW = W - pad * 2;

    ctxMain.fillStyle = '#070b14';
    ctxMain.fillRect(0, 0, W, H);

    // Grid
    ctxMain.strokeStyle = 'rgba(6,182,212,0.05)';
    ctxMain.lineWidth = 1;
    for (let y = 0; y <= H; y += 40) { ctxMain.beginPath(); ctxMain.moveTo(0, y); ctxMain.lineTo(W, y); ctxMain.stroke(); }
    for (let x = 0; x <= W; x += 40) { ctxMain.beginPath(); ctxMain.moveTo(x, 0); ctxMain.lineTo(x, H); ctxMain.stroke(); }

    // Axis
    ctxMain.strokeStyle = 'rgba(6,182,212,0.2)';
    ctxMain.lineWidth = 1;
    ctxMain.beginPath(); ctxMain.moveTo(pad, midY); ctxMain.lineTo(W - pad, midY); ctxMain.stroke();

    const elems = getActiveElements();
    if (elems.length === 0) {
      ctxMain.save();
      ctxMain.font = '14px "Courier New", monospace';
      ctxMain.fillStyle = 'rgba(100,116,139,0.5)';
      ctxMain.textAlign = 'center';
      ctxMain.textBaseline = 'middle';
      ctxMain.fillText('CLICK ELEMENT CONTAINERS TO ADD LAYERS', W / 2, H / 2);
      ctxMain.restore();
      return;
    }

    // Max amplitude for normalisation
    const maxPossible = elems.reduce((s, e) => s + e.amp, 0);
    const scale = Math.min((H / 2 - pad) * waveZoom, (H / 2 - pad)) / Math.max(1, maxPossible);

    // Draw composite wave with rainbow gradient
    const numSteps = Math.min(plotW, 700);
    const grad = ctxMain.createLinearGradient(pad, 0, W - pad, 0);
    elems.forEach((el, i) => {
      grad.addColorStop(i / Math.max(1, elems.length - 1), el.color);
    });
    if (elems.length === 1) grad.addColorStop(1, elems[0].color);

    ctxMain.save();
    ctxMain.beginPath();
    for (let px = 0; px <= numSteps; px++) {
      const x = (px / numSteps) * Math.PI * 4;
      const y = sampleWave(x, tick);
      const sx = pad + (px / numSteps) * plotW;
      const sy = midY - y * scale;
      if (px === 0) ctxMain.moveTo(sx, sy);
      else          ctxMain.lineTo(sx, sy);
    }
    ctxMain.strokeStyle = grad;
    ctxMain.lineWidth = 2.5;
    ctxMain.shadowColor = elems[0] ? elems[0].color : '#06b6d4';
    ctxMain.shadowBlur  = 10;
    ctxMain.stroke();
    ctxMain.shadowBlur = 0;

    // Fill under wave
    ctxMain.lineTo(W - pad, midY);
    ctxMain.lineTo(pad, midY);
    ctxMain.closePath();
    const fillGrad = ctxMain.createLinearGradient(0, midY - 80, 0, midY + 80);
    fillGrad.addColorStop(0, (elems[0] ? elems[0].color : '#06b6d4') + '22');
    fillGrad.addColorStop(0.5, (elems[0] ? elems[0].color : '#06b6d4') + '08');
    fillGrad.addColorStop(1, 'transparent');
    ctxMain.fillStyle = fillGrad;
    ctxMain.fill();
    ctxMain.restore();

    // Label
    ctxMain.save();
    ctxMain.font = '10px "Courier New", monospace';
    ctxMain.fillStyle = 'rgba(100,116,139,0.7)';
    ctxMain.textAlign = 'left';
    ctxMain.textBaseline = 'top';
    ctxMain.fillText(`COMPOSITE  ${elems.map(e => e.label).join('+')}  LAYERS:${elems.length}`, pad + 4, 10);
    ctxMain.restore();
  }

  /* ── Layer canvas (individual waves) ─────────────────────── */
  function drawLayerCanvas() {
    if (!ctxLayer || !canvasLayer) return;
    const W = canvasLayer.width, H = canvasLayer.height;
    const elems = getActiveElements();

    ctxLayer.fillStyle = '#070b14';
    ctxLayer.fillRect(0, 0, W, H);

    if (elems.length === 0) return;

    const rowH    = H / elems.length;
    const pad     = 10;
    const plotW   = W - pad * 2;
    const numSteps = Math.min(plotW, 600);

    elems.forEach((el, rowIdx) => {
      const midY  = rowH * rowIdx + rowH / 2;
      const scale = (rowH / 2 - 4) * 0.9;

      // Row label
      ctxLayer.save();
      ctxLayer.font = `bold 10px "Courier New", monospace`;
      ctxLayer.fillStyle = el.color;
      ctxLayer.textAlign = 'left';
      ctxLayer.textBaseline = 'middle';
      ctxLayer.shadowColor = el.color;
      ctxLayer.shadowBlur = 4;
      ctxLayer.fillText(el.label, 4, midY);
      ctxLayer.shadowBlur = 0;
      ctxLayer.restore();

      // Row separator
      if (rowIdx > 0) {
        ctxLayer.strokeStyle = 'rgba(30,45,74,0.8)';
        ctxLayer.lineWidth = 1;
        ctxLayer.beginPath();
        ctxLayer.moveTo(0, rowH * rowIdx);
        ctxLayer.lineTo(W, rowH * rowIdx);
        ctxLayer.stroke();
      }

      // Axis
      ctxLayer.strokeStyle = `rgba(100,116,139,0.15)`;
      ctxLayer.lineWidth = 1;
      ctxLayer.beginPath();
      ctxLayer.moveTo(pad + 20, midY);
      ctxLayer.lineTo(W - pad, midY);
      ctxLayer.stroke();

      // Wave
      ctxLayer.save();
      ctxLayer.beginPath();
      for (let px = 0; px <= numSteps; px++) {
        const x  = (px / numSteps) * Math.PI * 4;
        const y  = el.amp * Math.sin(el.freq * x + el.phase + tick * el.freq * waveSpeed * 0.6);
        const sx = pad + 22 + (px / numSteps) * (plotW - 22);
        const sy = midY - y * scale;
        if (px === 0) ctxLayer.moveTo(sx, sy);
        else          ctxLayer.lineTo(sx, sy);
      }
      ctxLayer.strokeStyle = el.color;
      ctxLayer.lineWidth = 1.5;
      ctxLayer.shadowColor = el.color;
      ctxLayer.shadowBlur = 6;
      ctxLayer.stroke();
      ctxLayer.shadowBlur = 0;
      ctxLayer.restore();
    });
  }

  /* ── Stats panel ─────────────────────────────────────────── */
  function updateStats() {
    if (!waveStats) return;
    const elems = getActiveElements();
    if (elems.length === 0) {
      waveStats.innerHTML = '<span style="color:#475569;font-style:italic;">Add elements to see wave analysis.</span>';
      return;
    }

    const totalAmp   = elems.reduce((s, e) => s + e.amp, 0).toFixed(3);
    const freqList   = elems.map(e => `H${e.freq}`).join(', ');
    const complexity = elems.length >= 5 ? 'Complex / Entangled' : elems.length >= 3 ? 'Compound' : elems.length === 2 ? 'Interference' : 'Simple';
    const dominant   = elems.reduce((a, b) => a.amp > b.amp ? a : b);

    waveStats.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:0.75rem;">
        <div class="result-box">
          <div class="result-label">Active Layers</div>
          <div class="result-val" style="font-size:1.5rem;">${elems.length}</div>
          <div style="font-size:0.78rem;color:#64748b;">${elems.map(e => e.label).join(' + ')}</div>
        </div>
        <div class="result-box">
          <div class="result-label">Harmonics</div>
          <div class="result-val" style="font-size:1rem;">${freqList}</div>
          <div style="font-size:0.78rem;color:#64748b;">Fourier components</div>
        </div>
        <div class="result-box">
          <div class="result-label">Total Amplitude</div>
          <div class="result-val" style="font-size:1.4rem;">${totalAmp}</div>
          <div style="font-size:0.78rem;color:#64748b;">Max possible combined</div>
        </div>
        <div class="result-box">
          <div class="result-label">Complexity</div>
          <div class="result-val" style="font-size:1rem;color:#8b5cf6;">${complexity}</div>
          <div style="font-size:0.78rem;color:#64748b;">Waveform classification</div>
        </div>
        <div class="result-box">
          <div class="result-label">Dominant Layer</div>
          <div class="result-val" style="font-size:1.2rem;color:${dominant.color};">${dominant.label}</div>
          <div style="font-size:0.78rem;color:#64748b;">${dominant.title} — H${dominant.freq}</div>
        </div>
      </div>
      <div style="font-size:0.83rem;color:#94a3b8;line-height:1.7;margin-top:0.75rem;">
        ${elems.length === 1
          ? `Single ${dominant.title} carrier — pure ${dominant.freq === 1 ? 'fundamental' : `${dominant.freq}th harmonic`} waveform. Add more elements to build complexity.`
          : elems.length <= 3
            ? `${complexity} waveform: ${elems.map(e => e.title).join(' + ')}. The waves are beginning to interfere and create new frequency regions.`
            : `${complexity} field: ${elems.length} harmonics active. The composite waveform shows rich interference patterns — characteristic of a fully activated resonance lattice.`}
      </div>
    `;
  }

})();
