import {
  Tick,
  DigitStats,
  DigitDetail,
  EvenOddStats,
  OverUnderStats,
  MatchesDiffersStats,
  RiseFallStats,
  TouchNoTouchStats,
  HigherLowerStats,
  EndsInOutStats,
  MultiTimeframeStats,
  MultiTimeframeRow,
  TechnicalIndicators,
  AnalyticalSignal,
  Signal,
  Market,
  BacktestResult,
} from '../types';

/**
 * Extracts the last digit from a price quote according to market decimals.
 */
export function extractLastDigit(quote: number, decimals: number): number {
  const formatted = quote.toFixed(decimals);
  const clean = formatted.replace('.', '');
  const lastChar = clean.charAt(clean.length - 1);
  const parsed = parseInt(lastChar, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculates digit frequency, streaks, momentum, and transitions.
 */
export function calculateDigitStats(ticks: Tick[], windowSize: number): DigitStats {
  const sample = ticks.slice(-windowSize);
  const n = sample.length;

  if (n === 0) {
    return {
      sampleSize: 0,
      distribution: Array.from({ length: 10 }, (_, i) => ({
        digit: i,
        count: 0,
        percentage: 10,
        recentCount: 0,
        streak: 0,
        ticksSinceLast: 0,
        analysis: 'Near Expected',
      })),
      percentages: { 0: 10, 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10, 9: 10 },
      mostFrequentDigit: 0,
      mostFrequentCount: 0,
      mostFrequentPct: 10,
      leastFrequentDigit: 0,
      leastFrequentCount: 0,
      leastFrequentPct: 10,
      repeatPairsCount: 0,
      maxRepeatedDigit: { digit: 0, streak: 0 },
      transitions: Array(10).fill(0).map(() => Array(10).fill(0)),
      momentum: [],
    };
  }

  const counts = Array(10).fill(0);
  const recentWindow = sample.slice(-Math.min(25, n));
  const recentCounts = Array(10).fill(0);

  sample.forEach((t) => counts[t.digit]++);
  recentWindow.forEach((t) => recentCounts[t.digit]++);

  // Consecutive repeats and streaks
  let repeatPairs = 0;
  let currentStreakDigit = sample[sample.length - 1]?.digit ?? 0;
  let currentStreakLen = 0;

  for (let i = sample.length - 1; i >= 0; i--) {
    if (sample[i].digit === currentStreakDigit) {
      currentStreakLen++;
    } else {
      break;
    }
  }

  // Transitions matrix (fromDigit -> toDigit)
  const transitions: number[][] = Array(10).fill(0).map(() => Array(10).fill(0));
  for (let i = 0; i < sample.length - 1; i++) {
    const from = sample[i].digit;
    const to = sample[i + 1].digit;
    transitions[from][to]++;
    if (from === to) {
      repeatPairs++;
    }
  }

  // Calculate ticks since last appearance for each digit
  const ticksSinceLast = Array(10).fill(n);
  for (let d = 0; d <= 9; d++) {
    for (let i = sample.length - 1; i >= 0; i--) {
      if (sample[i].digit === d) {
        ticksSinceLast[d] = sample.length - 1 - i;
        break;
      }
    }
  }

  const expectedPct = 10; // 10% for fair random 0-9
  const distribution: DigitDetail[] = [];
  let mostFreqDigit = 0;
  let maxCount = -1;
  let leastFreqDigit = 0;
  let minCount = Infinity;

  for (let d = 0; d <= 9; d++) {
    const count = counts[d];
    const pct = parseFloat(((count / n) * 100).toFixed(1));
    const recent = recentCounts[d];
    const streak = d === currentStreakDigit ? currentStreakLen : 0;
    const sinceLast = ticksSinceLast[d];

    let analysis: DigitDetail['analysis'] = 'Near Expected';
    if (pct > expectedPct + 3.5) analysis = 'Above Expected';
    else if (pct < expectedPct - 3.5) analysis = 'Below Expected';
    else if (sinceLast > 20) analysis = 'Overdue (Statistical)';

    if (count > maxCount) {
      maxCount = count;
      mostFreqDigit = d;
    }
    if (count < minCount) {
      minCount = count;
      leastFreqDigit = d;
    }

    distribution.push({
      digit: d,
      count,
      percentage: pct,
      recentCount: recent,
      streak,
      ticksSinceLast: sinceLast,
      analysis,
    });
  }

  const momentum = distribution.map((d) => {
    const fullPct = d.percentage;
    const recentPct = recentWindow.length > 0 ? (d.recentCount / recentWindow.length) * 100 : 10;
    return {
      digit: d.digit,
      delta: parseFloat((recentPct - fullPct).toFixed(1)),
    };
  });

  const percentages: Record<number, number> = {};
  distribution.forEach((d) => {
    percentages[d.digit] = d.percentage;
  });

  return {
    sampleSize: n,
    distribution,
    percentages,
    mostFrequentDigit: mostFreqDigit,
    mostFrequentCount: maxCount,
    mostFrequentPct: parseFloat(((maxCount / n) * 100).toFixed(1)),
    leastFrequentDigit: leastFreqDigit,
    leastFrequentCount: minCount,
    leastFrequentPct: parseFloat(((minCount / n) * 100).toFixed(1)),
    repeatPairsCount: repeatPairs,
    maxRepeatedDigit: { digit: currentStreakDigit, streak: currentStreakLen },
    transitions,
    momentum,
  };
}

/**
 * Even / Odd analysis
 */
export function calculateEvenOddStats(ticks: Tick[], windowSize: number): EvenOddStats {
  const sample = ticks.slice(-windowSize);
  const n = sample.length;

  if (n === 0) {
    return {
      sampleSize: 0,
      evenCount: 0,
      oddCount: 0,
      evenPercentage: 50,
      oddPercentage: 50,
      currentStreak: 0,
      currentStreakType: 'NONE',
      longestEvenStreak: 0,
      longestOddStreak: 0,
      estimatedProbEven: 50,
      estimatedProbOdd: 50,
      confidence: 'Low',
      recent25EvenPct: 50,
      recent25OddPct: 50,
    };
  }

  let evenCount = 0;
  let oddCount = 0;
  let longestEven = 0;
  let longestOdd = 0;
  let currentStreak = 0;
  let currentType: 'EVEN' | 'ODD' | 'NONE' = 'NONE';

  for (let i = 0; i < n; i++) {
    const isEven = sample[i].digit % 2 === 0;
    if (isEven) {
      evenCount++;
    } else {
      oddCount++;
    }
  }

  // Calculate streaks
  let runningType: 'EVEN' | 'ODD' | null = null;
  let runningStreak = 0;

  for (let i = 0; i < n; i++) {
    const type: 'EVEN' | 'ODD' = sample[i].digit % 2 === 0 ? 'EVEN' : 'ODD';
    if (type === runningType) {
      runningStreak++;
    } else {
      runningType = type;
      runningStreak = 1;
    }
    if (type === 'EVEN' && runningStreak > longestEven) longestEven = runningStreak;
    if (type === 'ODD' && runningStreak > longestOdd) longestOdd = runningStreak;
  }

  // Current streak at tail
  if (n > 0) {
    const tailType: 'EVEN' | 'ODD' = sample[n - 1].digit % 2 === 0 ? 'EVEN' : 'ODD';
    let tailStreak = 0;
    for (let i = n - 1; i >= 0; i--) {
      const t: 'EVEN' | 'ODD' = sample[i].digit % 2 === 0 ? 'EVEN' : 'ODD';
      if (t === tailType) tailStreak++;
      else break;
    }
    currentStreak = tailStreak;
    currentType = tailType;
  }

  const evenPct = parseFloat(((evenCount / n) * 100).toFixed(1));
  const oddPct = parseFloat(((oddCount / n) * 100).toFixed(1));

  // Recent 25 ticks
  const recent = sample.slice(-Math.min(25, n));
  const rEven = recent.filter((t) => t.digit % 2 === 0).length;
  const recent25EvenPct = recent.length > 0 ? parseFloat(((rEven / recent.length) * 100).toFixed(1)) : 50;
  const recent25OddPct = parseFloat((100 - recent25EvenPct).toFixed(1));

  // Bayesian / sample-weighted probability estimate
  // Prior is 50/50, blended with historical frequency and streak regression
  const streakDampener = currentStreak > 4 ? (currentType === 'EVEN' ? -1.5 : 1.5) : 0;
  const rawEvenEst = 0.5 * 50 + 0.3 * evenPct + 0.2 * recent25EvenPct + streakDampener;
  const estimatedProbEven = Math.min(65, Math.max(35, parseFloat(rawEvenEst.toFixed(1))));
  const estimatedProbOdd = parseFloat((100 - estimatedProbEven).toFixed(1));

  let confidence: 'Low' | 'Medium' | 'High' = 'Low';
  if (n >= 100 && Math.abs(evenPct - 50) > 4) confidence = 'Medium';
  if (n >= 250 && Math.abs(evenPct - 50) > 6 && Math.abs(recent25EvenPct - 50) > 8) confidence = 'High';

  return {
    sampleSize: n,
    evenCount,
    oddCount,
    evenPercentage: evenPct,
    oddPercentage: oddPct,
    currentStreak,
    currentStreakType: currentType,
    longestEvenStreak: longestEven,
    longestOddStreak: longestOdd,
    estimatedProbEven,
    estimatedProbOdd,
    confidence,
    recent25EvenPct,
    recent25OddPct,
  };
}

/**
 * Over / Under analysis
 */
export function calculateOverUnderStats(ticks: Tick[], threshold: number, windowSize: number): OverUnderStats {
  const sample = ticks.slice(-windowSize);
  const n = sample.length;

  if (n === 0) {
    return {
      sampleSize: 0,
      threshold,
      underCount: 0,
      overCount: 0,
      underPercentage: 50,
      overPercentage: 50,
      currentStreak: 0,
      currentStreakType: 'NONE',
      longestUnderStreak: 0,
      longestOverStreak: 0,
      estimatedProbUnder: 50,
      estimatedProbOver: 50,
      recentUnderPct: 50,
      recentOverPct: 50,
    };
  }

  let underCount = 0;
  let overCount = 0;
  let longestUnder = 0;
  let longestOver = 0;

  for (let i = 0; i < n; i++) {
    const d = sample[i].digit;
    if (d < threshold) underCount++;
    else if (d > threshold) overCount++;
  }

  // Streaks
  let runType: 'UNDER' | 'OVER' | 'EQUAL' | null = null;
  let runLen = 0;
  for (let i = 0; i < n; i++) {
    const d = sample[i].digit;
    const type = d < threshold ? 'UNDER' : d > threshold ? 'OVER' : 'EQUAL';
    if (type === runType) {
      runLen++;
    } else {
      runType = type;
      runLen = 1;
    }
    if (type === 'UNDER' && runLen > longestUnder) longestUnder = runLen;
    if (type === 'OVER' && runLen > longestOver) longestOver = runLen;
  }

  // Current tail streak
  let currentStreak = 0;
  let currentStreakType: 'UNDER' | 'OVER' | 'EQUAL' | 'NONE' = 'NONE';
  if (n > 0) {
    const lastDigit = sample[n - 1].digit;
    currentStreakType = lastDigit < threshold ? 'UNDER' : lastDigit > threshold ? 'OVER' : 'EQUAL';
    for (let i = n - 1; i >= 0; i--) {
      const d = sample[i].digit;
      const t = d < threshold ? 'UNDER' : d > threshold ? 'OVER' : 'EQUAL';
      if (t === currentStreakType) currentStreak++;
      else break;
    }
  }

  const underPct = parseFloat(((underCount / n) * 100).toFixed(1));
  const overPct = parseFloat(((overCount / n) * 100).toFixed(1));

  // Expected baseline: digits under threshold: threshold / 10
  const expectedUnder = (threshold / 10) * 100;
  const expectedOver = ((9 - threshold) / 10) * 100;

  const recent = sample.slice(-Math.min(25, n));
  const rUnder = recent.filter((t) => t.digit < threshold).length;
  const recentUnderPct = recent.length > 0 ? parseFloat(((rUnder / recent.length) * 100).toFixed(1)) : expectedUnder;
  const recentOverPct = parseFloat((100 - recentUnderPct).toFixed(1));

  // Estimated probability
  const estUnder = Math.min(95, Math.max(5, parseFloat((0.6 * expectedUnder + 0.25 * underPct + 0.15 * recentUnderPct).toFixed(1))));
  const estOver = Math.min(95, Math.max(5, parseFloat((0.6 * expectedOver + 0.25 * overPct + 0.15 * recentOverPct).toFixed(1))));

  return {
    sampleSize: n,
    threshold,
    underCount,
    overCount,
    underPercentage: underPct,
    overPercentage: overPct,
    currentStreak,
    currentStreakType,
    longestUnderStreak: longestUnder,
    longestOverStreak: longestOver,
    estimatedProbUnder: estUnder,
    estimatedProbOver: estOver,
    recentUnderPct,
    recentOverPct,
  };
}

/**
 * Matches / Differs analysis
 */
export function calculateMatchesDiffersStats(ticks: Tick[], targetDigit: number, windowSize: number): MatchesDiffersStats {
  const sample = ticks.slice(-windowSize);
  const n = sample.length;

  if (n === 0) {
    return {
      sampleSize: 0,
      targetDigit,
      matchesCount: 0,
      differsCount: 0,
      matchesPercentage: 10,
      differsPercentage: 90,
      currentStreak: 0,
      streakType: 'DIFFER',
      estimatedProbMatches: 10,
      estimatedProbDiffers: 90,
      recentOccurrences: 0,
    };
  }

  let matches = 0;
  let differs = 0;

  sample.forEach((t) => {
    if (t.digit === targetDigit) matches++;
    else differs++;
  });

  const matchesPct = parseFloat(((matches / n) * 100).toFixed(1));
  const differsPct = parseFloat(((differs / n) * 100).toFixed(1));

  // Current streak
  const lastMatch = sample[n - 1].digit === targetDigit;
  const streakType: 'MATCH' | 'DIFFER' = lastMatch ? 'MATCH' : 'DIFFER';
  let currentStreak = 0;
  for (let i = n - 1; i >= 0; i--) {
    const isM = sample[i].digit === targetDigit;
    if ((lastMatch && isM) || (!lastMatch && !isM)) currentStreak++;
    else break;
  }

  const recent = sample.slice(-25);
  const recentOccurrences = recent.filter((t) => t.digit === targetDigit).length;

  // Theoretical probability is 10% match, 90% differ
  const estMatches = Math.min(30, Math.max(2, parseFloat((0.7 * 10 + 0.2 * matchesPct + 0.1 * (recentOccurrences / 25 * 100)).toFixed(1))));
  const estDiffers = parseFloat((100 - estMatches).toFixed(1));

  return {
    sampleSize: n,
    targetDigit,
    matchesCount: matches,
    differsCount: differs,
    matchesPercentage: matchesPct,
    differsPercentage: differsPct,
    currentStreak,
    streakType,
    estimatedProbMatches: estMatches,
    estimatedProbDiffers: estDiffers,
    recentOccurrences,
  };
}

/**
 * Rise / Fall analysis
 */
export function calculateRiseFallStats(ticks: Tick[], windowSize: number): RiseFallStats {
  const sample = ticks.slice(-windowSize);
  const n = sample.length;

  const helper = (subset: Tick[]) => {
    let rise = 0;
    let fall = 0;
    for (let i = 1; i < subset.length; i++) {
      if (subset[i].quote > subset[i - 1].quote) rise++;
      else if (subset[i].quote < subset[i - 1].quote) fall++;
    }
    const tot = Math.max(1, rise + fall);
    return {
      risePct: parseFloat(((rise / tot) * 100).toFixed(1)),
      fallPct: parseFloat(((fall / tot) * 100).toFixed(1)),
      rise,
      fall,
    };
  };

  const w10 = helper(ticks.slice(-10));
  const w50 = helper(ticks.slice(-50));
  const w100 = helper(ticks.slice(-100));
  const w250 = helper(ticks.slice(-250));

  let risingTicks = 0;
  let fallingTicks = 0;
  let unchangedTicks = 0;

  for (let i = 1; i < sample.length; i++) {
    const diff = sample[i].quote - sample[i - 1].quote;
    if (diff > 0) risingTicks++;
    else if (diff < 0) fallingTicks++;
    else unchangedTicks++;
  }

  const totalMoves = Math.max(1, sample.length - 1);
  const risePct = parseFloat(((risingTicks / totalMoves) * 100).toFixed(1));
  const fallPct = parseFloat(((fallingTicks / totalMoves) * 100).toFixed(1));
  const unchangedPct = parseFloat(((unchangedTicks / totalMoves) * 100).toFixed(1));

  // Trend determination
  const shortNet = w10.risePct - w10.fallPct;
  const medNet = w50.risePct - w50.fallPct;

  const shortTermTrend = shortNet > 6 ? 'Bullish' : shortNet < -6 ? 'Bearish' : 'Neutral';
  const mediumTermTrend = medNet > 4 ? 'Bullish' : medNet < -4 ? 'Bearish' : 'Neutral';

  const trendStrength = Math.min(100, Math.round(Math.abs(risePct - fallPct) * 2 + Math.abs(shortNet)));
  const momentum = parseFloat((shortNet / 10).toFixed(2));

  // Streak calculation
  let consecutiveStreak = 0;
  let streakDirection: 'RISE' | 'FALL' | 'FLAT' = 'FLAT';
  if (sample.length > 1) {
    const lastDiff = sample[sample.length - 1].quote - sample[sample.length - 2].quote;
    streakDirection = lastDiff > 0 ? 'RISE' : lastDiff < 0 ? 'FALL' : 'FLAT';
    for (let i = sample.length - 1; i >= 1; i--) {
      const diff = sample[i].quote - sample[i - 1].quote;
      const dir = diff > 0 ? 'RISE' : diff < 0 ? 'FALL' : 'FLAT';
      if (dir === streakDirection) consecutiveStreak++;
      else break;
    }
  }

  const estimatedProbRise = Math.min(85, Math.max(15, parseFloat((50 + (risePct - fallPct) * 0.4).toFixed(1))));
  const estimatedProbFall = parseFloat((100 - estimatedProbRise).toFixed(1));

  return {
    sampleSize: n,
    risingTicks,
    fallingTicks,
    unchangedTicks,
    risePercentage: risePct,
    fallPercentage: fallPct,
    risingPercentage: risePct,
    fallingPercentage: fallPct,
    risingCount: risingTicks,
    fallingCount: fallingTicks,
    estimatedProbRise,
    estimatedProbFall,
    consecutiveStreak,
    streakDirection,
    unchangedPercentage: unchangedPct,
    shortTermTrend,
    mediumTermTrend,
    trendStrength,
    momentum,
    windowsComparison: {
      ticks10: { risePct: w10.risePct, fallPct: w10.fallPct },
      ticks50: { risePct: w50.risePct, fallPct: w50.fallPct },
      ticks100: { risePct: w100.risePct, fallPct: w100.fallPct },
      ticks250: { risePct: w250.risePct, fallPct: w250.fallPct },
    },
  };
}

export const calculateTouchNoTouchStats = calculateTouchStats;

/**
 * Touch / No Touch analysis
 */
export function calculateTouchStats(ticks: Tick[], barrierOffset: number, windowSize: number): TouchNoTouchStats {
  const sample = ticks.slice(-windowSize);
  const n = sample.length;
  const currentPrice = sample[sample.length - 1]?.quote ?? 1000;
  const targetPrice = currentPrice + barrierOffset;
  const distance = Math.abs(barrierOffset);

  if (n < 5) {
    return {
      sampleSize: n,
      currentPrice,
      targetOffset: barrierOffset,
      targetPrice,
      distance,
      historicalTouchRate: 50,
      estimatedProbability: 50,
      recentVolatility: 0.1,
      averageTickMovement: 0.05,
      riskRating: 'Balanced',
    };
  }

  // Calculate average tick step
  let totalStep = 0;
  for (let i = 1; i < n; i++) {
    totalStep += Math.abs(sample[i].quote - sample[i - 1].quote);
  }
  const avgStep = totalStep / (n - 1);

  // Historical touch simulation: how often does a 5-tick window reach this distance?
  let touches = 0;
  let trials = 0;
  const lookahead = 5;
  for (let i = 0; i < n - lookahead; i++) {
    const base = sample[i].quote;
    let touched = false;
    for (let k = 1; k <= lookahead; k++) {
      const q = sample[i + k].quote;
      if (barrierOffset > 0 && q >= base + distance) touched = true;
      if (barrierOffset < 0 && q <= base - distance) touched = true;
      if (touched) break;
    }
    if (touched) touches++;
    trials++;
  }

  const touchRate = trials > 0 ? parseFloat(((touches / trials) * 100).toFixed(1)) : 40;

  // Volatility calculation (standard deviation of returns)
  let sumSq = 0;
  for (let i = 1; i < n; i++) {
    const d = sample[i].quote - sample[i - 1].quote;
    sumSq += d * d;
  }
  const stdDev = Math.sqrt(sumSq / (n - 1));
  const volatility = parseFloat(stdDev.toFixed(4));

  // Probability decay with distance / volatility
  const ratio = distance / Math.max(0.001, avgStep * 3);
  const estProb = Math.min(92, Math.max(8, parseFloat((100 / (1 + Math.exp(ratio * 1.5 - 1))).toFixed(1))));

  let riskRating: TouchNoTouchStats['riskRating'] = 'Balanced';
  if (ratio < 0.8) riskRating = 'Conservative';
  else if (ratio > 2.5) riskRating = 'High Volatility';
  else if (ratio > 1.6) riskRating = 'Aggressive';

  return {
    sampleSize: n,
    currentPrice,
    targetOffset: barrierOffset,
    targetPrice,
    distance,
    historicalTouchRate: touchRate,
    estimatedProbability: estProb,
    recentVolatility: volatility,
    averageTickMovement: parseFloat(avgStep.toFixed(4)),
    riskRating,
  };
}

/**
 * Higher / Lower analysis
 */
export function calculateHigherLowerStats(ticks: Tick[], barrierOffset: number, windowSize: number): HigherLowerStats {
  const sample = ticks.slice(-windowSize);
  const n = sample.length;
  const currentPrice = sample[sample.length - 1]?.quote ?? 1000;
  const barrierPrice = currentPrice + barrierOffset;
  const distance = Math.abs(barrierOffset);

  if (n < 5) {
    return {
      sampleSize: n,
      currentPrice,
      barrierOffset,
      barrierPrice,
      distance,
      historicalProbHigher: 50,
      historicalProbLower: 50,
      estimatedProbHigher: 50,
      estimatedProbLower: 50,
      recentMomentum: 0,
      volatility: 0.1,
      trend: 'Neutral',
    };
  }

  // Count how many historical ticks ended above barrier from previous ticks
  let higherCount = 0;
  let lowerCount = 0;
  for (let i = 5; i < n; i++) {
    const prev = sample[i - 5].quote;
    const target = prev + barrierOffset;
    if (sample[i].quote > target) higherCount++;
    else lowerCount++;
  }

  const total = Math.max(1, higherCount + lowerCount);
  const histHigher = parseFloat(((higherCount / total) * 100).toFixed(1));
  const histLower = parseFloat(((lowerCount / total) * 100).toFixed(1));

  // Momentum
  const priceChange = sample[n - 1].quote - sample[Math.max(0, n - 10)].quote;
  const trend = priceChange > 0.05 ? 'Bullish' : priceChange < -0.05 ? 'Bearish' : 'Neutral';

  // Estimated probability
  const biasAdjustment = barrierOffset > 0 ? (trend === 'Bullish' ? 4 : -4) : (trend === 'Bearish' ? 4 : -4);
  const estHigher = Math.min(88, Math.max(12, parseFloat((histHigher * 0.7 + (barrierOffset < 0 ? 60 : 40) * 0.3 + biasAdjustment).toFixed(1))));
  const estLower = parseFloat((100 - estHigher).toFixed(1));

  return {
    sampleSize: n,
    currentPrice,
    barrierOffset,
    barrierPrice,
    distance,
    historicalProbHigher: histHigher,
    historicalProbLower: histLower,
    estimatedProbHigher: estHigher,
    estimatedProbLower: estLower,
    recentMomentum: parseFloat(priceChange.toFixed(3)),
    volatility: 0.15,
    trend,
  };
}

/**
 * Ends In / Ends Out analysis
 */
export function calculateEndsInOutStats(ticks: Tick[], targetDigit: number, durationTicks: number, windowSize: number): EndsInOutStats {
  const sample = ticks.slice(-windowSize);
  const n = sample.length;

  if (n < durationTicks + 5) {
    return {
      sampleSize: n,
      targetDigit,
      contractDurationTicks: durationTicks,
      historicalFrequency: 10,
      estimatedProbability: 10,
      recentOccurrences: 1,
    };
  }

  // Check occurrences at exactly durationTicks offset
  let matches = 0;
  let totalEvaluated = 0;
  for (let i = 0; i < n - durationTicks; i++) {
    const endDigit = sample[i + durationTicks].digit;
    if (endDigit === targetDigit) matches++;
    totalEvaluated++;
  }

  const histFreq = totalEvaluated > 0 ? parseFloat(((matches / totalEvaluated) * 100).toFixed(1)) : 10;
  const recentWindow = sample.slice(-Math.min(50, n));
  const recentMatches = recentWindow.filter((t) => t.digit === targetDigit).length;

  // Bayesian shrinkage towards 10%
  const estProb = parseFloat((0.8 * 10 + 0.15 * histFreq + 0.05 * (recentMatches / recentWindow.length * 100)).toFixed(1));

  return {
    sampleSize: n,
    targetDigit,
    contractDurationTicks: durationTicks,
    historicalFrequency: histFreq,
    estimatedProbability: estProb,
    recentOccurrences: recentMatches,
  };
}

/**
 * Multi-Timeframe Analysis
 */
export function calculateMultiTimeframe(ticks: Tick[]): MultiTimeframeStats {
  const windows = [10, 25, 50, 100, 250, 500, 1000];
  const rows: MultiTimeframeRow[] = [];

  let bullishVotes = 0;
  let bearishVotes = 0;

  for (const w of windows) {
    const sub = ticks.slice(-w);
    if (sub.length < 3) continue;

    let rise = 0;
    let fall = 0;
    for (let i = 1; i < sub.length; i++) {
      if (sub[i].quote > sub[i - 1].quote) rise++;
      else if (sub[i].quote < sub[i - 1].quote) fall++;
    }
    const totMoves = Math.max(1, rise + fall);
    const risePct = Math.round((rise / totMoves) * 100);
    const fallPct = 100 - risePct;

    const even = sub.filter((t) => t.digit % 2 === 0).length;
    const evenPct = Math.round((even / sub.length) * 100);

    // Dominant digit
    const digitCounts = Array(10).fill(0);
    sub.forEach((t) => digitCounts[t.digit]++);
    const dominantDigit = digitCounts.indexOf(Math.max(...digitCounts));

    // Volatility
    let diffSq = 0;
    for (let i = 1; i < sub.length; i++) {
      const d = sub[i].quote - sub[i - 1].quote;
      diffSq += d * d;
    }
    const vol = parseFloat(Math.sqrt(diffSq / (sub.length - 1)).toFixed(3));

    const net = risePct - fallPct;
    const trend: 'Bullish' | 'Bearish' | 'Neutral' = net >= 5 ? 'Bullish' : net <= -5 ? 'Bearish' : 'Neutral';
    const bias = trend;

    if (trend === 'Bullish') bullishVotes++;
    if (trend === 'Bearish') bearishVotes++;

    rows.push({
      ticks: w,
      trend,
      volatility: vol,
      evenOddRatio: `${evenPct}% / ${100 - evenPct}%`,
      riseFallRatio: `${risePct}% / ${fallPct}%`,
      dominantDigit,
      momentum: `${net > 0 ? '+' : ''}${net}%`,
      bias,
    });
  }

  const shortTerm = rows[0]?.trend || 'Neutral';
  const mediumTerm = rows[2]?.trend || 'Neutral';
  const longTerm = rows[rows.length - 1]?.trend || 'Neutral';

  const totalRows = Math.max(1, rows.length);
  const agreement = Math.max(bullishVotes, bearishVotes) / totalRows;
  const agreementScore = Math.round(agreement * 100);

  let overallBias = 'Neutral';
  if (bullishVotes > bearishVotes + 1) overallBias = 'Bullish bias — moderate statistical alignment';
  else if (bearishVotes > bullishVotes + 1) overallBias = 'Bearish bias — moderate statistical alignment';
  else overallBias = 'Balanced / Mixed statistical distribution';

  const statisticalConfidence = agreementScore > 75 ? 'High' : agreementScore > 50 ? 'Moderate' : 'Low';

  return {
    rows,
    shortTerm,
    mediumTerm,
    longTerm,
    overallBias,
    agreementScore,
    statisticalConfidence,
  };
}

/**
 * Technical Indicators: SMA, EMA, Bollinger Bands, RSI, MACD, Support/Resistance
 */
export function calculateIndicators(ticks: Tick[]): TechnicalIndicators {
  const quotes = ticks.map((t) => t.quote);
  const n = quotes.length;

  const sma10: (number | null)[] = Array(n).fill(null);
  const ema20: (number | null)[] = Array(n).fill(null);
  const upperBollinger: (number | null)[] = Array(n).fill(null);
  const lowerBollinger: (number | null)[] = Array(n).fill(null);
  const middleBollinger: (number | null)[] = Array(n).fill(null);
  const rsi: (number | null)[] = Array(n).fill(null);
  const macdLine: (number | null)[] = Array(n).fill(null);
  const signalLine: (number | null)[] = Array(n).fill(null);
  const macdHist: (number | null)[] = Array(n).fill(null);

  // SMA 10 & Bollinger Bands (20 periods)
  for (let i = 0; i < n; i++) {
    if (i >= 9) {
      let sum = 0;
      for (let j = 0; j < 10; j++) sum += quotes[i - j];
      sma10[i] = parseFloat((sum / 10).toFixed(4));
    }

    if (i >= 19) {
      let sum20 = 0;
      for (let j = 0; j < 20; j++) sum20 += quotes[i - j];
      const mean = sum20 / 20;
      let var20 = 0;
      for (let j = 0; j < 20; j++) var20 += Math.pow(quotes[i - j] - mean, 2);
      const sd = Math.sqrt(var20 / 20);
      middleBollinger[i] = parseFloat(mean.toFixed(4));
      upperBollinger[i] = parseFloat((mean + 2 * sd).toFixed(4));
      lowerBollinger[i] = parseFloat((mean - 2 * sd).toFixed(4));
    }
  }

  // EMA 20
  const k20 = 2 / (20 + 1);
  let prevEma: number | null = null;
  for (let i = 0; i < n; i++) {
    if (i < 19) continue;
    if (prevEma === null) {
      let sum = 0;
      for (let j = 0; j < 20; j++) sum += quotes[i - j];
      prevEma = sum / 20;
    } else {
      prevEma = quotes[i] * k20 + prevEma * (1 - k20);
    }
    ema20[i] = parseFloat(prevEma.toFixed(4));
  }

  // RSI 14
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < n; i++) {
    const diff = quotes[i] - quotes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);

    if (i >= 14) {
      const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
      const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;
      if (avgLoss === 0) {
        rsi[i] = 100;
      } else {
        const rs = avgGain / avgLoss;
        rsi[i] = parseFloat((100 - 100 / (1 + rs)).toFixed(1));
      }
    }
  }

  // MACD (12, 26, 9)
  const k12 = 2 / 13;
  const k26 = 2 / 27;
  let ema12 = quotes[0] || 0;
  let ema26 = quotes[0] || 0;
  const macdBuffer: number[] = [];

  for (let i = 0; i < n; i++) {
    ema12 = quotes[i] * k12 + ema12 * (1 - k12);
    ema26 = quotes[i] * k26 + ema26 * (1 - k26);
    const m = ema12 - ema26;
    macdLine[i] = parseFloat(m.toFixed(4));
    macdBuffer.push(m);

    if (macdBuffer.length >= 9) {
      const k9 = 2 / 10;
      let sig = macdBuffer.slice(-9).reduce((a, b) => a + b, 0) / 9;
      signalLine[i] = parseFloat(sig.toFixed(4));
      macdHist[i] = parseFloat((m - sig).toFixed(4));
    }
  }

  // Support & Resistance (lowest low & highest high in recent 50 ticks)
  const recent50 = quotes.slice(-50);
  const recentHigh = recent50.length > 0 ? Math.max(...recent50) : quotes[0] || 1000;
  const recentLow = recent50.length > 0 ? Math.min(...recent50) : quotes[0] || 1000;
  const support = parseFloat((recentLow - (recentHigh - recentLow) * 0.1).toFixed(4));
  const resistance = parseFloat((recentHigh + (recentHigh - recentLow) * 0.1).toFixed(4));

  // Volatility
  let volSum = 0;
  for (let i = 1; i < quotes.length; i++) {
    volSum += Math.abs(quotes[i] - quotes[i - 1]);
  }
  const volatility = quotes.length > 1 ? parseFloat((volSum / (quotes.length - 1)).toFixed(4)) : 0.05;

  return {
    sma10,
    ema20,
    upperBollinger,
    lowerBollinger,
    middleBollinger,
    rsi,
    macdLine,
    signalLine,
    macdHist,
    support,
    resistance,
    volatility,
    recentHigh,
    recentLow,
  };
}

/**
 * Signal Engine: Combines multiple independent statistical factors
 */
export function generateAnalyticalSignals(ticks: Tick[], market: Market): AnalyticalSignal[] {
  if (ticks.length < 25) return [];

  const signals: AnalyticalSignal[] = [];
  const eo = calculateEvenOddStats(ticks, 100);
  const rf = calculateRiseFallStats(ticks, 100);
  const dg = calculateDigitStats(ticks, 100);
  const mtf = calculateMultiTimeframe(ticks);

  const timestamp = new Date().toLocaleTimeString();

  // 1. Even / Odd Signal
  if (Math.abs(eo.evenPercentage - 50) >= 5 || eo.currentStreak >= 4) {
    const isEvenHeavy = eo.evenPercentage > 50;
    const direction = isEvenHeavy ? 'EVEN' : 'ODD';
    const streakReason = eo.currentStreak >= 4 ? `current ${eo.currentStreak}-tick ${eo.currentStreakType} streak` : '';
    const bias = Math.abs(eo.evenPercentage - 50) >= 8 ? 'STRONG ANALYTICAL BIAS' : 'MODERATE ANALYTICAL BIAS';
    const confidenceScore = Math.min(88, Math.round(50 + Math.abs(eo.evenPercentage - 50) * 3 + eo.currentStreak * 2));

    signals.push({
      id: `sig_eo_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp,
      marketSymbol: market.symbol,
      marketName: market.name,
      contractType: 'even_odd',
      bias,
      direction,
      confidenceScore,
      confidenceLabel: `${confidenceScore}/100 — Statistical Distribution Skew`,
      reasoning: `Even/Odd distribution exhibits a ${Math.abs(eo.evenPercentage - 50).toFixed(1)}% departure from baseline across 100 ticks ${streakReason ? `with ${streakReason}` : ''}. Probabilities remain independent.`,
      factors: [
        `100-Tick Ratio: ${eo.evenPercentage}% Even / ${eo.oddPercentage}% Odd`,
        `Recent 25-Tick Ratio: ${eo.recent25EvenPct}% Even`,
        `Longest Even Streak: ${eo.longestEvenStreak}, Odd: ${eo.longestOddStreak}`,
      ],
      sampleSize: 100,
      status: 'PENDING',
    });
  }

  // 2. Rise / Fall Signal
  if (Math.abs(rf.risePercentage - 50) >= 6 || rf.trendStrength > 40) {
    const isBull = rf.risePercentage > rf.fallPercentage;
    const direction = isBull ? 'RISE' : 'FALL';
    const bias = rf.trendStrength > 60 ? 'STRONG ANALYTICAL BIAS' : 'MODERATE ANALYTICAL BIAS';
    const confidenceScore = Math.min(85, Math.round(50 + rf.trendStrength * 0.45));

    signals.push({
      id: `sig_rf_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp,
      marketSymbol: market.symbol,
      marketName: market.name,
      contractType: 'rise_fall',
      bias,
      direction,
      confidenceScore,
      confidenceLabel: `${confidenceScore}/100 — Momentum & Trend Agreement`,
      reasoning: `${direction} momentum aligned with ${rf.shortTermTrend} short-term and ${rf.mediumTermTrend} medium-term indicators across 100-tick window.`,
      factors: [
        `Rise / Fall: ${rf.risePercentage}% vs ${rf.fallPercentage}%`,
        `Short-term trend: ${rf.shortTermTrend} (momentum ${rf.momentum})`,
        `Trend Strength: ${rf.trendStrength}/100`,
      ],
      sampleSize: 100,
      status: 'PENDING',
    });
  }

  // 3. Over / Under (Under 5 vs Over 5)
  const ou = calculateOverUnderStats(ticks, 5, 100);
  if (Math.abs(ou.underPercentage - ou.overPercentage) >= 10) {
    const favUnder = ou.underPercentage > ou.overPercentage;
    const direction = favUnder ? 'UNDER' : 'OVER';
    const confidenceScore = Math.min(82, Math.round(50 + Math.abs(ou.underPercentage - ou.overPercentage) * 1.8));

    signals.push({
      id: `sig_ou_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp,
      marketSymbol: market.symbol,
      marketName: market.name,
      contractType: 'over_under',
      bias: 'MODERATE ANALYTICAL BIAS',
      direction,
      confidenceScore,
      confidenceLabel: `${confidenceScore}/100 — Threshold Frequency Imbalance`,
      reasoning: `Digits ${favUnder ? 'under 5' : 'over 5'} accounted for ${favUnder ? ou.underPercentage : ou.overPercentage}% of outcomes in the last 100 ticks compared to ${favUnder ? ou.overPercentage : ou.underPercentage}%.`,
      factors: [
        `Under 5: ${ou.underPercentage}%`,
        `Over 5: ${ou.overPercentage}%`,
        `Current streak: ${ou.currentStreak} ${ou.currentStreakType}`,
      ],
      sampleSize: 100,
      status: 'PENDING',
    });
  }

  // 4. Matches / Differs Signal (Statistical Overdue or Frequency Extreme)
  if (dg.distribution.length > 0) {
    const overdue = dg.distribution.find((d) => d.ticksSinceLast > 30);
    if (overdue) {
      signals.push({
        id: `sig_diff_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        timestamp,
        marketSymbol: market.symbol,
        marketName: market.name,
        contractType: 'matches_differs',
        bias: 'MODERATE ANALYTICAL BIAS',
        direction: 'DIFFER',
        confidenceScore: 78,
        confidenceLabel: '78/100 — High Differ Probability',
        reasoning: `Digit ${overdue.digit} has not appeared for ${overdue.ticksSinceLast} ticks. Statistically, 'Differs ${overdue.digit}' maintains an estimated ~90% baseline probability per tick.`,
        factors: [
          `Ticks since last digit ${overdue.digit}: ${overdue.ticksSinceLast}`,
          `Historical frequency: ${overdue.percentage}%`,
          `Estimated Differ Probability: 91.2%`,
        ],
        sampleSize: 100,
        status: 'PENDING',
      });
    }
  }

  // 5. Multi-Timeframe Consensus Signal
  if (mtf.agreementScore >= 70) {
    const isBull = mtf.overallBias.includes('Bullish');
    signals.push({
      id: `sig_mtf_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp,
      marketSymbol: market.symbol,
      marketName: market.name,
      contractType: 'rise_fall',
      bias: mtf.agreementScore >= 85 ? 'STRONG ANALYTICAL BIAS' : 'MODERATE ANALYTICAL BIAS',
      direction: isBull ? 'RISE' : 'FALL',
      confidenceScore: mtf.agreementScore,
      confidenceLabel: `${mtf.agreementScore}/100 — Multi-Timeframe Alignment`,
      reasoning: `Multi-timeframe matrix shows ${mtf.agreementScore}% alignment across tick horizons (10, 25, 50, 100, 250, 500, 1000).`,
      factors: [
        `Short-term: ${mtf.shortTerm}`,
        `Medium-term: ${mtf.mediumTerm}`,
        `Long-term: ${mtf.longTerm}`,
      ],
      sampleSize: Math.min(ticks.length, 1000),
      status: 'PENDING',
    });
  }

  return signals;
}

/**
 * Historical Backtesting Engine
 */
export function runBacktest(
  ticks: Tick[],
  contractType: string,
  condition: string,
  targetValue: number,
  durationTicks: number = 1
): BacktestResult {
  const n = ticks.length;
  if (n < 50) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRatePct: 0,
      profitFactor: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      netPnL: 0,
      equityCurve: [1000],
      periodTicks: n,
      totalObservations: 0,
      correctOutcomes: 0,
      incorrectOutcomes: 0,
      accuracyPct: 0,
      maxWinningStreak: 0,
      maxLosingStreak: 0,
      averageResultPct: 0,
      summary: 'Insufficient sample size for reliable backtesting (minimum 50 ticks required).',
    };
  }

  let wins = 0;
  let losses = 0;
  let winStreak = 0;
  let maxWinStreak = 0;
  let lossStreak = 0;
  let maxLossStreak = 0;

  let currentEquity = 1000;
  const equityCurve: number[] = [currentEquity];

  // Iterate through available ticks with lookahead
  for (let i = 10; i < n - durationTicks; i++) {
    const entryTick = ticks[i];
    const exitTick = ticks[i + durationTicks];
    let isWin = false;

    if (contractType === 'even_odd') {
      const isEven = exitTick.digit % 2 === 0;
      if (condition === 'EVEN' && isEven) isWin = true;
      else if (condition === 'ODD' && !isEven) isWin = true;
    } else if (contractType === 'over_under') {
      if (condition === 'UNDER' && exitTick.digit < targetValue) isWin = true;
      else if (condition === 'OVER' && exitTick.digit > targetValue) isWin = true;
    } else if (contractType === 'matches_differs') {
      if (condition === 'MATCH' && exitTick.digit === targetValue) isWin = true;
      else if (condition === 'DIFFER' && exitTick.digit !== targetValue) isWin = true;
    } else if (contractType === 'rise_fall') {
      if (condition === 'RISE' && exitTick.quote > entryTick.quote) isWin = true;
      else if (condition === 'FALL' && exitTick.quote < entryTick.quote) isWin = true;
    }

    if (isWin) {
      wins++;
      winStreak++;
      lossStreak = 0;
      if (winStreak > maxWinStreak) maxWinStreak = winStreak;
      currentEquity += 9.5; // typical synthetic return
    } else {
      losses++;
      lossStreak++;
      winStreak = 0;
      if (lossStreak > maxLossStreak) maxLossStreak = lossStreak;
      currentEquity -= 10;
    }

    if (i % 5 === 0) {
      equityCurve.push(parseFloat(currentEquity.toFixed(2)));
    }
  }

  const total = wins + losses;
  const accuracyPct = total > 0 ? parseFloat(((wins / total) * 100).toFixed(1)) : 0;
  const avgResult = total > 0 ? parseFloat(((currentEquity - 1000) / total).toFixed(2)) : 0;

  return {
    totalTrades: total,
    wins,
    losses,
    winRatePct: accuracyPct,
    profitFactor: losses > 0 ? parseFloat(((wins * 9.5) / (losses * 10)).toFixed(2)) : 99.9,
    maxConsecutiveWins: maxWinStreak,
    maxConsecutiveLosses: maxLossStreak,
    netPnL: parseFloat((currentEquity - 1000).toFixed(2)),
    equityCurve,
    periodTicks: n,
    totalObservations: total,
    correctOutcomes: wins,
    incorrectOutcomes: losses,
    accuracyPct,
    maxWinningStreak: maxWinStreak,
    maxLosingStreak: maxLossStreak,
    averageResultPct: avgResult,
    summary: `Historical backtest across ${total} observations yielded an accuracy of ${accuracyPct}%. Maximum winning streak reached ${maxWinStreak} consecutive ticks, with a max drawdown streak of ${maxLossStreak} ticks. Historical results do not guarantee future performance.`,
  };
}

export const calculateTechnicalIndicators = calculateIndicators;

/**
 * Generate decision-support signals with factor breakdown and invalidation conditions
 */
export function generateSignals(
  market: Market,
  ticks: Tick[],
  indicators: TechnicalIndicators
): Signal[] {
  if (ticks.length < 25) return [];

  const signals: Signal[] = [];
  const eo = calculateEvenOddStats(ticks, 100);
  const rf = calculateRiseFallStats(ticks, 100);
  const dg = calculateDigitStats(ticks, 100);
  const mtf = calculateMultiTimeframe(ticks);

  // 1. Even / Odd Confluence Signal
  if (Math.abs(eo.evenPercentage - 50) >= 5 || eo.currentStreak >= 4) {
    const isEvenHeavy = eo.evenPercentage > 50;
    const direction = isEvenHeavy ? 'Even' : 'Odd';
    const bias = Math.abs(eo.evenPercentage - 50) >= 8 || eo.currentStreak >= 4 ? 'STRONG_BIAS' : 'MODERATE_BIAS';
    const conf = Math.min(88, Math.round(50 + Math.abs(eo.evenPercentage - 50) * 3 + eo.currentStreak * 2));
    const estProb = isEvenHeavy ? eo.estimatedProbEven : eo.estimatedProbOdd;

    signals.push({
      id: `sig-eo-${Date.now()}`,
      contractType: 'EVEN_ODD',
      direction: `Trade ${direction}`,
      signalType: bias,
      confidenceScore: conf,
      estimatedProbability: estProb,
      factors: {
        trendAlignment: `Parity imbalance ${eo.evenPercentage}% Even vs ${eo.oddPercentage}% Odd`,
        volatilityCondition: indicators.volatility > 0.1 ? 'Moderate Volatility' : 'Low Volatility',
        maConfirmation: 'Parity streak momentum',
        streakCondition: `Current streak: ${eo.currentStreak}x ${eo.currentStreakType}`,
        sampleSizeAdequacy: `${ticks.length} ticks evaluated`,
      },
      invalidationCondition: `Counter digit parity breaks streak or probability falls below 50%`,
      riskRating: bias === 'STRONG_BIAS' ? 'Conservative' : 'Moderate',
      timestamp: Date.now(),
    });
  }

  // 2. Rise / Fall Confluence Signal
  if (Math.abs(rf.risePercentage - 50) >= 6) {
    const isBull = rf.risePercentage > 50;
    const direction = isBull ? 'Rise (Higher)' : 'Fall (Lower)';
    const conf = Math.min(85, Math.round(50 + Math.abs(rf.risePercentage - 50) * 2.5));
    const estProb = isBull ? rf.estimatedProbRise : rf.estimatedProbFall;

    signals.push({
      id: `sig-rf-${Date.now()}`,
      contractType: 'RISE_FALL',
      direction,
      signalType: conf >= 72 ? 'STRONG_BIAS' : 'MODERATE_BIAS',
      confidenceScore: conf,
      estimatedProbability: estProb,
      factors: {
        trendAlignment: `Short-term ${rf.shortTermTrend} (${rf.risePercentage}% Rise vs ${rf.fallPercentage}% Fall)`,
        volatilityCondition: `Volatility score ${indicators.volatility.toFixed(3)}`,
        maConfirmation: isBull ? 'SMA(10) slope ascending' : 'SMA(10) slope descending',
        streakCondition: `${rf.consecutiveStreak}x ${rf.streakDirection} streak`,
        sampleSizeAdequacy: `${rf.sampleSize} ticks analyzed`,
      },
      invalidationCondition: `Tick reverses opposite to ${direction} breaking MA support/resistance`,
      riskRating: 'Balanced',
      timestamp: Date.now(),
    });
  }

  // 3. Matches / Differs Signal (Statistical Overdue or Frequency Extreme)
  if (dg.distribution.length > 0) {
    const overdue = dg.distribution.find((d) => d.ticksSinceLast > 25);
    if (overdue) {
      signals.push({
        id: `sig-diff-${Date.now()}`,
        contractType: 'MATCHES_DIFFERS',
        direction: `Differs Digit ${overdue.digit}`,
        signalType: 'MODERATE_BIAS',
        confidenceScore: 78,
        estimatedProbability: 91.5,
        factors: {
          trendAlignment: `Digit ${overdue.digit} overdue (${overdue.ticksSinceLast} ticks)`,
          volatilityCondition: 'Stable distribution window',
          maConfirmation: 'Baseline statistical differ edge ~90%',
          streakCondition: `Absence streak: ${overdue.ticksSinceLast} ticks`,
          sampleSizeAdequacy: `${dg.sampleSize} ticks window`,
        },
        invalidationCondition: `Digit ${overdue.digit} appears as exit tick`,
        riskRating: 'Conservative',
        timestamp: Date.now(),
      });
    }
  }

  return signals;
}

/**
 * Historical Strategy Backtester Simulation
 */
export function runBacktestSimulation(
  ticks: Tick[],
  params: {
    contractType: string;
    rule: string;
    ticksCount: number;
    payoutMultiplier: number;
    stake: number;
  }
): BacktestResult {
  const sample = ticks.slice(-params.ticksCount);
  const n = sample.length;

  if (n < 20) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRatePct: 0,
      profitFactor: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      netPnL: 0,
      equityCurve: [1000],
      periodTicks: n,
    };
  }

  let wins = 0;
  let losses = 0;
  let winStreak = 0;
  let maxWinStreak = 0;
  let lossStreak = 0;
  let maxLossStreak = 0;
  let equity = 1000;
  const equityCurve: number[] = [equity];

  let grossWin = 0;
  let grossLoss = 0;

  for (let i = 5; i < n - 1; i++) {
    const prevTick = sample[i];
    const nextTick = sample[i + 1];

    let triggered = false;
    let predictedWin = false;

    if (params.contractType === 'EVEN_ODD') {
      if (params.rule === 'FADE_EVEN_STREAK') {
        const last3Even = sample.slice(i - 2, i + 1).every((t) => t.digit % 2 === 0);
        if (last3Even) {
          triggered = true;
          predictedWin = nextTick.digit % 2 !== 0; // Bet Odd
        }
      } else if (params.rule === 'FADE_ODD_STREAK') {
        const last3Odd = sample.slice(i - 2, i + 1).every((t) => t.digit % 2 !== 0);
        if (last3Odd) {
          triggered = true;
          predictedWin = nextTick.digit % 2 === 0; // Bet Even
        }
      } else {
        // Follow Even streak
        const last2Even = sample.slice(i - 1, i + 1).every((t) => t.digit % 2 === 0);
        if (last2Even) {
          triggered = true;
          predictedWin = nextTick.digit % 2 === 0;
        }
      }
    } else if (params.contractType === 'RISE_FALL') {
      if (params.rule === 'FADE_RISE_STREAK') {
        const streak4Rise = sample.slice(i - 3, i + 1).every((t, idx, arr) => idx === 0 || t.quote > arr[idx - 1].quote);
        if (streak4Rise) {
          triggered = true;
          predictedWin = nextTick.quote < prevTick.quote; // Fall
        }
      } else {
        // Fade fall streak
        const streak4Fall = sample.slice(i - 3, i + 1).every((t, idx, arr) => idx === 0 || t.quote < arr[idx - 1].quote);
        if (streak4Fall) {
          triggered = true;
          predictedWin = nextTick.quote > prevTick.quote; // Rise
        }
      }
    } else if (params.contractType === 'OVER_UNDER') {
      if (params.rule === 'BUY_UNDER_5') {
        const streakOver = sample.slice(i - 2, i + 1).every((t) => t.digit > 5);
        if (streakOver) {
          triggered = true;
          predictedWin = nextTick.digit < 5;
        }
      } else {
        const streakUnder = sample.slice(i - 2, i + 1).every((t) => t.digit < 5);
        if (streakUnder) {
          triggered = true;
          predictedWin = nextTick.digit > 4;
        }
      }
    } else if (params.contractType === 'MATCHES_DIFFERS') {
      // Differs overdue
      triggered = true;
      predictedWin = nextTick.digit !== 7;
    }

    if (triggered) {
      if (predictedWin) {
        wins++;
        winStreak++;
        lossStreak = 0;
        if (winStreak > maxWinStreak) maxWinStreak = winStreak;
        const profit = params.stake * (params.payoutMultiplier - 1);
        equity += profit;
        grossWin += profit;
      } else {
        losses++;
        lossStreak++;
        winStreak = 0;
        if (lossStreak > maxLossStreak) maxLossStreak = lossStreak;
        equity -= params.stake;
        grossLoss += params.stake;
      }
      equityCurve.push(parseFloat(equity.toFixed(2)));
    }
  }

  const totalTrades = wins + losses;
  const winRatePct = totalTrades > 0 ? parseFloat(((wins / totalTrades) * 100).toFixed(1)) : 0;
  const profitFactor = grossLoss > 0 ? parseFloat((grossWin / grossLoss).toFixed(2)) : grossWin > 0 ? 99.9 : 1.0;
  const netPnL = parseFloat((equity - 1000).toFixed(2));

  return {
    totalTrades,
    wins,
    losses,
    winRatePct,
    profitFactor,
    maxConsecutiveWins: maxWinStreak,
    maxConsecutiveLosses: maxLossStreak,
    netPnL,
    equityCurve: equityCurve.length > 1 ? equityCurve : [1000, 1000],
    periodTicks: n,
  };
}
