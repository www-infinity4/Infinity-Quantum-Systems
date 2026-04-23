/* ============================================================
   RESONANT OS — Resonance Calculator
   tools/resonance-calculator.html
   ============================================================ */

(function () {
  'use strict';

  /* ── Canvas animation state ─────────────────────────────── */
  let animFrame = null;
  let wavePhase = 0;
  let currentResult = null;

  /* ── DOM refs ────────────────────────────────────────────── */
  let selA, selB, calcBtn, flipBtn, resultBox, canvas, ctx;

  /* ── Initialise after ROS is ready ──────────────────────── */
  document.addEventListener('ros:ready', () => {
    initDom();
    populateSelects();
    setDefaultSelection();
    attachEvents();
    startWaveAnimation();
  });

  function initDom() {
    selA      = document.getElementById('elemA');
    selB      = document.getElementById('elemB');
    calcBtn   = document.getElementById('calcBtn');
    flipBtn   = document.getElementById('flipBtn');
    resultBox = document.getElementById('resultBox');
    canvas    = document.getElementById('resonanceCanvas');
    if (canvas) ctx = window.ROS.configureCanvasContext(canvas.getContext('2d'));

    // Make canvas responsive
    if (canvas) {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    }
  }

  function resizeCanvas() {
    const wrap = canvas.parentElement;
    const w    = Math.min(560, wrap.clientWidth - 32);
    canvas.width  = w;
    canvas.height = Math.round(w * (220 / 560));
  }

  /* ── Populate select dropdowns with all elements ────────── */
  function populateSelects() {
    if (!selA || !selB) return;
    const elems = window.ROS.elements;
    const makeOption = (el) => {
      const opt = document.createElement('option');
      opt.value = el.symbol;
      opt.textContent = `${el.number}. ${el.name} (${el.symbol}) — ${parseFloat(el.mass).toFixed(3)} u`;
      return opt;
    };
    elems.forEach(el => {
      selA.appendChild(makeOption(el));
      selB.appendChild(makeOption(el).cloneNode(true));
    });
  }

  /* ── Default: Ni(28) → Ag(47) ───────────────────────────── */
  function setDefaultSelection() {
    if (!selA || !selB) return;
    setSelectBySymbol(selA, 'Ni');
    setSelectBySymbol(selB, 'Ag');
    calculate();
  }

  function setSelectBySymbol(sel, sym) {
    for (const opt of sel.options) {
      if (opt.value === sym) { sel.value = sym; return; }
    }
  }

  /* ── Events ──────────────────────────────────────────────── */
  function attachEvents() {
    if (calcBtn) calcBtn.addEventListener('click', calculate);
    if (flipBtn) flipBtn.addEventListener('click', flipElements);
    if (selA)    selA.addEventListener('change', calculate);
    if (selB)    selB.addEventListener('change', calculate);
  }

  function flipElements() {
    if (!selA || !selB) return;
    const tmp = selA.value;
    selA.value = selB.value;
    selB.value = tmp;
    calculate();
  }

  /* ── Main calculation ────────────────────────────────────── */
  function calculate() {
    const symA = selA ? selA.value : 'Ni';
    const symB = selB ? selB.value : 'Ag';
    const ea   = window.ROS.getElement(symA);
    const eb   = window.ROS.getElement(symB);
    if (!ea || !eb) return;

    currentResult = window.ROS.calcResonanceRatio(ea, eb);
    renderResults(currentResult);
    renderCodeLinkage(ea, eb);
  }

  /* ── Render result text ──────────────────────────────────── */
  function renderResults(r) {
    if (!resultBox || !r) return;
    resultBox.classList.add('active');

    const pa = r.parityA;
    const pb = r.parityB;

    const specialHtml = r.specialNote
      ? `<div style="margin:0.75rem 0;padding:0.75rem 1rem;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:6px;color:#f59e0b;font-size:0.88rem;">
           ⚡ <strong>Special Pair:</strong> ${r.specialNote}
         </div>`
      : '';

    resultBox.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
        <div>
          <div class="result-label">Element A</div>
          <div style="font-size:1.5rem;font-weight:900;color:${pa.color === 'cyan' ? '#06b6d4' : '#f59e0b'};">${r.elemA.symbol}</div>
          <div style="font-size:0.8rem;color:#94a3b8;">${r.elemA.name} · Z=${r.elemA.number} · ${parseFloat(r.elemA.mass).toFixed(3)} u</div>
          <span class="tag badge-${pa.parity === 'even' ? 'even' : 'odd'}" style="margin-top:0.3rem;">${pa.parity.toUpperCase()} · ${pa.role}</span>
        </div>
        <div>
          <div class="result-label">Element B</div>
          <div style="font-size:1.5rem;font-weight:900;color:${pb.color === 'cyan' ? '#06b6d4' : '#f59e0b'};">${r.elemB.symbol}</div>
          <div style="font-size:0.8rem;color:#94a3b8;">${r.elemB.name} · Z=${r.elemB.number} · ${parseFloat(r.elemB.mass).toFixed(3)} u</div>
          <span class="tag badge-${pb.parity === 'even' ? 'even' : 'odd'}" style="margin-top:0.3rem;">${pb.parity.toUpperCase()} · ${pb.role}</span>
        </div>
      </div>
      <hr style="border-color:#1e2d4a;margin:0.75rem 0;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:0.75rem;">
        <div>
          <div class="result-label">Mass Ratio</div>
          <div class="result-val" style="font-size:1.4rem;">${r.ratioStr}</div>
        </div>
        <div>
          <div class="result-label">Snap Voltage</div>
          <div class="result-val" style="font-size:1.4rem;">${r.snapVoltage} V</div>
        </div>
        <div>
          <div class="result-label">Activation Freq</div>
          <div class="result-val" style="font-size:1.4rem;">${window.ROS.formatHz(r.activationFreqHz)}</div>
        </div>
      </div>
      <div style="font-size:0.78rem;color:#64748b;margin-bottom:0.5rem;">Harmonic Order: ${r.harmonicOrder}</div>
      ${specialHtml}
      <div style="margin-top:0.75rem;">
        <div class="result-label">Interpretation</div>
        <div style="font-size:0.85rem;color:#94a3b8;line-height:1.7;margin-top:0.3rem;">${r.interpretation}</div>
      </div>
      <div style="margin-top:1rem;">
        <div class="result-label">What does this give you?</div>
        <div id="whatItGives" style="font-size:0.85rem;color:#94a3b8;line-height:1.7;margin-top:0.3rem;"></div>
      </div>
    `;

    renderWhatItGives(r);
  }

  /* ── Plain-English "what does this give you?" ─────────────── */
  function renderWhatItGives(r) {
    const box = document.getElementById('whatItGives');
    if (!box) return;

    const zA = r.elemA.number;
    const zB = r.elemB.number;

    const linkA = window.ROS.codeToAtomicLink(zA);
    const linkB = window.ROS.codeToAtomicLink(zB);

    let text = '';

    // Code 73 (Love) and 72 (Terrorism) transformation example
    if ((zA === 28 && zB === 47) || (zA === 47 && zB === 28)) {
      text = `The Nickel-Silver (28-to-47) ratio is the master resonance ratio of the entire Resonant OS architecture.
        Nickel(28) as the driver locks onto Silver(47) as the amplifier.
        Code 28 connects to Nickel; Code 47 connects to Silver.
        In operational terms: the even driver (Ni, inertia) holds the frequency while the odd amplifier (Ag) radiates it outward.
        This is the engine of the 152:1 resonance computer.`;
    } else if (linkA.linkType !== 'none' || linkB.linkType !== 'none') {
      text += `${r.elemA.symbol} links to ${linkA.element ? `code ${linkA.atomicZ} (${linkA.element.name})` : 'no direct code'}. `;
      text += `${r.elemB.symbol} links to ${linkB.element ? `code ${linkB.atomicZ} (${linkB.element.name})` : 'no direct code'}. `;
      // Example: if one is Z=73 or Z=72
      if (zA === 73 || zB === 73 || zA === 72 || zB === 72) {
        const codeL = window.ROS.getCode(73);
        const codeT = window.ROS.getCode(72);
        text += `Code 73 (${codeL ? codeL.label : 'Love'}) placed above code 72 (${codeT ? codeT.label : 'Terrorism'}) means Love commands Terrorism — it transforms destructive intent by commanding the code below it in the chain of command.`;
      } else {
        text += r.interpretation;
      }
    } else {
      text = r.interpretation;
    }

    box.textContent = text;
  }

  /* ── Code linkage section ────────────────────────────────── */
  function renderCodeLinkage(ea, eb) {
    const container = document.getElementById('codeLinkage');
    if (!container) return;

    const linkA = window.ROS.codeToAtomicLink(ea.number);
    const linkB = window.ROS.codeToAtomicLink(eb.number);

    const renderLink = (elem, link) => {
      const codeObj = window.ROS.getCode(elem.number);
      return `
        <div class="code-resonance-link" style="margin-bottom:0.75rem;">
          <strong style="color:#06b6d4;">${elem.symbol} (Z=${elem.number})</strong>
          ${codeObj
            ? `→ Code ${codeObj.number}: <span style="color:#f59e0b;">${codeObj.label}</span>
               <div style="font-size:0.78rem;color:#64748b;margin-top:0.2rem;">${codeObj.meaning}</div>`
            : `<span style="color:#64748b;">— No direct code mapping (Z > current code table)</span>`
          }
          <div style="font-size:0.75rem;color:#475569;margin-top:0.3rem;">${link.explanation}</div>
        </div>
      `;
    };

    container.innerHTML = renderLink(ea, linkA) + renderLink(eb, linkB);
  }

  /* ── Canvas Wave Animation ───────────────────────────────── */
  function startWaveAnimation() {
    if (!ctx) return;
    function draw() {
      animFrame = requestAnimationFrame(draw);
      wavePhase += 0.04;
      drawCanvas();
    }
    draw();
  }

  function drawCanvas() {
    if (!ctx || !canvas) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(6,182,212,0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (!currentResult) {
      drawPlaceholder(W, H);
      return;
    }

    const r   = currentResult;
    const ea  = r.elemA;
    const eb  = r.elemB;
    const massA = parseFloat(ea.mass);
    const massB = parseFloat(eb.mass);

    // Radii proportional to sqrt(mass), clamped
    const scale = Math.min(H * 0.35, 55) / Math.sqrt(Math.max(massA, massB));
    const radA  = Math.max(18, Math.min(60, Math.sqrt(massA) * scale));
    const radB  = Math.max(18, Math.min(60, Math.sqrt(massB) * scale));

    const cx1 = W * 0.22;
    const cx2 = W * 0.78;
    const cy  = H * 0.5;

    // Draw element circles
    drawAtomCircle(cx1, cy, radA, ea, r.parityA.parity);
    drawAtomCircle(cx2, cy, radB, eb, r.parityB.parity);

    // Draw wave between circles
    const waveStart = cx1 + radA + 8;
    const waveEnd   = cx2 - radB - 8;
    drawResonanceWave(waveStart, waveEnd, cy, r);

    // Status label
    const isLocked = r.ratio > 0.8 && r.ratio < 200;
    ctx.save();
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = isLocked ? '#06b6d4' : '#f59e0b';
    ctx.textAlign = 'center';
    ctx.shadowColor = isLocked ? '#06b6d4' : '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.fillText(isLocked ? '◆ RESONANCE LOCKED' : '◇ TUNING...', W / 2, H - 12);
    ctx.restore();
  }

  /* ── Colour helper: convert hex + alpha to rgba() string ──── */
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function drawAtomCircle(cx, cy, r, elem, parity) {
    const color = parity === 'even' ? '#06b6d4' : '#f59e0b';

    // Glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.6);
    grad.addColorStop(0, hexToRgba(color, 0.15));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Circle border
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner fill
    ctx.fillStyle = 'rgba(7,11,20,0.85)';
    ctx.fill();

    // Symbol
    ctx.save();
    ctx.font = `bold ${Math.round(r * 0.52)}px "Segoe UI", sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillText(elem.symbol, cx, cy - 4);
    ctx.font = `${Math.round(r * 0.3)}px "Courier New", monospace`;
    ctx.fillStyle = 'rgba(148,163,184,0.9)';
    ctx.shadowBlur = 0;
    ctx.fillText(`Z=${elem.number}`, cx, cy + r * 0.4);
    ctx.restore();
  }

  function drawResonanceWave(x1, x2, cy, r) {
    const len      = x2 - x1;
    const amp      = Math.min(28, (cy - 20) * 0.5);
    const freq     = Math.PI * 2 * 3 / len;
    const pairType = r.parityA.parity === r.parityB.parity ? 'same' : 'opposite';
    const color1   = r.parityA.parity === 'even' ? '#06b6d4' : '#f59e0b';
    const color2   = r.parityB.parity === 'even' ? '#06b6d4' : '#f59e0b';

    // Gradient along wave
    const grad = ctx.createLinearGradient(x1, 0, x2, 0);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);

    ctx.beginPath();
    ctx.moveTo(x1, cy);
    for (let x = x1; x <= x2; x += 2) {
      const t = (x - x1) / len;
      const envelope = Math.sin(t * Math.PI); // fade in/out at ends
      const y = cy + Math.sin(freq * (x - x1) + wavePhase) * amp * envelope;
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = grad;
    ctx.lineWidth = pairType === 'same' ? 2.5 : 1.5;
    ctx.shadowColor = color1;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Second harmonic for opposite parity
    if (pairType === 'opposite') {
      ctx.beginPath();
      ctx.moveTo(x1, cy);
      for (let x = x1; x <= x2; x += 2) {
        const t = (x - x1) / len;
        const envelope = Math.sin(t * Math.PI);
        const y = cy - Math.sin(freq * 2 * (x - x1) + wavePhase * 1.5) * amp * 0.45 * envelope;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(245,158,11,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Ratio label
    ctx.save();
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(`ratio ${r.ratio.toFixed(3)}:1`, (x1 + x2) / 2, cy - amp - 10);
    ctx.restore();
  }

  function drawPlaceholder(W, H) {
    ctx.save();
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = 'rgba(100,116,139,0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SELECT ELEMENTS TO VISUALISE RESONANCE', W / 2, H / 2);
    ctx.restore();
  }

})();
