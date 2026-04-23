/* ============================================================
   RESONANT OS — Navigation & Footer Injector
   Infinity Quantum Systems
   ============================================================ */

const NAV_HTML = `
<nav class="site-nav" id="site-nav">
  <div class="nav-inner">
    <a href="INDEX_ROOT" class="nav-logo">
      <span class="logo-atom">⚛</span>
      RESONANT OS
      <span class="logo-sub">Infinity Quantum Systems</span>
    </a>

    <button class="nav-mobile-toggle" id="navToggle" aria-label="Toggle navigation">
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>

    <ul class="nav-links" id="navLinks">

      <!-- Learn Dropdown -->
      <li class="nav-item-dropdown" id="dd-learn">
        <button class="nav-btn" aria-haspopup="true" aria-expanded="false">
          Learn <span class="nav-chevron">▾</span>
        </button>
        <ul class="nav-dropdown" aria-label="Learn">
          <li><span class="nav-dropdown-label">Core Concepts</span></li>
          <li><a href="PAGES_ROOT/quantum-microphone.html">Quantum Microphone</a></li>
          <li><a href="PAGES_ROOT/geometric-resonance.html">Geometric Resonance</a></li>
          <li><a href="PAGES_ROOT/proportional-scaling.html">Proportional Scaling</a></li>
          <li><a href="PAGES_ROOT/transmutation.html">Transmutation</a></li>
          <li><a href="PAGES_ROOT/universal-code.html">Universal Code</a></li>
          <li><a href="PAGES_ROOT/static-programming.html">Static Programming</a></li>
          <li><a href="PAGES_ROOT/elemental-safety.html">Elemental Safety</a></li>
          <li><a href="PAGES_ROOT/earthen-growth.html">Earthen Growth</a></li>
          <li><a href="PAGES_ROOT/atomic-computer.html">Atomic Computer</a></li>
          <li><a href="PAGES_ROOT/nickel-silver-computer.html">Nickel-Silver Computer</a></li>
          <li><a href="PAGES_ROOT/hydrogen-stack-ruby.html">Hydrogen Stack Ruby</a></li>
        </ul>
      </li>

      <!-- Advanced Dropdown -->
      <li class="nav-item-dropdown" id="dd-advanced">
        <button class="nav-btn" aria-haspopup="true" aria-expanded="false">
          Advanced <span class="nav-chevron">▾</span>
        </button>
        <ul class="nav-dropdown" aria-label="Advanced">
          <li><span class="nav-dropdown-label">Advanced Systems</span></li>
          <li><a href="PAGES_ROOT/frequency-converter.html">Frequency Converter</a></li>
          <li><a href="PAGES_ROOT/nested-instruction.html">Nested Instruction</a></li>
          <li><a href="PAGES_ROOT/global-resonant-grid.html">Global Resonant Grid</a></li>
          <li><a href="PAGES_ROOT/spacecraft-hull.html">Spacecraft Hull</a></li>
          <li><a href="PAGES_ROOT/universe-hard-drive.html">Universe Hard Drive</a></li>
          <li><a href="PAGES_ROOT/b-plate-ai.html">B-Plate AI</a></li>
          <li><a href="PAGES_ROOT/jar-lab.html">Jar Lab</a></li>
        </ul>
      </li>

      <!-- Tools Dropdown -->
      <li class="nav-item-dropdown" id="dd-tools">
        <button class="nav-btn" aria-haspopup="true" aria-expanded="false">
          Tools <span class="nav-chevron">▾</span>
        </button>
        <ul class="nav-dropdown" aria-label="Tools">
          <li><span class="nav-dropdown-label">Interactive Tools</span></li>
          <li><span class="nav-dropdown-label">Calculators</span></li>
          <li><a href="TOOLS_ROOT/resonance-calculator.html">Resonance Calculator</a></li>
          <li><a href="TOOLS_ROOT/code-interpreter.html">Code Interpreter</a></li>
          <li><a href="TOOLS_ROOT/stack-visualizer.html">Stack Visualizer</a></li>
          <li><a href="TOOLS_ROOT/frequency-driver.html">Frequency Driver</a></li>
          <li><a href="TOOLS_ROOT/lensing-engine.html">Lensing Engine</a></li>
          <li><a href="TOOLS_ROOT/intent-programmer.html">Intent Programmer</a></li>
          <li><a href="TOOLS_ROOT/vein-mapper.html">Vein Mapper</a></li>
          <li><span class="nav-dropdown-label">3D Visualizers</span></li>
          <li><a href="TOOLS_ROOT/atomic-lattice-3d.html">⚛ Atomic Lattice 3D</a></li>
          <li><a href="TOOLS_ROOT/harmonic-wave-builder.html">〜 Harmonic Wave Builder</a></li>
          <li><a href="TOOLS_ROOT/phonon-vortex.html">🌀 Phonon Vortex</a></li>
          <li><a href="TOOLS_ROOT/gyroscopic-simulator.html">Gyroscopic Simulator</a></li>
          <li><a href="TOOLS_ROOT/resonance-computer.html">Resonance Computer</a></li>
        </ul>
      </li>

      <!-- Reference Dropdown -->
      <li class="nav-item-dropdown" id="dd-reference">
        <button class="nav-btn" aria-haspopup="true" aria-expanded="false">
          Reference <span class="nav-chevron">▾</span>
        </button>
        <ul class="nav-dropdown" aria-label="Reference">
          <li><span class="nav-dropdown-label">Reference Materials</span></li>
          <li><a href="REF_ROOT/code-dictionary.html">Code Dictionary</a></li>
          <li><a href="REF_ROOT/element-ratios.html">Element Ratios</a></li>
          <li><a href="REF_ROOT/protocols.html">Protocols</a></li>
        </ul>
      </li>

    </ul>
  </div>
</nav>
`;

const FOOTER_HTML = `
<footer class="site-footer" id="site-footer">
  <div class="footer-inner">
    <div class="footer-grid">
      <div class="footer-col">
        <h4>Core Concepts</h4>
        <ul>
          <li><a href="PAGES_ROOT/quantum-microphone.html">Quantum Microphone</a></li>
          <li><a href="PAGES_ROOT/geometric-resonance.html">Geometric Resonance</a></li>
          <li><a href="PAGES_ROOT/proportional-scaling.html">Proportional Scaling</a></li>
          <li><a href="PAGES_ROOT/transmutation.html">Transmutation</a></li>
          <li><a href="PAGES_ROOT/universal-code.html">Universal Code</a></li>
          <li><a href="PAGES_ROOT/static-programming.html">Static Programming</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Applied Systems</h4>
        <ul>
          <li><a href="PAGES_ROOT/elemental-safety.html">Elemental Safety</a></li>
          <li><a href="PAGES_ROOT/earthen-growth.html">Earthen Growth</a></li>
          <li><a href="PAGES_ROOT/atomic-computer.html">Atomic Computer</a></li>
          <li><a href="PAGES_ROOT/nickel-silver-computer.html">Nickel-Silver Computer</a></li>
          <li><a href="PAGES_ROOT/hydrogen-stack-ruby.html">Hydrogen Stack Ruby</a></li>
          <li><a href="PAGES_ROOT/spacecraft-hull.html">Spacecraft Hull</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Advanced</h4>
        <ul>
          <li><a href="PAGES_ROOT/frequency-converter.html">Frequency Converter</a></li>
          <li><a href="PAGES_ROOT/nested-instruction.html">Nested Instruction</a></li>
          <li><a href="PAGES_ROOT/global-resonant-grid.html">Global Resonant Grid</a></li>
          <li><a href="PAGES_ROOT/universe-hard-drive.html">Universe Hard Drive</a></li>
          <li><a href="PAGES_ROOT/b-plate-ai.html">B-Plate AI</a></li>
          <li><a href="PAGES_ROOT/jar-lab.html">Jar Lab</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Tools</h4>
        <ul>
          <li><a href="TOOLS_ROOT/resonance-calculator.html">Resonance Calculator</a></li>
          <li><a href="TOOLS_ROOT/code-interpreter.html">Code Interpreter</a></li>
          <li><a href="TOOLS_ROOT/stack-visualizer.html">Stack Visualizer</a></li>
          <li><a href="TOOLS_ROOT/frequency-driver.html">Frequency Driver</a></li>
          <li><a href="TOOLS_ROOT/lensing-engine.html">Lensing Engine</a></li>
          <li><a href="TOOLS_ROOT/intent-programmer.html">Intent Programmer</a></li>
          <li><a href="TOOLS_ROOT/vein-mapper.html">Vein Mapper</a></li>
          <li><a href="TOOLS_ROOT/resonance-computer.html">Resonance Computer</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>3D Visualizers</h4>
        <ul>
          <li><a href="TOOLS_ROOT/atomic-lattice-3d.html">⚛ Atomic Lattice 3D</a></li>
          <li><a href="TOOLS_ROOT/harmonic-wave-builder.html">〜 Harmonic Wave Builder</a></li>
          <li><a href="TOOLS_ROOT/phonon-vortex.html">🌀 Phonon Vortex</a></li>
          <li><a href="TOOLS_ROOT/gyroscopic-simulator.html">Gyroscopic Simulator</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Reference</h4>
        <ul>
          <li><a href="REF_ROOT/code-dictionary.html">Code Dictionary</a></li>
          <li><a href="REF_ROOT/element-ratios.html">Element Ratios</a></li>
          <li><a href="REF_ROOT/protocols.html">Protocols</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <p class="footer-tagline">
        Every atom is a frequency. Every intention is a <span>code</span>.
      </p>
      <p class="footer-copyright">&copy; 2024 Infinity Quantum Systems &mdash; Resonant OS</p>
      <p class="footer-disclaimer">
        Conceptual and educational platform. Information presented is theoretical and speculative in nature.
        Real experiments with radioactive materials, high-voltage systems, or controlled substances
        require qualified scientific oversight and appropriate legal authorization.
        Do not attempt physical replication without proper credentials and safety protocols.
      </p>
    </div>
  </div>
</footer>
`;

/**
 * Determine the path depth so we can prefix hrefs correctly.
 * Root index = depth 0 → no prefix needed
 * pages/, tools/, reference/ = depth 1 → prefix "../"
 */
function getPathPrefix() {
  const path = window.location.pathname;
  // Count meaningful directory segments (ignore trailing slash/filename)
  const parts = path.split('/').filter(p => p.length > 0 && !p.endsWith('.html'));
  // If we're inside a subdir (pages, tools, reference, etc.) return ../
  if (parts.length >= 1) {
    const lastDir = parts[parts.length - 1];
    const knownSubdirs = ['pages', 'tools', 'reference', 'css', 'js', 'data'];
    if (knownSubdirs.includes(lastDir)) return '../';
  }
  // If path contains a known subdir segment
  if (/\/(pages|tools|reference)\//.test(path)) return '../';
  return '';
}

/**
 * Inject nav and footer into the page, resolving href prefixes.
 */
function injectNav() {
  const prefix = getPathPrefix();

  // Replace placeholder tokens in both HTML strings
  const processHtml = (html) => html
    .replace(/INDEX_ROOT/g,  prefix + 'index.html')
    .replace(/PAGES_ROOT/g,  prefix + 'pages')
    .replace(/TOOLS_ROOT/g,  prefix + 'tools')
    .replace(/REF_ROOT/g,    prefix + 'reference');

  const processedNav    = processHtml(NAV_HTML);
  const processedFooter = processHtml(FOOTER_HTML);

  document.body.insertAdjacentHTML('afterbegin',  processedNav);
  document.body.insertAdjacentHTML('beforeend', processedFooter);

  // Mark the active link based on current page filename
  setActiveLink();

  // Wire up dropdowns
  initDropdowns();

  // Wire up mobile hamburger
  initMobileToggle();
}

/**
 * Set active class on nav links matching the current page.
 */
function setActiveLink() {
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.site-nav a[href]');
  navLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkFile = href.split('/').pop();
    if (linkFile && linkFile === currentFile) {
      link.classList.add('active');
    }
  });
}

/**
 * Dropdown show/hide on desktop hover; toggle on click for mobile.
 */
function initDropdowns() {
  const dropdownItems = document.querySelectorAll('.nav-item-dropdown');

  dropdownItems.forEach(item => {
    const btn     = item.querySelector('.nav-btn');
    const dropdown = item.querySelector('.nav-dropdown');
    if (!btn || !dropdown) return;

    let closeTimer = null;

    // Desktop: hover
    item.addEventListener('mouseenter', () => {
      clearTimeout(closeTimer);
      // Close all other dropdowns
      dropdownItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          const ob = other.querySelector('.nav-btn');
          if (ob) ob.setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    });

    item.addEventListener('mouseleave', () => {
      closeTimer = setTimeout(() => {
        item.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }, 120);
    });

    // Mobile / click toggle
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = item.classList.contains('open');
      // Close all
      dropdownItems.forEach(other => {
        other.classList.remove('open');
        const ob = other.querySelector('.nav-btn');
        if (ob) ob.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    dropdownItems.forEach(item => {
      item.classList.remove('open');
      const btn = item.querySelector('.nav-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  });

  // Prevent nav clicks from bubbling to document
  const nav = document.getElementById('site-nav');
  if (nav) {
    nav.addEventListener('click', (e) => e.stopPropagation());
  }
}

/**
 * Mobile hamburger: toggles nav-open class on nav links list.
 */
function initMobileToggle() {
  const toggle   = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navLinks.classList.contains('nav-open');
    navLinks.classList.toggle('nav-open', !isOpen);
    toggle.classList.toggle('active', !isOpen);
    toggle.setAttribute('aria-expanded', String(!isOpen));
  });

  // Close mobile nav when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('nav-open');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close when clicking outside
  document.addEventListener('click', () => {
    navLinks.classList.remove('nav-open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
  });
}

window.addEventListener('DOMContentLoaded', injectNav);
