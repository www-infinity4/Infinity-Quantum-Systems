/* ============================================================
   RESONANT OS — Phonon Vortex
   tools/phonon-vortex.html
   ============================================================ */

(function () {
  'use strict';

  /* ── State ───────────────────────────────────────────────── */
  let canvas, ctx;
  let animFrame  = null;
  let tick       = 0;
  let spinSpeed  = 2;
  let vortMode   = 'both';
  let pulseTrigger = 0;

  let phonons    = [];   // active phonon particles
  let maxPhonons = 8;
  let focalEl    = null;

  /* ── DOM refs ────────────────────────────────────────────── */
  let selElement, selPhonons, slSpin, spanSpinVal,
      selMode, btnReset, btnPulse, vortReadout;

  /* ── Init on ros:ready ───────────────────────────────────── */
  document.addEventListener('ros:ready', () => {
    initDom();
    spawnInitialPhonons();
    attachEvents();
    startLoop();
    renderReadout();
  });

  function initDom() {
    selElement  = document.getElementById('vortElement');
    selPhonons  = document.getElementById('vortPhonons');
    slSpin      = document.getElementById('vortSpin');
    spanSpinVal = document.getElementById('vortSpinVal');
    selMode     = document.getElementById('vortMode');
    btnReset    = document.getElementById('vortReset');
    btnPulse    = document.getElementById('vortPulse');
    vortReadout = document.getElementById('vortReadout');
    canvas      = document.getElementById('vortCanvas');

    if (canvas) {
      ctx = canvas.getContext('2d');
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    }

    // Populate elements
    if (selElement) {
      window.ROS.elements.forEach(el => {
        const opt = document.createElement('option');
        opt.value = el.symbol;
        opt.textContent = `${el.number}. ${el.name} (${el.symbol})`;
        if (el.symbol === 'H') opt.selected = true;
        selElement.appendChild(opt);
      });
      focalEl = window.ROS.getElement('H');
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    const wrap = canvas.parentElement;
    const w    = Math.min(900, wrap.clientWidth - 8);
    canvas.width  = w;
    canvas.height = Math.round(w * (500 / 900));
  }

  /* ── Phonon particle factory ─────────────────────────────── */
  function createPhonon(idx, total) {
    // Phonons spawn on the left at different Y positions (large → small droplets)
    const W = canvas ? canvas.width : 900;
    const H = canvas ? canvas.height : 500;

    // Y spread: largest (first) at top, smallest (last) near cone centre
    const frac = idx / Math.max(1, total - 1);
    const startY = H * (0.15 + frac * 0.7);  // spread from 15% to 85% of height
    const size   = Math.max(4, 22 - frac * 18); // large to small

    return {
      x:      W * -0.02,
      y:      startY,
      size,
      frac,   // 0 = top/large, 1 = bottom/small
      speed:  1.2 + frac * 0.8,
      phase:  Math.random() * Math.PI * 2,
      trail:  [],
      alive:  true,
      color:  frac < 0.5 ? '#e2e8f0' : '#94a3b8'
    };
  }

  function spawnInitialPhonons() {
    maxPhonons = parseInt(selPhonons ? selPhonons.value : 8, 10) || 8;
    phonons = Array.from({ length: maxPhonons }, (_, i) => createPhonon(i, maxPhonons));
  }

  /* ── Events ──────────────────────────────────────────────── */
  function attachEvents() {
    if (selElement) selElement.addEventListener('change', () => {
      focalEl = window.ROS.getElement(selElement.value);
      renderReadout();
    });
    if (selPhonons) selPhonons.addEventListener('change', () => {
      spawnInitialPhonons();
    });
    if (slSpin) {
      slSpin.addEventListener('input', () => {
        spinSpeed = parseFloat(slSpin.value) || 2;
        if (spanSpinVal) spanSpinVal.textContent = spinSpeed.toFixed(1) + '×';
      });
    }
    if (selMode) selMode.addEventListener('change', () => {
      vortMode = selMode.value;
    });
    if (btnReset) btnReset.addEventListener('click', () => {
      spawnInitialPhonons();
      tick = 0;
    });
    if (btnPulse) btnPulse.addEventListener('click', () => {
      pulseTrigger = tick;
      // Respawn all phonons with a burst
      phonons = Array.from({ length: maxPhonons }, (_, i) => {
        const ph = createPhonon(i, maxPhonons);
        ph.x = (canvas ? canvas.width : 900) * -0.02;
        return ph;
      });
    });
  }

  /* ── Animation loop ──────────────────────────────────────── */
  function startLoop() {
    function loop() {
      animFrame = requestAnimationFrame(loop);
      tick += 0.018;
      updatePhonons();
      drawFrame();
    }
    loop();
  }

  /* ── Update phonons ──────────────────────────────────────── */
  function updatePhonons() {
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;
    const focalX = W * 0.62;  // where the cone converges
    const focalY = H * 0.5;

    phonons.forEach((ph, idx) => {
      if (!ph.alive) return;

      // Target Y converges toward cone focal point as x approaches focalX
      const progress = Math.max(0, Math.min(1, ph.x / focalX));
      const targetY = ph.y * (1 - progress) + focalY * progress;
      ph.y += (targetY - ph.y) * 0.08;

      // X movement
      ph.x += ph.speed * 2.2;

      // Store trail
      ph.trail.push({ x: ph.x, y: ph.y, size: ph.size * (1 - progress * 0.7) });
      if (ph.trail.length > 18) ph.trail.shift();

      // When phonon passes focal point it gets absorbed into the vortex
      if (ph.x > focalX + 60) {
        ph.alive = false;
        // Respawn from left after a delay
        setTimeout(() => {
          Object.assign(ph, createPhonon(idx, maxPhonons));
        }, 600 + Math.random() * 1200);
      }
    });
  }

  /* ── Drawing ─────────────────────────────────────────────── */
  function drawFrame() {
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;
    const focalX = W * 0.62;
    const focalY = H * 0.5;
    const vortexX = W * 0.82;
    const vortexY = focalY;

    // Background
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, W, H);

    // Deep space grid
    ctx.strokeStyle = 'rgba(6,182,212,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    if (vortMode !== 'spiral') {
      drawCone(focalX, focalY, W, H);
    }

    // Phonon particles (back to front — drawn before vortex)
    phonons.forEach(ph => drawPhonon(ph, focalX));

    // Focal flash at convergence point
    drawFocalPoint(focalX, focalY);

    if (vortMode !== 'focus') {
      drawVortex(vortexX, vortexY, focalX, focalY, W, H);
    }

    // HUD
    drawHUD(W, H);
  }

  /* ── Draw convergence cone ───────────────────────────────── */
  function drawCone(focalX, focalY, W, H) {
    const spread = H * 0.42;

    // Top cone line (from left edge to focal point)
    ctx.save();
    const gradTop = ctx.createLinearGradient(0, focalY - spread, focalX, focalY);
    gradTop.addColorStop(0, 'rgba(255,255,255,0.55)');
    gradTop.addColorStop(0.6, 'rgba(255,255,255,0.3)');
    gradTop.addColorStop(1, 'rgba(220,38,38,0.0)');
    ctx.strokeStyle = gradTop;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(0, focalY - spread);
    ctx.lineTo(focalX, focalY);
    ctx.stroke();

    // Bottom cone line
    const gradBot = ctx.createLinearGradient(0, focalY + spread, focalX, focalY);
    gradBot.addColorStop(0, 'rgba(255,255,255,0.55)');
    gradBot.addColorStop(0.6, 'rgba(255,255,255,0.3)');
    gradBot.addColorStop(1, 'rgba(220,38,38,0.0)');
    ctx.strokeStyle = gradBot;
    ctx.beginPath();
    ctx.moveTo(0, focalY + spread);
    ctx.lineTo(focalX, focalY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Cone fill (subtle)
    ctx.beginPath();
    ctx.moveTo(0, focalY - spread);
    ctx.lineTo(focalX, focalY);
    ctx.lineTo(0, focalY + spread);
    ctx.closePath();
    const coneFill = ctx.createLinearGradient(0, 0, focalX, 0);
    coneFill.addColorStop(0, 'rgba(6,182,212,0.04)');
    coneFill.addColorStop(1, 'rgba(220,38,38,0.02)');
    ctx.fillStyle = coneFill;
    ctx.fill();

    ctx.restore();
  }

  /* ── Draw phonon particle (teardrop shape) ───────────────── */
  function drawPhonon(ph, focalX) {
    if (!ph.alive) return;

    const progress = Math.max(0, Math.min(1, ph.x / focalX));
    const r        = ph.size * (1 - progress * 0.75);
    const opacity  = Math.max(0.2, 1 - progress * 0.4);

    // Trail
    if (ph.trail.length > 1) {
      ctx.save();
      for (let t = 0; t < ph.trail.length - 1; t++) {
        const tp = ph.trail[t];
        const alpha = (t / ph.trail.length) * 0.35 * opacity;
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, Math.max(1, tp.size * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,163,184,${alpha})`;
        ctx.fill();
      }
      ctx.restore();
    }

    // Teardrop body
    ctx.save();
    ctx.translate(ph.x, ph.y);

    // Tilt slightly pointing left (direction of travel — pointing back)
    const tiltAngle = -Math.PI / 2 + 0.3;  // pointing mostly left

    ctx.save();
    ctx.rotate(tiltAngle);

    // Draw teardrop path
    ctx.beginPath();
    ctx.moveTo(0, -r);                          // top point
    ctx.bezierCurveTo(r * 0.9, -r * 0.3, r * 0.7,  r * 0.6, 0, r * 1.2);  // right side
    ctx.bezierCurveTo(-r * 0.7, r * 0.6, -r * 0.9, -r * 0.3, 0, -r);      // left side
    ctx.closePath();

    const dropGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.3, 0, 0, 0, r);
    dropGrad.addColorStop(0, `rgba(255,255,255,${opacity * 0.9})`);
    dropGrad.addColorStop(0.4, `rgba(226,232,240,${opacity * 0.7})`);
    dropGrad.addColorStop(1, `rgba(100,116,139,${opacity * 0.2})`);
    ctx.fillStyle = dropGrad;

    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur  = r * 1.5;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Outline
    ctx.strokeStyle = `rgba(255,255,255,${opacity * 0.6})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.restore(); // un-rotate
    ctx.restore(); // un-translate
  }

  /* ── Focal convergence point ─────────────────────────────── */
  function drawFocalPoint(fx, fy) {
    const r     = 8 + Math.sin(tick * 6) * 3;
    const pulse = pulseTrigger > 0 && (tick - pulseTrigger) < 1.5
      ? 1 + (tick - pulseTrigger) * 30
      : 1;

    ctx.save();
    // Outer flash
    const outerGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, r * 5 * pulse);
    outerGrad.addColorStop(0, 'rgba(255,255,255,0.5)');
    outerGrad.addColorStop(0.3, 'rgba(220,38,38,0.15)');
    outerGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(fx, fy, r * 5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright dot
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 25;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ripple rings
    for (let ring = 1; ring <= 3; ring++) {
      const rr = ((tick * 40 * ring) % 60) + r;
      ctx.beginPath();
      ctx.arc(fx, fy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${0.25 / ring})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ── Vortex / radiation coil ─────────────────────────────── */
  function drawVortex(vx, vy, focalX, focalY, W, H) {
    const angle   = tick * spinSpeed;
    const coils   = 4;
    const maxR    = Math.min(H * 0.38, W * 0.16);
    const el      = focalEl;
    const z       = el ? el.number : 1;

    // Glow body (deep red, like the drawing)
    ctx.save();
    const bodyGrad = ctx.createRadialGradient(vx, vy, 0, vx, vy, maxR * 1.4);
    bodyGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
    bodyGrad.addColorStop(0.08, 'rgba(255,180,140,0.9)');
    bodyGrad.addColorStop(0.25, 'rgba(220,38,38,0.85)');
    bodyGrad.addColorStop(0.55, 'rgba(150,10,10,0.65)');
    bodyGrad.addColorStop(1, 'rgba(70,0,0,0)');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(vx, vy, maxR * 1.4, maxR * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Spiral coil lines
    ctx.save();
    for (let coil = 0; coil < coils; coil++) {
      const startAngle = (coil / coils) * Math.PI * 2 + angle;
      ctx.beginPath();
      let started = false;
      for (let step = 0; step <= 120; step++) {
        const t   = step / 120;
        const r   = t * maxR;
        const a   = startAngle + t * Math.PI * 5;
        const ex  = vx + Math.cos(a) * r;
        const ey  = vy + Math.sin(a) * r * 0.55;  // elliptical (3D look)
        if (!started) { ctx.moveTo(ex, ey); started = true; }
        else ctx.lineTo(ex, ey);
      }
      const coilAlpha = 0.6 + 0.3 * Math.sin(tick * 3 + coil);
      ctx.strokeStyle = `rgba(255,220,200,${coilAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#ff8060';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // Bright inner eye
    ctx.save();
    const eyeR = maxR * 0.12 + Math.sin(tick * 4) * 3;
    const eyeGrad = ctx.createRadialGradient(vx, vy, 0, vx, vy, eyeR);
    eyeGrad.addColorStop(0, '#ffffff');
    eyeGrad.addColorStop(0.5, 'rgba(255,200,180,0.9)');
    eyeGrad.addColorStop(1, 'rgba(220,38,38,0)');
    ctx.fillStyle = eyeGrad;
    ctx.beginPath();
    ctx.ellipse(vx, vy, eyeR, eyeR * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.ellipse(vx, vy, eyeR * 0.4, eyeR * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Energy tail (from focal point to vortex, like the drawing's curved line)
    ctx.save();
    const tailGrad = ctx.createLinearGradient(focalX, focalY, vx, vy);
    tailGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    tailGrad.addColorStop(0.5, 'rgba(220,38,38,0.6)');
    tailGrad.addColorStop(1, 'rgba(150,10,10,0.0)');
    ctx.strokeStyle = tailGrad;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff4040';
    ctx.shadowBlur = 12;
    // Curved bezier like in the drawing
    ctx.beginPath();
    ctx.moveTo(focalX, focalY);
    ctx.bezierCurveTo(
      focalX + (vx - focalX) * 0.4, focalY + H * 0.12,
      vx - (vx - focalX) * 0.2,     vy + H * 0.05,
      vx,                             vy
    );
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Element badge
    if (el) {
      ctx.save();
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,200,180,0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = '#ff8060';
      ctx.shadowBlur = 10;
      ctx.fillText(`${el.symbol}  Z=${z}`, vx, vy - maxR - 10);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Z-value arc label (like "42486.0" in the drawing)
    ctx.save();
    ctx.font = '9px "Courier New", monospace';
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.textAlign = 'left';
    ctx.fillText(`${(z * 569.3).toFixed(1)} Hz`, vx + maxR + 8, vy - 6);
    ctx.fillText(`Ω-LOCK`, vx + maxR + 8, vy + 8);
    ctx.restore();
  }

  /* ── HUD ─────────────────────────────────────────────────── */
  function drawHUD(W, H) {
    ctx.save();
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(100,116,139,0.6)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const alive = phonons.filter(p => p.alive).length;
    ctx.fillText(`PHONONS: ${alive}/${phonons.length}   SPIN: ${spinSpeed.toFixed(1)}×   MODE: ${vortMode.toUpperCase()}`, 10, 10);
    ctx.textAlign = 'right';
    ctx.fillText(focalEl ? `FOCAL: ${focalEl.symbol} Z=${focalEl.number}` : '', W - 10, 10);
    ctx.restore();
  }

  /* ── Readout panel ───────────────────────────────────────── */
  function renderReadout() {
    if (!vortReadout || !focalEl) return;
    const parity = window.ROS.evenOddRule(focalEl.number);
    const code   = window.ROS.getCode(focalEl.number);
    const snapV  = parseFloat((Math.log(parseFloat(focalEl.mass) / focalEl.number + 1) * 4.2).toFixed(2));

    vortReadout.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.75rem;margin-bottom:0.75rem;">
        <div class="result-box">
          <div class="result-label">Focal Element</div>
          <div class="result-val" style="font-size:1.4rem;color:${parity.parity === 'even' ? '#06b6d4' : '#f59e0b'};">${focalEl.symbol} (Z=${focalEl.number})</div>
          <div style="font-size:0.78rem;color:#64748b;">${focalEl.name} · ${parseFloat(focalEl.mass).toFixed(3)} u</div>
        </div>
        <div class="result-box">
          <div class="result-label">Parity Role</div>
          <div class="result-val" style="font-size:1rem;color:${parity.parity === 'even' ? '#06b6d4' : '#f59e0b'};">${parity.parity.toUpperCase()} — ${parity.role}</div>
          <div style="font-size:0.78rem;color:#64748b;">${parity.description}</div>
        </div>
        <div class="result-box">
          <div class="result-label">Snap Voltage</div>
          <div class="result-val" style="font-size:1.3rem;">${snapV} V</div>
          <div style="font-size:0.78rem;color:#64748b;">Vortex initiation threshold</div>
        </div>
        <div class="result-box">
          <div class="result-label">Vortex Freq</div>
          <div class="result-val" style="font-size:1.1rem;">${window.ROS.formatHz(Math.round(focalEl.number * 569.3))}</div>
          <div style="font-size:0.78rem;color:#64748b;">Z × 569.3 Hz coil lock</div>
        </div>
        ${code ? `<div class="result-box">
          <div class="result-label">Code ${code.number}</div>
          <div class="result-val" style="font-size:1rem;color:#8b5cf6;">${code.label}</div>
          <div style="font-size:0.78rem;color:#64748b;">${code.meaning}</div>
        </div>` : ''}
      </div>
      <div style="font-size:0.83rem;color:#94a3b8;line-height:1.7;">
        <strong style="color:#e2e8f0;">How the vortex works:</strong>
        Phonon packets (the teardrop shapes on the left) each carry a quantum of acoustic energy.
        As they travel through the convergence cone, they compress in size and converge toward the focal lens point.
        At the focal point they collapse into a coherent burst of radiation, which is captured and spun
        by the ${focalEl.name}-seeded vortex coil into a self-sustaining rotating field.
        The bright white eye at the center of the coil is the radiation tip — the point from which
        the energy radiates outward as a carbon-trail-like phonon breadcrumb (as referenced in the Quantum Microphone page).
      </div>
    `;
  }

})();
