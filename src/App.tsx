import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Sidebar, 
  ActiveTab 
} from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { TickChart } from './components/TickChart';
import { DigitAnalysisView } from './components/DigitAnalysisView';
import { EvenOddView } from './components/EvenOddView';
import { OverUnderView } from './components/OverUnderView';
import { MatchesDiffersView } from './components/MatchesDiffersView';
import { RiseFallView } from './components/RiseFallView';
import { TouchNoTouchView } from './components/TouchNoTouchView';
import { HigherLowerView } from './components/HigherLowerView';
import { EndsInOutView } from './components/EndsInOutView';
import { MultiTimeframeView } from './components/MultiTimeframeView';
import { SignalsView } from './components/SignalsView';
import { AiAnalystView } from './components/AiAnalystView';
import { BacktestingView } from './components/BacktestingView';
import { HistoryView } from './components/HistoryView';
import { AlertsView, AlertRule } from './components/AlertsView';
import { RiskManagementView } from './components/RiskManagementView';
import { SettingsView } from './components/SettingsView';
import { MarketsView } from './components/MarketsView';

import { 
  Market, 
  Tick, 
  ConnectionStatus, 
  DataSourceMode, 
  Signal, 
  SignalLog 
} from './types';
import { 
  marketDataManager, 
  SUPPORTED_MARKETS 
} from './services/marketDataProvider';
import { 
  calculateTechnicalIndicators, 
  generateSignals,
  calculateDigitStats,
  calculateEvenOddStats,
  calculateRiseFallStats
} from './utils/statistics';
import { soundEngine } from './utils/audio';
import { 
  Sparkles, 
  ArrowRight, 
  Binary, 
  Split, 
  TrendingUp, 
  Radio, 
  Cpu, 
  AlertTriangle,
  Layers
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedMarket, setSelectedMarket] = useState<Market>(SUPPORTED_MARKETS[0]);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [timeframe, setTimeframe] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(marketDataManager.getStatus());
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>(marketDataManager.getMode());
  const [derivAppId, setDerivAppId] = useState<string>('1089');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  // Alerts & History Logs
  const [alerts, setAlerts] = useState<AlertRule[]>([
    {
      id: 'alert-1',
      name: 'Parity Streak 4+ Warning',
      conditionType: 'PARITY_STREAK',
      marketSymbol: '1HZ100V',
      thresholdValue: 4,
      windowTicks: 50,
      isActive: true,
      createdAt: Date.now() - 3600000,
      triggerCount: 3,
    },
    {
      id: 'alert-2',
      name: 'RSI Extreme Alert (>70 or <30)',
      conditionType: 'RSI_THRESHOLD',
      marketSymbol: '1HZ100V',
      thresholdValue: 70,
      windowTicks: 50,
      isActive: true,
      createdAt: Date.now() - 7200000,
      triggerCount: 1,
    }
  ]);

  const [signalLogs, setSignalLogs] = useState<SignalLog[]>([
    {
      id: 'log-1',
      timestamp: Date.now() - 180000,
      market: '1HZ100V',
      contractType: 'EVEN_ODD',
      signalType: 'STRONG_BIAS',
      confidence: 76,
      outcome: 'WIN',
      details: 'Parity streak reached 4 Odd ticks; reversion to Even triggered with MA support.',
    },
    {
      id: 'log-2',
      timestamp: Date.now() - 360000,
      market: '1HZ100V',
      contractType: 'RISE_FALL',
      signalType: 'MODERATE_BIAS',
      confidence: 68,
      outcome: 'WIN',
      details: 'Bullish divergence on RSI (14) with SMA(10) upward cross.',
    },
    {
      id: 'log-3',
      timestamp: Date.now() - 600000,
      market: '1HZ75V',
      contractType: 'OVER_UNDER',
      signalType: 'MODERATE_BIAS',
      confidence: 65,
      outcome: 'LOSS',
      details: 'Under 5 threshold triggered after 3 consecutive high digits; exited at 8.',
    }
  ]);

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  // Load historical ticks when selectedMarket changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const history = await marketDataManager.getHistoricalTicks(selectedMarket.symbol, 1000);
      if (isMounted && history.length > 0) {
        setTicks(history);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedMarket.symbol, dataSourceMode]);

  // Subscribe to live tick stream
  useEffect(() => {
    const handleTick = (newTick: Tick) => {
      if (isPausedRef.current) return;

      setTicks((prev) => {
        const next = [...prev, newTick];
        if (next.length > 1500) next.shift();
        return next;
      });
    };

    marketDataManager.subscribeTicks(selectedMarket.symbol, handleTick);

    return () => {
      marketDataManager.unsubscribeTicks(selectedMarket.symbol);
    };
  }, [selectedMarket.symbol]);

  // Listen to connection and mode changes
  useEffect(() => {
    const unsubscribe = marketDataManager.onStateChange((mode, status) => {
      setDataSourceMode(mode);
      setConnectionStatus(status);
    });
    return unsubscribe;
  }, []);

  // Compute Technical Indicators
  const technicalIndicators = useMemo(() => {
    return calculateTechnicalIndicators(ticks);
  }, [ticks]);

  // Compute Real-Time Signals
  const activeSignals = useMemo(() => {
    return generateSignals(selectedMarket, ticks, technicalIndicators);
  }, [selectedMarket, ticks, technicalIndicators]);

  // Check alert triggers on new tick
  const prevTickCountRef = useRef(0);
  useEffect(() => {
    if (ticks.length === 0 || ticks.length === prevTickCountRef.current) return;
    prevTickCountRef.current = ticks.length;

    // Check parity streak alert
    const evenOdd = calculateEvenOddStats(ticks, 50);
    if (evenOdd.currentStreak >= 4 && audioEnabled) {
      soundEngine.playAlert();
    }
  }, [ticks.length, audioEnabled]);

  // Handlers
  const handleToggleDataSource = useCallback(async () => {
    const nextMode: DataSourceMode = dataSourceMode === 'LIVE_WEBSOCKET' ? 'DEMO_SIMULATION' : 'LIVE_WEBSOCKET';
    await marketDataManager.setMode(nextMode);
    setDataSourceMode(nextMode);
    setConnectionStatus(marketDataManager.getStatus());
  }, [dataSourceMode]);

  const handleRefresh = useCallback(async () => {
    const fresh = await marketDataManager.getHistoricalTicks(selectedMarket.symbol, 1000);
    if (fresh.length > 0) setTicks(fresh);
  }, [selectedMarket.symbol]);

  const handleAddAlert = useCallback((rule: Omit<AlertRule, 'id' | 'createdAt' | 'triggerCount'>) => {
    const newAlert: AlertRule = {
      ...rule,
      id: `alert-${Date.now()}`,
      createdAt: Date.now(),
      triggerCount: 0,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  }, []);

  const handleToggleAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  }, []);

  const handleDeleteAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const currentTick = ticks.length > 0 ? ticks[ticks.length - 1] : null;
  const previousTick = ticks.length > 1 ? ticks[ticks.length - 2] : null;

  // Quick stats for Dashboard cards
  const digitStats = useMemo(() => calculateDigitStats(ticks, 100), [ticks]);
  const evenOddStats = useMemo(() => calculateEvenOddStats(ticks, 100), [ticks]);
  const riseFallStats = useMemo(() => calculateRiseFallStats(ticks, 100), [ticks]);

  // Overall analytical confidence composite for Bento gauge
  const overallConfidence = useMemo(() => {
    if (activeSignals.length > 0) {
      return activeSignals[0].confidenceScore;
    }
    const parityMax = Math.max(evenOddStats.estimatedProbEven, evenOddStats.estimatedProbOdd);
    const trendMax = Math.max(riseFallStats.risingPercentage, riseFallStats.fallingPercentage);
    return Math.min(95, Math.max(50, Math.round((parityMax + trendMax) / 2)));
  }, [activeSignals, evenOddStats, riseFallStats]);

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingSignalsCount={activeSignals.length}
        activeAlertsCount={alerts.filter((a) => a.isActive).length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Persistent Top Bar */}
        <TopBar
          markets={SUPPORTED_MARKETS}
          selectedMarket={selectedMarket}
          onSelectMarket={setSelectedMarket}
          currentTick={currentTick}
          previousTick={previousTick}
          connectionStatus={connectionStatus}
          dataSourceMode={dataSourceMode}
          onToggleDataSource={handleToggleDataSource}
          timeframe={timeframe}
          onChangeTimeframe={setTimeframe}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused((p) => !p)}
          onRefresh={handleRefresh}
          volatilityEstimate={technicalIndicators.volatility}
        />

        {/* Workspace Canvas Container */}
        <main className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto w-full flex-grow">
          {/* Prominent Demo Mode Banner if simulated */}
          {dataSourceMode === 'DEMO_SIMULATION' && (
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 px-4 flex items-center justify-between gap-4 text-xs font-mono text-amber-300 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>DEMO SIMULATION ACTIVE:</strong> Real-time Brownian simulated tick feed. All calculations labeled as <strong>DEMO DATA</strong>.
                </span>
              </div>
              <button
                onClick={handleToggleDataSource}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-semibold text-[11px] shrink-0 transition-colors"
              >
                Switch to Live Deriv WS
              </button>
            </div>
          )}

          {/* Tab 1: Primary Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Bento Grid Architecture */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Bento Card 1: Tick Momentum Chart (col-span-12 lg:col-span-8) */}
                <div className="col-span-12 lg:col-span-8">
                  <TickChart
                    market={selectedMarket}
                    ticks={ticks}
                    timeframe={timeframe}
                    onChangeTimeframe={setTimeframe}
                    indicators={technicalIndicators}
                    isLiveData={dataSourceMode === 'LIVE_WEBSOCKET'}
                  />
                </div>

                {/* Bento Card 2: Digit Frequency (100 Ticks) (col-span-12 lg:col-span-4) */}
                <div className="col-span-12 lg:col-span-4 bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 flex flex-col justify-between overflow-hidden shadow-sm">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">
                        Digit Frequency (100 Ticks)
                      </span>
                      <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 font-mono">
                        {dataSourceMode === 'LIVE_WEBSOCKET' ? 'LIVE FEED' : 'DEMO MODE'}
                      </span>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                        const pct = digitStats.percentages[digit] || 0;
                        const isMost = digit === digitStats.mostFrequentDigit;
                        const isLeast = digit === digitStats.leastFrequentDigit;
                        return (
                          <div key={digit} className="flex items-center space-x-2">
                            <span className={`w-3 text-right font-bold ${isMost ? 'text-green-400' : isLeast ? 'text-red-400' : 'text-gray-400'}`}>
                              {digit}
                            </span>
                            <div className="flex-grow bg-[#1a1a1a] h-3.5 rounded overflow-hidden flex items-center px-1">
                              <div
                                className={`h-2 rounded transition-all duration-300 ${
                                  isMost ? 'bg-green-500' : isLeast ? 'bg-red-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${Math.max(6, pct * 3.5)}%` }}
                              />
                            </div>
                            <span className="w-10 text-right text-gray-500 text-[11px]">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('digit_analysis')}
                    className="mt-4 pt-2.5 border-t border-[#262626] flex items-center justify-between text-xs font-mono text-gray-400 hover:text-blue-400 transition-colors group"
                  >
                    <span>View Detailed Digit Distribution</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Bento Card 3: Analytical Confidence (col-span-12 sm:col-span-6 lg:col-span-3) */}
                <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 flex flex-col justify-between shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">
                    Analytical Confidence
                  </span>

                  <div className="flex items-center space-x-4 my-2">
                    <div className="relative flex items-center justify-center shrink-0">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="26" stroke="#262626" strokeWidth="5" fill="none" />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          stroke="#3b82f6"
                          strokeWidth="5"
                          fill="none"
                          strokeDasharray="163.36"
                          strokeDashoffset={163.36 - (163.36 * overallConfidence) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-xs font-mono font-bold text-gray-200">
                        {overallConfidence}%
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-green-400 font-mono">
                        {overallConfidence >= 65 ? 'Strong Alignment' : overallConfidence >= 50 ? 'Moderate Alignment' : 'Low Alignment'}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                        Based on trend & digit agreement
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-gray-400 pt-2 border-t border-[#262626] flex justify-between">
                    <span>Top Signal:</span>
                    <span className="text-blue-400 font-semibold truncate max-w-[130px]">
                      {activeSignals.length > 0 ? activeSignals[0].direction : 'Monitoring...'}
                    </span>
                  </div>
                </div>

                {/* Bento Card 4: Even / Odd & Rise / Fall Probabilities (col-span-12 sm:col-span-6 lg:col-span-5) */}
                <div className="col-span-12 sm:col-span-6 lg:col-span-5 bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 flex flex-col justify-between shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">
                    Market Probabilities
                  </span>

                  <div className="grid grid-cols-2 gap-4 my-2 font-mono">
                    {/* Even / Odd */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Even / Odd</span>
                        <span className="text-blue-400 font-bold">{evenOddStats.estimatedProbEven}% E</span>
                      </div>
                      <div className="w-full bg-[#1a1a1a] h-2 rounded-full overflow-hidden flex">
                        <div className="bg-blue-600" style={{ width: `${evenOddStats.evenPercentage}%` }} />
                        <div className="bg-amber-600" style={{ width: `${evenOddStats.oddPercentage}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>Streak: {evenOddStats.currentStreak}x {evenOddStats.currentStreakType}</span>
                        <span>{evenOddStats.oddPercentage}% O</span>
                      </div>
                    </div>

                    {/* Rise / Fall */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Rise / Fall</span>
                        <span className={`font-bold ${riseFallStats.shortTermTrend === 'BULLISH' ? 'text-green-400' : 'text-red-400'}`}>
                          {riseFallStats.risingPercentage}% Up
                        </span>
                      </div>
                      <div className="w-full bg-[#1a1a1a] h-2 rounded-full overflow-hidden flex">
                        <div className="bg-green-500" style={{ width: `${riseFallStats.risingPercentage}%` }} />
                        <div className="bg-red-500" style={{ width: `${riseFallStats.fallingPercentage}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>Trend: {riseFallStats.shortTermTrend}</span>
                        <span>{riseFallStats.fallingPercentage}% Dn</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-gray-400 pt-2 border-t border-[#262626] flex justify-between">
                    <span>Sample Size:</span>
                    <span className="text-gray-300 font-semibold">{Math.min(100, ticks.length)} Ticks</span>
                  </div>
                </div>

                {/* Bento Card 5: AI Insights Grounded (col-span-12 lg:col-span-4) */}
                <div className="col-span-12 lg:col-span-4 bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">
                        AI Insights Grounded
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 font-mono leading-relaxed bg-[#141414] p-2.5 rounded border border-[#262626]">
                      &ldquo;Consecutive tick momentum shows {riseFallStats.shortTermTrend.toLowerCase()} bias ({riseFallStats.risingPercentage}% up). Digit {digitStats.mostFrequentDigit} is the high-frequency anchor ({digitStats.mostFrequentPct}%). Probabilities remain statistical estimates.&rdquo;
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#262626] flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-mono">Updated real-time</span>
                    <button
                      onClick={() => setActiveTab('ai_analyst')}
                      className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                    >
                      <span>Open AI Analyst</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Analytics Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Digit Glance Card */}
                <div 
                  onClick={() => setActiveTab('digit_analysis')}
                  className="bg-[#0f0f0f] border border-[#262626] hover:border-blue-500/60 transition-all rounded-xl p-4 cursor-pointer shadow-sm space-y-3 group"
                >
                  <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-400">
                      <Binary className="w-4 h-4" />
                      <span>Digit Frequency (0-9)</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                  </div>

                  <div className="flex items-baseline justify-between font-mono">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase block">Most Frequent</span>
                      <span className="text-xl font-bold text-green-400">
                        Digit {digitStats.mostFrequentDigit}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-1">({digitStats.mostFrequentPct}%)</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 uppercase block">Least Frequent</span>
                      <span className="text-xl font-bold text-red-400">
                        Digit {digitStats.leastFrequentDigit}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-1">({digitStats.leastFrequentPct}%)</span>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-gray-400 pt-1 border-t border-[#262626] flex justify-between">
                    <span>Active Streak:</span>
                    <span className="text-gray-200 font-semibold">Digit {digitStats.maxRepeatedDigit.digit} ({digitStats.maxRepeatedDigit.streak}x)</span>
                  </div>
                </div>

                {/* 2. Even / Odd Parity Card */}
                <div 
                  onClick={() => setActiveTab('even_odd')}
                  className="bg-[#0f0f0f] border border-[#262626] hover:border-blue-500/60 transition-all rounded-xl p-4 cursor-pointer shadow-sm space-y-3 group"
                >
                  <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-400">
                      <Split className="w-4 h-4" />
                      <span>Even / Odd Parity</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                  </div>

                  <div className="flex items-baseline justify-between font-mono">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase block">Even Probability</span>
                      <span className="text-xl font-bold text-blue-400">
                        {evenOddStats.estimatedProbEven}%
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 uppercase block">Odd Probability</span>
                      <span className="text-xl font-bold text-amber-400">
                        {evenOddStats.estimatedProbOdd}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden flex">
                    <div className="bg-blue-600" style={{ width: `${evenOddStats.evenPercentage}%` }} />
                    <div className="bg-amber-600" style={{ width: `${evenOddStats.oddPercentage}%` }} />
                  </div>

                  <div className="text-[11px] font-mono text-gray-400 flex justify-between">
                    <span>Active Streak:</span>
                    <span className="text-gray-200 font-semibold">{evenOddStats.currentStreak}x {evenOddStats.currentStreakType}</span>
                  </div>
                </div>

                {/* 3. Rise / Fall Directional Card */}
                <div 
                  onClick={() => setActiveTab('rise_fall')}
                  className="bg-[#0f0f0f] border border-[#262626] hover:border-green-500/60 transition-all rounded-xl p-4 cursor-pointer shadow-sm space-y-3 group"
                >
                  <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-green-400">
                      <TrendingUp className="w-4 h-4" />
                      <span>Rise / Fall Direction</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-green-400 transition-colors" />
                  </div>

                  <div className="flex items-baseline justify-between font-mono">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase block">Short Trend</span>
                      <span className={`text-xl font-bold ${
                        riseFallStats.shortTermTrend === 'BULLISH' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {riseFallStats.shortTermTrend}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 uppercase block">Trend Strength</span>
                      <span className="text-xl font-bold text-blue-400">
                        {riseFallStats.trendStrength}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden flex">
                    <div className="bg-green-500" style={{ width: `${riseFallStats.risingPercentage}%` }} />
                    <div className="bg-red-500" style={{ width: `${riseFallStats.fallingPercentage}%` }} />
                  </div>

                  <div className="text-[11px] font-mono text-gray-400 flex justify-between">
                    <span>Ratio (Rise/Fall):</span>
                    <span className="text-gray-200 font-semibold">{riseFallStats.risingPercentage}% / {riseFallStats.fallingPercentage}%</span>
                  </div>
                </div>

                {/* 4. Active Confluence Signal Card */}
                <div 
                  onClick={() => setActiveTab('signals')}
                  className="bg-[#0f0f0f] border border-[#262626] hover:border-blue-500/60 transition-all rounded-xl p-4 cursor-pointer shadow-sm space-y-3 group"
                >
                  <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-400">
                      <Radio className="w-4 h-4" />
                      <span>Decision Support Signals</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                  </div>

                  {activeSignals.length > 0 ? (
                    <>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-mono block">Top Signal</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-bold text-gray-200 font-mono text-sm truncate">
                            {activeSignals[0].direction}
                          </span>
                          <span className="text-xs font-bold font-mono text-blue-400">
                            {activeSignals[0].confidenceScore}% Conf
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono text-gray-400 pt-1 border-t border-[#262626] flex justify-between">
                        <span>Signal Count:</span>
                        <span className="text-green-400 font-semibold">{activeSignals.length} Active Alignment(s)</span>
                      </div>
                    </>
                  ) : (
                    <div className="py-2 text-center text-xs font-mono text-gray-500">
                      Scanning for statistical alignment...
                    </div>
                  )}
                </div>
              </div>

              {/* AI Analyst Assistant Banner Shortcut */}
              <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-100 font-mono text-sm uppercase tracking-wide">
                      AI Market Analyst Grounded Synthesis
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Generate natural language analysis with statistical transparency, conflicting indicator notes, and sample size disclosures.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('ai_analyst')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded-lg transition-colors shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  <span>Open AI Assistant</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Markets Matrix */}
          {activeTab === 'markets' && (
            <MarketsView
              markets={SUPPORTED_MARKETS}
              selectedMarket={selectedMarket}
              onSelectMarket={(m) => {
                setSelectedMarket(m);
                setActiveTab('dashboard');
              }}
              currentTick={currentTick}
            />
          )}

          {/* Tab 3: Digit Analysis (0-9) */}
          {activeTab === 'digit_analysis' && (
            <DigitAnalysisView ticks={ticks} />
          )}

          {/* Tab 4: Even / Odd */}
          {activeTab === 'even_odd' && (
            <EvenOddView ticks={ticks} />
          )}

          {/* Tab 5: Over / Under */}
          {activeTab === 'over_under' && (
            <OverUnderView ticks={ticks} />
          )}

          {/* Tab 6: Matches / Differs */}
          {activeTab === 'matches_differs' && (
            <MatchesDiffersView ticks={ticks} />
          )}

          {/* Tab 7: Rise / Fall */}
          {activeTab === 'rise_fall' && (
            <RiseFallView ticks={ticks} indicators={technicalIndicators} />
          )}

          {/* Tab 8: Touch / No Touch */}
          {activeTab === 'touch_no_touch' && (
            <TouchNoTouchView
              ticks={ticks}
              market={selectedMarket}
              indicators={technicalIndicators}
            />
          )}

          {/* Tab 9: Higher / Lower */}
          {activeTab === 'higher_lower' && (
            <HigherLowerView
              ticks={ticks}
              market={selectedMarket}
              indicators={technicalIndicators}
            />
          )}

          {/* Tab 10: Ends In / Ends Out */}
          {activeTab === 'ends_in_out' && (
            <EndsInOutView
              ticks={ticks}
              market={selectedMarket}
            />
          )}

          {/* Tab 11: Multi-Timeframe Matrix */}
          {activeTab === 'multi_timeframe' && (
            <MultiTimeframeView
              ticks={ticks}
              market={selectedMarket}
            />
          )}

          {/* Tab 12: Signals Engine */}
          {activeTab === 'signals' && (
            <SignalsView
              signals={activeSignals}
              market={selectedMarket}
              onRefreshSignals={handleRefresh}
            />
          )}

          {/* Tab 13: AI Analyst */}
          {activeTab === 'ai_analyst' && (
            <AiAnalystView
              market={selectedMarket}
              ticks={ticks}
              indicators={technicalIndicators}
            />
          )}

          {/* Tab 14: Backtesting */}
          {activeTab === 'backtesting' && (
            <BacktestingView
              ticks={ticks}
              market={selectedMarket}
            />
          )}

          {/* Tab 15: History Log */}
          {activeTab === 'history' && (
            <HistoryView logs={signalLogs} />
          )}

          {/* Tab 16: Alerts */}
          {activeTab === 'alerts' && (
            <AlertsView
              market={selectedMarket}
              alerts={alerts}
              onAddAlert={handleAddAlert}
              onToggleAlert={handleToggleAlert}
              onDeleteAlert={handleDeleteAlert}
            />
          )}

          {/* Tab 17: Risk Management */}
          {activeTab === 'risk_management' && (
            <RiskManagementView />
          )}

          {/* Tab 18: Settings */}
          {activeTab === 'settings' && (
            <SettingsView
              dataSourceMode={dataSourceMode}
              onSelectMode={async (mode) => {
                await marketDataManager.setMode(mode);
                setDataSourceMode(mode);
                setConnectionStatus(marketDataManager.getStatus());
              }}
              connectionStatus={connectionStatus}
              derivAppId={derivAppId}
              onChangeDerivAppId={setDerivAppId}
              audioEnabled={audioEnabled}
              onToggleAudio={() => setAudioEnabled((a) => !a)}
              onReconnect={handleRefresh}
            />
          )}
        </main>

        {/* Bento Grid Disclaimer Footer */}
        <footer className="h-8 bg-[#0a0a0a] px-6 flex items-center justify-center border-t border-[#262626] shrink-0 text-center">
          <span className="text-[10px] text-gray-500 font-mono tracking-tight">
            Independent Analytical Platform &bull; Statistical decision-support only &bull; No financial advice or guaranteed outcomes
          </span>
        </footer>
      </div>
    </div>
  );
}
