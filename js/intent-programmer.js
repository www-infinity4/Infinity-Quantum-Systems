/* ============================================================
   RESONANT OS — Intent Programmer
   tools/intent-programmer.html
   ============================================================ */

(function () {
  'use strict';

  /* ── HTML escape helper ──────────────────────────────────── */
  function esc(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  /* ── Intent library ──────────────────────────────────────── */
  // Each category maps to codes and elements drawn from ROS data
  const INTENT_LIBRARY = [
    {
      id: 'health',
      label: '💚 Health',
      emoji: '💚',
      desc: 'Physical healing, body resonance, wellness field.',
      codes: [8, 100, 54],
      elements: [8, 7, 6],   // O, N, C  (8/7 health ratio)
      notes: 'Code 8 (Health) commands Code 100 below it. Oxygen (Z=8) / Nitrogen (Z=7) form the biological 8:7 health resonance ratio.'
    },
    {
      id: 'protection',
      label: '🛡 Protection',
      emoji: '🛡',
      desc: 'Shield, safety, containment of harmful influence.',
      codes: [6, 20, 84, 49],
      elements: [84, 49, 28],  // Po, In, Ni
      notes: 'Polonium (84) + Indium (49) create the radiation-control and field-containment shield. Nickel (28) as the driver base.'
    },
    {
      id: 'align',
      label: '✨ God Alignment',
      emoji: '✨',
      desc: 'Spiritual source alignment, divine resonance.',
      codes: [53, 16, 73],
      elements: [53, 16, 79],  // I, S, Au
      notes: 'Code 53 commands Code 16 (God). Gold (79) as output layer — highest atomic weight noble metal.'
    },
    {
      id: 'love',
      label: '❤️ Love / Family',
      emoji: '❤️',
      desc: 'Strengthen relational bonds, family protection.',
      codes: [73, 15, 3, 82],
      elements: [79, 47, 29],  // Au, Ag, Cu
      notes: 'Code 73 (Love) commands Code 15 (Family). Gold–Silver–Copper stack is the emotional conductor sequence.'
    },
    {
      id: 'power',
      label: '⚡ Power / Energy',
      emoji: '⚡',
      desc: 'Field generation, energy storage, power extraction.',
      codes: [46, 47, 48, 28],
      elements: [46, 47, 48, 49],  // Pd, Ag, Cd, In
      notes: 'SLR Weave 46–47–48–49 — the self-contained nuclear resonance quartet for field power extraction.'
    },
    {
      id: 'stress',
      label: '🌊 Stress Release',
      emoji: '🌊',
      desc: 'Calm nervous system, dissolve tension fields.',
      codes: [8, 7, 2, 100],
      elements: [8, 7, 2],    // O, N, He
      notes: 'Oxygen (8)–Nitrogen (7) health ratio combined with Helium (2) noble buffer. Creates a calm, stable resonance field.'
    },
    {
      id: 'antisubstance',
      label: '🚫 Anti-Substance',
      emoji: '🚫',
      desc: 'Counter addiction, clear chemical interference.',
      codes: [43, 44, 8, 0],
      elements: [4, 5, 3],   // Be, B, Li  (anti-static base)
      notes: 'Code 43 → 44 is the anti-meth/cocaine stack. Beryllium (4) holds the static charge; Boron (5) throttles; Lithium (3) is the breeder-base.'
    },
    {
      id: 'anticorrupt',
      label: '⚖️ Anti-Corruption',
      emoji: '⚖️',
      desc: 'Expose and dismantle corrupt systems and patterns.',
      codes: [19, 53, 10, 0],
      elements: [19, 53, 79],  // K, I, Au
      notes: 'Code 19 (Fighting Corruption) commanded by Code 53. Potassium (19), Iodine (53), Gold (79) — purification triad.'
    },
    {
      id: 'wealth',
      label: '💰 Wealth / Abundance',
      emoji: '💰',
      desc: 'Attract resources, financial field coherence.',
      codes: [5, 23, 79, 47],
      elements: [79, 47, 29],  // Au, Ag, Cu
      notes: 'Code 5 (Save Money) + 23 (Raising Up). Gold (79)–Silver (47)–Copper (29) monetary resonance stack.'
    },
    {
      id: 'focus',
      label: '🎯 Focus / Clarity',
      emoji: '🎯',
      desc: 'Mental coherence, concentration field, clarity lens.',
      codes: [13, 24, 20, 53],
      elements: [13, 24, 8],   // Al, Cr, O  (ruby lens)
      notes: 'Ruby lens pair: Aluminum (13) + Chromium (24) = Al₂O₃:Cr. Code 13 (Showing Skills) + 20 (Visual) stack.'
    },
    {
      id: 'envirofield',
      label: '🌐 Env. Firewall',
      emoji: '🌐',
      desc: 'Environmental resonance shield, anti-snooping.',
      codes: [84, 49, 17, 6],
      elements: [84, 49, 79],  // Po, In, Au
      notes: 'Polonium (84) + Indium (49) = hard outer field boundary. Topped with Gold (79) for signal masking.'
    },
    {
      id: 'meditation',
      label: '🧘 Meditation',
      emoji: '🧘',
      desc: 'Deep meditative state, inner resonance lock.',
      codes: [16, 53, 8, 1],
      elements: [1, 2, 3],     // H, He, Li  (core well)
      notes: 'Code 16 (God) commanded from above by 53 for full alignment. Core H–He–Li well as the inner foundation.'
    }
  ];

  /* ── State ───────────────────────────────────────────────── */
  let selectedIntent = null;
  let generatedStack = [];
  let generatedElements = [];

  /* ── DOM refs ────────────────────────────────────────────── */
  let intentGrid, intentDesc, intentStrength, intentBuild,
      intentStack, intentChain, intentElements, intentSequence,
      intentExport, intentCopy, intentClear;

  /* ── Init on ros:ready ───────────────────────────────────── */
  document.addEventListener('ros:ready', () => {
    initDom();
    buildIntentGrid();
    attachEvents();
  });

  function initDom() {
    intentGrid     = document.getElementById('intentGrid');
    intentDesc     = document.getElementById('intentDesc');
    intentStrength = document.getElementById('intentStrength');
    intentBuild    = document.getElementById('intentBuild');
    intentStack    = document.getElementById('intentStack');
    intentChain    = document.getElementById('intentChain');
    intentElements = document.getElementById('intentElements');
    intentSequence = document.getElementById('intentSequence');
    intentExport   = document.getElementById('intentExport');
    intentCopy     = document.getElementById('intentCopy');
    intentClear    = document.getElementById('intentClear');
  }

  /* ── Build intent category grid ──────────────────────────── */
  function buildIntentGrid() {
    if (!intentGrid) return;
    INTENT_LIBRARY.forEach(intent => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:0.75rem 0.5rem;text-align:center;line-height:1.4;';
      btn.innerHTML = `<span style="font-size:1.4rem;">${intent.emoji}</span><span style="font-size:0.8rem;margin-top:0.3rem;">${intent.label.replace(/^[^ ]+ /, '')}</span>`;
      btn.title = intent.desc;
      btn.dataset.id = intent.id;
      btn.addEventListener('click', () => selectIntent(intent, btn));
      intentGrid.appendChild(btn);
    });
  }

  function selectIntent(intent, btn) {
    // Deselect all
    intentGrid.querySelectorAll('.preset-btn').forEach(b => {
      b.style.borderColor = '';
      b.style.color = '';
      b.style.background = '';
    });
    // Select this one
    btn.style.borderColor = '#06b6d4';
    btn.style.color       = '#06b6d4';
    btn.style.background  = 'rgba(6,182,212,0.1)';
    selectedIntent = intent;
  }

  /* ── Events ──────────────────────────────────────────────── */
  function attachEvents() {
    if (intentBuild)  intentBuild.addEventListener('click', buildProgram);
    if (intentExport) intentExport.addEventListener('click', exportProgram);
    if (intentCopy)   intentCopy.addEventListener('click',   copyProgram);
    if (intentClear)  intentClear.addEventListener('click',  clearAll);
  }

  /* ── Build program ───────────────────────────────────────── */
  function buildProgram() {
    if (!selectedIntent) {
      flashMsg('⚠ Select an intent category first.', '#f59e0b');
      return;
    }

    const strength = parseInt(intentStrength ? intentStrength.value : '2', 10) || 2;
    const userNote = intentDesc ? intentDesc.value.trim() : '';

    // Build code stack with strength modulation
    let codes = [...selectedIntent.codes];
    if (strength >= 2 && !codes.includes(100)) {
      // Insert a "Full Life Save" / amplifier code
      codes = [100, ...codes];
    }
    if (strength >= 3) {
      // Add God alignment at top
      if (!codes.includes(16)) codes = [16, ...codes];
    }
    // Always end with Cancel (0) to close the sequence
    if (codes[codes.length - 1] !== 0) codes.push(0);

    generatedStack    = codes;
    generatedElements = selectedIntent.elements;

    renderStack();
    renderChain();
    renderElements();
    renderSequence(userNote);

    if (intentExport) intentExport.disabled = false;
    if (intentCopy)   intentCopy.disabled   = false;
  }

  /* ── Render stack chips ──────────────────────────────────── */
  function renderStack() {
    if (!intentStack) return;
    intentStack.innerHTML = generatedStack.map(n => window.ROS.renderCodeChip(n)).join('');
  }

  /* ── Render chain of command ─────────────────────────────── */
  function renderChain() {
    if (!intentChain) return;
    if (generatedStack.length === 0) { intentChain.innerHTML = ''; return; }

    let html = '<ol class="chain-of-command">';
    generatedStack.forEach((num, idx) => {
      const code    = window.ROS.getCode(num);
      const label   = code ? code.label   : `Unknown (${num})`;
      const meaning = code ? code.meaning : 'No data.';
      const nextNum  = generatedStack[idx + 1];
      const nextCode = nextNum !== undefined ? window.ROS.getCode(nextNum) : null;
      html += `<li class="coc-row" style="animation-delay:${idx * 0.06}s">
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <span class="coc-num">${esc(num)}</span>
          <span class="coc-label">${esc(label)}</span>
          ${num === 0 ? '<span class="tag badge-red">CANCEL / CLOSE</span>' : ''}
        </div>
        <div class="coc-meaning">${esc(meaning)}</div>
        ${nextCode ? `<div class="coc-soldier">↓ Commands: <strong style="color:#06b6d4;">${esc(nextNum)} — ${esc(nextCode.label)}</strong></div>` : ''}
      </li>`;
    });
    html += '</ol>';
    intentChain.innerHTML = html;
  }

  /* ── Render element assignments ──────────────────────────── */
  function renderElements() {
    if (!intentElements) return;
    if (generatedElements.length === 0) { intentElements.innerHTML = '<p style="color:#475569;font-style:italic;">No elements assigned.</p>'; return; }

    const ROLE_LABELS = ['Driver / Base', 'Amplifier / Mid', 'Output / Skin', 'Damper / Shield'];

    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.75rem;">';
    generatedElements.forEach((z, idx) => {
      const el = window.ROS.getElementByZ(z);
      if (!el) return;
      const parity = window.ROS.evenOddRule(z);
      html += `
        <div class="result-box" style="display:flex;flex-direction:column;gap:0.3rem;">
          ${window.ROS.renderElementTile(el)}
          <div style="font-size:0.72rem;color:var(--text-dim);margin-top:0.2rem;">${ROLE_LABELS[idx] || 'Support Layer'}</div>
          <span class="tag badge-${parity.parity === 'even' ? 'even' : 'odd'}" style="align-self:flex-start;">${parity.parity.toUpperCase()} · ${parity.role}</span>
        </div>
      `;
    });
    html += '</div>';
    intentElements.innerHTML = html;
  }

  /* ── Render activation sequence ─────────────────────────── */
  function renderSequence(userNote) {
    if (!intentSequence || !selectedIntent) return;

    const strength     = parseInt(intentStrength ? intentStrength.value : '2', 10) || 2;
    const strengthLabel = ['', 'Gentle', 'Standard', 'Strong'][strength] || 'Standard';
    const labels = generatedStack.map(n => {
      const c = window.ROS.getCode(n);
      return c ? esc(n) + '(' + esc(c.label) + ')' : esc(String(n));
    });

    intentSequence.innerHTML = `
      <div style="background:rgba(6,182,212,0.05);border:1px solid rgba(6,182,212,0.2);border-radius:8px;padding:1rem;font-family:var(--font-mono);font-size:0.82rem;line-height:1.8;">
        <div style="color:#06b6d4;font-weight:700;margin-bottom:0.5rem;">═══ INTENT PROGRAM ═══</div>
        <div><span style="color:#64748b;">Intent Category:</span> <span style="color:#e2e8f0;">${esc(selectedIntent.label)}</span></div>
        <div><span style="color:#64748b;">Strength:</span> <span style="color:#e2e8f0;">${esc(strengthLabel)}</span></div>
        ${userNote ? `<div><span style="color:#64748b;">Note:</span> <span style="color:#e2e8f0;">${esc(userNote)}</span></div>` : ''}
        <div style="margin-top:0.5rem;"><span style="color:#64748b;">Code Stack:</span> <span style="color:#f59e0b;">${labels.join(' → ')}</span></div>
        <div><span style="color:#64748b;">Elements (Z):</span> <span style="color:#10b981;">${generatedElements.map(z => esc(String(z))).join(' → ')}</span></div>
        <hr style="border-color:#1e2d4a;margin:0.6rem 0;">
        <div style="color:#94a3b8;">${esc(selectedIntent.notes)}</div>
        <hr style="border-color:#1e2d4a;margin:0.6rem 0;">
        <div style="color:#64748b;font-size:0.75rem;">
          ACTIVATION STEPS:<br>
          1. Hold intent clearly in mind: &ldquo;${esc(selectedIntent.desc)}&rdquo;<br>
          2. Arrange elements in stack order: ${generatedElements.map(z => { const e = window.ROS.getElementByZ(z); return e ? esc(e.symbol) : esc(String(z)); }).join(' → ')}<br>
          3. Invoke code stack from top down: ${labels.join(' → ')}<br>
          4. Seal sequence with Code 0 (Cancel / Close) at end.<br>
          5. Hold for ${esc(String(strength * 30))} seconds minimum.
        </div>
      </div>
    `;
  }

  /* ── Export / Copy / Clear ───────────────────────────────── */
  function getExportText() {
    if (!selectedIntent) return '';
    const labels = generatedStack.map(n => {
      const c = window.ROS.getCode(n);
      return c ? `${n}(${c.label})` : String(n);
    });
    const elems = generatedElements.map(z => {
      const e = window.ROS.getElementByZ(z);
      return e ? `${e.symbol}(Z=${z})` : String(z);
    });
    return [
      'RESONANT OS — INTENT PROGRAM',
      '==============================',
      `Category:   ${selectedIntent.label}`,
      `Desc:       ${selectedIntent.desc}`,
      `Code Stack: ${labels.join(' → ')}`,
      `Elements:   ${elems.join(' → ')}`,
      '',
      selectedIntent.notes,
      '',
      'ACTIVATION:',
      `1. Arrange: ${elems.join(' → ')}`,
      `2. Invoke stack: ${labels.join(' → ')}`,
      '3. Seal with Code 0.'
    ].join('\n');
  }

  function exportProgram() {
    const text = getExportText();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ros-intent-${selectedIntent ? selectedIntent.id : 'program'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyProgram() {
    const text = getExportText();
    if (!text) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => flashBtn(intentCopy, 'Copied!'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      flashBtn(intentCopy, 'Copied!');
    }
  }

  function clearAll() {
    selectedIntent = null;
    generatedStack = [];
    generatedElements = [];
    intentGrid.querySelectorAll('.preset-btn').forEach(b => {
      b.style.borderColor = ''; b.style.color = ''; b.style.background = '';
    });
    if (intentStack)    intentStack.innerHTML    = '';
    if (intentChain)    intentChain.innerHTML    = '';
    if (intentElements) intentElements.innerHTML = '';
    if (intentSequence) intentSequence.innerHTML = '<span style="color:var(--text-muted);font-style:italic;">Build a program first.</span>';
    if (intentExport)   intentExport.disabled    = true;
    if (intentCopy)     intentCopy.disabled      = true;
    if (intentDesc)     intentDesc.value         = '';
  }

  function flashBtn(btn, msg) {
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = msg;
    btn.style.borderColor = '#10b981';
    btn.style.color = '#10b981';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 1500);
  }

  function flashMsg(msg, color) {
    if (!intentSequence) return;
    const prev = intentSequence.innerHTML;
    intentSequence.innerHTML = `<span style="color:${color};font-weight:600;">${msg}</span>`;
    setTimeout(() => { intentSequence.innerHTML = prev; }, 2000);
  }

})();
