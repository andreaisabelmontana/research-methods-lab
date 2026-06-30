import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mainEffectA, mainEffectB, interaction, effects } from '../src/factorial.js';

// Worked example 1 (course.html / index demo default): Factor A = Training
// (none/yes), Factor B = Experience (novice/expert). Cells:
//   A1B1 none·novice = 40, A1B2 none·expert = 60,
//   A2B1 yes·novice  = 55, A2B2 yes·expert  = 75.
// Expect main effect A = +15, main effect B = +20, interaction = 0 (parallel).
test('Training × Experience: A=+15, B=+20, interaction 0 (additive)', () => {
  assert.equal(mainEffectA(40, 60, 55, 75), 15);
  assert.equal(mainEffectB(40, 60, 55, 75), 20);
  assert.equal(interaction(40, 60, 55, 75), 0);
});

// Worked example 2 (course.html Caffeine × Sleep): cell means 70/74/50/66 in
// A1B1, A1B2, A2B1, A2B2 order. Interaction = (66−50)−(74−70) = +12 (crossed).
test('Caffeine × Sleep: interaction = +12 (non-additive)', () => {
  assert.equal(interaction(70, 74, 50, 66), 12);
  // equivalent diagonal form (a1b1 + a2b2) − (a1b2 + a2b1)
  assert.equal((70 + 66) - (74 + 50), 12);
});

// The two interaction formulas must agree for arbitrary cells.
test('interaction equals the diagonal-contrast form', () => {
  const cells = [12, 47, 3, 88];
  const [a, b, c, d] = cells;
  assert.equal(interaction(a, b, c, d), (a + d) - (b + c));
});

// effects() bundles the three scalars consistently.
test('effects() bundle matches the individual functions', () => {
  const e = effects(40, 60, 55, 75);
  assert.deepEqual(e, { a: 15, b: 20, ab: 0 });
});

// Finite-safe: NaN / undefined inputs coerce to 0, never NaN out.
test('non-finite inputs coerce to 0', () => {
  assert.equal(mainEffectA(NaN, undefined, 10, 10), 10);
  assert.ok(Number.isFinite(interaction(NaN, 1, 2, 3)));
});
