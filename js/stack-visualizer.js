/* ============================================================
   RESONANT OS — Stack Visualizer
   tools/stack-visualizer.html
   ============================================================ */

(function () {
  'use strict';

  /* ── State ───────────────────────────────────────────────── */
  let layers = [];          // array of element objects
  let selectedLayerIdx = -1;
  let animFrame = null;
  let tick = 0;

  /* ── Preset stacks ───────────────────────────────────────── */
  const PRESETS = [
    {
      label: 'Hull Layers 1–9',
      zValues: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
    {
      label: 'SLR Weave 46-47-48-49',
      zValues: [46, 47, 48, 49]
    },
    {
      label: 'Triple Stack Ag-Pd-Cu',
      zValues: [47, 46, 29]
    },
    {
      label: 'Mind Reader 85-83-84',
      zValues: [85, 83, 84]
    },
    {
      label: 'Ruby Lens Al-O-Cr',
      zValues: [13, 8, 24]
    },
    {
      label: 'Core Fusion H-He-Li',
      zValues: [1, 2, 3]
    }
  ];

  /* ── DOM refs ────────────────────────────────────────────── */
  let canvas, ctx, elemSelect, addLayerBtn, clearBtn,
      exportBtn, sidePanel, legendPanel;

  /* ── Init on ros:ready ───────────────────────────────────── */
  document.addEventListener('ros:ready', () => {
    initDom();
    populateSelect();
    buildPresetButtons();
    attachEvents();
    startAnimation();
  });

  function initDom() {
    canvas       = document.getElementById('stackCanvas');
    elemSelect   = document.getElementById('elemSelect');
    addLayerBtn  = document.getElementById('addLayerBtn');
    clearBtn     = document.getElementById('clearAllBtn');
    exportBtn    = document.getElementById('exportCanvasBtn');
    sidePanel    = document.getElementById('layerSidePanel');
    legendPanel  = document.getElementById('legendPanel');

    if (canvas) {
      ctx = canvas.getContext('2d');
      resizeCanvas();
      window.addEventListener('resize', () => {
        resizeCanvas();
        // redraw immediately
      });
      canvas.addEventListener('click', handleCanvasClick);
      canvas.addEventListener('mousemove', handleCanvasHover);
    }

    buildLegend();
  }

  function resizeCanvas() {
    if (!canvas) return;
    const wrap  = canvas.parentElement;
    const maxW  = Math.min(700, wrap.clientWidth - 16);
    canvas.width  = maxW;
    canvas.height = Math.min(500, Math.round(maxW * (500 / 700)));
  }

  /* ── Populate element select ─────────────────────────────── */
  function populateSelect() {
    if (!elemSelect) return;
    window.ROS.elements.forEach(el => {
      const opt = document.createElement('option');
      opt.value = el.symbol;
      opt.textContent = `${el.number}. ${el.name} (${el.symbol})`;
      elemSelect.appendChild(opt);
    });
  }

  /* ── Preset buttons ──────────────────────────────────────── */
  function buildPresetButtons() {
    const container = document.getElementById('presetBtns');
    if (!container) return;
    PRESETS.forEach(preset => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.textContent = preset.label;
      btn.addEventListener('click', () => loadPreset(preset));
      container.appendChild(btn);
    });
  }

  function loadPreset(preset) {
    layers = [];
    selectedLayerIdx = -1;
    preset.zValues.forEach(z => {
      const el = window.ROS.getElementByZ(z);
      if (el) layers.push(el);
    });
    clearSidePanel();
  }

  /* ── Events ──────────────────────────────────────────────── */
  function attachEvents() {
    if (addLayerBtn) addLayerBtn.addEventListener('click', addLayer);
    if (clearBtn)    clearBtn.addEventListener('click',    clearAll);
    if (exportBtn)   exportBtn.addEventListener('click',   exportCanvas);
  }

  function addLayer() {
    if (!elemSelect) return;
    const sym = elemSelect.value;
    const el  = window.ROS.getElement(sym);
    if (!el) return;
    layers.push(el);
  }

  function clearAll() {
    layers = [];
    selectedLayerIdx = -1;
    clearSidePanel();
  }

  function exportCanvas() {
    if (!canvas) return;
    // Draw one more frame without animation for clean export
    drawFrame(true);
    const link = document.createElement('a');
    link.download = 'ros-stack-visualizer.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /* ── Animation loop ──────────────────────────────────────── */
  function startAnimation() {
    function loop() {
      animFrame = requestAnimationFrame(loop);
      tick += 0.018;
      drawFrame(false);
    }
    loop();
  }

  /* ── Hit-test: which ring was clicked/hovered ─────────────── */
  function getRingAtPoint(mx, my) {
    if (!canvas || layers.length === 0) return -1;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    const ringData = computeRingData(W, H);
    // Test from outermost ring inward
    for (let i = layers.length - 1; i >= 0; i--) {
      const { outerR, innerR } = ringData[i];
      const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
      if (dist >= innerR && dist <= outerR) return i;
    }
    return -1;
  }

  function computeRingData(W, H) {
    const maxR   = Math.min(W, H) * 0.46;
    const minR   = maxR * 0.12;
    const totalN = layers.length;
    const ringW  = totalN > 0 ? (maxR - minR) / totalN : 0;
    const data = [];
    layers.forEach((el, i) => {
      const mass    = parseFloat(el.mass) || 1;
      const baseThick = Math.max(10, Math.min(42, Math.sqrt(mass) * 2.5));
      const innerR  = minR + i * ringW;
      const outerR  = innerR + baseThick;
      data.push({ innerR, outerR, baseThick });
    });
    return data;
  }

  function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx   = (e.clientX - rect.left) * (canvas.width  / rect.width);
    const my   = (e.clientY - rect.top)  * (canvas.height / rect.height);
    const idx  = getRingAtPoint(mx, my);
    selectedLayerIdx = (idx === selectedLayerIdx) ? -1 : idx;
    if (idx >= 0) showSidePanel(layers[idx], idx);
    else clearSidePanel();
  }

  function handleCanvasHover(e) {
    const rect = canvas.getBoundingClientRect();
    const mx   = (e.clientX - rect.left) * (canvas.width  / rect.width);
    const my   = (e.clientY - rect.top)  * (canvas.height / rect.height);
    const idx  = getRingAtPoint(mx, my);
    canvas.style.cursor = idx >= 0 ? 'pointer' : 'default';
  }

  /* ── Draw ────────────────────────────────────────────────── */
  function drawFrame(staticMode) {
    if (!ctx || !canvas) return;
    const W  = canvas.width;
    const H  = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const t  = staticMode ? 0 : tick;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(6,182,212,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (layers.length === 0) {
      drawEmptyState(W, H);
      return;
    }

    const ringData = computeRingData(W, H);

    // Draw rings from outermost to innermost
    for (let i = layers.length - 1; i >= 0; i--) {
      drawRing(layers[i], i, ringData[i], cx, cy, t, W);
    }

    // Center nucleus dot
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
    grad.addColorStop(0, 'rgba(6,182,212,0.9)');
    grad.addColorStop(1, 'rgba(6,182,212,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Title overlay
    drawTitle(W, H);
  }

  function drawRing(el, idx, ringDatum, cx, cy, t, W) {
    const parity   = el.number % 2 === 0 ? 'even' : 'odd';
    const color    = parity === 'even' ? '#06b6d4' : '#f59e0b';
    const isSelected = idx === selectedLayerIdx;

    const { innerR, outerR, baseThick } = ringDatum;
    // Pulse each ring at a slightly different rate
    const pulseAmt = Math.sin(t * (0.8 + idx * 0.15)) * 3;
    const r        = (innerR + outerR) / 2 + pulseAmt;
    const thick    = baseThick + Math.abs(pulseAmt) * 0.5;

    // Glow aura
    const auraAlpha = isSelected ? 0.3 : 0.08;
    ctx.beginPath();
    ctx.arc(cx, cy, r + thick * 0.6, 0, Math.PI * 2);
    ctx.arc(cx, cy, r - thick * 0.6, 0, Math.PI * 2, true);
    ctx.fillStyle = color.replace(')', `,${auraAlpha})`).replace('rgb', 'rgba').replace('#', 'rgba(').replace('rgba(06b6d4', 'rgba(6,182,212').replace('rgba(f59e0b', 'rgba(245,158,11');
    // simpler approach:
    if (color === '#06b6d4') {
      ctx.fillStyle = `rgba(6,182,212,${auraAlpha * 2})`;
    } else {
      ctx.fillStyle = `rgba(245,158,11,${auraAlpha * 2})`;
    }
    ctx.fill();

    // Ring stroke
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = isSelected ? '#fff' : color;
    ctx.lineWidth   = isSelected ? thick + 2 : thick;
    ctx.shadowColor = color;
    ctx.shadowBlur  = isSelected ? 20 : 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Dashed direction arrow at 3 o'clock position
    const arrowAngle = t * (parity === 'even' ? 0.3 : -0.4) + idx * 0.6;
    const ax = cx + Math.cos(arrowAngle) * r;
    const ay = cy + Math.sin(arrowAngle) * r;
    drawArrowDot(ax, ay, color, parity);

    // Badge at right edge
    const badgeX = cx + r + thick * 0.5 + 4;
    drawRingBadge(badgeX, cy - (layers.length - 1 - idx) * (thick + 4) + (layers.length - 1) * (thick + 4) / 2, el, parity, color, W);
  }

  function drawArrowDot(x, y, color, parity) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Arrow indicator
    ctx.save();
    ctx.translate(x, y);
    const angle = parity === 'even' ? 0 : Math.PI;
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(4, -4);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawRingBadge(bx, by, el, parity, color, W) {
    // Clamp badge position within canvas
    const clampedX = Math.min(bx, W - 80);

    ctx.save();
    const text1 = `${el.symbol}(${el.number})`;
    const text2 = parity.toUpperCase();

    ctx.font = 'bold 11px "Courier New", monospace';
    const tw = Math.max(ctx.measureText(text1).width, ctx.measureText(text2).width) + 12;

    ctx.fillStyle = 'rgba(7,11,20,0.85)';
    roundRect(ctx, clampedX, by - 16, tw, 32, 4);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    roundRect(ctx, clampedX, by - 16, tw, 32, 4);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text1, clampedX + 6, by - 2);
    ctx.font = '9px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(148,163,184,0.8)';
    ctx.fillText(text2, clampedX + 6, by + 11);
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function drawTitle(W, H) {
    ctx.save();
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(100,116,139,0.6)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`LAYERS: ${layers.length}  |  CLICK RING FOR DETAILS`, 10, 10);
    ctx.restore();
  }

  function drawEmptyState(W, H) {
    ctx.save();
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = 'rgba(100,116,139,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD ELEMENTS OR SELECT A PRESET', W / 2, H / 2);
    ctx.restore();
  }

  /* ── Side panel ──────────────────────────────────────────── */
  function showSidePanel(el, idx) {
    if (!sidePanel) return;
    const parity   = el.number % 2 === 0 ? 'even' : 'odd';
    const parityRule = window.ROS.evenOddRule(el.number);
    const codeLink   = window.ROS.codeToAtomicLink(el.number);
    const hullLayer  = window.ROS.hullLayers.find(h => h.z === el.number);

    sidePanel.innerHTML = `
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
        ${window.ROS.renderElementTile(el)}
        <div>
          <div style="font-size:0.7rem;color:#64748b;letter-spacing:0.1em;text-transform:uppercase;">Layer ${idx + 1}</div>
          <div style="font-size:1.2rem;font-weight:900;color:${parity === 'even' ? '#06b6d4' : '#f59e0b'};">${el.name}</div>
          <div style="font-size:0.8rem;color:#94a3b8;">${el.group || ''} · Period ${el.period || '?'}</div>
        </div>
      </div>
      <hr style="border-color:#1e2d4a;margin:0.75rem 0;">
      <div style="margin-bottom:0.75rem;">
        <div style="font-size:0.72rem;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.25rem;">Parity Rule</div>
        <span class="tag badge-${parity === 'even' ? 'even' : 'odd'}">${parity.toUpperCase()} — ${parityRule.role}</span>
        <p style="font-size:0.78rem;color:#64748b;margin-top:0.4rem;line-height:1.6;">${parityRule.description}</p>
      </div>
      ${hullLayer ? `
      <div style="margin-bottom:0.75rem;">
        <div style="font-size:0.72rem;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.25rem;">Hull Layer Role</div>
        <div style="font-size:0.82rem;color:#e2e8f0;font-weight:600;">${hullLayer.layer}</div>
        <div style="font-size:0.78rem;color:#64748b;margin-top:0.2rem;line-height:1.5;">${hullLayer.role}</div>
      </div>` : ''}
      <div style="margin-bottom:0.75rem;">
        <div style="font-size:0.72rem;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.25rem;">Resonance Role</div>
        <div style="font-size:0.78rem;color:#64748b;line-height:1.5;">${el.role || '—'}</div>
      </div>
      <div>
        <div style="font-size:0.72rem;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.25rem;">Code Link</div>
        <div style="font-size:0.78rem;color:#64748b;line-height:1.5;">${codeLink.explanation}</div>
      </div>
      <button onclick="removeLayerByIdx(${idx})" class="btn btn-danger btn-sm" style="margin-top:1rem;width:100%;">Remove Layer</button>
    `;
  }

  // Exposed globally so onclick works
  window.removeLayerByIdx = function(idx) {
    layers.splice(idx, 1);
    if (selectedLayerIdx >= layers.length) selectedLayerIdx = layers.length - 1;
    if (layers.length === 0) { selectedLayerIdx = -1; clearSidePanel(); }
    else showSidePanel(layers[selectedLayerIdx], selectedLayerIdx);
  };

  function clearSidePanel() {
    if (!sidePanel) return;
    sidePanel.innerHTML = `
      <p style="color:#475569;font-style:italic;font-size:0.85rem;">
        Click a ring on the canvas to view element details.
      </p>
    `;
  }

  /* ── Legend ──────────────────────────────────────────────── */
  function buildLegend() {
    if (!legendPanel) return;
    legendPanel.innerHTML = `
      <div class="canvas-legend">
        <div class="canvas-legend-item">
          <span class="legend-dot" style="background:#06b6d4;box-shadow:0 0 6px #06b6d4;"></span>
          <span>EVEN (Inertia / Driver)</span>
        </div>
        <div class="canvas-legend-item">
          <span class="legend-dot" style="background:#f59e0b;box-shadow:0 0 6px #f59e0b;"></span>
          <span>ODD (Receptive / Reactor)</span>
        </div>
        <div class="canvas-legend-item">
          <span style="font-size:0.7rem;color:#475569;">Ring thickness ∝ atomic mass</span>
        </div>
      </div>
    `;
  }

})();
