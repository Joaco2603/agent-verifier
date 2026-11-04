function approxErf(x) {
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return sign * y;
}

const erf = Math.erf ?? approxErf;

export function normalCdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

export function contractParts(contract) {
  return ["observables", "preconditions", "cases", "properties"].reduce(
    (sum, key) => sum + (contract[key]?.length ?? 0),
    0,
  );
}

export function pointsForParts(count) {
  if (!Number.isInteger(count) || count < 1) throw new Error("part count");
  return { optimistic: 2 * count, likely: 4 * count, pessimistic: 8 * count };
}

export function reviewEstimate(estimate, target) {
  const sigma = Math.sqrt(estimate.variance);
  const gap = target - estimate.expected;
  const z = sigma === 0 ? null : gap / sigma;
  const identityGap = 6 * estimate.expected - (estimate.optimistic + 4 * estimate.likely + estimate.pessimistic);
  return {
    target,
    z,
    probabilityByTarget: z == null ? (gap >= 0 ? 1 : 0) : normalCdf(z),
    exceedanceAtMost: gap <= 0 ? 1 : estimate.variance / (estimate.variance + gap * gap),
    holds: Math.abs(identityGap) < 1e-9 && estimate.expected >= estimate.optimistic && estimate.expected <= estimate.pessimistic,
  };
}

export function pert({ optimistic, likely, pessimistic, actual = null } = {}) {
  const points = [optimistic, likely, pessimistic];
  if (points.some((value) => typeof value !== "number" || Number.isNaN(value))) {
    throw new Error("O, likely, and P are required");
  }
  if (pessimistic < optimistic || likely < optimistic || likely > pessimistic) {
    throw new Error("likely must sit between O and P");
  }
  const expected = (optimistic + 4 * likely + pessimistic) / 6;
  const variance = ((pessimistic - optimistic) / 6) ** 2;
  return {
    activity: "write and approve one contract",
    unit: "minutes",
    optimistic,
    likely,
    pessimistic,
    expected,
    variance,
    actual,
    subjective: actual == null,
    label: "duration estimate",
  };
}

export function annotateApproval(rows, points) {
  const estimate = pert(points);
  return {
    estimate,
    rows: rows.map((row) => ({
      ...row,
      approvalEstimate: estimate.expected,
      approvalMinutes: typeof estimate.actual === "number" ? estimate.actual : row.approvalMinutes,
    })),
  };
}
