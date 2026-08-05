# Infinity Finite Pi

## Purpose

Infinity Finite Pi is a numerical research engine for the Infinity Quantum System. It preserves intermediate calculation layers instead of reducing every result immediately to one floating-point answer.

The project began from three connected ideas:

1. **Finite pi:** use a bounded, present-layer value of pi rather than assuming every calculation must start with an infinitely extended decimal.
2. **Dynamic pi:** represent pi as a value that approaches the familiar constant as a time or precision layer expands.
3. **Pi-layer mapping:** use a modular phase function to expose repeating relationships.

Recovered core:

```text
Phi(x) = (137.036 * x) mod pi
```

The earlier implementation was deliberately described as **PI-Finite, No NumPy Needed**.

## Scientific distinction

In established mathematics, pi is a constant ratio of circumference to diameter in Euclidean geometry. Truncating pi changes numerical precision, not pi itself.

Infinity Finite Pi therefore distinguishes:

- `pi_reference`: conventional high-precision pi;
- `pi_finite`: a chosen finite representation;
- `pi_dynamic`: a project-defined convergence function;
- `pi_layer`: modular phase output;
- `observed_result`: measured or imported data;
- `symbolic_mapping`: Infinity-specific interpretation.

## Dynamic model

A safe default convergence model is:

```text
pi_dynamic(t, k) = 3 + (pi_reference - 3) * (1 - exp(-k * t))
```

where:

- `t = 0` gives 3;
- larger `t` approaches conventional pi;
- `k` controls convergence speed;
- freezing `t` gives a present-only finite layer.

This is a project calculation device, not a claim that physical pi changes with time.

## Finite layer model

A layer may be selected by decimal depth:

```text
pi_finite(d) = truncate(pi_reference, d)
```

or by rational approximation:

```text
22/7
333/106
355/113
```

Each result must carry its layer and error:

```json
{
  "value": 3.14159,
  "layer": 5,
  "method": "decimal-truncation",
  "absoluteError": 0.000002653589793,
  "relativeError": 8.45e-7
}
```

## Layer-preserving arithmetic

Unlike ordinary array libraries, the engine stores provenance with every value:

- source expression;
- precision layer;
- uncertainty;
- unit;
- coordinate or phase;
- symbolic code;
- parent operations;
- rounding policy;
- timestamp;
- claim classification.

An operation returns both the result and its ancestry.

## Proposed modules

### 1. Scalar

Layer-aware number with uncertainty and provenance.

### 2. Vector

Arrays of Scalars without external packages.

### 3. Matrix

Pure-JavaScript matrix addition, multiplication, transpose, determinant, and linear solving for small research datasets.

### 4. Pi Spiral

Maps a changing finite-pi layer onto radius, angle, time, and error.

### 5. Phi Layer

Computes:

```text
Phi(x, alpha, p) = positiveModulo(alpha * x, p)
```

with default `alpha = 137.036` and configurable finite or reference pi.

### 6. Equation Products

Turns an equation output into a reusable named product that can feed other Infinity modules:

```text
infinity_core
vector_starburst
gravity_well_mapper
music_field
signal_reader
```

### 7. Present Freeze

Captures one complete calculation state so the exact inputs, pi layer, precision, and graph can be reproduced later.

### 8. Comparison Bench

Runs the same equation through:

- conventional `Math.PI`;
- decimal-truncated pi;
- rational pi;
- dynamic pi;
- user-defined pi layer.

## Why this can extend beyond NumPy-style output

This is not initially a faster replacement for NumPy. NumPy is highly optimized for large numerical arrays. Infinity Finite Pi aims at a different strength:

- visible intermediate layers;
- symbolic and measured values kept separate;
- exact provenance;
- dynamic precision;
- reversible operation history;
- uncertainty propagation;
- geometric and phase visualizations;
- no installation requirement;
- browser and Android compatibility;
- exportable calculation records.

A later native implementation could add typed arrays, WebAssembly, GPU compute, sparse matrices, automatic differentiation, interval arithmetic, arbitrary precision, and distributed workloads.

## Mobile-first requirements

- Main calculation text at least 18 px.
- Results presented in stacked cards.
- Graph labels rendered as readable HTML where possible.
- No pinch zoom required.
- Copyable expression and result blocks.
- Offline operation.
- No third-party scripts.
- Export calculation as JSON.

## Initial API

```js
const x = FinitePi.scalar(12.5, {
  precision: 12,
  unit: "unitless",
  label: "input-x"
});

const p = FinitePi.pi.dynamic({ time: 11, rate: 0.7 });
const phase = FinitePi.phase(x, { alpha: 137.036, modulus: p });
```

## Evidence rules

Numerical output is not automatically physical evidence. Every result must be labeled as one of:

- established calculation;
- project transform;
- symbolic mapping;
- simulation output;
- observation;
- experimental result.

## Roadmap

1. Browser scalar/vector engine.
2. Pi-layer and time-spiral visualizer.
3. Matrix and signal operations.
4. Arbitrary-precision decimal backend.
5. Automatic differentiation.
6. Interval and uncertainty arithmetic.
7. WebAssembly acceleration.
8. Quantum-System module connectors.
9. Reproducible calculation notebooks.
10. Signed calculation packages.