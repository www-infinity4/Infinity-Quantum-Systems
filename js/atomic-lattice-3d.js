/* ============================================================
   RESONANT OS — Atomic Lattice 3D
   tools/atomic-lattice-3d.html
   ============================================================ */

(function () {
  'use strict';

  /* ── 3D Math helpers ─────────────────────────────────────── */
  function rotX(p, a) {
    const cos = Math.cos(a), sin = Math.sin(a);
    return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
  }
  function rotY(p, a) {
    const cos = Math.cos(a), sin = Math.sin(a);
    return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
  }
  function rotZ(p, a) {
    const cos = Math.cos(a), sin = Math.sin(a);
    return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos, z: p.z };
  }
  function project(p, fov, cx, cy) {
    const z = p.z + fov;
    if (z <= 0) return { sx: cx, sy: cy, scale: 0 };
    const scale = fov / z;
    return { sx: cx + p.x * scale, sy: cy + p.y * scale, scale };
  }

  /* ── State ───────────────────────────────────────────────── */
  let nodes    = [];
  let bonds    = [];
  let canvas, ctx;
  let animFrame = null;
  let tick = 0;
  let spinning = true;
  let showBonds = true;
  let selectedNode = -1;
  let zoom = 1;

  // Rotation angles
  let rotAngleX = -0.35;
  let rotAngleY = 0.4;
  let autoRotSpeedX = 0.0008;
  let autoRotSpeedY = 0.0035;

  // Drag
  let isDragging = false;
  let lastMx = 0, lastMy = 0;

  /* ── DOM refs ────────────────────────────────────────────── */
  let selRows, selElem, btnSpin, btnBonds, btnReset, btnActivateAll,
      nodeInfo, presetContainer;

  /* ── Element for nodes (default: Hydrogen) ───────────────── */
  let nodeElement = null;

  /* ── Presets ─────────────────────────────────────────────── */
  const PRESETS = [
    { label: 'H Stack 1-2-3',  zVals: [1, 2, 3]  },
    { label: 'SLR 46-47-48',   zVals: [46, 47, 48] },
    { label: 'Ruby Al-Cr-O',   zVals: [13, 24, 8]  },
    { label: 'Bio 7-8-6',      zVals: [7, 8, 6]   }
  ];

  /* ── Init on ros:ready ───────────────────────────────────── */
  document.addEventListener('ros:ready', () => {
    initDom();
    buildLattice(4);
    buildPresets();
    attachEvents();
    startLoop();
  });

  function initDom() {
    selRows         = document.getElementById('latRows');
    selElem         = document.getElementById('latElement');
    btnSpin         = document.getElementById('latSpin');
    btnBonds        = document.getElementById('latBonds');
    btnReset        = document.getElementById('latReset');
    btnActivateAll  = document.getElementById('latActivateAll');
    nodeInfo        = document.getElementById('latNodeInfo');
    presetContainer = document.getElementById('latPresets');
    canvas          = document.getElementById('latCanvas');

    if (canvas) {
      ctx = window.ROS.configureCanvasContext(canvas.getContext('2d'));
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseup',   onMouseUp);
      canvas.addEventListener('mouseleave',onMouseUp);
      canvas.addEventListener('click',     onCanvasClick);
      canvas.addEventListener('wheel',     onWheel, { passive: true });
      canvas.addEventListener('touchstart', onTouchStart, { passive: true });
      canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
      canvas.addEventListener('touchend',   onMouseUp);
    }

    // Populate element select
    if (selElem) {
      window.ROS.elements.forEach(el => {
        const opt = document.createElement('option');
        opt.value = el.symbol;
        opt.textContent = `${el.number}. ${el.name} (${el.symbol})`;
        if (el.symbol === 'H') opt.selected = true;
        selElem.appendChild(opt);
      });
      nodeElement = window.ROS.getElement('H');
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    const wrap = canvas.parentElement;
    const w    = Math.min(720, wrap.clientWidth - 8);
    canvas.width  = w;
    canvas.height = Math.round(w * (540 / 720));
  }

  /* ── Build lattice ───────────────────────────────────────── */
  function buildLattice(size) {
    nodes = [];
    bonds = [];
    const cols  = size;
    const rows  = size;
    const depth = Math.max(2, Math.round(size * 0.6));
    const spacing = 90;

    // Create nodes
    for (let ix = 0; ix < cols; ix++) {
      for (let iy = 0; iy < rows; iy++) {
        for (let iz = 0; iz < depth; iz++) {
          const el = nodeElement || window.ROS.getElement('H');
          // Slight jitter to look organic
          const jitter = () => (Math.random() - 0.5) * 6;
          nodes.push({
            x: (ix - (cols - 1) / 2) * spacing + jitter(),
            y: (iy - (rows - 1) / 2) * spacing + jitter(),
            z: (iz - (depth - 1) / 2) * spacing + jitter(),
            active: false,
            pulsePhase: Math.random() * Math.PI * 2,
            el,
            ix, iy, iz
          });
        }
      }
    }

    // Create bonds between nearest neighbours
    const maxBondDist = spacing * 1.35;
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const dx = nodes[a].x - nodes[b].x;
        const dy = nodes[a].y - nodes[b].y;
        const dz = nodes[a].z - nodes[b].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist <= maxBondDist) {
          bonds.push({ a, b, dist });
        }
      }
    }
  }

  /* ── Preset buttons ──────────────────────────────────────── */
  function buildPresets() {
    if (!presetContainer) return;
    PRESETS.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.textContent = p.label;
      btn.addEventListener('click', () => {
        // Activate nodes matching z values
        p.zVals.forEach((z, layer) => {
          const el = window.ROS.getElementByZ(z);
          if (!el) return;
          nodes.forEach((nd, idx) => {
            if (nd.iz === layer % nodes.reduce((m, n) => Math.max(m, n.iz), 0)) {
              nd.el = el;
              nd.active = true;
            }
          });
        });
      });
      presetContainer.appendChild(btn);
    });
  }

  /* ── Events ──────────────────────────────────────────────── */
  function attachEvents() {
    if (selRows) selRows.addEventListener('change', () => {
      buildLattice(parseInt(selRows.value, 10) || 4);
    });
    if (selElem) selElem.addEventListener('change', () => {
      nodeElement = window.ROS.getElement(selElem.value);
      nodes.forEach(nd => { nd.el = nodeElement; });
    });
    if (btnSpin) btnSpin.addEventListener('click', () => {
      spinning = !spinning;
      btnSpin.setAttribute('aria-pressed', String(spinning));
      btnSpin.textContent = spinning ? '⟳ Spinning' : '○ Paused';
      btnSpin.style.borderColor = spinning ? '#06b6d4' : '';
    });
    if (btnBonds) btnBonds.addEventListener('click', () => {
      showBonds = !showBonds;
      btnBonds.setAttribute('aria-pressed', String(showBonds));
      btnBonds.textContent = showBonds ? 'Bonds ON' : 'Bonds OFF';
    });
    if (btnReset) btnReset.addEventListener('click', () => {
      nodes.forEach(nd => { nd.active = false; nd.el = nodeElement || window.ROS.getElement('H'); });
      selectedNode = -1;
      clearNodeInfo();
    });
    if (btnActivateAll) btnActivateAll.addEventListener('click', () => {
      nodes.forEach(nd => { nd.active = true; });
    });
  }

  /* ── Mouse / Touch ───────────────────────────────────────── */
  function onMouseDown(e) {
    isDragging = true;
    lastMx = e.clientX; lastMy = e.clientY;
    canvas.style.cursor = 'grabbing';
  }
  function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - lastMx;
    const dy = e.clientY - lastMy;
    rotAngleY += dx * 0.007;
    rotAngleX += dy * 0.007;
    lastMx = e.clientX; lastMy = e.clientY;
  }
  function onMouseUp() { isDragging = false; canvas.style.cursor = 'grab'; }
  function onCanvasClick(e) {
    if (isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width  / rect.width);
    const my = (e.clientY - rect.top)  * (canvas.height / rect.height);
    pickNode(mx, my);
  }
  function onWheel(e) {
    zoom = Math.max(0.3, Math.min(3, zoom - e.deltaY * 0.001));
  }
  let touchStartX = 0, touchStartY = 0;
  function onTouchStart(e) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }
  function onTouchMove(e) {
    e.preventDefault();
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    rotAngleY += dx * 0.005;
    rotAngleX += dy * 0.005;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  /* ── Node picking ─────────────────────────────────────────── */
  function pickNode(mx, my) {
    const W = canvas.width, H = canvas.height;
    const fov = 500 * zoom;
    let best = -1, bestDist = 22;

    nodes.forEach((nd, idx) => {
      let p = { x: nd.x, y: nd.y, z: nd.z };
      p = rotX(p, rotAngleX);
      p = rotY(p, rotAngleY);
      const proj = project(p, fov, W / 2, H / 2);
      const d = Math.sqrt((mx - proj.sx) ** 2 + (my - proj.sy) ** 2);
      if (d < bestDist) { bestDist = d; best = idx; }
    });

    if (best >= 0) {
      selectedNode = best;
      nodes[best].active = !nodes[best].active;
      showNodeInfo(nodes[best], best);
    } else {
      selectedNode = -1;
      clearNodeInfo();
    }
  }

  /* ── Node info panel ─────────────────────────────────────── */
  function showNodeInfo(nd, idx) {
    if (!nodeInfo) return;
    const el     = nd.el;
    const parity = window.ROS.evenOddRule(el.number);
    const code   = window.ROS.getCode(el.number);
    nodeInfo.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:1rem;flex-wrap:wrap;">
        ${window.ROS.renderElementTile(el)}
        <div>
          <div style="font-size:0.7rem;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Node #${idx + 1} · Layer Z=${nd.iz + 1} · Position (${nd.ix},${nd.iy},${nd.iz})</div>
          <div style="font-size:1.2rem;font-weight:900;color:${parity.parity === 'even' ? '#06b6d4' : '#f59e0b'};">${el.name}</div>
          <div style="font-size:0.8rem;color:#94a3b8;">Z=${el.number} · ${parseFloat(el.mass).toFixed(3)} u · ${parity.parity.toUpperCase()} — ${parity.role}</div>
          ${code ? `<div style="font-size:0.78rem;color:#64748b;margin-top:0.3rem;">Code ${code.number}: ${code.label} — ${code.meaning}</div>` : ''}
          <span class="tag badge-${nd.active ? 'even' : 'odd'}" style="margin-top:0.4rem;">${nd.active ? '⚡ ACTIVATED' : '○ INACTIVE'}</span>
        </div>
      </div>
    `;
  }
  function clearNodeInfo() {
    if (nodeInfo) nodeInfo.innerHTML = '<span style="color:#475569;font-style:italic;">Click a node in the lattice to inspect it.</span>';
  }

  /* ── Animation loop ──────────────────────────────────────── */
  function startLoop() {
    function loop() {
      animFrame = requestAnimationFrame(loop);
      tick += 0.014;
      if (spinning && !isDragging) {
        rotAngleY += autoRotSpeedY;
        rotAngleX += autoRotSpeedX;
      }
      drawFrame();
    }
    loop();
  }

  /* ── Draw ────────────────────────────────────────────────── */
  function drawFrame() {
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const fov = 500 * zoom;

    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, W, H);

    // Project all nodes
    const projected = nodes.map(nd => {
      let p = { x: nd.x, y: nd.y, z: nd.z };
      p = rotX(p, rotAngleX);
      p = rotY(p, rotAngleY);
      return { ...project(p, fov, cx, cy), worldZ: p.z };
    });

    // Draw bonds (back to front)
    if (showBonds) {
      const sortedBonds = [...bonds].sort((a, b) => {
        const midA = (projected[a.a].worldZ + projected[a.b].worldZ) / 2;
        const midB = (projected[b.a].worldZ + projected[b.b].worldZ) / 2;
        return midA - midB;
      });

      sortedBonds.forEach(bond => {
        const pA = projected[bond.a];
        const pB = projected[bond.b];
        const ndA = nodes[bond.a];
        const ndB = nodes[bond.b];
        if (pA.scale <= 0 || pB.scale <= 0) return;

        const depthFade = Math.max(0.05, Math.min(0.7, (pA.scale + pB.scale) * 0.18));
        const isActive = ndA.active && ndB.active;

        const colorA = ndA.el.number % 2 === 0 ? '#06b6d4' : '#f59e0b';
        const colorB = ndB.el.number % 2 === 0 ? '#06b6d4' : '#f59e0b';

        ctx.save();
        if (isActive) {
          // Animated flowing bond
          const grad = ctx.createLinearGradient(pA.sx, pA.sy, pB.sx, pB.sy);
          const t = (tick * 2) % 1;
          grad.addColorStop(0, colorA + '88');
          grad.addColorStop(Math.max(0, t - 0.1), colorA + '22');
          grad.addColorStop(t, '#ffffff');
          grad.addColorStop(Math.min(1, t + 0.1), colorB + '22');
          grad.addColorStop(1, colorB + '88');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.shadowColor = colorA;
          ctx.shadowBlur = 8;
        } else {
          ctx.strokeStyle = `rgba(30,45,74,${depthFade * 1.5})`;
          ctx.lineWidth = 1;
        }
        ctx.beginPath();
        ctx.moveTo(pA.sx, pA.sy);
        ctx.lineTo(pB.sx, pB.sy);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      });
    }

    // Sort nodes by Z for correct occlusion
    const sortedIdx = nodes.map((_, i) => i).sort((a, b) => projected[a].worldZ - projected[b].worldZ);

    sortedIdx.forEach(idx => {
      const nd  = nodes[idx];
      const p   = projected[idx];
      if (p.scale <= 0) return;

      const parity    = nd.el.number % 2 === 0 ? 'even' : 'odd';
      const baseColor = parity === 'even' ? '#06b6d4' : '#f59e0b';
      const r         = Math.max(4, Math.min(16, 8 * p.scale * zoom));
      const isSelected = idx === selectedNode;

      // Depth-based opacity
      const opacity = Math.max(0.25, Math.min(1, 0.3 + p.scale * 0.5));

      // Pulse for active nodes
      const pulse = nd.active
        ? 1 + Math.sin(tick * 3 + nd.pulsePhase) * 0.25
        : 1;

      ctx.save();

      // Glow aura for active/selected
      if (nd.active || isSelected) {
        const auraR = r * 2.8 * pulse;
        const aura  = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, auraR);
        const ac = nd.active ? (isSelected ? '#ffffff' : baseColor) : '#ffffff';
        aura.addColorStop(0, ac + '55');
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, auraR, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3D sphere shading
      const sphereGrad = ctx.createRadialGradient(
        p.sx - r * 0.3, p.sy - r * 0.3, r * 0.1,
        p.sx, p.sy, r * pulse
      );
      const hexToRgba = (hex, a) => {
        const rr = parseInt(hex.slice(1,3),16), gg = parseInt(hex.slice(3,5),16), bb = parseInt(hex.slice(5,7),16);
        return `rgba(${rr},${gg},${bb},${a})`;
      };

      if (nd.active) {
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.3, baseColor);
        sphereGrad.addColorStop(1, hexToRgba(baseColor, 0.3));
      } else {
        sphereGrad.addColorStop(0, hexToRgba(baseColor, opacity * 0.7));
        sphereGrad.addColorStop(0.6, hexToRgba(baseColor, opacity * 0.25));
        sphereGrad.addColorStop(1, 'rgba(7,11,20,0.9)');
      }

      ctx.beginPath();
      ctx.arc(p.sx, p.sy, r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      if (nd.active) {
        ctx.shadowColor = baseColor;
        ctx.shadowBlur  = isSelected ? 24 : 14;
      }
      ctx.fill();

      // Ring for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r * pulse + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // Symbol label (only when big enough)
      if (r > 8) {
        ctx.font = `bold ${Math.round(r * 0.75)}px "Segoe UI", sans-serif`;
        ctx.fillStyle = nd.active ? '#070b14' : hexToRgba(baseColor, opacity);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = nd.active ? 'transparent' : baseColor;
        ctx.shadowBlur  = 4;
        ctx.fillText(nd.el.symbol, p.sx, p.sy);
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    });

    // HUD overlay
    ctx.save();
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(100,116,139,0.6)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const activeCount = nodes.filter(n => n.active).length;
    ctx.fillText(`NODES: ${nodes.length}  BONDS: ${bonds.length}  ACTIVE: ${activeCount}  ZOOM: ${zoom.toFixed(1)}×`, 10, 10);
    ctx.textAlign = 'right';
    ctx.fillText(spinning ? '⟳ AUTO-ROTATE' : '○ MANUAL', W - 10, 10);
    ctx.restore();
  }

})();
