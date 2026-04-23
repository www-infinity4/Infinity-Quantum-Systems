/* ============================================================
   RESONANT OS — Lensing Engine
   tools/lensing-engine.html
   ============================================================ */

(function () {
  'use strict';

  /* ── State ───────────────────────────────────────────────── */
  let animFrame  = null;
  let tick       = 0;
  let currentProfile = null;

  /* ── DOM refs ────────────────────────────────────────────── */
  let inpCr, inpNi, inpAg, selFocal, inpDiam,
      btnCompute, btnReset, canvas, ctx,
      lensOutput, lensStack, lensStackNotes;

  /* ── Focal target presets ────────────────────────────────── */
  const FOCAL_TARGETS = {
    health: { label: 'Health / Body (8/7)', codeA: 8,  codeB: 7,  zA: 8,  zB: 7,  desc: 'Biological 8:7 Oxygen-Nitrogen health resonance ratio.' },
    mind:   { label: 'Mind Coherence',       codeA: 85, codeB: 83, zA: 85, zB: 83, desc: 'Mind-reader 84-83-85 antenna field with Polonium bracket.' },
    align:  { label: 'God Alignment',        codeA: 53, codeB: 16, zA: 53, zB: 16, desc: 'Full spiritual alignment: Code 53 commands Code 16 (God).' },
    power:  { label: 'Power Extraction',     codeA: 46, codeB: 47, zA: 46, zB: 47, desc: 'SLR Weave 46-47-48-49 — first layer of the power-extraction braid.' },
    custom: { label: 'Custom (auto-derive)', codeA: null, codeB: null, zA: null, zB: null, desc: 'Profile derived from Chromium concentration and base stack.' }
  };

  /* ── Init on ros:ready ───────────────────────────────────── */
  document.addEventListener('ros:ready', () => {
    initDom();
    attachEvents();
    drawIdle();
    runCompute(); // Auto-compute with defaults
  });

  function initDom() {
    inpCr         = document.getElementById('lensCr');
    inpNi         = document.getElementById('lensNi');
    inpAg         = document.getElementById('lensAg');
    selFocal      = document.getElementById('lensFocalTarget');
    inpDiam       = document.getElementById('lensRubyDiam');
    btnCompute    = document.getElementById('lensCompute');
    btnReset      = document.getElementById('lensReset');
    canvas        = document.getElementById('lensCanvas');
    lensOutput    = document.getElementById('lensOutput');
    lensStack     = document.getElementById('lensStack');
    lensStackNotes = document.getElementById('lensStackNotes');

    if (canvas) {
      ctx = canvas.getContext('2d');
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    const wrap = canvas.parentElement;
    const w    = Math.min(620, wrap.clientWidth - 16);
    canvas.width  = w;
    canvas.height = Math.round(w * (300 / 620));
  }

  function attachEvents() {
    if (btnCompute) btnCompute.addEventListener('click', runCompute);
    if (btnReset)   btnReset.addEventListener('click',   resetTool);
    [inpCr, inpNi, inpAg, selFocal, inpDiam].forEach(el => {
      if (el) el.addEventListener('change', runCompute);
    });
  }

  /* ── Compute lens profile ────────────────────────────────── */
  function runCompute() {
    const crPct  = parseFloat(inpCr  ? inpCr.value  : 0.05) || 0.05;
    const niCnt  = parseInt(inpNi    ? inpNi.value   : 53,  10) || 53;
    const agCnt  = parseInt(inpAg    ? inpAg.value   : 1,   10) || 1;
    const diam   = parseFloat(inpDiam ? inpDiam.value : 5)   || 5;
    const focal  = selFocal ? selFocal.value : 'health';

    const focalPreset = FOCAL_TARGETS[focal] || FOCAL_TARGETS.custom;

    // Chromium fraction (pure ruby = 0.05 wt%)
    const crFrac    = crPct / 100;
    // Al fraction = 1 - Cr fraction (Al2O3 host)
    const alFrac    = 1 - crFrac;

    // Atomic masses (approximate)
    const massAl = 26.982;
    const massO  = 15.999;
    const massCr = 51.996;

    // Al2O3:Cr molar composition
    const mol_Al2O3 = alFrac * 100 / (2 * massAl + 3 * massO);
    const mol_Cr    = crFrac * 100 / massCr;
    const totalMol  = mol_Al2O3 + mol_Cr;
    const molFracAl2O3 = (mol_Al2O3 / totalMol * 100).toFixed(3);
    const molFracCr    = (mol_Cr    / totalMol * 100).toFixed(3);

    // Nickel/Silver base ratio
    const baseRatio   = niCnt + agCnt > 0 ? (niCnt / (agCnt || 1)) : 0;
    // Multiplier recommendation: 152:1 is target → how close?
    const targetRatio = 152;
    const ratioScore  = Math.max(0, 100 - Math.abs(baseRatio - targetRatio) / targetRatio * 100).toFixed(1);

    // Focal length estimate (empirical: diam × Cr-concentration scaling)
    const focalLen   = parseFloat((diam * 12 / (crPct * 10 + 0.5)).toFixed(2));
    const coherence  = parseFloat(Math.min(100, 30 + crPct * 200 + ratioScore * 0.4).toFixed(1));

    // Snap voltage from Z=13 (Al) ↔ Z=24 (Cr)
    const elAl = window.ROS.getElementByZ(13);
    const elCr = window.ROS.getElementByZ(24);
    const snapResult = elAl && elCr ? window.ROS.calcResonanceRatio(elAl, elCr) : null;

    currentProfile = {
      crPct, alFrac, crFrac, niCnt, agCnt, diam,
      molFracAl2O3, molFracCr, baseRatio, targetRatio,
      ratioScore, focalLen, coherence, focalPreset, snapResult
    };

    renderOutput(currentProfile);
    renderStackOutput(currentProfile);
    startAnimation();
  }

  /* ── Render output panel ─────────────────────────────────── */
  function renderOutput(p) {
    if (!lensOutput) return;

    const coherColor = p.coherence > 70 ? '#10b981' : p.coherence > 40 ? '#f59e0b' : '#ef4444';
    const snapV = p.snapResult ? p.snapResult.snapVoltage : '—';
    const actF  = p.snapResult ? window.ROS.formatHz(p.snapResult.activationFreqHz) : '—';

    lensOutput.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:0.75rem;margin-bottom:1rem;">
        <div class="result-box">
          <div class="result-label">Composition</div>
          <div class="result-val" style="font-size:1.05rem;">Al₂O₃: ${p.molFracAl2O3}%</div>
          <div style="font-size:0.78rem;color:#64748b;">Cr: ${p.molFracCr}% · Cr wt%: ${p.crPct}</div>
        </div>
        <div class="result-box">
          <div class="result-label">Coherence Score</div>
          <div class="result-val" style="font-size:1.4rem;color:${coherColor};">${p.coherence}%</div>
          <div style="font-size:0.78rem;color:#64748b;">Combined lens + base quality</div>
        </div>
        <div class="result-box">
          <div class="result-label">Est. Focal Length</div>
          <div class="result-val" style="font-size:1.3rem;">${p.focalLen} mm</div>
          <div style="font-size:0.78rem;color:#64748b;">Diameter: ${p.diam} mm</div>
        </div>
        <div class="result-box">
          <div class="result-label">Base Ratio</div>
          <div class="result-val" style="font-size:1.3rem;">${p.baseRatio.toFixed(1)}:1</div>
          <div style="font-size:0.78rem;color:#64748b;">Ni ${p.niCnt} / Ag ${p.agCnt} · target 152:1 · score ${p.ratioScore}%</div>
        </div>
        <div class="result-box">
          <div class="result-label">Al(13)↔Cr(24) Snap V</div>
          <div class="result-val" style="font-size:1.3rem;">${snapV} V</div>
          <div style="font-size:0.78rem;color:#64748b;">Act. freq: ${actF}</div>
        </div>
        <div class="result-box">
          <div class="result-label">Focal Target</div>
          <div class="result-val" style="font-size:0.95rem;">${p.focalPreset.label}</div>
          <div style="font-size:0.76rem;color:#64748b;">${p.focalPreset.desc}</div>
        </div>
      </div>

      <div style="background:rgba(6,182,212,0.05);border:1px solid rgba(6,182,212,0.15);border-radius:6px;padding:0.75rem 1rem;font-size:0.83rem;color:#94a3b8;line-height:1.7;">
        <strong style="color:#e2e8f0;">Lens Profile Summary:</strong> This ruby contains
        ${p.crPct} wt% Chromium in an Al₂O₃ host lattice.
        ${p.crPct < 0.02
          ? 'Very low Cr concentration — minimal lasing action; suited for structural/containment rather than focal use.'
          : p.crPct < 0.5
            ? 'Standard ruby range — suitable for resonance focusing and coherent field emission.'
            : p.crPct < 5
              ? 'High Cr concentration — strong absorption, deep red field, reduced coherence length. Use with Ni-Ag damper base.'
              : 'Very high Cr — approaching saturation. Field broadening expected. Best used as a broad-field diffuser rather than focal lens.'}
        Ni:Ag base ratio ${p.baseRatio.toFixed(1)}:1 scores ${p.ratioScore}% toward the ideal 152:1 master ratio
        ${parseFloat(p.ratioScore) > 80 ? '— excellent foundation.' : parseFloat(p.ratioScore) > 50 ? '— acceptable, consider adjusting Ni count.' : '— low; increase Ni count toward 152 for the single War Nickel.'}.
      </div>
    `;
  }

  /* ── Render recommended stack ────────────────────────────── */
  function renderStackOutput(p) {
    if (!lensStack || !lensStackNotes) return;

    // Build a stack: Ni(28) base → Ag(47) amp → Al(13) driver → Cr(24) lens → focal target elements
    const stackZ = [28, 47, 13, 24];
    if (p.focalPreset.zA) stackZ.push(p.focalPreset.zA);
    if (p.focalPreset.zB && p.focalPreset.zB !== p.focalPreset.zA) stackZ.push(p.focalPreset.zB);

    lensStack.innerHTML = stackZ.map(z => {
      const el = window.ROS.getElementByZ(z);
      if (!el) return '';
      return window.ROS.renderElementTile(el);
    }).join('<span style="color:#475569;padding:0 0.3rem;align-self:center;">→</span>');

    const notes = [
      `<strong>Stack order (bottom → top):</strong>`,
      `<strong style="color:#f59e0b;">Ni(28)</strong> — Driver base; even parity inertia lock; holds the 152:1 ratio foundation.`,
      `<strong style="color:#06b6d4;">Ag(47)</strong> — Amplifier; odd reactor; radiates the driver frequency outward.`,
      `<strong style="color:#8b5cf6;">Al(13)</strong> — Ruby host lattice; Aluminum oxide scaffold for the Chromium dopant.`,
      `<strong style="color:#8b5cf6;">Cr(24)</strong> — Lens dope; Chromium at ${p.crPct} wt% provides the focal chromatic shift and emission peak.`,
    ];
    if (p.focalPreset.zA) {
      const elA = window.ROS.getElementByZ(p.focalPreset.zA);
      const elB = p.focalPreset.zB ? window.ROS.getElementByZ(p.focalPreset.zB) : null;
      if (elA) notes.push(`<strong style="color:#10b981;">${elA.symbol}(${p.focalPreset.zA})</strong> — Focal target A: ${p.focalPreset.desc}`);
      if (elB) notes.push(`<strong style="color:#10b981;">${elB.symbol}(${p.focalPreset.zB})</strong> — Focal target B: counterpart for target resonance.`);
    }
    lensStackNotes.innerHTML = notes.map(n => `<div style="margin-bottom:0.3rem;">${n}</div>`).join('');
  }

  /* ── Canvas animation ────────────────────────────────────── */
  function startAnimation() {
    if (animFrame) cancelAnimationFrame(animFrame);
    function loop() {
      animFrame = requestAnimationFrame(loop);
      tick += 0.018;
      drawLens();
    }
    loop();
  }

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
    ctx.fillText('SET COMPOSITION & COMPUTE', W / 2, H / 2);
    ctx.restore();
  }

  function drawGrid(W, H) {
    ctx.strokeStyle = 'rgba(6,182,212,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  function drawLens() {
    if (!ctx || !canvas || !currentProfile) return;
    const W = canvas.width, H = canvas.height;
    const p = currentProfile;

    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, W, H);
    drawGrid(W, H);

    const cx = W * 0.38, cy = H / 2;
    const lensH = H * 0.65;
    const lensW = Math.max(12, Math.min(50, p.diam * 2));

    // Focal length scaled to canvas
    const focalScaled = Math.min(W * 0.55, (p.focalLen / 200) * W * 0.5 + 30);

    // Lens body (biconvex shape)
    const crColor = p.crPct < 0.5 ? '#f87171' : p.crPct < 5 ? '#dc2626' : '#7f1d1d';
    ctx.save();
    ctx.beginPath();
    // Left curve
    ctx.moveTo(cx, cy - lensH / 2);
    ctx.bezierCurveTo(cx - lensW * 0.8, cy - lensH / 4, cx - lensW * 0.8, cy + lensH / 4, cx, cy + lensH / 2);
    // Right curve
    ctx.bezierCurveTo(cx + lensW * 0.8, cy + lensH / 4, cx + lensW * 0.8, cy - lensH / 4, cx, cy - lensH / 2);
    const lensGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, lensH / 2);
    lensGrad.addColorStop(0, crColor + 'cc');
    lensGrad.addColorStop(1, crColor + '22');
    ctx.fillStyle = lensGrad;
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Incoming rays (parallel)
    const rayCount = 5;
    const rayGap   = lensH / (rayCount + 1);
    for (let r = 0; r < rayCount; r++) {
      const ry = cy - lensH / 2 + rayGap * (r + 1);
      const phase = Math.sin(tick * 2 + r * 0.7) * 2;

      ctx.save();
      ctx.strokeStyle = `rgba(6,182,212,${0.4 + 0.3 * Math.sin(tick + r)})`;
      ctx.lineWidth = 1.2;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 6;
      // Incoming ray
      ctx.beginPath();
      ctx.moveTo(0, ry + phase);
      ctx.lineTo(cx, ry);
      ctx.stroke();
      // Converging ray (through lens)
      ctx.strokeStyle = `rgba(245,158,11,${0.6 + 0.3 * Math.sin(tick + r)})`;
      ctx.shadowColor = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(cx, ry);
      ctx.lineTo(cx + focalScaled, cy);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Focal point
    const fpx = cx + focalScaled;
    ctx.save();
    ctx.beginPath();
    ctx.arc(fpx, cy, 6 + Math.sin(tick * 3) * 2, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Focal pulse
    for (let ring = 1; ring <= 3; ring++) {
      const rr = (ring * 18 + (tick * 40 * ring) % 30);
      ctx.beginPath();
      ctx.arc(fpx, cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(245,158,11,${0.3 / ring})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    // Labels
    ctx.save();
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.fillText(`Ruby Ø${p.diam}mm`, cx, cy + lensH / 2 + 14);
    ctx.fillText(`${p.crPct}wt% Cr`, cx, cy + lensH / 2 + 25);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`f = ${p.focalLen}mm`, fpx, cy - 18);
    ctx.fillStyle = 'rgba(100,116,139,0.6)';
    ctx.textAlign = 'right';
    ctx.fillText(`Coherence: ${p.coherence}%`, W - 8, H - 8);
    ctx.restore();
  }

  /* ── Reset ───────────────────────────────────────────────── */
  function resetTool() {
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
    currentProfile = null;
    if (inpCr)   inpCr.value   = 0.05;
    if (inpNi)   inpNi.value   = 53;
    if (inpAg)   inpAg.value   = 1;
    if (inpDiam) inpDiam.value = 5;
    if (selFocal) selFocal.value = 'health';
    if (lensOutput)     lensOutput.innerHTML    = '<span style="color:var(--text-muted);font-style:italic;">Enter composition values and click Compute.</span>';
    if (lensStack)      lensStack.innerHTML     = '';
    if (lensStackNotes) lensStackNotes.innerHTML = '';
    drawIdle();
  }

})();
