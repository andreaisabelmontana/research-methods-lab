# research-methods-lab

Visual research methods. 10 self-contained demos, one per idea from the IE BCSAI *Learning to Observe, Experiment & Survey* course (Prof. Joshua Guyer).

**Live:** https://andreaisabelmontana.github.io/research-methods-lab/

Module 1 & 2 — The research process, sampling & description
1. Population, sample & sampling error — draw a random (or biased) sample, watch the estimate `p̂` jiggle and the standard error shrink like `1/√n`
2. Sample size vs margin of error — the `E = z·√(p̂(1−p̂)/n)` curve with a live 95% confidence interval

Module 2 — Descriptive & correlational designs
3. Correlation & scatterplots — set a target `r`, resample a cloud, read Pearson `r`, `r²` and the least-squares slope
4. Confounding & randomization — a third variable fakes an effect; toggle randomization to break the `Z→treatment` arrow
5. Simpson's paradox — two positive within-group trends reverse when pooled

Module 3 — Experimental methodologies
6. Two-group experiment & effect size — control vs treatment, Cohen's `d`, `t` and an approximate `p`-value

Module 2 & 4 — Evaluating information scientifically
7. Type I & Type II error — `H₀` vs `H₁` distributions, threshold at `α`, with `β` and power `1−β`
8. p-hacking & multiple comparisons — testing `k` pure-noise hypotheses; `P(≥1 false positive) = 1−(1−α)^k`

Module 5 — Qualitative methods & surveys
9. Survey question bias — neutral vs leading/loaded wording plus acquiescence shift the 5-point Likert distribution

Module 1 & 4 — Measurement
10. Reliability vs validity — the dartboard analogy: scatter = (un)reliable, off-center = (in)valid

Plain HTML + canvas + KaTeX. Indigo accent. Zero build step.

Part of the *-lab series: [calc-lab](https://github.com/andreaisabelmontana/calc-lab) · [stats-lab](https://github.com/andreaisabelmontana/stats-lab) · [discrete-math-lab](https://github.com/andreaisabelmontana/discrete-math-lab)
