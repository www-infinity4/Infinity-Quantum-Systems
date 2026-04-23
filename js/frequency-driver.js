/* ============================================================
   RESONANT OS — Frequency Driver
   tools/frequency-driver.html
   ============================================================ */

(function () {
  'use strict';

  /* ── State ───────────────────────────────────────────────── */
  let running    = false;
  let animFrame  = null;
  let sweepPhase = 0;
  let peaks      = [];   // computed resonance peaks
  let currentEl  = null;

  /* ── DOM refs ────────────────────────────────────────────── */
  let selElem, selHarmonics, inpVoltage, inpFreqMin, inpFreqMax,
      inpDuty, btnRun, btnStop, btnReset, canvas, ctx,
      peakTable, shellReadout, presetContainer;

  /* ── Preset configurations ───────────────────────────────── */
  const PRESETS = [
    { label: 'Ni-Ag 28→47',  z: 28, fMin: 100,   fMax: 10000,  V: 4.2,  duty: 50 },
    { label: 'H Seed Z=1',   z: 1,  fMin: 50,    fMax: 5000,   V: 1.5,  duty: 30 },
    { label: 'Ruby Cr Z=24', z: 24, fMin: 1000,  fMax: 100000, V: 6.0,  duty: 50 },
    { label: 'Pd SLR Z=46',  z: 46, fMin: 5000,  fMax: 500000, V: 5.5,  duty: 60 },
    { label: 'Polonium Z=84',z: 84, fMin: 10000, fMax: 1000000,V: 12.0, duty: 40 }
  ];

  /* ── Shell layer names keyed by harmonic number ──────────── */
  const SHELL_NAMES = {
    1:  'Fundamental / Ground Shell',
    2:  '1st Overtone — Activation Shell',
    3:  '2nd Overtone — Coupling Shell',
    4:  '3rd Overtone — Amplification Shell',
    5:  '4th Overtone — Resonance Lock',
    6:  '5th Overtone — Phase Bridge',
    7:  '6th Overtone — Deep Field',
    8:  '7th Overtone — Saturation Shell',
    9:  '8th Overtone — Breakdown Threshold',
    10: '9th Overtone — Cascade Shell',
    11: '10th Overtone — Trans-Harmonic',
    12: '11th Overtone — Quantum Ceiling'
  };

  /* ── Initialise on ros:ready ──────────────────────────────── */
  document.addEventListener('ros:ready', () => {
    initDom();
    populateElements();
    buildPresets();
    attachEvents();
    drawIdle();
  });

  function initDom() {
    selElem       = document.getElementById('drvElement');
    selHarmonics  = document.getElementById('drvHarmonics');
    inpVoltage    = document.getElementById('drvVoltage');
    inpFreqMin    = document.getElementById('drvFreqMin');
    inpFreqMax    = document.getElementById('drvFreqMax');
    inpDuty       = document.getElementById('drvDuty');
    btnRun        = document.getElementById('drvRun');
    btnStop       = document.getElementById('drvStop');
    btnReset      = document.getElementById('drvReset');
    canvas        = document.getElementById('drvCanvas');
    peakTable     = document.getElementById('peakTable');
    shellReadout  = document.getElementById('shellReadout');
    presetContainer = document.getElementById('drvPresets');

    if (canvas) {
      ctx = canvas.getContext('2d');
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    const wrap = canvas.parentElement;
    const w    = Math.min(700, wrap.clientWidth - 16);
    canvas.width  = w;
    canvas.height = Math.round(w * (280 / 700));
  }

  /* ── Populate element select ─────────────────────────────── */
  function populateElements() {
    if (!selElem) return;
    window.ROS.elements.forEach(el => {
      const opt = document.createElement('option');
      opt.value = el.symbol;
      opt.textContent = `${el.number}. ${el.name} (${el.symbol})`;
      if (el.symbol === 'Ni') opt.selected = true;
      selElem.appendChild(opt);
    });
    currentEl = window.ROS.getElement('Ni');
  }

  /* ── Preset buttons ──────────────────────────────────────── */
  function buildPresets() {
    if (!presetContainer) return;
    PRESETS.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.textContent = p.label;
      btn.addEventListener('click', () => applyPreset(p));
      presetContainer.appendChild(btn);
    });
  }

  function applyPreset(p) {
    const el = window.ROS.getElementByZ(p.z);
    if (el && selElem) {
      selElem.value = el.symbol;
      currentEl = el;
    }
    if (inpVoltage) inpVoltage.value  = p.V;
    if (inpFreqMin) inpFreqMin.value  = p.fMin;
    if (inpFreqMax) inpFreqMax.value  = p.fMax;
    if (inpDuty)    inpDuty.value     = p.duty;
    stopSweep();
    runSweep();
  }

  /* ── Events ──────────────────────────────────────────────── */
  function attachEvents() {
    if (btnRun)   btnRun.addEventListener('click', runSweep);
    if (btnStop)  btnStop.addEventListener('click', stopSweep);
    if (btnReset) btnReset.addEventListener('click', resetAll);
    if (selElem)  selElem.addEventListener('change', () => {
      currentEl = window.ROS.getElement(selElem.value);
    });
  }

  /* ── Compute resonance peaks ─────────────────────────────── */
  function computePeaks() {
    if (!currentEl) return [];
    const Z        = currentEl.number;
    const mass     = parseFloat(currentEl.mass) || 1;
    const V        = parseFloat(inpVoltage ? inpVoltage.value : 4.2) || 4.2;
    const fMin     = parseFloat(inpFreqMin ? inpFreqMin.value : 100) || 100;
    const fMax     = parseFloat(inpFreqMax ? inpFreqMax.value : 10000) || 10000;
    const numHarm  = parseInt(selHarmonics ? selHarmonics.value : 6, 10) || 6;

    // Base frequency: empirical formula using Z and mass
    const f0 = Z * Math.sqrt(mass) * 0.847;

    const results = [];
    for (let h = 1; h <= numHarm; h++) {
      const freq = f0 * h;
      if (freq < fMin * 0.5 || freq > fMax * 2) continue;

      // Amplitude: voltage-scaled, decays with harmonic order
      const amp = Math.min(1, (V / (h * 1.5)) * (1 / Math.log(h + 1.5)));
      const inRange = freq >= fMin && freq <= fMax;

      results.push({
        harmonic:  h,
        freq,
        amp: parseFloat(amp.toFixed(4)),
        shell:     SHELL_NAMES[h] || `Harmonic ${h}`,
        inRange,
        notes:     buildHarmonicNote(Z, h, freq, V)
      });
    }
    return results;
  }

  function buildHarmonicNote(Z, h, freq, V) {
    if (h === 1) return `Fundamental lock at ${window.ROS.formatHz(Math.round(freq))}. Drive at ≥${V.toFixed(1)}V to initiate.`;
    if (h === 2) return 'Activation layer — pair with second element at this harmonic for coupling.';
    if (h === 3) return 'Coupling shell — optimal insertion point for a third stack element.';
    if (Z % 2 === 0 && h % 2 === 0) return 'Even-Z + even harmonic: INERTIA LOCK — high stability, low radiance.';
    if (Z % 2 !== 0 && h % 2 !== 0) return 'Odd-Z + odd harmonic: REACTIVE PEAK — maximum output, lower stability.';
    return 'Mixed parity: push-pull oscillation across driver/reactor boundary.';
  }

  /* ── Run sweep ───────────────────────────────────────────── */
  function runSweep() {
    if (!currentEl) {
      currentEl = window.ROS.getElement(selElem ? selElem.value : 'Ni');
    }
    peaks = computePeaks();
    renderPeakTable();
    renderShellReadout();

    if (btnRun)  btnRun.disabled  = true;
    if (btnStop) btnStop.disabled = false;
    running = true;
    sweepPhase = 0;

    function loop() {
      if (!running) return;
      animFrame = requestAnimationFrame(loop);
      sweepPhase += 0.025;
      drawSweep();
    }
    loop();
  }

  function stopSweep() {
    running = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    if (btnRun)  btnRun.disabled  = false;
    if (btnStop) btnStop.disabled = true;
  }

  function resetAll() {
    stopSweep();
    peaks = [];
    currentEl = null;
    if (selElem)    selElem.value    = 'Ni';
    if (inpVoltage) inpVoltage.value = 4.2;
    if (inpFreqMin) inpFreqMin.value = 100;
    if (inpFreqMax) inpFreqMax.value = 10000;
    if (inpDuty)    inpDuty.value    = 50;
    currentEl = window.ROS.getElement('Ni');
    if (peakTable) peakTable.innerHTML = '';
    if (shellReadout) shellReadout.innerHTML = '<span style="color:var(--text-muted);font-style:italic;">Run a sweep to see activation data.</span>';
    drawIdle();
  }

  /* ── Canvas drawing ──────────────────────────────────────── */
  function drawIdle() {
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, W, H);
    drawGrid(W, H);
    ctx.save();
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = 'rgba(100,116,139,0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SELECT ELEMENT & RUN SWEEP', W / 2, H / 2);
    ctx.restore();
  }

  function drawGrid(W, H) {
    ctx.strokeStyle = 'rgba(6,182,212,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  function drawSweep() {
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;
    const fMin = parseFloat(inpFreqMin ? inpFreqMin.value : 100) || 100;
    const fMax = parseFloat(inpFreqMax ? inpFreqMax.value : 10000) || 10000;
    const duty = (parseFloat(inpDuty ? inpDuty.value : 50) || 50) / 100;

    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, W, H);
    drawGrid(W, H);

    const pad    = 40;
    const plotW  = W - pad * 2;
    const plotH  = H - pad * 2;
    const midY   = pad + plotH / 2;

    // Axis labels
    ctx.save();
    ctx.font = '9px "Courier New", monospace';
    ctx.fillStyle = 'rgba(100,116,139,0.7)';
    ctx.textAlign = 'left';
    ctx.fillText(window.ROS.formatHz(Math.round(fMin)), pad, H - 6);
    ctx.textAlign = 'right';
    ctx.fillText(window.ROS.formatHz(Math.round(fMax)), W - pad, H - 6);
    ctx.textAlign = 'center';
    ctx.fillText('FREQUENCY', W / 2, H - 6);
    ctx.restore();

    // Sweep cursor
    const cursorNorm = (sweepPhase % (Math.PI * 2)) / (Math.PI * 2);
    const cursorX    = pad + cursorNorm * plotW;

    ctx.save();
    ctx.strokeStyle = 'rgba(245,158,11,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cursorX, pad); ctx.lineTo(cursorX, H - pad); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Background envelope (duty-cycle square wave)
    ctx.save();
    ctx.strokeStyle = 'rgba(6,182,212,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let px = 0; px <= plotW; px++) {
      const t = px / plotW;
      const logT = Math.log(1 + t * (fMax / fMin - 1)) / Math.log(fMax / fMin);
      const sq = ((logT * 8 + sweepPhase * 0.3) % 1) < duty ? 1 : -1;
      const y  = midY - sq * plotH * 0.18;
      if (px === 0) ctx.moveTo(pad + px, y);
      else          ctx.lineTo(pad + px, y);
    }
    ctx.stroke();
    ctx.restore();

    // Draw continuous waveform (log-frequency scale)
    const grad = ctx.createLinearGradient(pad, 0, W - pad, 0);
    grad.addColorStop(0, '#06b6d4');
    grad.addColorStop(0.5, '#8b5cf6');
    grad.addColorStop(1, '#f59e0b');

    ctx.save();
    ctx.beginPath();
    for (let px = 0; px <= plotW; px++) {
      const t       = px / plotW;
      const logFreq = fMin * Math.pow(fMax / fMin, t);
      let amp = 0;
      peaks.forEach(pk => {
        const dist  = Math.abs(logFreq - pk.freq) / (pk.freq * 0.04 + 1);
        amp += pk.amp * Math.exp(-dist * dist * 2.5);
      });
      amp = Math.min(1, amp);
      const wave = Math.sin(t * Math.PI * 24 + sweepPhase) * amp * plotH * 0.38;
      const y    = midY - wave;
      if (px === 0) ctx.moveTo(pad + px, y);
      else          ctx.lineTo(pad + px, y);
    }
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Peak markers
    peaks.filter(pk => pk.inRange).forEach(pk => {
      const t  = Math.log(pk.freq / fMin) / Math.log(fMax / fMin);
      if (t < 0 || t > 1) return;
      const px  = pad + t * plotW;
      const ampH = pk.amp * plotH * 0.38;

      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth   = 1.5;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur  = 10;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(px, midY - ampH - 6);
      ctx.lineTo(px, midY + ampH + 6);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Peak label
      ctx.font = '9px "Courier New", monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'center';
      ctx.fillText(`H${pk.harmonic}`, px, midY - ampH - 14);
      ctx.fillText(window.ROS.formatHz(Math.round(pk.freq)), px, midY - ampH - 24);
      ctx.restore();
    });

    // Element badge
    if (currentEl) {
      ctx.save();
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.fillStyle = currentEl.number % 2 === 0 ? 'rgba(6,182,212,0.5)' : 'rgba(245,158,11,0.5)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`${currentEl.symbol} Z=${currentEl.number}`, W - pad - 4, pad + 4);
      ctx.restore();
    }

    // Status
    ctx.save();
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = running ? '#10b981' : '#64748b';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(running ? '● SWEEP ACTIVE' : '○ IDLE', pad + 4, pad + 4);
    ctx.restore();
  }

  /* ── Render peak table ───────────────────────────────────── */
  function renderPeakTable() {
    if (!peakTable) return;
    peakTable.innerHTML = '';
    if (peaks.length === 0) {
      peakTable.innerHTML = '<tr><td colspan="5" style="color:#475569;font-style:italic;text-align:center;">No peaks in range.</td></tr>';
      return;
    }
    peaks.forEach(pk => {
      const tr = document.createElement('tr');
      tr.className = pk.inRange ? 'list-row' : 'list-row';
      tr.style.opacity = pk.inRange ? '1' : '0.4';
      tr.innerHTML = `
        <td class="td-num">H${pk.harmonic}</td>
        <td style="font-weight:700;color:#06b6d4;">${window.ROS.formatHz(Math.round(pk.freq))}</td>
        <td>
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <div style="width:${Math.round(pk.amp * 80)}px;height:6px;background:${pk.inRange ? '#06b6d4' : '#475569'};border-radius:3px;box-shadow:0 0 6px #06b6d4;"></div>
            <span style="font-size:0.78rem;color:#64748b;">${(pk.amp * 100).toFixed(1)}%</span>
          </div>
        </td>
        <td style="font-size:0.8rem;color:#94a3b8;">${pk.shell}</td>
        <td style="font-size:0.78rem;color:#64748b;">${pk.inRange ? pk.notes : '<em>Out of sweep range</em>'}</td>
      `;
      peakTable.appendChild(tr);
    });
  }

  /* ── Render shell readout ─────────────────────────────────── */
  function renderShellReadout() {
    if (!shellReadout || !currentEl) return;
    const V      = parseFloat(inpVoltage ? inpVoltage.value : 4.2) || 4.2;
    const parity = window.ROS.evenOddRule(currentEl.number);
    const snapV  = parseFloat((Math.log(parseFloat(currentEl.mass) / currentEl.number + 1) * 4.2).toFixed(2));
    const inPeaks = peaks.filter(pk => pk.inRange);

    shellReadout.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.75rem;margin-bottom:1rem;">
        <div class="result-box">
          <div class="result-label">Element</div>
          <div class="result-val" style="font-size:1.3rem;">${currentEl.symbol} (Z=${currentEl.number})</div>
          <div style="font-size:0.78rem;color:#64748b;">${currentEl.name} · ${parseFloat(currentEl.mass).toFixed(3)} u</div>
        </div>
        <div class="result-box">
          <div class="result-label">Parity Role</div>
          <div class="result-val" style="color:${parity.parity === 'even' ? '#06b6d4' : '#f59e0b'};font-size:1rem;">${parity.parity.toUpperCase()}</div>
          <div style="font-size:0.78rem;color:#64748b;">${parity.role}</div>
        </div>
        <div class="result-box">
          <div class="result-label">Snap Voltage</div>
          <div class="result-val" style="font-size:1.3rem;">${snapV} V</div>
          <div style="font-size:0.78rem;color:#64748b;">Drive voltage: ${V} V ${V >= snapV ? '✓ above snap' : '⚠ below snap'}</div>
        </div>
        <div class="result-box">
          <div class="result-label">Active Peaks</div>
          <div class="result-val" style="font-size:1.3rem;">${inPeaks.length}</div>
          <div style="font-size:0.78rem;color:#64748b;">of ${peaks.length} total harmonics in sweep range</div>
        </div>
      </div>
      <div style="font-size:0.85rem;color:#94a3b8;line-height:1.7;">
        <strong style="color:#e2e8f0;">Driver Notes:</strong> ${parity.description}
        ${inPeaks.length > 0
          ? ` Strongest in-range peak is H${inPeaks.reduce((a, b) => a.amp > b.amp ? a : b).harmonic}
              at ${window.ROS.formatHz(Math.round(inPeaks.reduce((a, b) => a.amp > b.amp ? a : b).freq))}.`
          : ' No peaks fall inside the current sweep range — widen the frequency window or adjust element.'}
      </div>
    `;
  }

})();
