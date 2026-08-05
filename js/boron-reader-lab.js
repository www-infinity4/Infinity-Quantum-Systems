(() => {
  'use strict';

  const layers = [
    { symbol: 'V', name: 'Vanadium', atomic: 23, color: '#77d7ff', role: 'State-sensitive trigger and switching layer.', label: 'Engineering analogy' },
    { symbol: 'K', name: 'Potassium', atomic: 19, color: '#ffbd69', role: 'Positive component in the alternating ion-field model.', label: 'Project hypothesis' },
    { symbol: 'I', name: 'Iodine', atomic: 53, color: '#9a7cff', role: 'Negative component in the alternating ion-field model.', label: 'Project hypothesis' },
    { symbol: 'As', name: 'Arsenic', atomic: 33, color: '#ff7a8e', role: 'Directional pathway layer. Physical arsenic work requires professional toxic-material controls.', label: 'Safety-critical hypothesis' },
    { symbol: 'Li', name: 'Lithium', atomic: 3, color: '#9cf2b9', role: 'Mobile-ion backbone and contact trigger analogue.', label: 'Engineering analogy' },
    { symbol: 'B', name: 'Boron', atomic: 5, color: '#f3dd72', role: 'Proposed structural memory core represented here by simulated void cells.', label: 'Simulation model' }
  ];

  const $ = (id) => document.getElementById(id);
  const internal = $('internalField');
  const cosmic = $('cosmicField');
  const noise = $('noise');
  const fieldCanvas = $('fieldCanvas');
  const scopeCanvas = $('scopeCanvas');
  const fieldCtx = fieldCanvas.getContext('2d');
  const scopeCtx = scopeCanvas.getContext('2d');
  const cells = Array(96).fill(false);
  let pulse = 0;
  let animationFrame = 0;

  function renderLayers() {
    const root = $('layerStack');
    root.innerHTML = '';
    layers.forEach((layer, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'layer';
      button.style.setProperty('--layer-color', layer.color);
      button.innerHTML = `<span class="atom">${layer.symbol}</span><span><strong>${layer.name}</strong><small> Element ${layer.atomic}</small></span><span>${layer.label}</span>`;
      button.addEventListener('click', () => selectLayer(index, button));
      root.appendChild(button);
    });
    selectLayer(0, root.firstElementChild);
  }

  function selectLayer(index, button) {
    document.querySelectorAll('.layer').forEach((node) => node.classList.remove('active'));
    button?.classList.add('active');
    const layer = layers[index];
    $('layerDetails').innerHTML = `<strong>${layer.symbol} · ${layer.name} · Z=${layer.atomic}</strong><p>${layer.role}</p><small>${layer.label}</small>`;
  }

  function renderGrid() {
    const root = $('voidGrid');
    root.innerHTML = '';
    cells.forEach((active, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `void-cell${active ? ' on' : ''}`;
      button.setAttribute('aria-label', `Boron cell ${index + 1}: ${active ? 'void' : 'solid'}`);
      button.addEventListener('click', () => {
        cells[index] = !cells[index];
        renderGrid();
      });
      root.appendChild(button);
    });
    $('binaryOutput').textContent = cells.map((value) => value ? '1' : '0').join('');
  }

  function drawField(time) {
    const w = fieldCanvas.width;
    const h = fieldCanvas.height;
    const a = Number(internal.value) / 100;
    const b = Number(cosmic.value) / 100;
    const n = Number(noise.value) / 50;
    fieldCtx.clearRect(0, 0, w, h);
    const bg = fieldCtx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * .6);
    bg.addColorStop(0, '#17265e');
    bg.addColorStop(1, '#050919');
    fieldCtx.fillStyle = bg;
    fieldCtx.fillRect(0, 0, w, h);

    for (let ring = 0; ring < 13; ring += 1) {
      const progress = (ring + ((time * .00025) % 1)) / 13;
      const radius = 30 + progress * 360;
      fieldCtx.beginPath();
      fieldCtx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
      fieldCtx.strokeStyle = `rgba(101,229,255,${(1 - progress) * b * .55})`;
      fieldCtx.lineWidth = 2;
      fieldCtx.stroke();
    }

    for (let ray = 0; ray < 34; ray += 1) {
      const angle = (ray / 34) * Math.PI * 2 + time * .00012;
      const jitter = Math.sin(ray * 7 + time * .004) * 18 * n;
      fieldCtx.beginPath();
      fieldCtx.moveTo(w / 2, h / 2);
      fieldCtx.lineTo(w / 2 + Math.cos(angle) * (120 + a * 170 + jitter), h / 2 + Math.sin(angle) * (120 + a * 170 + jitter));
      fieldCtx.strokeStyle = `rgba(255,107,122,${.12 + a * .33})`;
      fieldCtx.stroke();
    }

    fieldCtx.beginPath();
    fieldCtx.arc(w / 2, h / 2, 44 + Math.sin(time * .003) * 5, 0, Math.PI * 2);
    fieldCtx.fillStyle = '#ffd36a';
    fieldCtx.shadowBlur = 35;
    fieldCtx.shadowColor = '#ff7a4c';
    fieldCtx.fill();
    fieldCtx.shadowBlur = 0;
    animationFrame = requestAnimationFrame(drawField);
  }

  function drawScope() {
    const w = scopeCanvas.width;
    const h = scopeCanvas.height;
    const a = Number(internal.value) / 100;
    const b = Number(cosmic.value) / 100;
    const n = Number(noise.value) / 50;
    scopeCtx.clearRect(0, 0, w, h);
    scopeCtx.fillStyle = '#050919';
    scopeCtx.fillRect(0, 0, w, h);
    scopeCtx.strokeStyle = '#17254b';
    scopeCtx.lineWidth = 1;
    for (let x = 0; x <= w; x += 75) { scopeCtx.beginPath(); scopeCtx.moveTo(x, 0); scopeCtx.lineTo(x, h); scopeCtx.stroke(); }
    for (let y = 0; y <= h; y += 60) { scopeCtx.beginPath(); scopeCtx.moveTo(0, y); scopeCtx.lineTo(w, y); scopeCtx.stroke(); }

    const traces = [
      { color: '#ffbd69', phase: 0, amplitude: 78 * a },
      { color: '#9a7cff', phase: Math.PI, amplitude: 78 * b }
    ];
    traces.forEach((trace, traceIndex) => {
      scopeCtx.beginPath();
      for (let x = 0; x < w; x += 2) {
        const wave = Math.sin(x * .035 + trace.phase + pulse);
        const disturbance = Math.sin(x * .41 + traceIndex) * n * 10;
        const y = h / 2 + wave * trace.amplitude + disturbance;
        if (x === 0) scopeCtx.moveTo(x, y); else scopeCtx.lineTo(x, y);
      }
      scopeCtx.strokeStyle = trace.color;
      scopeCtx.lineWidth = 3;
      scopeCtx.stroke();
    });
    const phaseBalance = Math.abs(a - b);
    $('phaseMetric').textContent = phaseBalance.toFixed(2);
    $('stabilityMetric').textContent = `${Math.max(0, Math.round((1 - phaseBalance - n * .4) * 100))}%`;
    $('disturbanceMetric').textContent = `${Math.round((n * .65 + phaseBalance * .35) * 100)}%`;
  }

  function updateOutputs() {
    $('internalOut').textContent = internal.value;
    $('cosmicOut').textContent = cosmic.value;
    $('noiseOut').textContent = noise.value;
    drawScope();
  }

  [internal, cosmic, noise].forEach((input) => input.addEventListener('input', updateOutputs));
  $('pulseBtn').addEventListener('click', () => { pulse += Math.PI / 3; drawScope(); });
  $('randomizeBtn').addEventListener('click', () => { cells.forEach((_, i) => { cells[i] = Math.random() > .67; }); renderGrid(); });
  $('clearBtn').addEventListener('click', () => { cells.fill(false); renderGrid(); });

  renderLayers();
  renderGrid();
  updateOutputs();
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(drawField);
})();