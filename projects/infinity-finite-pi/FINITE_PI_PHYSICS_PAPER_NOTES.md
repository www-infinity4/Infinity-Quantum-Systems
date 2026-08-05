# Finite Pi Physics Paper — Integration Notes

## Duplicate audit

The three uploaded files are byte-identical copies:

```text
Finite_Pi_Physics_Paper.pdf      SHA-256 75483eee125ed8b0…
Finite_Pi_Physics_Paper (1).pdf  SHA-256 75483eee125ed8b0…
Finite_Pi_Physics_Paper (2).pdf  SHA-256 75483eee125ed8b0…
```

Archive only one canonical copy.

## Original formulation

The paper’s title is:

**The Finite π: A Bounded Geometric Constant of Physical Reality**

It introduces `pi_f` as a proposed cutoff-curvature quantity for physical systems where coherence, vibration, or curvature stops propagating ideally because of damping, quantization, and medium-dependent limits.

The paper proposes:

```text
pi_f = pi * (1 - gamma / (2 * pi * f_c))
```

where:

- `gamma` is an amplitude-decay or damping constant;
- `f_c` is the carrier or driving frequency;
- `pi` is the conventional mathematical constant.

## Relationship to the later FCL paper

The later **Finite Curvature Limit** paper provides a more scientifically careful interpretation:

- mathematical pi is not redefined;
- the physical system has a finite cutoff or tolerance;
- the cutoff is system-dependent rather than automatically universal;
- the computation should report where an ideal model stops matching measured behavior.

Therefore the software should preserve both stages:

```text
Historical/original hypothesis: finite pi, pi_f
Refined formal layer: Finite Curvature Limit, FCL
```

The original equation should remain available as a named project transform, not silently deleted.

## Engine implementation

Add a function conceptually equivalent to:

```js
function finitePiFromDamping({ gamma, carrierFrequency }) {
  if (carrierFrequency <= 0) throw new RangeError('carrierFrequency must be positive');
  return Math.PI * (1 - gamma / (2 * Math.PI * carrierFrequency));
}
```

The output record must include:

- gamma;
- carrier frequency;
- units;
- equation version;
- uncertainty;
- source-paper identifier;
- whether the result is a project transform or measured FCL estimate.

## Hydrodynamic experiment module

The paper proposes comparing wave decay in water, oil, or another medium.

A safe software workflow is:

1. Import amplitude-versus-time samples.
2. Fit an exponential envelope:

```text
A(t) = A0 * exp(-gamma * t)
```

3. estimate gamma;
4. identify dominant carrier frequency;
5. calculate the original `pi_f` transform;
6. independently calculate an FCL threshold based on residual, coherence, or measurement uncertainty;
7. compare media without assuming convergence in advance;
8. export raw data, fit error, and confidence intervals.

## Falsification and refinement

The original paper predicts that values across different media may converge if the limit is universal. The software must allow that prediction to fail. It should report medium-specific results rather than forcing convergence.

A convincing result would require:

- calibrated timing;
- repeatable excitation;
- temperature control;
- known viscosity and density;
- sensor noise characterization;
- blind or automated cutoff selection;
- uncertainty estimates;
- independent replication.

## UI additions

The Infinity Finite Pi app should eventually show:

- `pi_reference`;
- finite decimal approximation;
- rational approximation;
- dynamic project layer;
- original damping-derived `pi_f`;
- measured Finite Curvature Limit;
- residual graph;
- coherence threshold;
- confidence interval;
- source-paper toggle.

## Classification

The damping equation is preserved as a **project hypothesis/project transform**. It is not an established replacement for pi or a demonstrated universal physical constant.