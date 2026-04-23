/* ============================================================
   RESONANT OS — Gyroscopic Simulator
   tools/gyroscopic-simulator.html
   ============================================================ */

(function () {
  'use strict';

  /* ── State ───────────────────────────────────────────────── */
  let canvas, ctx;
  let animFrame = null;
  let tick = 0;
  let spinning = false;
  let spinSpeed = 1;
  let spinAngle = 0;

  // Triangle vertices (in canvas-local coords, set after resize)
  let verts = [];            // [{x, y}] x3 — Alpha, Beta, Gamma
  let labels = ['α Alpha', 'β Beta', 'γ Gamma'];
  let colors = ['#06b6d4', '#f59e0b', '#8b5cf6'];

  // Drag state
  let dragging = -1;          // index of vertex being dragged
  let dragOffX = 0, dragOffY = 0;
  let shiftDrag = false;      // dragging the whole triangle

  /* ── Init on ros:ready ───────────────────────────────────── */
  document.addEventListener('ros:ready', () => {
    initDom();
    resetTriangle();
    attachEvents();
    startLoop();
    updateSidePanel();
    renderRatioGrid();
  });

  function initDom() {
    canvas = document.getElementById('gyrCanvas');
    if (canvas) {
      ctx = canvas.getContext('2d');
      resizeCanvas();
      window.addEventListener('resize', () => { resizeCanvas(); scaleVertsToCanvas(); });
    }

    const btnReset = document.getElementById('gyrReset');
    const btnEquil = document.getElementById('gyrEquilateral');
    const btnGold  = document.getElementById('gyrGolden');
    const btnSpin  = document.getElementById('gyrSpin');
    const slSpeed  = document.getElementById('gyrSpinSpeed');

    if (btnReset) btnReset.addEventListener('click', () => { resetTriangle(); });
    if (btnEquil) btnEquil.addEventListener('click', () => { setEquilateral(); });
    if (btnGold)  btnGold.addEventListener('click',  () => { setGoldenRatio(); });
    if (btnSpin) {
      btnSpin.addEventListener('click', () => {
        spinning = !spinning;
        btnSpin.setAttribute('aria-pressed', String(spinning));
        btnSpin.style.borderColor = spinning ? '#f59e0b' : '';
        btnSpin.style.color       = spinning ? '#f59e0b' : '';
      });
    }
    if (slSpeed) slSpeed.addEventListener('input', () => {
      spinSpeed = parseFloat(slSpeed.value) || 1;
    });
  }

  function resizeCanvas() {
    if (!canvas) return;
    const wrap = canvas.parentElement;
    const maxW = Math.min(580, wrap.clientWidth - 16);
    canvas.width  = maxW;
    canvas.height = Math.min(520, Math.round(maxW * (520 / 580)));
  }

  /* ── Vertex helpers ──────────────────────────────────────── */
  function canvasCx() { return canvas ? canvas.width / 2 : 290; }
  function canvasCy() { return canvas ? canvas.height / 2 : 260; }

  function resetTriangle() {
    const cx = canvasCx(), cy = canvasCy();
    const r  = Math.min(cx, cy) * 0.55;
    verts = [
      { x: cx,                      y: cy - r         },   // top = Alpha
      { x: cx - r * Math.sin(2.094),y: cy + r * Math.cos(2.094) }, // Beta
      { x: cx + r * Math.sin(2.094),y: cy + r * Math.cos(2.094) }  // Gamma
    ];
    spinAngle = 0;
    updateSidePanel();
    renderRatioGrid();
  }

  function scaleVertsToCanvas() {
    // Re-center after a canvas resize — keep relative normalised positions
    const cx = canvasCx(), cy = canvasCy();
    const r  = Math.min(cx, cy) * 0.55;
    verts = [
      { x: cx,                      y: cy - r         },
      { x: cx - r * Math.sin(2.094),y: cy + r * Math.cos(2.094) },
      { x: cx + r * Math.sin(2.094),y: cy + r * Math.cos(2.094) }
    ];
  }

  function setEquilateral() {
    resetTriangle();
    updateSidePanel();
    renderRatioGrid();
  }

  function setGoldenRatio() {
    const cx = canvasCx(), cy = canvasCy();
    const phi = 1.61803398875;
    const base = Math.min(cx, cy) * 0.65;
    verts = [
      { x: cx,              y: cy - base / phi     },
      { x: cx - base / 2,  y: cy + base / phi / 2 },
      { x: cx + base / 2,  y: cy + base / phi / 2 }
    ];
    updateSidePanel();
    renderRatioGrid();
  }

  /* ── Geometry calculations ───────────────────────────────── */
  function sideLength(a, b) {
    return Math.sqrt((verts[a].x - verts[b].x) ** 2 + (verts[a].y - verts[b].y) ** 2);
  }

  function angleAt(pivot, a, b) {
    const ax = verts[a].x - verts[pivot].x;
    const ay = verts[a].y - verts[pivot].y;
    const bx = verts[b].x - verts[pivot].x;
    const by = verts[b].y - verts[pivot].y;
    const dot = ax * bx + ay * by;
    const magA = Math.sqrt(ax * ax + ay * ay);
    const magB = Math.sqrt(bx * bx + by * by);
    if (magA === 0 || magB === 0) return 0;
    return (Math.acos(Math.min(1, Math.max(-1, dot / (magA * magB)))) * 180 / Math.PI);
  }

  function triangleArea() {
    const [A, B, C] = verts;
    return Math.abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2;
  }

  function centroid() {
    return {
      x: (verts[0].x + verts[1].x + verts[2].x) / 3,
      y: (verts[0].y + verts[1].y + verts[2].y) / 3
    };
  }

  function computeResonanceScore() {
    const sides = [sideLength(0, 1), sideLength(1, 2), sideLength(2, 0)];
    const sorted = [...sides].sort((a, b) => a - b);
    const ratio1 = sorted[1] / (sorted[0] || 1);
    const ratio2 = sorted[2] / (sorted[0] || 1);
    // Closeness to golden ratio φ ≈ 1.618
    const phi  = 1.61803;
    const score1 = 1 - Math.min(1, Math.abs(ratio1 - phi) / phi);
    const score2 = 1 - Math.min(1, Math.abs(ratio2 - phi) / phi);
    return parseFloat(((score1 + score2) / 2 * 100).toFixed(1));
  }

  /* ── Animation loop ──────────────────────────────────────── */
  function startLoop() {
    function loop() {
      animFrame = requestAnimationFrame(loop);
      tick += 0.012;
      if (spinning) {
        spinAngle += 0.004 * spinSpeed;
        rotateVertsBy(0.004 * spinSpeed);
      }
      drawFrame();
    }
    loop();
  }

  function rotateVertsBy(dAngle) {
    const c  = centroid();
    verts = verts.map(v => {
      const dx  = v.x - c.x;
      const dy  = v.y - c.y;
      const cos = Math.cos(dAngle);
      const sin = Math.sin(dAngle);
      return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
    });
  }

  /* ── Drawing ─────────────────────────────────────────────── */
  function drawFrame() {
    if (!ctx || !canvas || verts.length < 3) return;
    const W = canvas.width, H = canvas.height;

    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(6,182,212,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const cen = centroid();

    // Resonance pulse rings from centroid
    const score = computeResonanceScore() / 100;
    for (let ring = 1; ring <= 4; ring++) {
      const r   = (ring * 30 + Math.sin(tick * 0.8 + ring) * 8) * (0.5 + score * 0.5);
      const alp = 0.04 + score * 0.1;
      ctx.beginPath();
      ctx.arc(cen.x, cen.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(6,182,212,${alp})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Altitude lines (from each vertex to opposite midpoint)
    for (let i = 0; i < 3; i++) {
      const opp1 = (i + 1) % 3, opp2 = (i + 2) % 3;
      const midX = (verts[opp1].x + verts[opp2].x) / 2;
      const midY = (verts[opp1].y + verts[opp2].y) / 2;
      ctx.save();
      ctx.strokeStyle = `rgba(${colors[i].startsWith('#0') ? '6,182,212' : colors[i].startsWith('#f') ? '245,158,11' : '139,92,246'},0.15)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(verts[i].x, verts[i].y);
      ctx.lineTo(midX, midY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Triangle sides with gradient glow
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3;
      ctx.save();
      const grad = ctx.createLinearGradient(verts[i].x, verts[i].y, verts[j].x, verts[j].y);
      grad.addColorStop(0, colors[i]);
      grad.addColorStop(1, colors[j]);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = colors[i];
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(verts[i].x, verts[i].y);
      ctx.lineTo(verts[j].x, verts[j].y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Vertices
    verts.forEach((v, i) => {
      const pulse = 1 + Math.sin(tick * 1.5 + i * 1.2) * 0.08;
      ctx.save();
      ctx.beginPath();
      ctx.arc(v.x, v.y, 10 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#070b14';
      ctx.fill();
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2.5;
      ctx.shadowColor = colors[i];
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillStyle = colors[i];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i].substring(0, 1), v.x, v.y);
      ctx.restore();

      // Label outside vertex
      const dx = v.x - cen.x, dy = v.y - cen.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const lx = v.x + (dx / len) * 18, ly = v.y + (dy / len) * 18;
      ctx.save();
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillStyle = colors[i];
      ctx.textAlign = lx < cen.x ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], lx, ly);
      ctx.restore();
    });

    // Centroid marker
    ctx.save();
    ctx.beginPath();
    ctx.arc(cen.x, cen.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#8b5cf6';
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '9px "Courier New", monospace';
    ctx.fillStyle = '#8b5cf6';
    ctx.textAlign = 'center';
    ctx.fillText('Ω', cen.x, cen.y - 10);
    ctx.restore();

    // Resonance score overlay
    ctx.save();
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(100,116,139,0.7)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`φ-SCORE: ${computeResonanceScore()}%   ${spinning ? '⟳ SPINNING' : 'STATIC'}`, 10, 10);
    ctx.restore();
  }

  /* ── Drag events ─────────────────────────────────────────── */
  function attachEvents() {
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      const { mx, my } = getMousePos(e);
      shiftDrag = e.shiftKey;
      if (shiftDrag) {
        dragging = 3; // whole triangle
        dragOffX = mx;
        dragOffY = my;
        return;
      }
      dragging = nearestVertex(mx, my);
      if (dragging >= 0) {
        dragOffX = mx - verts[dragging].x;
        dragOffY = my - verts[dragging].y;
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (dragging < 0) return;
      const { mx, my } = getMousePos(e);
      if (dragging === 3) {
        const dx = mx - dragOffX, dy = my - dragOffY;
        verts = verts.map(v => ({ x: v.x + dx, y: v.y + dy }));
        dragOffX = mx; dragOffY = my;
      } else {
        verts[dragging] = { x: mx - dragOffX, y: my - dragOffY };
      }
      updateSidePanel();
      renderRatioGrid();
    });

    const up = () => { dragging = -1; };
    canvas.addEventListener('mouseup', up);
    canvas.addEventListener('mouseleave', up);

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const { mx, my } = getTouchPos(touch);
      dragging = nearestVertex(mx, my);
      if (dragging >= 0) { dragOffX = mx - verts[dragging].x; dragOffY = my - verts[dragging].y; }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (dragging < 0) return;
      const touch = e.touches[0];
      const { mx, my } = getTouchPos(touch);
      verts[dragging] = { x: mx - dragOffX, y: my - dragOffY };
      updateSidePanel();
      renderRatioGrid();
    }, { passive: false });

    canvas.addEventListener('touchend', () => { dragging = -1; });
  }

  function getMousePos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      mx: (e.clientX - r.left) * (canvas.width  / r.width),
      my: (e.clientY - r.top)  * (canvas.height / r.height)
    };
  }

  function getTouchPos(touch) {
    const r = canvas.getBoundingClientRect();
    return {
      mx: (touch.clientX - r.left) * (canvas.width  / r.width),
      my: (touch.clientY - r.top)  * (canvas.height / r.height)
    };
  }

  function nearestVertex(mx, my) {
    let best = -1, bestDist = Infinity;
    verts.forEach((v, i) => {
      const d = Math.sqrt((mx - v.x) ** 2 + (my - v.y) ** 2);
      if (d < 20 && d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  /* ── Side panel ──────────────────────────────────────────── */
  function updateSidePanel() {
    const side = document.getElementById('gyrSide');
    if (!side || verts.length < 3) return;

    const sides  = [
      sideLength(0, 1).toFixed(1),
      sideLength(1, 2).toFixed(1),
      sideLength(2, 0).toFixed(1)
    ];
    const angles = [
      angleAt(0, 1, 2).toFixed(1),
      angleAt(1, 0, 2).toFixed(1),
      angleAt(2, 0, 1).toFixed(1)
    ];
    const area  = triangleArea().toFixed(1);
    const score = computeResonanceScore();
    const phi   = 1.61803;
    const r01   = (parseFloat(sides[1]) / parseFloat(sides[0])).toFixed(3);
    const r02   = (parseFloat(sides[2]) / parseFloat(sides[0])).toFixed(3);

    side.innerHTML = `
      <div style="margin-bottom:0.75rem;">
        <div class="result-label">φ Resonance Score</div>
        <div style="font-size:1.6rem;font-weight:900;color:${score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444'};">${score}%</div>
        <div style="font-size:0.76rem;color:#64748b;">How close the side ratios are to the golden ratio φ=${phi}</div>
      </div>
      <hr style="border-color:#1e2d4a;margin:0.6rem 0;">
      ${verts.map((_, i) => `
        <div style="margin-bottom:0.5rem;">
          <span style="color:${colors[i]};font-weight:700;">${labels[i]}</span>
          <div style="font-size:0.78rem;color:#94a3b8;">Angle: <strong>${angles[i]}°</strong></div>
        </div>
      `).join('')}
      <hr style="border-color:#1e2d4a;margin:0.6rem 0;">
      <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:0.3rem;">
        <strong>Sides:</strong> α→β=${sides[0]}px · β→γ=${sides[1]}px · γ→α=${sides[2]}px
      </div>
      <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:0.3rem;">
        <strong>Ratios:</strong> β/α = ${r01} · γ/α = ${r02}
      </div>
      <div style="font-size:0.78rem;color:#94a3b8;">
        <strong>Area:</strong> ${area} px²
      </div>
      <div style="margin-top:0.75rem;font-size:0.78rem;color:#64748b;line-height:1.6;">
        ${score > 70
          ? '✅ High φ-resonance: this geometry approaches golden-ratio lock. Strong spatial tuning potential.'
          : score > 40
            ? '⚡ Moderate resonance: the triangle is actively tuning. Adjust vertices toward φ-ratio sides for lock.'
            : '⚠ Low resonance: imbalanced geometry. Move vertices toward equilateral or golden-ratio proportions.'}
      </div>
    `;
  }

  /* ── Ratio grid below canvas ─────────────────────────────── */
  function renderRatioGrid() {
    const grid = document.getElementById('gyrRatios');
    if (!grid || verts.length < 3) return;

    const sides  = [sideLength(0, 1), sideLength(1, 2), sideLength(2, 0)];
    const sorted = [...sides].sort((a, b) => a - b);
    const phi    = 1.61803398875;

    const metrics = [
      { label: 'Side Ratio 1:2',  value: (sorted[1] / (sorted[0] || 1)).toFixed(4), target: phi.toFixed(4) },
      { label: 'Side Ratio 1:3',  value: (sorted[2] / (sorted[0] || 1)).toFixed(4), target: phi.toFixed(4) },
      { label: 'Angle α (°)',     value: angleAt(0, 1, 2).toFixed(2),                target: '60.00' },
      { label: 'Angle β (°)',     value: angleAt(1, 0, 2).toFixed(2),                target: '60.00' },
      { label: 'Angle γ (°)',     value: angleAt(2, 0, 1).toFixed(2),                target: '60.00' },
      { label: 'Area (px²)',      value: triangleArea().toFixed(0),                  target: '—' },
      { label: 'φ-Score',         value: computeResonanceScore() + '%',              target: '100%' },
      { label: 'Harmonic Fit',    value: computeHarmonicFit(),                       target: 'Integer' }
    ];

    grid.innerHTML = metrics.map(m => `
      <div class="result-box">
        <div class="result-label">${m.label}</div>
        <div class="result-val" style="font-size:1.1rem;">${m.value}</div>
        <div style="font-size:0.72rem;color:#475569;">target: ${m.target}</div>
      </div>
    `).join('');
  }

  function computeHarmonicFit() {
    const sides = [sideLength(0, 1), sideLength(1, 2), sideLength(2, 0)];
    const base  = Math.min(...sides) || 1;
    const ratios = sides.map(s => s / base);
    // Check if ratios are close to small integers
    const nearInt = ratios.filter(r => Math.abs(r - Math.round(r)) < 0.1).length;
    return nearInt === 3 ? 'Perfect' : nearInt === 2 ? 'Partial' : 'Irrational';
  }

})();
