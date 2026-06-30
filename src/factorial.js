// ============================================================
// factorial.js — pure 2×2 factorial-design effect maths.
//
// Cell layout (rows = Factor A levels, cols = Factor B levels):
//
//             B1        B2
//        A1  a1b1      a1b2
//        A2  a2b1      a2b2
//
// Main effect of A = (mean of A2 cells) − (mean of A1 cells).
// Main effect of B = (mean of B2 cells) − (mean of B1 cells).
// Interaction = how much B's effect changes across A levels:
//   (a2b2 − a2b1) − (a1b2 − a1b1)   ≡   (a1b1 + a2b2) − (a1b2 + a2b1).
// Interaction ≈ 0  ⇒ additive ⇒ parallel lines on the interaction plot.
//
// Every function is pure and finite-safe (NaN inputs coerce to 0) so the
// same code backs both the live demo and the node:test harness.
// ============================================================

const num = (x) => (Number.isFinite(x) ? x : 0);

/** Main effect of Factor A: A2 cells minus A1 cells (averaged over B). */
export function mainEffectA(a1b1, a1b2, a2b1, a2b2) {
  return (num(a2b1) + num(a2b2)) / 2 - (num(a1b1) + num(a1b2)) / 2;
}

/** Main effect of Factor B: B2 cells minus B1 cells (averaged over A). */
export function mainEffectB(a1b1, a1b2, a2b1, a2b2) {
  return (num(a1b2) + num(a2b2)) / 2 - (num(a1b1) + num(a2b1)) / 2;
}

/** A×B interaction: how the effect of B differs between the two A levels. */
export function interaction(a1b1, a1b2, a2b1, a2b2) {
  return (num(a2b2) - num(a2b1)) - (num(a1b2) - num(a1b1));
}

/** Convenience bundle: all three effects from the four cell means. */
export function effects(a1b1, a1b2, a2b1, a2b2) {
  return {
    a: mainEffectA(a1b1, a1b2, a2b1, a2b2),
    b: mainEffectB(a1b1, a1b2, a2b1, a2b2),
    ab: interaction(a1b1, a1b2, a2b1, a2b2),
  };
}
