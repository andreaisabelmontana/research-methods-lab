// ============================================================
// research-methods-lab — 10 visual demos for "Learning to Observe,
// Experiment & Survey" (IE BCSAI): sampling, margin of error,
// correlation, confounding & randomization, Simpson's paradox,
// two-group experiments, type I/II error, p-hacking, survey bias,
// reliability vs validity.
//
// Every demo follows the *-lab pattern: read controls through helpers
// that always return finite values, compute into a buffer, render in a
// single idempotent draw() that resets the transform and clears first,
// wrapped against degenerate input. A resize listener re-runs draw().
// ============================================================

import { mainEffectA, mainEffectB, interaction } from './factorial.js';

// ---------- helpers ------------------------------------------------------
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function n(id, fallback) {
  const el = document.getElementById(id);
  const v = el ? +el.value : NaN;
  return Number.isFinite(v) ? v : fallback;
}
const $ = id => document.getElementById(id);
const setText = (id, t) => { const el = $(id); if (el) el.textContent = t; };

// ---------- palette ------------------------------------------------------
const ACCENT = '#4338CA';
const ACCENT_S = 'rgba(67,56,202,0.16)';
const RULE  = '#E5E5EA';
const RULE_H = '#CDCDD4';
const INK   = '#15151A';
const INK_S = '#4B4B55';
const MUTED = '#8A8A92';
const GOOD  = '#16A34A';
const WARN  = '#F59E0B';
const BAD   = '#DC2626';

function fitCanvas(cv) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = cv.getBoundingClientRect();
  const cssW = Math.max(80, rect.width);
  const cssH = Math.max(80, parseInt(cv.getAttribute('height'), 10) || 280);
  cv.width  = Math.floor(cssW * dpr);
  cv.height = Math.floor(cssH * dpr);
  cv.style.height = cssH + 'px';
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = '12px Inter, sans-serif';
  ctx.textBaseline = 'alphabetic';
  return { ctx, w: cssW, h: cssH };
}
function ptr(cv, ev) {
  const r = cv.getBoundingClientRect();
  return { x: ev.clientX - r.left, y: ev.clientY - r.top };
}
// shared maths utilities, all guarded against NaN / divide-by-zero
const randn = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
function normCdf(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}
const normPdf = x => 0.3989423 * Math.exp(-x * x / 2);
const Z = { '90': 1.645, '95': 1.96, '99': 2.576 };

// ============================================================
// 1. POPULATION, SAMPLE & SAMPLING ERROR
// ============================================================
(function sampling() {
  const cv = $('cv-sample'); if (!cv) return;
  let pop = [], sampleIdx = new Set();
  function buildPop() {
    pop = [];
    const p = clamp(n('s-p', 50) / 100, 0.01, 0.99);
    for (let i = 0; i < 300; i++) {
      pop.push({ x: Math.random(), y: Math.random(), s: Math.random() < p });
    }
  }
  function resample() {
    const N = clamp(Math.round(n('s-n', 40)), 1, pop.length);
    const biased = $('s-bias').checked;
    const order = pop.map((d, i) => ({ i, w: biased ? (1 - d.x) * (1 - d.y) + 0.05 : Math.random() }));
    order.sort((a, b) => (biased ? b.w - a.w + (Math.random() - 0.5) * 0.1 : a.w - b.w));
    sampleIdx = new Set(order.slice(0, N).map(o => o.i));
  }
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    if (pop.length === 0) buildPop();
    const p = clamp(n('s-p', 50) / 100, 0.01, 0.99);
    setText('s-pv', p.toFixed(2));
    setText('s-nv', Math.round(n('s-n', 40)));
    const N = clamp(Math.round(n('s-n', 40)), 1, pop.length);
    if (sampleIdx.size === 0) resample();

    const pad = 14, fw = w - pad * 2, fh = h - 40;
    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    ctx.strokeRect(pad, pad, fw, fh);
    pop.forEach((d, i) => {
      const cx = pad + d.x * fw, cy = pad + d.y * fh;
      const inS = sampleIdx.has(i);
      ctx.beginPath(); ctx.arc(cx, cy, inS ? 4.5 : 2.6, 0, Math.PI * 2);
      ctx.fillStyle = d.s ? (inS ? ACCENT : 'rgba(67,56,202,0.28)') : (inS ? INK : 'rgba(138,138,146,0.30)');
      ctx.fill();
      if (inS) { ctx.lineWidth = 1.4; ctx.strokeStyle = '#fff'; ctx.stroke(); }
    });

    let succ = 0;
    sampleIdx.forEach(i => { if (pop[i].s) succ++; });
    const phat = N > 0 ? succ / N : 0;
    const err = phat - p;
    const se = Math.sqrt(Math.max(0, phat * (1 - phat) / Math.max(1, N)));
    setText('s-phat', phat.toFixed(3));
    setText('s-err', (err >= 0 ? '+' : '') + err.toFixed(3));
    setText('s-se', se.toFixed(3));
    $('s-err').style.color = Math.abs(err) < 0.05 ? GOOD : Math.abs(err) < 0.12 ? WARN : BAD;

    ctx.fillStyle = MUTED; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('filled = in sample · indigo = success', pad, h - 8);
    ctx.textAlign = 'right';
    ctx.fillStyle = INK_S;
    ctx.fillText(`n = ${N}`, w - pad, h - 8);
    ctx.textAlign = 'left';
  }
  $('s-draw').addEventListener('click', () => { resample(); draw(); });
  $('s-n').addEventListener('input', () => { resample(); draw(); });
  $('s-p').addEventListener('input', () => { buildPop(); resample(); draw(); });
  $('s-bias').addEventListener('change', () => { resample(); draw(); });
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 2. SAMPLE SIZE vs MARGIN OF ERROR
// ============================================================
(function marginOfError() {
  const cv = $('cv-moe'); if (!cv) return;
  function E(nn, phat, z) {
    nn = Math.max(1, nn);
    return z * Math.sqrt(Math.max(0, phat * (1 - phat) / nn));
  }
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    const nn = clamp(Math.round(n('m-n', 600)), 1, 5000);
    const phat = clamp(n('m-p', 50) / 100, 0.01, 0.99);
    const z = Z[$('m-c').value] || 1.96;
    setText('m-nv', nn); setText('m-pv', phat.toFixed(2));
    setText('m-z', z.toFixed(3));
    const e = E(nn, phat, z);
    setText('m-e', '±' + (e * 100).toFixed(2) + '%');
    const lo = clamp(phat - e, 0, 1), hi = clamp(phat + e, 0, 1);
    setText('m-ci', `[${(lo * 100).toFixed(1)}, ${(hi * 100).toFixed(1)}]%`);

    const padL = 44, padR = 16, padT = 16, padB = 30;
    const gw = w - padL - padR, gh = h - padT - padB;
    const nMax = 3000, eMax = E(20, 0.5, 2.576);
    const X = v => padL + (v / nMax) * gw;
    const Y = v => padT + (1 - v / eMax) * gh;
    // axes
    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + gh); ctx.lineTo(padL + gw, padT + gh); ctx.stroke();
    ctx.fillStyle = MUTED; ctx.font = '10px JetBrains Mono, monospace'; ctx.textAlign = 'right';
    for (let f = 0; f <= 4; f++) {
      const ev = eMax * f / 4, y = Y(ev);
      ctx.fillText((ev * 100).toFixed(0) + '%', padL - 5, y + 3);
      ctx.strokeStyle = RULE; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + gw, y); ctx.stroke();
    }
    ctx.textAlign = 'center';
    for (let f = 0; f <= 3; f++) { const nv = nMax * f / 3; ctx.fillText(nv.toFixed(0), X(nv), padT + gh + 14); }
    // curve
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 2; ctx.beginPath();
    let first = true;
    for (let nv = 20; nv <= nMax; nv += 10) {
      const y = Y(E(nv, phat, z));
      if (first) { ctx.moveTo(X(nv), y); first = false; } else ctx.lineTo(X(nv), y);
    }
    ctx.stroke();
    // marker at current n
    const mx = X(clamp(nn, 0, nMax)), my = Y(clamp(e, 0, eMax));
    ctx.strokeStyle = RULE_H; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(mx, padT + gh); ctx.lineTo(mx, my); ctx.lineTo(padL, my); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2); ctx.fillStyle = ACCENT; ctx.fill();
    ctx.fillStyle = INK_S; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('margin of error E', padL + 4, padT + 10);
    ctx.textAlign = 'center'; ctx.fillStyle = MUTED;
    ctx.fillText('sample size n', padL + gw / 2, h - 4);
    ctx.textAlign = 'left';
  }
  ['m-n', 'm-p'].forEach(id => $(id).addEventListener('input', draw));
  $('m-c').addEventListener('change', draw);
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 3. CORRELATION & SCATTERPLOTS
// ============================================================
(function correlation() {
  const cv = $('cv-corr'); if (!cv) return;
  let pts = [];
  function resample() {
    const target = clamp(n('c-r', 70) / 100, -0.999, 0.999);
    const N = clamp(Math.round(n('c-n', 60)), 2, 400);
    const b = target / Math.sqrt(Math.max(1e-6, 1 - target * target));
    pts = [];
    for (let i = 0; i < N; i++) {
      const x = randn();
      const y = b * x + randn();
      pts.push({ x, y });
    }
  }
  function stats() {
    const N = pts.length;
    if (N < 2) return { r: 0, slope: 0, mx: 0, my: 0, sx: 1, sy: 1 };
    let mx = 0, my = 0;
    pts.forEach(p => { mx += p.x; my += p.y; });
    mx /= N; my /= N;
    let sxx = 0, syy = 0, sxy = 0;
    pts.forEach(p => { sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; sxy += (p.x - mx) * (p.y - my); });
    const r = (sxx > 0 && syy > 0) ? sxy / Math.sqrt(sxx * syy) : 0;
    const slope = sxx > 0 ? sxy / sxx : 0;
    return { r, slope, mx, my, sx: Math.sqrt(sxx / N) || 1, sy: Math.sqrt(syy / N) || 1 };
  }
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    setText('c-rv', (clamp(n('c-r', 70) / 100, -1, 1)).toFixed(2));
    setText('c-nv', Math.round(n('c-n', 60)));
    if (pts.length === 0) resample();
    const st = stats();
    const pad = 24;
    const lim = 3.2;
    const X = v => pad + (v + lim) / (2 * lim) * (w - 2 * pad);
    const Y = v => (h - pad) - (v + lim) / (2 * lim) * (h - 2 * pad);
    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(0), pad); ctx.lineTo(X(0), h - pad); ctx.moveTo(pad, Y(0)); ctx.lineTo(w - pad, Y(0)); ctx.stroke();
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(67,56,202,0.55)'; ctx.fill();
    });
    // regression line through means
    const x1 = -lim, x2 = lim;
    const y1 = st.my + st.slope * (x1 - st.mx), y2 = st.my + st.slope * (x2 - st.mx);
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X(x1), Y(clamp(y1, -lim, lim))); ctx.lineTo(X(x2), Y(clamp(y2, -lim, lim))); ctx.stroke();

    setText('c-r2', st.r.toFixed(3));
    setText('c-rsq', (st.r * st.r).toFixed(3));
    setText('c-slope', st.slope.toFixed(3));
    $('c-r2').style.color = Math.abs(st.r) > 0.66 ? GOOD : Math.abs(st.r) > 0.33 ? WARN : MUTED;
  }
  $('c-draw').addEventListener('click', () => { resample(); draw(); });
  $('c-r').addEventListener('input', () => { resample(); draw(); });
  $('c-n').addEventListener('input', () => { resample(); draw(); });
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 4. CONFOUNDING & RANDOMIZATION
// ============================================================
(function confounding() {
  const cv = $('cv-confound'); if (!cv) return;
  let units = [];
  function resample() {
    const conf = clamp(n('f-c', 70) / 100, 0, 1);
    const eff = n('f-e', 0) / 100;
    const rand = $('f-rand').checked;
    units = [];
    for (let i = 0; i < 80; i++) {
      const z = Math.random();                       // confounder in [0,1]
      let treated;
      if (rand) treated = Math.random() < 0.5;       // randomization breaks Z->T
      else treated = Math.random() < clamp(0.15 + conf * z, 0, 1);
      const base = 0.5 + conf * (z - 0.5);           // Z drives outcome
      const outcome = clamp(base + (treated ? eff : 0) + randn() * 0.08, 0, 1);
      units.push({ z, treated, outcome });
    }
  }
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    const conf = clamp(n('f-c', 70) / 100, 0, 1);
    const eff = n('f-e', 0) / 100;
    setText('f-cv', conf.toFixed(1));
    setText('f-ev', (eff >= 0 ? '+' : '') + (eff * 100).toFixed(0) + '%');
    if (units.length === 0) resample();

    const pad = 30, gw = w - pad * 2, gh = h - pad * 2;
    // x = confounder z, y = outcome; color by group
    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    ctx.strokeRect(pad, pad, gw, gh);
    let tSum = 0, tN = 0, cSum = 0, cN = 0;
    units.forEach(u => {
      const cx = pad + u.z * gw, cy = pad + (1 - u.outcome) * gh;
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = u.treated ? ACCENT : 'rgba(138,138,146,0.7)'; ctx.fill();
      if (u.treated) { tSum += u.outcome; tN++; } else { cSum += u.outcome; cN++; }
    });
    const tMean = tN ? tSum / tN : 0, cMean = cN ? cSum / cN : 0;
    const naive = tMean - cMean;
    // mean lines
    [['T', tMean, ACCENT], ['C', cMean, INK_S]].forEach(([lab, m, col]) => {
      const y = pad + (1 - m) * gh;
      ctx.strokeStyle = col; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad + gw, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = col; ctx.font = '600 11px JetBrains Mono, monospace'; ctx.textAlign = 'left';
      ctx.fillText(lab, pad + gw + 2 > w ? pad + 2 : pad + 4, y - 3);
    });
    ctx.fillStyle = MUTED; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('confounder Z  →', w / 2, h - 8);
    ctx.save(); ctx.translate(12, h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('outcome', 0, 0); ctx.restore();
    ctx.textAlign = 'left';

    setText('f-naive', (naive >= 0 ? '+' : '') + (naive * 100).toFixed(1) + '%');
    setText('f-true', (eff >= 0 ? '+' : '') + (eff * 100).toFixed(0) + '%');
    const off = Math.abs(naive - eff);
    $('f-naive').style.color = off < 0.05 ? GOOD : off < 0.12 ? WARN : BAD;
  }
  $('f-draw').addEventListener('click', () => { resample(); draw(); });
  ['f-e', 'f-c'].forEach(id => $(id).addEventListener('input', () => { resample(); draw(); }));
  $('f-rand').addEventListener('change', () => { resample(); draw(); });
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 5. SIMPSON'S PARADOX
// ============================================================
(function simpson() {
  const cv = $('cv-simpson'); if (!cv) return;
  function groups() {
    const sep = clamp(n('p-s', 60) / 100, 0, 1);
    // each group has a positive within slope, but group centers go up-left to down-right
    const within = 0.8;
    const A = [], B = [];
    for (let i = 0; i < 30; i++) {
      const t = i / 29;
      const ax = 0.05 + t * 0.4;
      const ay = 0.30 + within * (t - 0.5) * 0.4 + sep * 0.32;
      A.push({ x: ax, y: clamp(ay, 0.02, 0.98) });
      const bx = 0.55 + t * 0.4;
      const by = 0.30 + within * (t - 0.5) * 0.4 - sep * 0.32 + sep * 0.0;
      B.push({ x: bx, y: clamp(by + sep * 0.0, 0.02, 0.98) });
    }
    return { A, B };
  }
  function slope(arr) {
    const N = arr.length; if (N < 2) return 0;
    let mx = 0, my = 0; arr.forEach(p => { mx += p.x; my += p.y; }); mx /= N; my /= N;
    let sxx = 0, sxy = 0; arr.forEach(p => { sxx += (p.x - mx) ** 2; sxy += (p.x - mx) * (p.y - my); });
    return sxx > 0 ? sxy / sxx : 0;
  }
  function line(ctx, arr, col, X, Y) {
    const N = arr.length; if (N < 2) return;
    let mx = 0, my = 0; arr.forEach(p => { mx += p.x; my += p.y; }); mx /= N; my /= N;
    const s = slope(arr);
    const xs = arr.map(p => p.x), x1 = Math.min(...xs), x2 = Math.max(...xs);
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X(x1), Y(my + s * (x1 - mx))); ctx.lineTo(X(x2), Y(my + s * (x2 - mx))); ctx.stroke();
  }
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    setText('p-sv', Math.round(n('p-s', 60)));
    const { A, B } = groups();
    const split = $('p-split').checked;
    const pad = 22, gw = w - pad * 2, gh = h - pad * 2;
    const X = v => pad + v * gw, Y = v => pad + (1 - v) * gh;
    ctx.strokeStyle = RULE; ctx.strokeRect(pad, pad, gw, gh);
    const drawPts = (arr, col) => arr.forEach(p => { ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 3.5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); });
    drawPts(A, split ? ACCENT : 'rgba(67,56,202,0.55)');
    drawPts(B, split ? WARN : 'rgba(67,56,202,0.55)');
    if (split) { line(ctx, A, ACCENT, X, Y); line(ctx, B, WARN, X, Y); }
    const pooled = A.concat(B);
    line(ctx, pooled, split ? RULE_H : BAD, X, Y);

    const sa = slope(A), sb = slope(B), sp = slope(pooled);
    setText('p-a', (sa >= 0 ? '+' : '') + sa.toFixed(2));
    setText('p-b', (sb >= 0 ? '+' : '') + sb.toFixed(2));
    setText('p-pool', (sp >= 0 ? '+' : '') + sp.toFixed(2));
    const reversal = (sa > 0 && sb > 0 && sp < 0) || (sa < 0 && sb < 0 && sp > 0);
    $('p-pool').style.color = reversal ? BAD : INK_S;
    ctx.fillStyle = MUTED; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(reversal ? 'paradox: pooled trend reversed!' : 'pooled trend agrees with groups', pad + 2, pad - 6 < 12 ? pad + 12 : pad - 6);
  }
  $('p-s').addEventListener('input', draw);
  $('p-split').addEventListener('change', draw);
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 6. TWO-GROUP EXPERIMENT & EFFECT SIZE
// ============================================================
(function abtest() {
  const cv = $('cv-ab'); if (!cv) return;
  let C = [], T = [];
  function resample() {
    const diff = n('a-d', 6) / 10;
    const sd = Math.max(0.05, n('a-s', 10) / 10);
    const N = clamp(Math.round(n('a-n', 30)), 2, 400);
    C = []; T = [];
    for (let i = 0; i < N; i++) { C.push(0 + randn() * sd); T.push(diff + randn() * sd); }
  }
  function mean(a) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0; }
  function variance(a, m) { return a.length > 1 ? a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1) : 0; }
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    setText('a-dv', (n('a-d', 6) / 10).toFixed(1));
    setText('a-sv', (n('a-s', 10) / 10).toFixed(1));
    setText('a-nv', Math.round(n('a-n', 30)));
    if (C.length === 0) resample();
    const mc = mean(C), mt = mean(T);
    const vc = variance(C, mc), vt = variance(T, mt);
    const nc = C.length, nt = T.length;
    const sp = Math.sqrt(Math.max(1e-9, ((nc - 1) * vc + (nt - 1) * vt) / Math.max(1, nc + nt - 2)));
    const d = sp > 0 ? (mt - mc) / sp : 0;
    const se = sp * Math.sqrt(1 / nc + 1 / nt);
    const t = se > 0 ? (mt - mc) / se : 0;
    const p = clamp(2 * (1 - normCdf(Math.abs(t))), 0, 1);

    // dot strips for both groups
    const pad = 36, gw = w - pad * 2;
    const all = C.concat(T);
    const lo = Math.min(...all), hi = Math.max(...all);
    const span = (hi - lo) || 1;
    const X = v => pad + (v - lo) / span * gw;
    const rows = [['control', C, INK_S, h * 0.62], ['treatment', T, ACCENT, h * 0.30]];
    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, h * 0.78); ctx.lineTo(w - pad, h * 0.78); ctx.stroke();
    rows.forEach(([lab, arr, col, y]) => {
      arr.forEach(v => { ctx.beginPath(); ctx.arc(X(v), y + (Math.random() - 0.5) * 24, 3, 0, Math.PI * 2); ctx.fillStyle = col + ''; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1; });
      const m = mean(arr);
      ctx.strokeStyle = col; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(X(m), y - 16); ctx.lineTo(X(m), y + 16); ctx.stroke();
      ctx.fillStyle = col; ctx.font = '600 11px Inter, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(lab, pad, y - 22);
    });
    ctx.textAlign = 'left';

    setText('a-d2', d.toFixed(2));
    setText('a-t', t.toFixed(2));
    setText('a-p', p < 0.001 ? '<0.001' : p.toFixed(3));
    $('a-p').style.color = p < 0.05 ? GOOD : p < 0.1 ? WARN : BAD;
  }
  $('a-d').addEventListener('input', () => { resample(); draw(); });
  $('a-s').addEventListener('input', () => { resample(); draw(); });
  $('a-n').addEventListener('input', () => { resample(); draw(); });
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 7. TYPE I & II ERROR
// ============================================================
(function errors() {
  const cv = $('cv-error'); if (!cv) return;
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    const sep = n('e-e', 25) / 10;                 // separation in SDs
    const alpha = +$('e-a').value || 0.05;
    setText('e-ev', sep.toFixed(1));
    // critical z for one-sided test under H0 (mean 0, sd 1)
    const zCrit = Z['' + Math.round((1 - 2 * alpha) * 100)] ? null : null;
    // invert normCdf for 1-alpha via bisection (robust, no divide-by-zero)
    let lo = -6, hi = 6;
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; (normCdf(mid) < 1 - alpha) ? lo = mid : hi = mid; }
    const crit = (lo + hi) / 2;
    void zCrit;

    const pad = 30, gw = w - pad * 2, gh = h - pad * 2 - 14;
    const xMin = -4, xMax = sep + 4;
    const X = v => pad + (v - xMin) / (xMax - xMin) * gw;
    const peak = normPdf(0);
    const Y = v => pad + (1 - v / peak) * gh;
    const critX = X(crit);

    const curve = (mu, fillRegion, col) => {
      ctx.beginPath();
      for (let px = pad; px <= pad + gw; px += 2) {
        const xv = xMin + (px - pad) / gw * (xMax - xMin);
        const y = Y(normPdf(xv - mu));
        px === pad ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
      }
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      if (fillRegion) {
        ctx.beginPath();
        const [a, b] = fillRegion;
        ctx.moveTo(X(a), Y(0));
        for (let xv = a; xv <= b; xv += (b - a) / 80) ctx.lineTo(X(xv), Y(normPdf(xv - mu)));
        ctx.lineTo(X(b), Y(0)); ctx.closePath();
        ctx.fillStyle = col === BAD ? 'rgba(220,38,38,0.22)' : 'rgba(245,158,11,0.25)'; ctx.fill();
      }
    };
    // H0 alpha tail (right of crit), H1 beta tail (left of crit)
    curve(0, [crit, xMax], BAD);
    curve(sep, [xMin, crit], WARN);
    curve(0, null, INK_S);
    curve(sep, null, ACCENT);
    // threshold
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(critX, pad); ctx.lineTo(critX, pad + gh); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = INK_S; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('H₀', X(0), pad - 4 < 12 ? pad + 10 : pad - 4);
    ctx.fillStyle = ACCENT; ctx.fillText('H₁', X(sep), pad - 4 < 12 ? pad + 10 : pad - 4);
    ctx.fillStyle = INK; ctx.fillText('threshold', critX, pad + gh + 12);
    ctx.textAlign = 'left';

    const beta = normCdf(crit - sep);
    const power = 1 - beta;
    setText('e-alpha', alpha.toFixed(3));
    setText('e-beta', beta.toFixed(3));
    setText('e-power', power.toFixed(3));
    $('e-power').style.color = power > 0.8 ? GOOD : power > 0.5 ? WARN : BAD;
  }
  $('e-e').addEventListener('input', draw);
  $('e-a').addEventListener('change', draw);
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 8. P-HACKING & MULTIPLE COMPARISONS
// ============================================================
(function phack() {
  const cv = $('cv-phack'); if (!cv) return;
  let results = [];
  function run() {
    const k = clamp(Math.round(n('h-k', 20)), 1, 80);
    results = [];
    for (let i = 0; i < k; i++) results.push(Math.random());   // p-value under pure null = uniform
  }
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    const k = clamp(Math.round(n('h-k', 20)), 1, 80);
    const alpha = +$('h-a').value || 0.05;
    setText('h-kv', k);
    if (results.length !== k) run();

    const pad = 24, gw = w - pad * 2, gh = h - pad * 2 - 10;
    const cols = Math.ceil(Math.sqrt(k * 1.6)) || 1;
    const rowsN = Math.ceil(k / cols);
    const cwc = gw / cols, chc = gh / rowsN;
    let hits = 0;
    results.forEach((p, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const x = pad + c * cwc, y = pad + r * chc;
      const sig = p < alpha;
      if (sig) hits++;
      ctx.fillStyle = sig ? BAD : 'rgba(67,56,202,0.16)';
      ctx.fillRect(x + 2, y + 2, cwc - 4, chc - 4);
      ctx.strokeStyle = RULE; ctx.lineWidth = 1; ctx.strokeRect(x + 2, y + 2, cwc - 4, chc - 4);
      if (sig && chc > 18) {
        ctx.fillStyle = '#fff'; ctx.font = '600 9px JetBrains Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText('p<α', x + cwc / 2, y + chc / 2 + 3);
      }
    });
    ctx.textAlign = 'left'; ctx.fillStyle = MUTED; ctx.font = '11px Inter, sans-serif';
    ctx.fillText('each box = one test on pure noise · red = false positive', pad, h - 6);

    const fwer = 1 - Math.pow(1 - alpha, k);
    setText('h-fwer', (fwer * 100).toFixed(1) + '%');
    setText('h-hits', `${hits} / ${k}`);
    $('h-fwer').style.color = fwer > 0.5 ? BAD : fwer > 0.2 ? WARN : INK_S;
  }
  $('h-draw').addEventListener('click', () => { run(); draw(); });
  $('h-k').addEventListener('input', () => { run(); draw(); });
  $('h-a').addEventListener('change', draw);
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 9. SURVEY QUESTION BIAS (LIKERT)
// ============================================================
(function likert() {
  const cv = $('cv-likert'); if (!cv) return;
  let counts = [0, 0, 0, 0, 0];
  function resample() {
    const wording = +$('l-w').value || 0;           // 0,1,2 shifts center up
    const acq = clamp(n('l-b', 20) / 100, 0, 1);     // pull toward agree
    const N = clamp(Math.round(n('l-n', 200)), 1, 2000);
    const center = 3 + wording * 0.6 + acq * 0.8;    // on 1..5 scale
    const spread = 1.0 + (1 - acq) * 0.2;
    counts = [0, 0, 0, 0, 0];
    for (let i = 0; i < N; i++) {
      let v = Math.round(center + randn() * spread);
      v = clamp(v, 1, 5);
      counts[v - 1]++;
    }
  }
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    setText('l-bv', (clamp(n('l-b', 20) / 100, 0, 1)).toFixed(2));
    setText('l-nv', Math.round(n('l-n', 200)));
    const total = counts.reduce((s, v) => s + v, 0);
    if (total === 0) resample();
    const tot = counts.reduce((s, v) => s + v, 0) || 1;

    const labels = ['Strongly\ndisagree', 'Disagree', 'Neutral', 'Agree', 'Strongly\nagree'];
    const pad = 30, gw = w - pad * 2, gh = h - pad - 50;
    const bw = gw / 5;
    const maxC = Math.max(...counts, 1);
    counts.forEach((c, i) => {
      const bh = (c / maxC) * gh;
      const x = pad + i * bw, y = pad + (gh - bh);
      ctx.fillStyle = i >= 3 ? ACCENT : i === 2 ? RULE_H : INK_S;
      ctx.globalAlpha = i >= 3 ? 1 : 0.7;
      ctx.fillRect(x + 6, y, bw - 12, bh);
      ctx.globalAlpha = 1;
      ctx.fillStyle = INK_S; ctx.font = '600 11px JetBrains Mono, monospace'; ctx.textAlign = 'center';
      ctx.fillText(((c / tot) * 100).toFixed(0) + '%', x + bw / 2, y - 4 < pad ? pad + 10 : y - 4);
      ctx.fillStyle = MUTED; ctx.font = '10px Inter, sans-serif';
      labels[i].split('\n').forEach((ln, k) => ctx.fillText(ln, x + bw / 2, pad + gh + 14 + k * 11));
    });
    ctx.textAlign = 'left';

    let mean = 0; counts.forEach((c, i) => mean += (i + 1) * c); mean /= tot;
    const agree = (counts[3] + counts[4]) / tot;
    setText('l-mean', mean.toFixed(2) + ' / 5');
    setText('l-agree', (agree * 100).toFixed(0) + '%');
    $('l-mean').style.color = mean > 3.6 ? WARN : INK_S;
  }
  $('l-draw').addEventListener('click', () => { resample(); draw(); });
  $('l-w').addEventListener('change', () => { resample(); draw(); });
  $('l-b').addEventListener('input', () => { resample(); draw(); });
  $('l-n').addEventListener('input', () => { resample(); draw(); });
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 10. RELIABILITY vs VALIDITY (dartboard)
// ============================================================
(function dartboard() {
  const cv = $('cv-dart'); if (!cv) return;
  let shots = [];
  function resample() {
    const rel = clamp(n('d-r', 70) / 100, 0, 1);
    const val = clamp(n('d-v', 70) / 100, 0, 1);
    const N = clamp(Math.round(n('d-n', 25)), 1, 200);
    const noise = (1 - rel) * 0.9;                   // scatter radius
    const biasMag = (1 - val) * 0.75;                // systematic offset
    const ang = Math.PI * 0.25;                       // fixed bias direction
    const bx = Math.cos(ang) * biasMag, by = Math.sin(ang) * biasMag;
    shots = [];
    for (let i = 0; i < N; i++) shots.push({ x: bx + randn() * noise * 0.4, y: by + randn() * noise * 0.4 });
  }
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    const rel = clamp(n('d-r', 70) / 100, 0, 1);
    const val = clamp(n('d-v', 70) / 100, 0, 1);
    setText('d-rv', rel.toFixed(2)); setText('d-vv', val.toFixed(2));
    setText('d-nv', Math.round(n('d-n', 25)));
    if (shots.length === 0) resample();

    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42;
    // board rings (unit coords -1..1 mapped to R)
    const rings = [1, 0.72, 0.46, 0.22];
    rings.forEach((rr, i) => {
      ctx.beginPath(); ctx.arc(cx, cy, R * rr, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#fff' : 'rgba(67,56,202,0.06)'; ctx.fill();
      ctx.strokeStyle = RULE; ctx.lineWidth = 1; ctx.stroke();
    });
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.08, 0, Math.PI * 2); ctx.fillStyle = ACCENT_S; ctx.fill();
    // crosshair
    ctx.strokeStyle = RULE_H; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

    let mx = 0, my = 0;
    shots.forEach(s => { mx += s.x; my += s.y; }); mx /= shots.length; my /= shots.length;
    shots.forEach(s => {
      const x = cx + clamp(s.x, -1.05, 1.05) * R, y = cy + clamp(s.y, -1.05, 1.05) * R;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = ACCENT; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1;
      ctx.lineWidth = 1; ctx.strokeStyle = '#fff'; ctx.stroke();
    });
    // centroid
    ctx.beginPath(); ctx.arc(cx + mx * R, cy + my * R, 5, 0, Math.PI * 2);
    ctx.fillStyle = BAD; ctx.fill();

    let spread = 0; shots.forEach(s => { spread += (s.x - mx) ** 2 + (s.y - my) ** 2; });
    spread = Math.sqrt(spread / shots.length);
    const bias = Math.hypot(mx, my);
    setText('d-spread', spread.toFixed(2));
    setText('d-bias', bias.toFixed(2));
    const reliable = spread < 0.18, valid = bias < 0.18;
    let verdict;
    if (reliable && valid) verdict = 'reliable + valid';
    else if (reliable && !valid) verdict = 'reliable, biased';
    else if (!reliable && valid) verdict = 'valid, noisy';
    else verdict = 'neither';
    setText('d-verdict', verdict);
    $('d-verdict').style.color = (reliable && valid) ? GOOD : (reliable || valid) ? WARN : BAD;
  }
  $('d-draw').addEventListener('click', () => { resample(); draw(); });
  ['d-r', 'd-v', 'd-n'].forEach(id => $(id).addEventListener('input', () => { resample(); draw(); }));
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 11. 2×2 FACTORIAL — MAIN EFFECTS & INTERACTION
// ============================================================
(function factorial() {
  const cv = $('cv-factorial'); if (!cv) return;
  // Factor A (rows) = Training none(A1)/yes(A2); Factor B (cols) = Experience
  // novice(B1)/expert(B2). Pure effect maths lives in src/factorial.js.
  const cells = () => ({
    a1b1: clamp(n('fa-11', 40), 0, 100),
    a1b2: clamp(n('fa-12', 60), 0, 100),
    a2b1: clamp(n('fa-21', 55), 0, 100),
    a2b2: clamp(n('fa-22', 75), 0, 100),
  });
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    const c = cells();
    setText('fa-11v', Math.round(c.a1b1));
    setText('fa-12v', Math.round(c.a1b2));
    setText('fa-21v', Math.round(c.a2b1));
    setText('fa-22v', Math.round(c.a2b2));

    const ma = mainEffectA(c.a1b1, c.a1b2, c.a2b1, c.a2b2);
    const mb = mainEffectB(c.a1b1, c.a1b2, c.a2b1, c.a2b2);
    const ab = interaction(c.a1b1, c.a1b2, c.a2b1, c.a2b2);

    // interaction plot: x = Factor A levels (A1, A2); two lines for B1, B2.
    const padL = 46, padR = 96, padT = 24, padB = 40;
    const gw = w - padL - padR, gh = h - padT - padB;
    const xA1 = padL + gw * 0.22, xA2 = padL + gw * 0.78;
    const Y = v => padT + (1 - clamp(v, 0, 100) / 100) * gh;

    // axes + horizontal gridlines (0..100)
    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + gh); ctx.lineTo(padL + gw, padT + gh); ctx.stroke();
    ctx.fillStyle = MUTED; ctx.font = '10px JetBrains Mono, monospace'; ctx.textAlign = 'right';
    for (let v = 0; v <= 100; v += 25) {
      const y = Y(v);
      ctx.strokeStyle = RULE; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + gw, y); ctx.stroke();
      ctx.fillText('' + v, padL - 5, y + 3);
    }
    // x-axis level ticks
    ctx.textAlign = 'center'; ctx.fillStyle = INK_S; ctx.font = '600 11px Inter, sans-serif';
    ctx.fillText('A1 · no training', xA1, padT + gh + 16);
    ctx.fillText('A2 · training', xA2, padT + gh + 16);
    ctx.fillStyle = MUTED; ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Factor A (Training)  →', padL + gw / 2, h - 6);
    ctx.save(); ctx.translate(13, padT + gh / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillText('outcome score', 0, 0); ctx.restore();

    // one line per Factor B level
    const series = [
      { lab: 'B1 · novice', col: INK_S, y1: c.a1b1, y2: c.a2b1 },
      { lab: 'B2 · expert', col: ACCENT, y1: c.a1b2, y2: c.a2b2 },
    ];
    series.forEach(s => {
      ctx.strokeStyle = s.col; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(xA1, Y(s.y1)); ctx.lineTo(xA2, Y(s.y2)); ctx.stroke();
      [[xA1, s.y1], [xA2, s.y2]].forEach(([px, vv]) => {
        ctx.beginPath(); ctx.arc(px, Y(vv), 5, 0, Math.PI * 2);
        ctx.fillStyle = s.col; ctx.fill();
        ctx.lineWidth = 1.4; ctx.strokeStyle = '#fff'; ctx.stroke();
      });
      // right-edge series label by the A2 endpoint
      ctx.fillStyle = s.col; ctx.font = '600 11px Inter, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(s.lab, xA2 + 9, Y(s.y2) + 3);
    });

    // parallel-ness note
    const parallel = Math.abs(ab) < 0.5;
    ctx.textAlign = 'left'; ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = parallel ? GOOD : BAD;
    ctx.fillText(parallel ? 'lines parallel → no interaction (additive)' : 'lines not parallel → interaction present',
      padL + 2, padT + 12 < 14 ? padT + 14 : padT - 8 > 10 ? padT - 8 : padT + 12);

    const sign = x => (x >= 0 ? '+' : '') + x.toFixed(1);
    setText('fa-ma', sign(ma));
    setText('fa-mb', sign(mb));
    setText('fa-int', sign(ab) + (parallel ? '  (≈0 → additive)' : ''));
    $('fa-int').style.color = parallel ? GOOD : BAD;
  }
  ['fa-11', 'fa-12', 'fa-21', 'fa-22'].forEach(id => $(id).addEventListener('input', draw));
  window.addEventListener('resize', draw);
  draw();
})();
