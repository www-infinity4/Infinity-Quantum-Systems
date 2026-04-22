/* ============================================================
   RESONANT OS — Code Interpreter
   tools/code-interpreter.html
   ============================================================ */

(function () {
  'use strict';

  /* ── State ───────────────────────────────────────────────── */
  let stack = [];  // array of code numbers

  /* ── DOM refs ────────────────────────────────────────────── */
  let codeInput, addBtn, stackChain, chainDisplay,
      interpretDisplay, codeNum, codeLabel, codeMeaning,
      codeCounterpart, refTableBody, searchInput,
      exportBtn, clearBtn, cancelBtn, copyBtn;

  /* ── Example stacks ─────────────────────────────────────── */
  const EXAMPLE_STACKS = [
    { label: '43→44 Anti-Meth+Cocaine',  codes: [43, 44] },
    { label: '53→16 God Alignment',       codes: [53, 16] },
    { label: '100→54→8 Full Life Save',   codes: [100, 54, 8] },
    { label: '73→82→85 Love/Brother/Mom', codes: [73, 82, 85] },
    { label: '28→47 Ni-Ag Computer',      codes: [28, 47] },
    { label: '72→73 Terror→Love',         codes: [72, 73] }
  ];

  /* ── Init on ros:ready ───────────────────────────────────── */
  document.addEventListener('ros:ready', () => {
    initDom();
    buildReferenceTable(window.ROS.codes);
    buildExampleButtons();
    attachEvents();
    renderAll();
  });

  function initDom() {
    codeInput        = document.getElementById('codeInput');
    addBtn           = document.getElementById('addBtn');
    stackChain       = document.getElementById('stackChain');
    chainDisplay     = document.getElementById('chainDisplay');
    interpretDisplay = document.getElementById('interpretDisplay');
    codeNum          = document.getElementById('lookupNum');
    codeLabel        = document.getElementById('lookupLabel');
    codeMeaning      = document.getElementById('lookupMeaning');
    codeCounterpart  = document.getElementById('lookupCounterpart');
    refTableBody     = document.getElementById('refTableBody');
    searchInput      = document.getElementById('refSearch');
    exportBtn        = document.getElementById('exportBtn');
    clearBtn         = document.getElementById('clearBtn');
    cancelBtn        = document.getElementById('cancelBtn');
    copyBtn          = document.getElementById('copyBtn');
  }

  /* ── Events ──────────────────────────────────────────────── */
  function attachEvents() {
    if (addBtn) addBtn.addEventListener('click', addCodeFromInput);
    if (codeInput) {
      codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addCodeFromInput();
      });
      codeInput.addEventListener('input', () => {
        const n = parseInt(codeInput.value, 10);
        if (!isNaN(n)) showLookup(n);
      });
    }
    if (clearBtn)  clearBtn.addEventListener('click',  clearStack);
    if (cancelBtn) cancelBtn.addEventListener('click', appendCancel);
    if (exportBtn) exportBtn.addEventListener('click', exportStack);
    if (copyBtn)   copyBtn.addEventListener('click',   copyStackText);
    if (searchInput) searchInput.addEventListener('input', () => {
      buildReferenceTable(window.ROS.findCodes(searchInput.value));
    });
    if (stackChain) {
      stackChain.addEventListener('click', (e) => {
        if (e.target.classList.contains('stack-chip-remove')) {
          const code = parseInt(e.target.dataset.code, 10);
          removeFromStack(code, e.target);
        }
      });
      stackChain.addEventListener('mouseover', (e) => {
        const chip = e.target.closest('.stack-chip');
        if (!chip) return;
        const code = parseInt(chip.dataset.code, 10);
        highlightCounterpart(code, true);
      });
      stackChain.addEventListener('mouseout', (e) => {
        const chip = e.target.closest('.stack-chip');
        if (!chip) return;
        const code = parseInt(chip.dataset.code, 10);
        highlightCounterpart(code, false);
      });
    }
  }

  /* ── Add code from input ─────────────────────────────────── */
  function addCodeFromInput() {
    if (!codeInput) return;
    const n = parseInt(codeInput.value, 10);
    if (isNaN(n) || n < 0) return;
    addToStack(n);
    codeInput.value = '';
    codeInput.focus();
  }

  function addToStack(n) {
    stack.push(n);
    appendChip(n);
    showLookup(n);
    renderChainAndInterpret();
  }

  function appendCancel() {
    addToStack(0);
  }

  function clearStack() {
    stack = [];
    if (stackChain) stackChain.innerHTML = '';
    renderChainAndInterpret();
    clearLookup();
  }

  function removeFromStack(code, btn) {
    // Remove first occurrence
    const idx = stack.indexOf(code);
    if (idx !== -1) stack.splice(idx, 1);
    // Remove chip from DOM
    const chip = btn ? btn.closest('.stack-chip') : null;
    if (chip) {
      chip.style.animation = 'none';
      chip.style.opacity = '0';
      chip.style.transform = 'scale(0.8)';
      chip.style.transition = 'all 0.2s ease';
      setTimeout(() => chip.remove(), 200);
    }
    renderChainAndInterpret();
  }

  /* ── Chip rendering ──────────────────────────────────────── */
  function appendChip(n) {
    if (!stackChain) return;
    const html = window.ROS.renderCodeChip(n);
    stackChain.insertAdjacentHTML('beforeend', html);
  }

  /* ── Counterpart highlight ───────────────────────────────── */
  function highlightCounterpart(code, on) {
    const counterpart = window.ROS.getCounterpart(code);
    if (!counterpart) return;
    const chips = stackChain ? stackChain.querySelectorAll('.stack-chip') : [];
    chips.forEach(chip => {
      const c = parseInt(chip.dataset.code, 10);
      if (c === counterpart.number) {
        chip.classList.toggle('counterpart-active', on);
      }
    });
  }

  /* ── Single code lookup panel ────────────────────────────── */
  function showLookup(n) {
    const code = window.ROS.getCode(n);
    if (!code) { clearLookup(); return; }

    if (codeNum)    codeNum.textContent    = code.number;
    if (codeLabel)  codeLabel.textContent  = code.label;
    if (codeMeaning) codeMeaning.textContent = code.meaning;

    if (codeCounterpart) {
      const cp = window.ROS.getCounterpart(n);
      codeCounterpart.textContent = cp
        ? `Code ${cp.number} — ${cp.label}`
        : '—';
    }
  }

  function clearLookup() {
    if (codeNum)       codeNum.textContent       = '—';
    if (codeLabel)     codeLabel.textContent     = '—';
    if (codeMeaning)   codeMeaning.textContent   = '—';
    if (codeCounterpart) codeCounterpart.textContent = '—';
  }

  /* ── Chain of command + interpretation ──────────────────── */
  function renderChainAndInterpret() {
    renderChain();
    renderInterpretation();
  }

  function renderChain() {
    if (!chainDisplay) return;
    if (stack.length === 0) {
      chainDisplay.innerHTML = '<p style="color:#475569;font-style:italic;padding:0.5rem 0;">Add codes to see the chain of command.</p>';
      return;
    }

    let html = '<ol class="chain-of-command">';
    stack.forEach((num, idx) => {
      const code     = window.ROS.getCode(num);
      const label    = code ? code.label   : `Unknown (${num})`;
      const meaning  = code ? code.meaning : 'No data.';
      const nextNum  = stack[idx + 1];
      const nextCode = nextNum !== undefined ? window.ROS.getCode(nextNum) : null;

      html += `<li class="coc-row" style="animation-delay:${idx * 0.05}s">
        <div class="flex items-center gap-2">
          <span class="coc-num">${num}</span>
          <span class="coc-label">${label}</span>
          ${num === 0 ? '<span class="tag badge-red">CANCEL</span>' : ''}
        </div>
        <div class="coc-meaning">${meaning}</div>
        ${nextCode ? `<div class="coc-soldier">↓ Commands: <strong style="color:#06b6d4;">${nextNum} — ${nextCode.label}</strong></div>` : ''}
      </li>`;
    });
    html += '</ol>';
    chainDisplay.innerHTML = html;
  }

  function renderInterpretation() {
    if (!interpretDisplay) return;
    if (stack.length === 0) {
      interpretDisplay.textContent = '';
      return;
    }
    const text = window.ROS.interpretStack(stack);
    interpretDisplay.textContent = text;
  }

  /* ── Build reference table ───────────────────────────────── */
  function buildReferenceTable(codes) {
    if (!refTableBody) return;
    refTableBody.innerHTML = '';
    codes.forEach(code => {
      const tr = document.createElement('tr');
      tr.className = 'list-row';
      tr.innerHTML = `
        <td class="td-num">${code.number}</td>
        <td style="font-weight:600;font-size:0.85rem;">${code.label}</td>
        <td style="font-size:0.8rem;color:#64748b;">${(code.meaning || '').substring(0, 70)}${(code.meaning || '').length > 70 ? '…' : ''}</td>
      `;
      tr.addEventListener('click', () => {
        addToStack(code.number);
        if (codeInput) codeInput.value = '';
      });
      refTableBody.appendChild(tr);
    });
  }

  /* ── Example preset buttons ──────────────────────────────── */
  function buildExampleButtons() {
    const container = document.getElementById('exampleBtns');
    if (!container) return;
    EXAMPLE_STACKS.forEach(preset => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.textContent = preset.label;
      btn.addEventListener('click', () => {
        clearStack();
        preset.codes.forEach(n => addToStack(n));
      });
      container.appendChild(btn);
    });
  }

  /* ── Export & Copy ───────────────────────────────────────── */
  function getStackText() {
    if (stack.length === 0) return 'Empty stack';
    const labels = stack.map(n => {
      const c = window.ROS.getCode(n);
      return c ? `${n}(${c.label})` : String(n);
    });
    return 'STACK: ' + labels.join(' → ');
  }

  function exportStack() {
    const text = window.ROS.interpretStack(stack);
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'ros-stack.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyStackText() {
    const text = getStackText();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => flashBtn(copyBtn, 'Copied!'));
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      flashBtn(copyBtn, 'Copied!');
    }
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

  /* ── Initial render ──────────────────────────────────────── */
  function renderAll() {
    renderChainAndInterpret();
  }

})();
