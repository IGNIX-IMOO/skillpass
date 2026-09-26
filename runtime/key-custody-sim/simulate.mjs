const COMMITTEE_SCENARIOS = [
  { name: "bootstrap", size: 3, threshold: 2 },
  { name: "standard", size: 9, threshold: 6 },
  { name: "high_value", size: 11, threshold: 8 },
];

const COLLUSION_SHARES = [0.05, 0.1, 0.2, 0.33, 0.5];
const UPTIME_RATES = [0.999, 0.995, 0.98, 0.95, 0.9];

const TOKEN_TIERS = {
  A: { haircut: 1.0, baseEligible: true, cap: 0.15 },
  B: { haircut: 0.6, baseEligible: false, cap: 0.1 },
  C: { haircut: 0.25, baseEligible: false, cap: 0.05 },
};

const BUYOUT_VALUES = [1_000, 10_000, 100_000];
const ANNUAL_CUSTODY_COST = 50;
const NETWORK_FEE_RATE = 0.01;
const STORAGE_RESERVE_RATE = 0.02;
const MINIMUM_STORAGE_RESERVE = 100;

function choose(n, k) {
  if (k < 0 || k > n) return 0;
  const m = Math.min(k, n - k);
  let value = 1;
  for (let i = 1; i <= m; i += 1) {
    value = (value * (n - m + i)) / i;
  }
  return value;
}

function hypergeometricAtLeast(population, successes, draws, threshold) {
  const denominator = choose(population, draws);
  let probability = 0;
  const max = Math.min(successes, draws);
  for (let selected = threshold; selected <= max; selected += 1) {
    probability +=
      (choose(successes, selected) *
        choose(population - successes, draws - selected)) /
      denominator;
  }
  return probability;
}

function binomialAtLeast(trials, probability, threshold) {
  let result = 0;
  for (let successes = threshold; successes <= trials; successes += 1) {
    result +=
      choose(trials, successes) *
      probability ** successes *
      (1 - probability) ** (trials - successes);
  }
  return result;
}

function round(value, digits = 6) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function committeeCapture() {
  const population = 1_000;
  return COLLUSION_SHARES.flatMap((share) => {
    const colludingNodes = Math.round(population * share);
    return COMMITTEE_SCENARIOS.map((scenario) => ({
      committee: scenario.name,
      committeeSize: scenario.size,
      threshold: scenario.threshold,
      colludingNodeShare: share,
      captureProbability: round(
        hypergeometricAtLeast(
          population,
          colludingNodes,
          scenario.size,
          scenario.threshold,
        ),
      ),
    }));
  });
}

function thresholdAvailability() {
  return COMMITTEE_SCENARIOS.flatMap((scenario) =>
    UPTIME_RATES.map((uptime) => {
      const reachable = binomialAtLeast(
        scenario.size,
        uptime,
        scenario.threshold,
      );
      return {
        committee: scenario.name,
        committeeSize: scenario.size,
        threshold: scenario.threshold,
        nodeUptime: uptime,
        deliveryProbability: round(reachable),
        deliveryFailureProbability: round(1 - reachable),
      };
    }),
  );
}

function effectiveValue(rawValue, token) {
  return rawValue * TOKEN_TIERS[token].haircut;
}

function portfolioStress() {
  const minimumBaseStake = 10_000;
  const scenarios = [
    {
      name: "base_floor_b_3k_c_1k",
      allocations: { A: minimumBaseStake, B: 3_000, C: 1_000 },
      shock: { A: 0, B: 0, C: 0 },
    },
    {
      name: "project_token_c_down_90",
      allocations: { A: minimumBaseStake, B: 3_000, C: 1_000 },
      shock: { A: 0, B: 0, C: -0.9 },
    },
    {
      name: "supplemental_tokens_down_70_95",
      allocations: { A: minimumBaseStake, B: 3_000, C: 1_000 },
      shock: { A: 0, B: -0.7, C: -0.95 },
    },
    {
      name: "c_heavy_supplement",
      allocations: { A: minimumBaseStake, B: 0, C: 10_000 },
      shock: { A: 0, B: 0, C: -0.9 },
    },
  ];

  return scenarios.map((scenario) => {
    const raw = {};
    for (const token of Object.keys(scenario.allocations)) {
      raw[token] =
        scenario.allocations[token] / TOKEN_TIERS[token].haircut;
    }

    const stressed = {};
    for (const token of Object.keys(raw)) {
      stressed[token] =
        raw[token] *
        (1 + scenario.shock[token]) *
        TOKEN_TIERS[token].haircut;
    }

    const initial = Object.values(scenario.allocations).reduce(
      (sum, value) => sum + value,
      0,
    );
    const afterShock = Object.values(stressed).reduce(
      (sum, value) => sum + value,
      0,
    );
    const preservedRatio = afterShock / initial;

    return {
      scenario: scenario.name,
      initialEffectiveStake: initial,
      afterShockEffectiveStake: round(afterShock, 2),
      preservedRatio: round(preservedRatio),
      baseSecurityFloorAfterShock: round(stressed.A || 0, 2),
      baseEligible: (stressed.A || 0) >= minimumBaseStake,
      status:
        (stressed.A || 0) < minimumBaseStake
          ? "ineligible"
          : preservedRatio < 0.8
            ? "reduce_weight"
            : preservedRatio < 1
              ? "top_up_or_reduce_weight"
            : "healthy",
    };
  });
}

function feeDistribution() {
  return BUYOUT_VALUES.map((value) => {
    const networkFee = value * NETWORK_FEE_RATE;
    const storageReserve = Math.max(
      MINIMUM_STORAGE_RESERVE,
      value * STORAGE_RESERVE_RATE,
    );
    const annualCoverage = storageReserve / ANNUAL_CUSTODY_COST;
    const activeNodePool = networkFee * 0.7;

    return {
      buyoutValue: value,
      sellerCosts: round(networkFee + storageReserve, 2),
      networkFee: round(networkFee, 2),
      storageReserve: round(storageReserve, 2),
      storageCoverageYears: round(annualCoverage, 2),
      activeNodePool: round(activeNodePool, 2),
      perSixNodeShare: round(activeNodePool / 6, 2),
      perEightNodeShare: round(activeNodePool / 8, 2),
    };
  });
}

function coalitionCapitalCost() {
  const minimumNodeStake = 10_000;
  const scenarios = [
    {
      name: "bootstrap",
      controlledNodes: 2,
      assetValue: 5_000,
      coverageRatio: 1,
    },
    {
      name: "standard",
      controlledNodes: 6,
      assetValue: 50_000,
      coverageRatio: 1,
    },
    {
      name: "high_value",
      controlledNodes: 8,
      assetValue: 1_000_000,
      coverageRatio: 1,
    },
  ];

  return scenarios.map((scenario) => {
    const requiredCapital = Math.max(
      scenario.controlledNodes * minimumNodeStake,
      scenario.assetValue * scenario.coverageRatio,
    );
    return {
      ...scenario,
      minimumCoalitionStake: requiredCapital,
      stakeToAssetRatio: round(requiredCapital / scenario.assetValue),
      requiredStakePerNodeForFullCoverage: round(
        requiredCapital / scenario.controlledNodes,
        2,
      ),
      economicSecurity:
        requiredCapital >= scenario.assetValue ? "covered" : "undercollateralized",
    };
  });
}

const output = {
  generatedAt: "deterministic",
  parameters: {
    collusionNodeShares: COLLUSION_SHARES,
    uptimeRates: UPTIME_RATES,
    tokenTiers: TOKEN_TIERS,
    networkFeeRate: NETWORK_FEE_RATE,
    storageReserveRate: STORAGE_RESERVE_RATE,
    minimumStorageReserve: MINIMUM_STORAGE_RESERVE,
    minimumNodeStake: 10_000,
  },
  committeeCapture: committeeCapture(),
  thresholdAvailability: thresholdAvailability(),
  portfolioStress: portfolioStress(),
  feeDistribution: feeDistribution(),
  coalitionCapitalCost: coalitionCapitalCost(),
};

console.log(JSON.stringify(output, null, 2));
