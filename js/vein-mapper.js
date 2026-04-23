/* ============================================================
   RESONANT OS — Vein Mapper
   tools/vein-mapper.html
   ============================================================ */

(function () {
  'use strict';

  /* ── State ───────────────────────────────────────────────── */
  let veins    = [];
  let canvas, ctx;
  let animFrame = null;
  let tick = 0;
  let selectedIdx = -1;

  /* ── Vein type data ──────────────────────────────────────── */
  const VEIN_DATA = {
    gold:      { color: '#f59e0b', glow: '#f59e0b', z: 79, name: 'Gold',       label: 'Au' },
    quartz:    { color: '#e2e8f0', glow: '#a5b4fc', z: 14, name: 'Quartz',     label: 'SiO₂' },
    quartzgold:{ color: '#d97706', glow: '#f59e0b', z: 79, name: 'Gold-Quartz',label: 'Au/SiO₂' },
    silver:    { color: '#94a3b8', glow: '#06b6d4', z: 47, name: 'Silver',     label: 'Ag' },
    copper:    { color: '#f97316', glow: '#f97316', z: 29, name: 'Copper',     label: 'Cu' }
  };

  /* ── DOM refs ────────────────────────────────────────────── */
  let selType, inpStrike, inpDip, inpWidth, inpDepth, selGrid,
      btnAdd, btnClear, btnExport, veinTable, veinSide;

  /* ── Init on ros:ready ───────────────────────────────────── */
  document.addEventListener('ros:ready', () => {
    initDom();
    attachEvents();
    startLoop();
    addDefaultVein();
  });

  function initDom() {
    selType   = document.getElementById('veinType');
    inpStrike = document.getElementById('veinStrike');
    inpDip    = document.getElementById('veinDip');
    inpWidth  = document.getElementById('veinWidth');
    inpDepth  = document.getElementById('veinDepth');
    selGrid   = document.getElementById('veinGrid');
    btnAdd    = document.getElementById('veinAdd');
    btnClear  = document.getElementById('veinClear');
    btnExport = document.getElementById('veinExport');
    veinTable = document.getElementById('veinTable');
    veinSide  = document.getElementById('veinSide');
    canvas    = document.getElementById('veinCanvas');

    if (canvas) {
      ctx = canvas.getContext('2d');
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      canvas.addEventListener('click', handleCanvasClick);
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    const wrap = canvas.parentElement;
    const w    = Math.min(600, wrap.clientWidth - 16);
    canvas.width  = w;
    canvas.height = Math.min(540, Math.round(w * (540 / 600)));
  }

  function attachEvents() {
    if (btnAdd)    btnAdd.addEventListener('click',    addVein);
    if (btnClear)  btnClear.addEventListener('click',  clearAll);
    if (btnExport) btnExport.addEventListener('click', exportMap);
  }

  /* ── Add vein ─────────────────────────────────────────────── */
  function addVein() {
    const type   = selType   ? selType.value   : 'gold';
    const strike = parseFloat(inpStrike ? inpStrike.value : 45) || 45;
    const dip    = parseFloat(inpDip    ? inpDip.value    : 70) || 70;
    const width  = parseFloat(inpWidth  ? inpWidth.value  : 5)  || 5;
    const depth  = parseFloat(inpDepth  ? inpDepth.value  : 30) || 30;
    const gridKm = parseFloat(selGrid   ? selGrid.value   : 400) || 400;

    const align  = computeGridAlignment(strike, gridKm);
    const ratio  = computeResonanceRatio(strike, dip, VEIN_DATA[type].z);
    const nodeKm = computeNodeDistance(strike, depth, gridKm);

    const vein = { type, strike, dip, width, depth, gridKm, align, ratio, nodeKm, id: Date.now() };
    veins.push(vein);
    selectedIdx = veins.length - 1;

    refreshTable();
    showSidePanel(vein, veins.length - 1);
  }

  function addDefaultVein() {
    if (inpStrike) inpStrike.value = 45;
    if (inpDip)    inpDip.value    = 70;
    addVein();
  }

  /* ── Geometry helpers ────────────────────────────────────── */
  function computeGridAlignment(strike, gridKm) {
    // Grid nodes are at cardinal and diagonal angles (0,45,90,135,180,225,270,315)
    const cardinals = [0, 45, 90, 135, 180, 225, 270, 315];
    const best = cardinals.reduce((min, c) => {
      const diff = Math.abs(((strike - c + 360) % 360));
      const d = Math.min(diff, 360 - diff);
      return d < min.d ? { c, d } : min;
    }, { c: 0, d: 999 });
    // Score: 100 = perfect alignment, 0 = 45° off
    return parseFloat(Math.max(0, 100 - best.d / 45 * 100).toFixed(1));
  }

  function computeNodeDistance(strike, depth, gridKm) {
    // Conceptual distance to nearest node based on strike and depth
    const angFactor = Math.cos(strike * Math.PI / 180);
    const depthFactor = Math.sqrt(depth / 100);
    return parseFloat((gridKm * Math.abs(angFactor) * depthFactor * 0.5).toFixed(1));
  }

  function computeResonanceRatio(strike, dip, z) {
    // Ratio of strike / 360 × z, normalized to simple fraction
    const raw = (strike / 360) * z;
    const base = Math.max(1, Math.round(raw));
    const r2   = Math.round(dip / 90 * z);
    return `${base}:${r2 || 1}`;
  }

  /* ── Table ───────────────────────────────────────────────── */
  function refreshTable() {
    if (!veinTable) return;
    veinTable.innerHTML = '';
    veins.forEach((v, idx) => {
      const d = VEIN_DATA[v.type];
      const tr = document.createElement('tr');
      tr.className = 'list-row';
      tr.style.cursor = 'pointer';
      if (idx === selectedIdx) tr.style.background = 'rgba(6,182,212,0.07)';
      tr.innerHTML = `
        <td class="td-num">${idx + 1}</td>
        <td style="color:${d.color};font-weight:600;">${d.label}</td>
        <td class="td-num">${v.strike}°</td>
        <td class="td-num">${v.dip}°</td>
        <td class="td-num">${v.width}</td>
        <td style="color:${v.align > 70 ? '#10b981' : v.align > 40 ? '#f59e0b' : '#ef4444'};font-weight:700;">${v.align}%</td>
        <td class="td-num">${v.nodeKm} km</td>
        <td style="font-family:var(--font-mono);font-size:0.82rem;">${v.ratio}</td>
      `;
      tr.addEventListener('click', () => {
        selectedIdx = idx;
        showSidePanel(v, idx);
        refreshTable();
      });
      veinTable.appendChild(tr);
    });
  }

  /* ── Side panel ──────────────────────────────────────────── */
  function showSidePanel(v, idx) {
    if (!veinSide) return;
    const d = VEIN_DATA[v.type];
    const el = window.ROS.getElementByZ(d.z);
    const parity = window.ROS.evenOddRule(d.z);
    const codeLink = window.ROS.codeToAtomicLink(d.z);

    veinSide.innerHTML = `
      <div style="margin-bottom:0.75rem;">
        <div style="font-size:0.7rem;color:#64748b;letter-spacing:0.1em;text-transform:uppercase;">Vein #${idx + 1}</div>
        <div style="font-size:1.3rem;font-weight:900;color:${d.color};">${d.name}</div>
        <div style="font-size:0.8rem;color:#94a3b8;">${d.label} · Z=${d.z}</div>
      </div>
      <hr style="border-color:#1e2d4a;margin:0.6rem 0;">
      ${el ? window.ROS.renderElementTile(el) : ''}
      <div style="margin-top:0.75rem;">
        <div class="result-label">Grid Alignment</div>
        <div style="font-size:1.4rem;font-weight:900;color:${v.align > 70 ? '#10b981' : v.align > 40 ? '#f59e0b' : '#ef4444'};">${v.align}%</div>
        <div style="font-size:0.76rem;color:#64748b;">At strike ${v.strike}° vs cardinal grid nodes</div>
      </div>
      <div style="margin-top:0.6rem;">
        <div class="result-label">Nearest Grid Node</div>
        <div style="font-size:1rem;font-weight:700;color:#e2e8f0;">${v.nodeKm} km</div>
      </div>
      <div style="margin-top:0.6rem;">
        <div class="result-label">Resonance Ratio</div>
        <div style="font-size:1.1rem;font-weight:700;color:#06b6d4;">${v.ratio}</div>
        <div style="font-size:0.76rem;color:#64748b;">Strike ${v.strike}° / Dip ${v.dip}° · Z=${d.z} derivation</div>
      </div>
      <hr style="border-color:#1e2d4a;margin:0.6rem 0;">
      <div style="font-size:0.78rem;color:#64748b;line-height:1.6;">
        <strong style="color:#94a3b8;">Parity:</strong> ${parity.parity.toUpperCase()} — ${parity.role}<br>
        <strong style="color:#94a3b8;">Code Link:</strong> ${codeLink.explanation}
      </div>
      <div style="margin-top:0.75rem;font-size:0.78rem;color:#475569;line-height:1.6;">
        ${v.align > 70
          ? '✅ Strong grid alignment: this vein strike is close to a planetary resonance axis. High potential for legacy OS node connection.'
          : v.align > 40
            ? '⚡ Moderate alignment: adjust survey angle slightly toward the nearest 45° cardinal for better node coupling.'
            : '⚠ Off-grid: this vein runs counter to the resonance grid. May represent an older circuit or interference pattern.'}
      </div>
      <button onclick="removeVein(${idx})" class="btn btn-danger btn-sm" style="margin-top:1rem;width:100%;">Remove Vein</button>
    `;
  }

  window.removeVein = function(idx) {
    veins.splice(idx, 1);
    selectedIdx = Math.min(selectedIdx, veins.length - 1);
    refreshTable();
    if (veins.length > 0) showSidePanel(veins[selectedIdx], selectedIdx);
    else if (veinSide) veinSide.innerHTML = '<p style="color:#475569;font-style:italic;font-size:0.85rem;">Add a vein to see grid alignment details.</p>';
  };

  /* ── Clear ───────────────────────────────────────────────── */
  function clearAll() {
    veins = [];
    selectedIdx = -1;
    refreshTable();
    if (veinSide) veinSide.innerHTML = '<p style="color:#475569;font-style:italic;font-size:0.85rem;">Add a vein to see grid alignment details.</p>';
  }

  /* ── Export PNG ──────────────────────────────────────────── */
  function exportMap() {
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'ros-vein-map.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /* ── Canvas click to select vein ─────────────────────────── */
  function handleCanvasClick(e) {
    if (veins.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width  / rect.width);
    const my = (e.clientY - rect.top)  * (canvas.height / rect.height);

    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    let best = -1, bestDist = 40;
    veins.forEach((v, idx) => {
      // Find where this vein's line passes closest to click
      const angle = (v.strike - 90) * Math.PI / 180;
      const len   = Math.min(W, H) * 0.38;
      const ex    = cx + Math.cos(angle) * len;
      const ey    = cy + Math.sin(angle) * len;
      // Distance from click to line midpoint
      const midX = (cx + ex) / 2, midY = (cy + ey) / 2;
      const d = Math.sqrt((mx - midX) ** 2 + (my - midY) ** 2);
      if (d < bestDist) { bestDist = d; best = idx; }
    });

    if (best >= 0) {
      selectedIdx = best;
      showSidePanel(veins[best], best);
      refreshTable();
    }
  }

  /* ── Animation loop ──────────────────────────────────────── */
  function startLoop() {
    function loop() {
      animFrame = requestAnimationFrame(loop);
      tick += 0.012;
      drawFrame();
    }
    loop();
  }

  /* ── Draw ────────────────────────────────────────────────── */
  function drawFrame() {
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, W, H);

    // Grid lines (cardinal + diagonal resonance axes)
    const axes = [0, 45, 90, 135];
    axes.forEach(deg => {
      const rad = deg * Math.PI / 180;
      const len = Math.max(W, H);
      ctx.save();
      ctx.strokeStyle = 'rgba(6,182,212,0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(rad) * len, cy - Math.sin(rad) * len);
      ctx.lineTo(cx + Math.cos(rad) * len, cy + Math.sin(rad) * len);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // Concentric grid rings
    for (let r = 40; r < Math.max(W, H); r += 60) {
      const pulse = 1 + Math.sin(tick * 0.5 + r * 0.01) * 0.02;
      ctx.beginPath();
      ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6,182,212,0.04)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw each vein
    veins.forEach((v, idx) => {
      drawVein(v, idx, cx, cy, W, H);
    });

    // Center compass rose
    drawCompass(cx, cy);

    // Status
    ctx.save();
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(100,116,139,0.6)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`VEINS: ${veins.length}   CLICK VEIN TO SELECT`, 10, 10);
    ctx.restore();
  }

  function drawVein(v, idx, cx, cy, W, H) {
    const d       = VEIN_DATA[v.type];
    const isSelected = idx === selectedIdx;
    const angle   = (v.strike - 90) * Math.PI / 180;
    const len     = Math.min(W, H) * (0.25 + Math.min(v.width / 50, 0.2));
    const ex      = cx + Math.cos(angle) * len;
    const ey      = cy + Math.sin(angle) * len;
    const sx      = cx - Math.cos(angle) * len;
    const sy      = cy - Math.sin(angle) * len;

    // Dip taper (deeper veins are shown narrower)
    const taperedW = Math.max(1.5, v.width * 0.08 * (1 - v.dip / 120));

    ctx.save();
    ctx.strokeStyle = d.color;
    ctx.lineWidth   = taperedW + (isSelected ? 2 : 0);
    ctx.shadowColor = d.glow;
    ctx.shadowBlur  = isSelected ? 22 : 8;

    // Animated dash for selected
    if (isSelected) {
      ctx.setLineDash([8, 4]);
      ctx.lineDashOffset = -tick * 20;
    }

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Endpoint markers
    [{ x: sx, y: sy }, { x: ex, y: ey }].forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.shadowColor = d.glow;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Label at midpoint
    const midX = (sx + ex) / 2;
    const midY = (sy + ey) / 2;
    const labelOff = 14;
    const perpAngle = angle + Math.PI / 2;

    ctx.font = isSelected ? 'bold 10px "Courier New", monospace' : '9px "Courier New", monospace';
    ctx.fillStyle = isSelected ? '#fff' : d.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${idx + 1} ${d.label} ${v.strike}°`, midX + Math.cos(perpAngle) * labelOff, midY + Math.sin(perpAngle) * labelOff);

    // Alignment arc
    const alignColor = v.align > 70 ? '#10b981' : v.align > 40 ? '#f59e0b' : '#ef4444';
    ctx.beginPath();
    ctx.arc(midX, midY, 16 + v.align * 0.1, angle - 0.3, angle + 0.3);
    ctx.strokeStyle = alignColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = alignColor;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  function drawCompass(cx, cy) {
    const r = 22;
    const cardinals = [
      { label: 'N', angle: -Math.PI / 2 },
      { label: 'E', angle: 0 },
      { label: 'S', angle: Math.PI / 2 },
      { label: 'W', angle: Math.PI }
    ];

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(6,182,212,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    cardinals.forEach(c => {
      const x = cx + Math.cos(c.angle) * (r + 8);
      const y = cy + Math.sin(c.angle) * (r + 8);
      ctx.font = 'bold 9px "Courier New", monospace';
      ctx.fillStyle = c.label === 'N' ? '#06b6d4' : 'rgba(100,116,139,0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.label, x, y);
    });

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

})();
