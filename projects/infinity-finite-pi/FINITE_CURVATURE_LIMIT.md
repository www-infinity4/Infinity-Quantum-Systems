# The Finite Curvature Limit (FCL)

## Formal role in Infinity Finite Pi

The Finite Curvature Limit is the formal physical-computation layer that grew from the original **Finite Pi** idea.

The paper defines FCL as a proposed system-specific boundary where idealized geometry, vibration, or coherent propagation stops matching measurable physical behavior because of damping, entropy, quantization, finite resolution, and scale-dependent constraints.

FCL does **not** redefine pi. Pi remains the exact mathematical constant used in ideal Euclidean geometry.

## Computational interpretation

For a modeled system `S`, define:

```text
FCL(S) = first scale, time, curvature, frequency, or error threshold
         where model residual exceeds the accepted tolerance
```

A practical calculation may use:

```text
residual(t) = |observed(t) - ideal(t)|
FCL_time = min t such that residual(t) > tolerance
```

or:

```text
coherence(t) = normalized phase agreement
FCL_time = min t such that coherence(t) < coherence_floor
```

For geometry:

```text
FCL_scale = min scale where measurement uncertainty >= feature size
```

For rendering or simulation:

```text
FCL_curvature = max curvature that remains numerically stable
                at the selected resolution and timestep
```

## Required inputs

- ideal model;
- observed or simulated values;
- system scale;
- sampling rate;
- damping estimate;
- coherence floor;
- measurement uncertainty;
- numerical precision;
- accepted error tolerance;
- cutoff method.

## Required outputs

- FCL value;
- dimension or unit;
- triggering sample;
- residual at cutoff;
- confidence or uncertainty;
- calculation provenance;
- comparison to ideal pi-based geometry;
- classification as simulated, observed, or experimental.

## Relationship to finite pi layers

Finite pi layers remain useful as controlled numerical approximations:

```text
pi_reference → ideal geometry
pi_finite    → selected computational precision
FCL          → physical or numerical validity boundary
```

A calculation may compare several pi representations, but the FCL is determined by system behavior or numerical tolerance—not by declaring one truncated pi value to be the true constant.

## Candidate FCL detectors

1. **Residual detector** — first tolerance crossing.
2. **Coherence detector** — first sustained phase loss.
3. **Damping detector** — amplitude drops below a selected ratio.
4. **Quantization detector** — feature becomes smaller than available resolution.
5. **Instability detector** — solver error or curvature grows without bound.
6. **Information detector** — additional precision no longer changes the meaningful output.

## Example: damped water wave

```text
ideal(t)    = A0 cos(omega t)
observed(t) = A0 exp(-gamma t) cos(omega t + phi)
```

One possible FCL is the first time where:

```text
|observed(t) - ideal(t)| > epsilon
```

The selected `epsilon`, instrument resolution, and sampling rate must be stored with the result.

## Example: circle measurement

Given measured circumference `C`, diameter `D`, and uncertainty `u`:

```text
pi_measured = C / D
residual = |pi_measured - pi_reference|
```

The FCL is the scale at which the uncertainty interval becomes too large to distinguish additional digits or curvature detail.

## Software integration

The Infinity engine should add:

```js
FinitePi.fcl.residual({ ideal, observed, tolerance })
FinitePi.fcl.coherence({ samples, floor, sustain })
FinitePi.fcl.resolution({ featureSize, uncertainty })
FinitePi.fcl.information({ results, meaningfulDelta })
```

Every detector must return a provenance record instead of only a number.

## Authorship

Original concept and authorship: **Kristopher Jacob Watson (Kris Watson)**.

The paper records that the original hypothesis was called **Finite Pi** and was refined into the more scientifically neutral term **Finite Curvature Limit** with AI assistance for language and structure.

## Status

Project hypothesis and computational framework. FCL is not currently an internationally recognized universal physical constant. A system-specific cutoff can nevertheless be defined, calculated, tested, and compared using established concepts such as coherence time, damping, numerical cutoffs, uncertainty, and measurement resolution.