export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR';

export type DataSourceMode = 'LIVE_WEBSOCKET' | 'DEMO_SIMULATION';

export type ContractType = 
  | 'even_odd'
  | 'over_under'
  | 'matches_differs'
  | 'digits'
  | 'rise_fall'
  | 'higher_lower'
  | 'touch_no_touch'
  | 'ends_in_out'
  | 'up_down'
  | 'call_put';

export interface Market {
  symbol: string;
  name: string;
  category: 'Volatility Indices' | 'Daily Reset' | 'Crash/Boom' | 'Step Indices' | 'Jump Indices';
  decimals: number;
  tickFrequency: string; // e.g. "1 tick/sec" or "2 sec"
  description: string;
  defaultPrice: number;
  volatilityRate: number; // For simulation/normalization
}

export interface Tick {
  epoch: number;
  quote: number;
  digit: number;
  previousDigit?: number;
  diff: number;
  direction: 'up' | 'down' | 'flat';
  isDemo?: boolean;
}

export interface DigitDetail {
  digit: number;
  count: number;
  percentage: number;
  recentCount: number; // e.g. in last 25 ticks
  streak: number; // current consecutive appearances or ticks since last seen
  ticksSinceLast: number;
  analysis: 'Above Expected' | 'Below Expected' | 'Near Expected' | 'Overdue (Statistical)';
}

export interface DigitStats {
  sampleSize: number;
  distribution: DigitDetail[];
  percentages: Record<number, number>;
  mostFrequentDigit: number;
  mostFrequentCount: number;
  mostFrequentPct: number;
  leastFrequentDigit: number;
  leastFrequentCount: number;
  leastFrequentPct: number;
  repeatPairsCount: number; // Consecutive identical digits
  maxRepeatedDigit: { digit: number; streak: number };
  transitions: number[][]; // 10x10 matrix of fromDigit -> toDigit
  momentum: { digit: number; delta: number }[];
}

export interface EvenOddStats {
  sampleSize: number;
  evenCount: number;
  oddCount: number;
  evenPercentage: number;
  oddPercentage: number;
  currentStreak: number;
  currentStreakType: 'EVEN' | 'ODD' | 'NONE';
  longestEvenStreak: number;
  longestOddStreak: number;
  estimatedProbEven: number;
  estimatedProbOdd: number;
  confidence: 'Low' | 'Medium' | 'High';
  recent25EvenPct: number;
  recent25OddPct: number;
}

export interface OverUnderStats {
  sampleSize: number;
  threshold: number; // 0 to 9
  underCount: number;
  overCount: number;
  underPercentage: number;
  overPercentage: number;
  currentStreak: number;
  currentStreakType: 'UNDER' | 'OVER' | 'EQUAL' | 'NONE';
  longestUnderStreak: number;
  longestOverStreak: number;
  estimatedProbUnder: number;
  estimatedProbOver: number;
  recentUnderPct: number;
  recentOverPct: number;
}

export interface MatchesDiffersStats {
  sampleSize: number;
  targetDigit: number;
  matchesCount: number;
  differsCount: number;
  matchesPercentage: number;
  differsPercentage: number;
  currentStreak: number;
  streakType: 'MATCH' | 'DIFFER';
  estimatedProbMatches: number;
  estimatedProbDiffers: number;
  recentOccurrences: number;
}

export interface RiseFallStats {
  sampleSize: number;
  risingTicks: number;
  fallingTicks: number;
  unchangedTicks: number;
  risePercentage: number;
  fallPercentage: number;
  risingPercentage: number;
  fallingPercentage: number;
  risingCount: number;
  fallingCount: number;
  estimatedProbRise: number;
  estimatedProbFall: number;
  consecutiveStreak: number;
  streakDirection: 'RISE' | 'FALL' | 'FLAT';
  unchangedPercentage: number;
  shortTermTrend: 'Bullish' | 'Bearish' | 'Neutral';
  mediumTermTrend: 'Bullish' | 'Bearish' | 'Neutral';
  trendStrength: number; // 0 to 100
  momentum: number; // Rate of change
  windowsComparison: {
    ticks10: { risePct: number; fallPct: number };
    ticks50: { risePct: number; fallPct: number };
    ticks100: { risePct: number; fallPct: number };
    ticks250: { risePct: number; fallPct: number };
  };
}

export interface TouchNoTouchStats {
  sampleSize: number;
  currentPrice: number;
  targetOffset: number; // +/- offset from current price
  targetPrice: number;
  distance: number;
  historicalTouchRate: number; // percentage of historical ticks that touched this range
  estimatedProbability: number;
  recentVolatility: number;
  averageTickMovement: number;
  riskRating: 'Conservative' | 'Balanced' | 'Aggressive' | 'High Volatility';
}

export interface HigherLowerStats {
  sampleSize: number;
  currentPrice: number;
  barrierOffset: number;
  barrierPrice: number;
  distance: number;
  historicalProbHigher: number;
  historicalProbLower: number;
  estimatedProbHigher: number;
  estimatedProbLower: number;
  recentMomentum: number;
  volatility: number;
  trend: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface EndsInOutStats {
  sampleSize: number;
  targetDigit: number;
  contractDurationTicks: number;
  historicalFrequency: number;
  estimatedProbability: number;
  recentOccurrences: number;
}

export type SignalBias = 
  | 'STRONG ANALYTICAL BIAS'
  | 'MODERATE ANALYTICAL BIAS'
  | 'NEUTRAL'
  | 'HIGH UNCERTAINTY';

export interface AnalyticalSignal {
  id: string;
  timestamp: string;
  marketSymbol: string;
  marketName: string;
  contractType: ContractType;
  bias: SignalBias;
  direction: 'EVEN' | 'ODD' | 'OVER' | 'UNDER' | 'RISE' | 'FALL' | 'TOUCH' | 'NO_TOUCH' | 'HIGHER' | 'LOWER' | 'MATCH' | 'DIFFER' | 'NEUTRAL';
  confidenceScore: number; // 0 to 100
  confidenceLabel: string;
  reasoning: string;
  factors: string[];
  sampleSize: number;
  status: 'PENDING' | 'RESOLVED_ALIGNED' | 'RESOLVED_DIVERGED' | 'EXPIRED';
  resolvedTick?: number;
}

export interface MultiTimeframeRow {
  ticks: number;
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  volatility: number;
  evenOddRatio: string;
  riseFallRatio: string;
  dominantDigit: number;
  momentum: string;
  bias: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface MultiTimeframeStats {
  rows: MultiTimeframeRow[];
  shortTerm: 'Bullish' | 'Bearish' | 'Neutral';
  mediumTerm: 'Bullish' | 'Bearish' | 'Neutral';
  longTerm: 'Bullish' | 'Bearish' | 'Neutral';
  overallBias: string;
  agreementScore: number; // 0 - 100
  statisticalConfidence: 'Low' | 'Moderate' | 'High';
}

export interface TechnicalIndicators {
  sma10: (number | null)[];
  ema20: (number | null)[];
  upperBollinger: (number | null)[];
  lowerBollinger: (number | null)[];
  middleBollinger: (number | null)[];
  rsi: (number | null)[];
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  macdHist: (number | null)[];
  support: number;
  resistance: number;
  volatility: number;
  recentHigh: number;
  recentLow: number;
}

export interface AlertRule {
  id: string;
  title: string;
  marketSymbol: string;
  metric: 'digit_freq' | 'even_odd_imbalance' | 'volatility' | 'price_level' | 'confidence' | 'trend_change';
  operator: '>' | '<' | '==';
  value: number;
  targetDigit?: number;
  enabled: boolean;
  lastTriggered?: string;
  triggerCount: number;
}

export interface RiskSettings {
  accountBalance: number;
  maxRiskPerTradePct: number; // e.g. 2%
  dailyLossLimit: number; // e.g. $100
  maxConsecutiveLosses: number; // e.g. 4
  currentDayLoss: number;
  consecutiveLosses: number;
}

export interface BacktestRule {
  id: string;
  name: string;
  contractType: ContractType;
  condition: string;
  entryLogic: (tick: Tick, stats: any, prevTicks: Tick[]) => boolean;
  isWin: (entryTick: Tick, exitTick: Tick, param?: any) => boolean;
}

export interface BacktestResult {
  totalTrades: number;
  wins: number;
  losses: number;
  winRatePct: number;
  profitFactor: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  netPnL: number;
  equityCurve: number[];
  periodTicks: number;
  totalObservations?: number;
  correctOutcomes?: number;
  incorrectOutcomes?: number;
  accuracyPct?: number;
  maxWinningStreak?: number;
  maxLosingStreak?: number;
  averageResultPct?: number;
  summary?: string;
}

export interface SignalFactorBreakdown {
  trendAlignment: string;
  volatilityCondition: string;
  maConfirmation: string;
  streakCondition: string;
  sampleSizeAdequacy: string;
}

export interface Signal {
  id: string;
  contractType: string;
  direction: string;
  signalType: 'STRONG_BIAS' | 'MODERATE_BIAS' | 'NEUTRAL' | 'HIGH_UNCERTAINTY';
  confidenceScore: number;
  estimatedProbability: number;
  factors: SignalFactorBreakdown;
  invalidationCondition: string;
  riskRating: string;
  timestamp: number;
}

export interface SignalLog {
  id: string;
  timestamp: number;
  market: string;
  contractType: string;
  signalType: string;
  confidence: number;
  outcome: 'WIN' | 'LOSS' | 'PENDING';
  details: string;
}

export interface AiAnalystReport {
  summary: string;
  keyDigitInsights: string[];
  trendAssessment: string;
  potentialOpportunities: string[];
  riskConsiderations: string[];
  sampleSizeTransparency: number;
  conflictingIndicators: string[];
}

