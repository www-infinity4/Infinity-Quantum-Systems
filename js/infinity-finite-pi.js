(() => {
  'use strict';

  const PI_REFERENCE = Math.PI;

  function assertFinite(value, name = 'value') {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new TypeError(`${name} must be finite`);
    return n;
  }

  function positiveModulo(value, modulus) {
    const m = Math.abs(assertFinite(modulus, 'modulus'));
    if (m === 0) throw new RangeError('modulus must not be zero');
    const v = assertFinite(value);
    return ((v % m) + m) % m;
  }

  function truncate(value, decimals = 0) {
    const d = Math.max(0, Math.min(15, Math.trunc(assertFinite(decimals, 'decimals'))));
    const factor = 10 ** d;
    return Math.trunc(assertFinite(value) * factor) / factor;
  }

  function makeRecord(value, meta = {}) {
    return Object.freeze({
      value: assertFinite(value),
      precision: Number.isInteger(meta.precision) ? meta.precision : 15,
      unit: meta.unit || 'unitless',
      label: meta.label || '',
      uncertainty: Math.max(0, Number(meta.uncertainty) || 0),
      classification: meta.classification || 'project-transform',
      method: meta.method || 'direct',
      parents: Array.isArray(meta.parents) ? meta.parents : [],
      timestamp: meta.timestamp || new Date().toISOString()
    });
  }

  function unwrap(v) {
    return typeof v === 'number' ? v : assertFinite(v?.value, 'record.value');
  }

  function propagate(a, b, value, method, uncertainty) {
    return makeRecord(value, {
      precision: Math.min(a.precision ?? 15, b.precision ?? 15),
      uncertainty,
      method,
      parents: [a, b]
    });
  }

  const scalar = (value, meta) => makeRecord(value, meta);

  const add = (a, b) => {
    const av = unwrap(a), bv = unwrap(b);
    return propagate(a, b, av + bv, 'add', (a.uncertainty || 0) + (b.uncertainty || 0));
  };

  const subtract = (a, b) => {
    const av = unwrap(a), bv = unwrap(b);
    return propagate(a, b, av - bv, 'subtract', (a.uncertainty || 0) + (b.uncertainty || 0));
  };

  const multiply = (a, b) => {
    const av = unwrap(a), bv = unwrap(b);
    const relA = av === 0 ? 0 : (a.uncertainty || 0) / Math.abs(av);
    const relB = bv === 0 ? 0 : (b.uncertainty || 0) / Math.abs(bv);
    const value = av * bv;
    return propagate(a, b, value, 'multiply', Math.abs(value) * (relA + relB));
  };

  const divide = (a, b) => {
    const av = unwrap(a), bv = unwrap(b);
    if (bv === 0) throw new RangeError('division by zero');
    const relA = av === 0 ? 0 : (a.uncertainty || 0) / Math.abs(av);
    const relB = (b.uncertainty || 0) / Math.abs(bv);
    const value = av / bv;
    return propagate(a, b, value, 'divide', Math.abs(value) * (relA + relB));
  };

  const pi = {
    reference() {
      return makeRecord(PI_REFERENCE, { method: 'Math.PI', classification: 'established-calculation' });
    },
    finite(decimals = 6) {
      const value = truncate(PI_REFERENCE, decimals);
      return makeRecord(value, {
        precision: decimals,
        uncertainty: Math.abs(PI_REFERENCE - value),
        method: 'decimal-truncation',
        classification: 'established-calculation'
      });
    },
    rational(numerator = 355, denominator = 113) {
      const n = assertFinite(numerator, 'numerator');
      const d = assertFinite(denominator, 'denominator');
      if (d === 0) throw new RangeError('denominator must not be zero');
      const value = n / d;
      return makeRecord(value, {
        uncertainty: Math.abs(PI_REFERENCE - value),
        method: `rational:${n}/${d}`,
        classification: 'established-calculation'
      });
    },
    dynamic({ time = 11, rate = 0.7, start = 3 } = {}) {
      const t = Math.max(0, assertFinite(time, 'time'));
      const k = Math.max(0, assertFinite(rate, 'rate'));
      const s = assertFinite(start, 'start');
      const value = s + (PI_REFERENCE - s) * (1 - Math.exp(-k * t));
      return makeRecord(value, {
        uncertainty: Math.abs(PI_REFERENCE - value),
        method: 'dynamic-convergence',
        classification: 'project-transform'
      });
    }
  };

  function phase(input, { alpha = 137.036, modulus = PI_REFERENCE } = {}) {
    const x = unwrap(input);
    const p = unwrap(modulus);
    const value = positiveModulo(assertFinite(alpha, 'alpha') * x, p);
    return makeRecord(value, {
      method: 'pi-layer-phase',
      precision: Math.min(input.precision ?? 15, modulus.precision ?? 15),
      parents: [input, modulus],
      classification: 'project-transform'
    });
  }

  function vector(values, meta = {}) {
    if (!Array.isArray(values)) throw new TypeError('vector values must be an array');
    return Object.freeze(values.map((value, index) =>
      typeof value === 'number' ? makeRecord(value, { ...meta, label: `${meta.label || 'v'}[${index}]` }) : value
    ));
  }

  function map(v, fn) {
    return Object.freeze(v.map((item, index) => fn(item, index)));
  }

  function dot(a, b) {
    if (a.length !== b.length) throw new RangeError('vectors must have equal length');
    return a.reduce((sum, item, i) => add(sum, multiply(item, b[i])), scalar(0));
  }

  function matrix(rows) {
    if (!Array.isArray(rows) || rows.length === 0) throw new TypeError('matrix requires rows');
    const width = rows[0].length;
    if (!width || rows.some(row => !Array.isArray(row) || row.length !== width)) {
      throw new RangeError('matrix rows must have equal nonzero length');
    }
    return Object.freeze(rows.map(row => vector(row)));
  }

  function matMul(a, b) {
    if (a[0].length !== b.length) throw new RangeError('matrix dimensions do not align');
    const bt = b[0].map((_, col) => b.map(row => row[col]));
    return matrix(a.map(row => bt.map(col => dot(row, col))));
  }

  function comparePi(x, options = {}) {
    const input = scalar(assertFinite(x, 'x'), { label: 'x' });
    const variants = [
      ['reference', pi.reference()],
      ['finite-3', pi.finite(3)],
      ['finite-6', pi.finite(6)],
      ['22/7', pi.rational(22, 7)],
      ['355/113', pi.rational(355, 113)],
      ['dynamic', pi.dynamic(options)]
    ];
    return variants.map(([name, modulus]) => ({ name, modulus, phase: phase(input, { modulus }) }));
  }

  function exportRecord(record) {
    return JSON.stringify(record, null, 2);
  }

  window.FinitePi = Object.freeze({
    PI_REFERENCE,
    scalar,
    add,
    subtract,
    multiply,
    divide,
    vector,
    map,
    dot,
    matrix,
    matMul,
    pi,
    phase,
    comparePi,
    positiveModulo,
    truncate,
    exportRecord
  });
})();