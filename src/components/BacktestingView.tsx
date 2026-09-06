import React, { useState } from 'react';
import { 
  LineChart as ChartIcon, 
  Play, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders 
} from 'lucide-react';
import { Tick, Market, BacktestResult } from '../types';
import { runBacktestSimulation } from '../utils/statistics';

interface BacktestingViewProps {
  ticks: Tick[];
  market: Market;
}

export const BacktestingView: React.FC<BacktestingViewProps> = ({ ticks, market }) => {
  const [contractType, setContractType] = useState<string>('EVEN_ODD');
  const [strategyRule, setStrategyRule] = useState<string>('FADE_EVEN_STREAK');
  const [sampleTicks, setSampleTicks] = useState<number>(500);
  const [payoutMultiplier, setPayoutMultiplier] = useState<number>(1.95);
  const [initialCapital, setInitialCapital] = useState<number>(1000);
  const [stakePerTrade, setStakePerTrade] = useState<number>(10);

  const [result, setResult] = useState<BacktestResult | null>(() => {
    return runBacktestSimulation(ticks, {
      contractType: 'EVEN_ODD',
      rule: 'FADE_EVEN_STREAK',
      ticksCount: 500,
      payoutMultiplier: 1.95,
      stake: 10,
    });
  });

  const handleRunTest = () => {
    const res = runBacktestSimulation(ticks, {
      contractType,
      rule: strategyRule,
      ticksCount: sampleTicks,
      payoutMultiplier,
      stake: stakePerTrade,
    });
    setResult(res);
  };

  // Equity curve SVG coordinates
  const equityPoints = result ? result.equityCurve : [];
  const minEquity = equityPoints.length > 0 ? Math.min(...equityPoints) : 1000;
  const maxEquity = equityPoints.length > 0 ? Math.max(...equityPoints) : 1000;
  const range = Math.max(10, maxEquity - minEquity);

  const chartW = 750;
  const chartH = 180;
  const getX = (index: number) => {
    if (equityPoints.length <= 1) return 20;
    return 30 + (index / (equityPoints.length - 1)) * (chartW - 60);
  };
  const getY = (val: number) => {
    return chartH - 25 - ((val - minEquity) / range) * (chartH - 50);
  };

  const polyPoints = equityPoints.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');

  return (
    <div className="space-y-6">
      {/* Header & Configuration Controls */}
      <div className="bg-[#0f0f0f] border border-[#262626] p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ChartIcon className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
                Historical Strategy Backtester
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Simulate rule-based contract decision execution across historical tick series.
            </p>
          </div>

          <button
            onClick={handleRunTest}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded-lg transition-colors border border-blue-500/30"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Execute Backtest</span>
          </button>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-[#262626] text-xs font-mono">
          {/* Contract Type */}
          <div>
            <label className="text-gray-400 block mb-1">Contract Type</label>
            <select
              value={contractType}
              onChange={(e) => {
                setContractType(e.target.value);
                if (e.target.value === 'EVEN_ODD') setStrategyRule('FADE_EVEN_STREAK');
                else if (e.target.value === 'RISE_FALL') setStrategyRule('FADE_RISE_STREAK');
                else if (e.target.value === 'OVER_UNDER') setStrategyRule('BUY_UNDER_5');
              }}
              className="w-full bg-[#141414] border border-[#262626] p-1.5 rounded text-gray-100 outline-none focus:border-blue-500"
            >
              <option value="EVEN_ODD">Even / Odd</option>
              <option value="RISE_FALL">Rise / Fall</option>
              <option value="OVER_UNDER">Over / Under</option>
              <option value="MATCHES_DIFFERS">Matches / Differs</option>
            </select>
          </div>

          {/* Strategy Rule */}
          <div className="lg:col-span-2">
            <label className="text-gray-400 block mb-1">Rule Trigger</label>
            <select
              value={strategyRule}
              onChange={(e) => setStrategyRule(e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] p-1.5 rounded text-gray-100 outline-none focus:border-blue-500"
            >
              {contractType === 'EVEN_ODD' && (
                <>
                  <option value="FADE_EVEN_STREAK">After 3 consecutive Even, trade Odd</option>
                  <option value="FADE_ODD_STREAK">After 3 consecutive Odd, trade Even</option>
                  <option value="FOLLOW_EVEN_STREAK">Follow streak: trade Even on 2+ Evens</option>
                </>
              )}
              {contractType === 'RISE_FALL' && (
                <>
                  <option value="FADE_RISE_STREAK">Mean Reversion: trade Fall after 4 Rise ticks</option>
                  <option value="FADE_FALL_STREAK">Mean Reversion: trade Rise after 4 Fall ticks</option>
                  <option value="TREND_FOLLOW">Trend Follow: buy Rise on SMA(10) upward slope</option>
                </>
              )}
              {contractType === 'OVER_UNDER' && (
                <>
                  <option value="BUY_UNDER_5">Consensus: trade Under 5 when Over streak &gt; 3</option>
                  <option value="BUY_OVER_4">Consensus: trade Over 4 when Under streak &gt; 3</option>
                </>
              )}
              {contractType === 'MATCHES_DIFFERS' && (
                <>
                  <option value="DIFFERS_OVERDUE">Trade Differs on Digit overdue &gt; 15 ticks</option>
                  <option value="DIFFERS_HOT">Trade Differs on Most Frequent Digit</option>
                </>
              )}
            </select>
          </div>

          {/* Sample Ticks */}
          <div>
            <label className="text-gray-400 block mb-1">Ticks Count</label>
            <select
              value={sampleTicks}
              onChange={(e) => setSampleTicks(Number(e.target.value))}
              className="w-full bg-[#141414] border border-[#262626] p-1.5 rounded text-gray-100 outline-none focus:border-blue-500"
            >
              {[100, 250, 500, 1000].map((c) => (
                <option key={c} value={c}>
                  {c} ticks
                </option>
              ))}
            </select>
          </div>

          {/* Stake */}
          <div>
            <label className="text-gray-400 block mb-1">Fixed Stake ($)</label>
            <input
              type="number"
              value={stakePerTrade}
              onChange={(e) => setStakePerTrade(Number(e.target.value) || 10)}
              className="w-full bg-[#141414] border border-[#262626] p-1.5 rounded text-gray-100 outline-none focus:border-blue-500"
            />
          </div>

          {/* Payout Ratio */}
          <div>
            <label className="text-gray-400 block mb-1">Simulated Payout</label>
            <input
              type="number"
              step="0.01"
              value={payoutMultiplier}
              onChange={(e) => setPayoutMultiplier(Number(e.target.value) || 1.95)}
              className="w-full bg-[#141414] border border-[#262626] p-1.5 rounded text-gray-100 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {result && (
        <>
          {/* Performance Stats KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 font-mono">
            <div className="bg-[#0f0f0f] border border-[#262626] p-3.5 rounded-xl">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Total Trades</span>
              <span className="text-xl font-bold text-gray-100 mt-1 block">{result.totalTrades}</span>
              <span className="text-[10px] text-gray-500 mt-0.5 block">{result.periodTicks} ticks evaluated</span>
            </div>

            <div className="bg-[#0f0f0f] border border-[#262626] p-3.5 rounded-xl">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Win Rate</span>
              <span className={`text-xl font-bold mt-1 block ${
                result.winRatePct >= 50 ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.winRatePct}%
              </span>
              <span className="text-[10px] text-gray-500 mt-0.5 block">{result.wins} W / {result.losses} L</span>
            </div>

            <div className="bg-[#0f0f0f] border border-[#262626] p-3.5 rounded-xl">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Profit Factor</span>
              <span className={`text-xl font-bold mt-1 block ${
                result.profitFactor >= 1.0 ? 'text-blue-400' : 'text-amber-400'
              }`}>
                {result.profitFactor.toFixed(2)}
              </span>
              <span className="text-[10px] text-gray-500 mt-0.5 block">Gross Win / Gross Loss</span>
            </div>

            <div className="bg-[#0f0f0f] border border-[#262626] p-3.5 rounded-xl">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Max Wins</span>
              <span className="text-xl font-bold text-green-400 mt-1 block">
                {result.maxConsecutiveWins}x
              </span>
              <span className="text-[10px] text-gray-500 mt-0.5 block">Peak winning streak</span>
            </div>

            <div className="bg-[#0f0f0f] border border-[#262626] p-3.5 rounded-xl">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Max Losses</span>
              <span className="text-xl font-bold text-red-400 mt-1 block">
                {result.maxConsecutiveLosses}x
              </span>
              <span className="text-[10px] text-gray-500 mt-0.5 block">Drawdown pressure</span>
            </div>

            <div className="bg-[#0f0f0f] border border-[#262626] p-3.5 rounded-xl">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Net P&amp;L</span>
              <span className={`text-xl font-bold mt-1 block ${
                result.netPnL >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.netPnL >= 0 ? `+$${result.netPnL.toFixed(2)}` : `-$${Math.abs(result.netPnL).toFixed(2)}`}
              </span>
              <span className="text-[10px] text-gray-500 mt-0.5 block">Final balance delta</span>
            </div>
          </div>

          {/* Equity Curve Visualizer */}
          <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-gray-100 uppercase tracking-widest">
                Simulated Equity Curve Trajectory
              </h3>
              <span className="text-xs font-mono text-gray-400">
                Starting: $1000 | Peak: ${maxEquity.toFixed(2)} | Trough: ${minEquity.toFixed(2)}
              </span>
            </div>

            <div className="w-full overflow-hidden bg-[#141414] p-2 rounded-lg border border-[#262626]">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-48">
                {/* Horizontal zero/start line */}
                <line
                  x1={30}
                  y1={getY(1000)}
                  x2={chartW - 30}
                  y2={getY(1000)}
                  stroke="#262626"
                  strokeDasharray="4 4"
                />
                <text x={35} y={getY(1000) - 5} fill="#737373" fontSize="10" fontFamily="monospace">
                  Initial Capital: $1000
                </text>

                {/* Equity Line */}
                {polyPoints && (
                  <polyline
                    fill="none"
                    stroke={result.netPnL >= 0 ? '#22c55e' : '#ef4444'}
                    strokeWidth="2"
                    points={polyPoints}
                  />
                )}
              </svg>
            </div>
          </div>
        </>
      )}

      {/* Crucial Disclaimer */}
      <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 text-xs font-mono text-gray-400 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-gray-200 uppercase tracking-wider">Backtesting Disclaimer:</span>
          <p className="mt-1 leading-relaxed">
            Simulated historical testing has inherent limitations. Past market performance or tick patterns do not guarantee 
            future results. In live synthetic execution, spreads, execution delays, and random variance can cause material discrepancies.
          </p>
        </div>
      </div>
    </div>
  );
};
