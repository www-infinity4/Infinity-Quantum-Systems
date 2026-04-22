/* ============================================================
   RESONANT OS — Main Library (window.ROS)
   Infinity Quantum Systems
   ============================================================ */

window.ROS = {
  codes:    [],
  elements: [],
  ready:    false,

  /* ── Initialise: load JSON data, fire ros:ready ─────────── */
  async init() {
    const base = this.getDataPath();
    try {
      const [codeRes, elemRes] = await Promise.all([
        fetch(base + 'universal-codes.json'),
        fetch(base + 'elements.json')
      ]);
      if (!codeRes.ok) throw new Error('Failed to load universal-codes.json');
      if (!elemRes.ok) throw new Error('Failed to load elements.json');

      const codeData = await codeRes.json();
      const elemData = await elemRes.json();

      // universal-codes.json has a wrapper object with a "codes" array
      this.codes    = Array.isArray(codeData) ? codeData : (codeData.codes || []);
      this.elements = Array.isArray(elemData) ? elemData : [];

      this.ready = true;
      document.dispatchEvent(new CustomEvent('ros:ready', { detail: { ros: this } }));
    } catch (err) {
      console.error('[ROS] init failed:', err);
    }
  },

  /* ── Resolve data/ directory relative to current page ───── */
  getDataPath() {
    const path = window.location.pathname;
    if (/\/(pages|tools|reference)\//.test(path)) return '../data/';
    return 'data/';
  },

  /* ── Code lookups ────────────────────────────────────────── */
  getCode(number) {
    const n = parseInt(number, 10);
    return this.codes.find(c => c.number === n) || null;
  },

  findCodes(query) {
    if (!query) return this.codes;
    const q = String(query).toLowerCase();
    return this.codes.filter(c =>
      String(c.number).includes(q) ||
      (c.label   && c.label.toLowerCase().includes(q)) ||
      (c.meaning && c.meaning.toLowerCase().includes(q))
    );
  },

  /* ── Element lookups ─────────────────────────────────────── */
  getElement(sym) {
    return this.elements.find(e =>
      e.symbol && e.symbol.toLowerCase() === String(sym).toLowerCase()
    ) || null;
  },

  getElementByZ(n) {
    const z = parseInt(n, 10);
    return this.elements.find(e => e.number === z) || null;
  },

  /* ── Counterpart: positive/negative pair ─────────────────── */
  getCounterpart(number) {
    const n = parseInt(number, 10);
    // Counterpart logic: codes come in pairs around a midpoint
    // Simple heuristic: find code whose number is (n % 2 === 0 ? n-1 : n+1)
    // and verify they are conceptually related
    const partner = n % 2 === 0 ? n - 1 : n + 1;
    return this.getCode(partner);
  },

  /* ── Resonance Ratio Calculation ────────────────────────── */
  calcResonanceRatio(elemA, elemB) {
    if (!elemA || !elemB) return null;

    const massA  = parseFloat(elemA.mass) || 1;
    const massB  = parseFloat(elemB.mass) || 1;
    const ratio  = massB / massA;
    const ratioStr = ratio.toFixed(4) + ' : 1';

    const snapVoltage       = parseFloat((Math.log(ratio + 1) * 4.2).toFixed(2));
    const activationFreqHz  = Math.round(elemA.number * elemB.number * 0.847);
    const harmonicOrder     = Math.round(ratio * 2) / 2;

    // Special pair detection
    const zA = elemA.number;
    const zB = elemB.number;
    let specialNote = null;

    const isPair = (a, b, x, y) => (a === x && b === y) || (a === y && b === x);

    if (isPair(zA, zB, 28, 47)) {
      specialNote = '152:1 Nickel-Silver Computer — the master ratio of the Resonant OS architecture. Nickel(28) drives Silver(47) as a resonance amplifier stack.';
    } else if (isPair(zA, zB, 46, 47)) {
      specialNote = 'SLR Weave Pair 1/2 — Palladium(46) and Silver(47) form the first weave layer of the SLR resonance braid.';
    } else if (isPair(zA, zB, 46, 29)) {
      specialNote = 'Triple Potential Stack middle layer — Palladium(46) with Copper(29) creates the mid-layer of the three-element potential stack.';
    } else if (isPair(zA, zB, 85, 83)) {
      specialNote = 'Mind Reader 84-83-85 antenna — Astatine(85) and Bismuth(83) bracket element 84 (Polonium), forming the three-element mind-reading antenna array.';
    } else if (isPair(zA, zB, 1, 2)) {
      specialNote = 'Core Well of Power pair — Hydrogen(1) and Helium(2) are the innermost fusion pair; the primordial resonance seed of all matter.';
    } else if (isPair(zA, zB, 47, 48)) {
      specialNote = 'SLR Weave Pair 2/3 — Silver(47) to Cadmium(48); second-layer SLR braid connection.';
    } else if (isPair(zA, zB, 8, 7)) {
      specialNote = 'Health Resonance Pair — Oxygen(8) to Nitrogen(7) is the 8-to-7 biological health ratio found in breathable air.';
    } else if (isPair(zA, zB, 13, 24)) {
      specialNote = 'Ruby Lens Pair — Aluminum(13) and Chromium(24) compose the ruby crystal lattice used as a frequency lens.';
    }

    // Interpretation
    const evenA  = this.evenOddRule(zA);
    const evenB  = this.evenOddRule(zB);
    let interpretation = `${elemA.symbol}(${zA}) is ${evenA.role.toLowerCase()} and ${elemB.symbol}(${zB}) is ${evenB.role.toLowerCase()}. `;

    if (evenA.parity === evenB.parity) {
      interpretation += `Both elements share ${evenA.parity} parity — this creates a stable resonance lock: the driver amplifies the driver, producing a compounding inertia wave. `;
    } else {
      interpretation += `Opposite parities create a push-pull resonance circuit — ${elemA.symbol} drives, ${elemB.symbol} reacts, producing an oscillating energy exchange. `;
    }
    interpretation += `Snap voltage ${snapVoltage}V represents the minimum potential needed to trigger resonance lock. `;
    interpretation += `Activation frequency ${this.formatHz(activationFreqHz)} is derived from the product of both atomic numbers.`;

    return {
      elemA, elemB,
      ratio, ratioStr,
      snapVoltage,
      activationFreqHz,
      harmonicOrder,
      specialNote,
      interpretation,
      parityA: evenA,
      parityB: evenB
    };
  },

  /* ── Even/Odd Parity Rule ────────────────────────────────── */
  evenOddRule(z) {
    const n        = parseInt(z, 10);
    const parity   = n % 2 === 0 ? 'even' : 'odd';
    const role     = parity === 'even' ? 'Inertia / Driver' : 'Receptive / Reactor';
    const color    = parity === 'even' ? 'cyan' : 'gold';
    const description = parity === 'even'
      ? `Z=${n} is EVEN: an inertia/driver element. Even elements hold stable shells and tend to anchor, buffer, or drive the system. They resist change and store energy. In a stack they act as the foundation that the odd elements react against.`
      : `Z=${n} is ODD: a receptive/reactor element. Odd elements have unpaired electrons and tend to react, bond, or channel energy. In a stack they act as the transducers that convert the driver's stored potential into active output.`;
    return { z: n, parity, role, color, description };
  },

  /* ── Code-to-Atomic Number Link ──────────────────────────── */
  codeToAtomicLink(codeNumber) {
    const n    = parseInt(codeNumber, 10);
    const elem = this.getElementByZ(n);

    if (elem) {
      return {
        atomicZ:     n,
        element:     elem,
        linkType:    'direct',
        explanation: `Code ${n} directly maps to ${elem.name} (${elem.symbol}), atomic number Z=${n}. The code's social/spiritual meaning resonates with the element's physical properties.`
      };
    }

    // Try modulo 118 (periodic table wraps)
    const modZ = n % 118;
    const modElem = this.getElementByZ(modZ);
    if (modElem && modZ > 0) {
      return {
        atomicZ:     modZ,
        element:     modElem,
        linkType:    'modulo',
        explanation: `Code ${n} maps via modulo-118 to Z=${modZ} (${modElem.name}, ${modElem.symbol}). Higher codes wrap around the periodic table like higher octaves of atomic resonance.`
      };
    }

    // Try resonance relationship: find element whose Z × some harmonic ≈ n
    for (const elem of this.elements) {
      for (const harmonic of [2, 3, 4, 5]) {
        if (elem.number * harmonic === n) {
          return {
            atomicZ:     elem.number,
            element:     elem,
            linkType:    'harmonic',
            explanation: `Code ${n} is the ${harmonic}× harmonic of ${elem.name} (${elem.symbol}, Z=${elem.number}). Harmonic codes amplify the base element's resonance field.`
          };
        }
      }
    }

    return {
      atomicZ:     null,
      element:     null,
      linkType:    'none',
      explanation: `Code ${n} has no direct atomic mapping. It operates as a pure social/intentional code without a corresponding element link.`
    };
  },

  /* ── Stack Interpretation ────────────────────────────────── */
  interpretStack(codeArray) {
    if (!codeArray || codeArray.length === 0) return 'No codes in stack.';

    const lines = [];
    lines.push('═══ STACK CHAIN OF COMMAND ═══\n');

    codeArray.forEach((num, idx) => {
      const code = this.getCode(num);
      const label   = code ? code.label   : `Unknown(${num})`;
      const meaning = code ? code.meaning : 'No data for this code.';

      lines.push(`[${idx + 1}] Code ${num} — ${label}`);
      lines.push(`    ${meaning}`);

      if (idx < codeArray.length - 1) {
        const nextNum  = codeArray[idx + 1];
        const nextCode = this.getCode(nextNum);
        const nextLabel = nextCode ? nextCode.label : `Code ${nextNum}`;
        lines.push(`    ↓ Commands: Code ${nextNum} (${nextLabel})`);
      }
      lines.push('');
    });

    // Combined summary
    lines.push('═══ COMBINED MEANING ═══');
    const labels = codeArray.map(n => {
      const c = this.getCode(n);
      return c ? c.label : `Code ${n}`;
    });
    lines.push(labels.join(' → '));

    return lines.join('\n');
  },

  /* ── Hull Layer Data ─────────────────────────────────────── */
  hullLayers: [
    {
      z: 1, sym: 'H', name: 'Hydrogen',
      layer: 'Core — Well of Power',
      role: 'Primary fuel; H nested inside He nested inside Li; Lithium-6 breeds tritium on demand',
      parity: 'odd',
      color: '#ff6b8a'
    },
    {
      z: 2, sym: 'He', name: 'Helium',
      layer: 'Core — Noble Buffer',
      role: 'Helium-3 resonance store; stable even shell wrapping H',
      parity: 'even',
      color: '#a78bfa'
    },
    {
      z: 3, sym: 'Li', name: 'Lithium',
      layer: 'Core — Tritium Breeder',
      role: 'Li-6 breeds tritium when struck by neutrons; infinite fuel loop',
      parity: 'odd',
      color: '#f97316'
    },
    {
      z: 4, sym: 'Be', name: 'Beryllium',
      layer: 'Structural Wall — Neutron Reflector',
      role: 'Bounces energy inward; rigid backbone; expanded Be cavity as dampened controller',
      parity: 'even',
      color: '#14b8a6'
    },
    {
      z: 5, sym: 'B', name: 'Boron',
      layer: 'Transceiver — Throttle',
      role: 'Neutron absorber; shift density/position to control power; zero moving parts',
      parity: 'odd',
      color: '#22c55e'
    },
    {
      z: 6, sym: 'C', name: 'Carbon',
      layer: 'Armor — Heat Shield',
      role: 'Graphene/composite; highest melting point; handles potential gradient from inner well',
      parity: 'even',
      color: '#6b7280'
    },
    {
      z: 7, sym: 'N', name: 'Nitrogen',
      layer: 'EM Field — Plasma Buffer',
      role: 'Odd/receptive EM layer; ionized by inner proton stream; no gas tank needed',
      parity: 'odd',
      color: '#3b82f6'
    },
    {
      z: 8, sym: 'O', name: 'Oxygen',
      layer: 'EM Field — Inertia Buffer',
      role: 'Even/inertia plasma layer; oxygen-nitrogen 8-to-7 health resonance',
      parity: 'even',
      color: '#06b6d4'
    },
    {
      z: 9, sym: 'F', name: 'Fluorine',
      layer: 'EM Skin — Force Field',
      role: 'Highest electronegativity; pulls stray particles into containment; electromagnetic skin',
      parity: 'odd',
      color: '#84cc16'
    },
    {
      z: 10, sym: 'Ne', name: 'Neon',
      layer: 'Outer Buffer — Final Seal',
      role: 'Noble gas; period-2 close; inert outer seal; complete reset layer',
      parity: 'even',
      color: '#f43f5e'
    }
  ],

  /* ── Render Helpers ──────────────────────────────────────── */
  renderCodeChip(number) {
    const code  = this.getCode(number);
    const label = code ? code.label : '—';
    return `<span class="stack-chip" data-code="${number}" title="${label}">
      <span class="stack-chip-num">${number}</span>
      <span class="stack-chip-label">${label.length > 18 ? label.substring(0,17)+'…' : label}</span>
      <button class="stack-chip-remove" data-code="${number}" aria-label="Remove">&times;</button>
    </span>`;
  },

  renderElementTile(element) {
    if (!element) return '';
    const parity  = element.number % 2 === 0 ? 'even' : 'odd';
    const group   = (element.group || '').toLowerCase().replace(/\s+/g, '-');
    const groupClass = group.includes('noble') ? 'el-group-noble'
      : group.includes('nonmetal')             ? 'el-group-nonmetal'
      : group.includes('halogen')              ? 'el-group-halogen'
      : group.includes('metalloid')            ? 'el-group-metalloid'
      : group.includes('transition')           ? 'el-group-transition'
      : group.includes('lanthanide')           ? 'el-group-lanthanide'
      : group.includes('actinide')             ? 'el-group-actinide'
      : 'el-group-metal';

    return `<div class="element-card el-parity-${parity} ${groupClass}" data-z="${element.number}" title="${element.name}: ${element.role || ''}">
      <span class="el-number">${element.number}</span>
      <span class="el-symbol">${element.symbol}</span>
      <span class="el-name">${element.name}</span>
      <span class="el-mass">${parseFloat(element.mass).toFixed(2)}</span>
    </div>`;
  },

  /* ── Format frequency with human-readable units ─────────── */
  formatHz(hz) {
    const n = parseInt(hz, 10);
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + ' GHz';
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(2)     + ' MHz';
    if (n >= 1_000)         return (n / 1_000).toFixed(2)         + ' kHz';
    return n + ' Hz';
  }
};

/* Auto-initialise when DOM is ready */
document.addEventListener('DOMContentLoaded', () => window.ROS.init());
