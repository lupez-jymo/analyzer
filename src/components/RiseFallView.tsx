import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Compass, Gauge, BarChart } from 'lucide-react';
import { Tick, TechnicalIndicators } from '../types';
import { calculateRiseFallStats } from '../utils/statistics';

interface RiseFallViewProps {
  ticks: Tick[];
  indicators: TechnicalIndicators;
}

export const RiseFallView: React.FC<RiseFallViewProps> = ({ ticks, indicators }) => {
  const [windowSize, setWindowSize] = useState<number>(100);
  const stats = calculateRiseFallStats(ticks, windowSize);

  const multiWindows = [10, 50, 100, 250];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
              Rise / Fall Directional Engine
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Directional tick momentum, moving average convergence, and multi-window rise/fall bias.
          </p>
        </div>

        {/* Active Window */}
        <div className="flex items-center gap-2 bg-[#141414] p-1.5 rounded-lg border border-[#262626]">
          <span className="text-xs font-mono text-gray-400">Sample Window:</span>
          {multiWindows.map((w) => (
            <button
              key={w}
              onClick={() => setWindowSize(w)}
              className={`px-2.5 py-1 text-xs font-mono rounded font-semibold transition-colors ${
                windowSize === w
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#1f1f1f]'
              }`}
            >
              {w} ticks
            </button>
          ))}
        </div>
      </div>

      {/* Main Directional Indicators KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Short Term Trend */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">Short-Term Trend</span>
          <div className="flex items-center gap-2 mt-2">
            {stats.shortTermTrend === 'Bullish' ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : stats.shortTermTrend === 'Bearish' ? (
              <TrendingDown className="w-5 h-5 text-red-400" />
            ) : (
              <Compass className="w-5 h-5 text-gray-400" />
            )}
            <span className={`text-xl font-bold font-mono ${
              stats.shortTermTrend === 'Bullish' ? 'text-green-400' :
              stats.shortTermTrend === 'Bearish' ? 'text-red-400' : 'text-gray-300'
            }`}>
              {stats.shortTermTrend}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">Based on 10-tick velocity</span>
        </div>

        {/* Medium Term Trend */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">Medium-Term Trend</span>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xl font-bold font-mono ${
              stats.mediumTermTrend === 'Bullish' ? 'text-green-400' :
              stats.mediumTermTrend === 'Bearish' ? 'text-red-400' : 'text-gray-300'
            }`}>
              {stats.mediumTermTrend}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">SMA(10) vs EMA(20) cross</span>
        </div>

        {/* Trend Strength */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">Trend Strength</span>
          <div className="flex items-center gap-2 mt-2">
            <Gauge className="w-5 h-5 text-blue-400" />
            <span className="text-xl font-bold font-mono text-blue-300">
              {stats.trendStrength}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">Directional consensus</span>
        </div>

        {/* Active Streak */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">Consecutive Streak</span>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xl font-bold font-mono ${
              stats.streakDirection === 'RISE' ? 'text-green-400' : stats.streakDirection === 'FALL' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {stats.consecutiveStreak}x {stats.streakDirection}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">Active tick run</span>
        </div>
      </div>

      {/* Side-by-Side RISE vs FALL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RISE Card */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-green-500/10 text-green-400 flex items-center justify-center border border-green-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-mono text-gray-100">RISE</h3>
            </div>
            <span className="text-xs font-mono text-gray-400">Exit &gt; Entry</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">Historical Frequency</span>
              <span className="text-2xl font-bold font-mono text-green-400 mt-1 block">
                {stats.risingPercentage}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {stats.risingCount} rising ticks
              </span>
            </div>

            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">Estimated Probability</span>
              <span className="text-2xl font-bold font-mono text-gray-100 mt-1 block">
                {stats.estimatedProbRise}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Normalized likelihood</span>
            </div>
          </div>
        </div>

        {/* FALL Card */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                <TrendingDown className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-mono text-gray-100">FALL</h3>
            </div>
            <span className="text-xs font-mono text-gray-400">Exit &lt; Entry</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">Historical Frequency</span>
              <span className="text-2xl font-bold font-mono text-red-400 mt-1 block">
                {stats.fallingPercentage}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {stats.fallingCount} falling ticks
              </span>
            </div>

            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">Estimated Probability</span>
              <span className="text-2xl font-bold font-mono text-gray-100 mt-1 block">
                {stats.estimatedProbFall}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Normalized likelihood</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Window Comparison: 10, 50, 100, 250 ticks */}
      <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-gray-300 font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
          <BarChart className="w-4 h-4 text-blue-400" />
          MULTI-WINDOW DIRECTIONAL COMPARISON
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {multiWindows.map((w) => {
            const wStats = calculateRiseFallStats(ticks, w);
            return (
              <div key={w} className="bg-[#141414] border border-[#262626] p-3.5 rounded-lg">
                <div className="flex justify-between items-center text-xs font-mono text-gray-400 pb-2 border-b border-[#262626]">
                  <span className="font-bold text-gray-200">{w} Ticks</span>
                  <span className={`font-semibold ${
                    wStats.risingPercentage > wStats.fallingPercentage ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {wStats.risingPercentage > wStats.fallingPercentage ? 'BULL BIAS' : 'BEAR BIAS'}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rising:</span>
                    <span className="text-green-400 font-bold">{wStats.risingPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Falling:</span>
                    <span className="text-red-400 font-bold">{wStats.fallingPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden flex mt-1">
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${wStats.risingPercentage}%` }} 
                    />
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${wStats.fallingPercentage}%` }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
