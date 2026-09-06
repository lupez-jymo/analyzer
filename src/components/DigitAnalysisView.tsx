import React, { useState } from 'react';
import { 
  Binary, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Repeat, 
  Flame, 
  Grid, 
  Table as TableIcon 
} from 'lucide-react';
import { Tick } from '../types';
import { calculateDigitStats } from '../utils/statistics';

interface DigitAnalysisViewProps {
  ticks: Tick[];
}

export const DigitAnalysisView: React.FC<DigitAnalysisViewProps> = ({ ticks }) => {
  const [sampleSize, setSampleSize] = useState<number>(100);
  const sampleSizes = [25, 50, 100, 250, 500, 1000];

  const stats = calculateDigitStats(ticks, sampleSize);

  return (
    <div className="space-y-6">
      {/* Header & Window Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Binary className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
              Digit Analysis Engine (0–9)
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Analyzing discrete last-digit occurrences, streak states, momentum delta, and transition dynamics.
          </p>
        </div>

        {/* Sample Size Selector */}
        <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded-lg border border-[#262626] overflow-x-auto">
          <span className="text-xs font-mono text-gray-400 px-2 shrink-0">Sample:</span>
          {sampleSizes.map((size) => (
            <button
              key={size}
              id={`sample-size-btn-${size}`}
              onClick={() => setSampleSize(size)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md font-semibold transition-colors shrink-0 ${
                sampleSize === size
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-[#1f1f1f]'
              }`}
            >
              {size} ticks
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Most Frequent */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono uppercase tracking-widest">
            <span>Most Frequent</span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-green-400">
              Digit {stats.mostFrequentDigit}
            </span>
            <span className="text-xs font-mono text-gray-400">
              ({stats.mostFrequentCount}x / {stats.mostFrequentPct}%)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 font-mono">
            Baseline expected: 10.0%
          </div>
        </div>

        {/* Least Frequent */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono uppercase tracking-widest">
            <span>Least Frequent</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-red-400">
              Digit {stats.leastFrequentDigit}
            </span>
            <span className="text-xs font-mono text-gray-400">
              ({stats.leastFrequentCount}x / {stats.leastFrequentPct}%)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 font-mono">
            Spread from max: {(stats.mostFrequentPct - stats.leastFrequentPct).toFixed(1)}%
          </div>
        </div>

        {/* Consecutive Repeats */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono uppercase tracking-widest">
            <span>Repeated Pairs</span>
            <Repeat className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-yellow-400">
              {stats.repeatPairsCount}
            </span>
            <span className="text-xs font-mono text-gray-400">pairs</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 font-mono">
            Back-to-back identical digits
          </div>
        </div>

        {/* Active Streak */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono uppercase tracking-widest">
            <span>Current Tail Streak</span>
            <Flame className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-blue-400">
              {stats.maxRepeatedDigit.streak}x
            </span>
            <span className="text-xs font-mono text-gray-400">
              (Digit {stats.maxRepeatedDigit.digit})
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 font-mono">
            Current consecutive ticks
          </div>
        </div>
      </div>

      {/* Digit Frequency Visualizer */}
      <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-300 font-mono uppercase tracking-widest flex items-center gap-2">
            <Grid className="w-4 h-4 text-blue-400" />
            DIGIT FREQUENCY DISTRIBUTION (0–9)
          </h3>
          <span className="text-xs font-mono text-gray-500">
            Dashed line = Expected theoretical mean (10%)
          </span>
        </div>

        {/* Bar Chart Bars */}
        <div className="grid grid-cols-10 gap-2 sm:gap-3 items-end h-48 pt-6 pb-2 border-b border-[#262626] relative">
          {/* 10% Expected Baseline Reference Line */}
          <div 
            className="absolute left-0 right-0 border-t border-dashed border-blue-500/50 z-10 flex items-center justify-end pr-2"
            style={{ bottom: '40%' }} // roughly 10% on a 25% max scale
          >
            <span className="text-[9px] font-mono text-blue-400 bg-[#141414] px-1 py-0.5 rounded border border-[#262626]">
              10% Mean
            </span>
          </div>

          {stats.distribution.map((d) => {
            const isHighest = d.digit === stats.mostFrequentDigit;
            const isLowest = d.digit === stats.leastFrequentDigit;
            const barHeightPct = Math.min(100, Math.max(8, (d.percentage / 25) * 100));

            return (
              <div key={d.digit} className="flex flex-col items-center h-full justify-end group relative">
                {/* Value on top of bar */}
                <span className="text-[11px] font-mono font-bold text-gray-300 mb-1 group-hover:text-blue-400">
                  {d.percentage}%
                </span>

                {/* The Bar */}
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    isHighest
                      ? 'bg-green-500'
                      : isLowest
                      ? 'bg-red-500'
                      : d.percentage > 10
                      ? 'bg-blue-600'
                      : 'bg-[#262626]'
                  }`}
                  style={{ height: `${barHeightPct}%` }}
                />

                {/* Digit Label Below */}
                <div className="mt-2 w-7 h-7 rounded bg-[#141414] border border-[#262626] flex items-center justify-center font-mono font-bold text-xs text-gray-200">
                  {d.digit}
                </div>

                {/* Sub label: count */}
                <span className="text-[10px] font-mono text-gray-500 mt-0.5">
                  {d.count}x
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Digits 0–9 Analysis Table */}
      <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-300 font-mono uppercase tracking-widest flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-blue-400" />
            DIGIT FREQUENCY &amp; PATTERN BREAKDOWN
          </h3>
          <span className="text-xs font-mono text-gray-500">
            Sample Window: {sampleSize} ticks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#262626] text-gray-400 text-[11px] uppercase bg-[#141414]">
                <th className="py-2.5 px-3">Digit</th>
                <th className="py-2.5 px-3">Count</th>
                <th className="py-2.5 px-3">Percentage</th>
                <th className="py-2.5 px-3">Recent (25)</th>
                <th className="py-2.5 px-3">Ticks Since</th>
                <th className="py-2.5 px-3">Streak</th>
                <th className="py-2.5 px-3">Analysis Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {stats.distribution.map((item) => {
                const isEven = item.digit % 2 === 0;
                return (
                  <tr key={item.digit} className="hover:bg-[#141414] transition-colors">
                    <td className="py-2.5 px-3 font-bold text-sm">
                      <span className={`inline-block w-6 h-6 rounded text-center leading-6 text-white font-mono ${
                        isEven ? 'bg-blue-600' : 'bg-amber-600'
                      }`}>
                        {item.digit}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-200 font-bold">
                      {item.count}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-gray-200">{item.percentage}%</span>
                        <div className="w-20 bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full ${item.percentage >= 10 ? 'bg-blue-500' : 'bg-gray-600'}`}
                            style={{ width: `${Math.min(100, item.percentage * 4)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-300">
                      {item.recentCount}
                    </td>
                    <td className="py-2.5 px-3 text-gray-400">
                      {item.ticksSinceLast === 0 ? (
                        <span className="text-green-400 font-bold">Current</span>
                      ) : (
                        `${item.ticksSinceLast} ticks ago`
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.streak > 0 ? (
                        <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                          {item.streak}x Active
                        </span>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.analysis === 'Above Expected'
                          ? 'bg-green-500/10 border-green-500/20 text-green-400'
                          : item.analysis === 'Below Expected'
                          ? 'bg-red-500/10 border-red-500/20 text-red-400'
                          : item.analysis === 'Overdue (Statistical)'
                          ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                          : 'bg-[#141414] border-[#262626] text-gray-400'
                      }`}>
                        {item.analysis}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 10x10 Digit Transition Matrix */}
      <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-300 font-mono uppercase tracking-widest">
            DIGIT TRANSITION MATRIX (FROM ROW DIGIT → TO COLUMN DIGIT)
          </h3>
          <span className="text-xs font-mono text-gray-500">
            Consecutive transition counts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-[#141414] text-gray-400">
                <th className="p-1.5 text-left border border-[#262626] text-blue-400">From \ To</th>
                {Array.from({ length: 10 }, (_, i) => (
                  <th key={i} className="p-1.5 border border-[#262626] font-bold text-gray-300">
                    {i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.transitions.map((row, fromDigit) => (
                <tr key={fromDigit} className="hover:bg-[#141414]">
                  <td className="p-1.5 text-left font-bold border border-[#262626] text-gray-300 bg-[#141414]">
                    Digit {fromDigit}
                  </td>
                  {row.map((count, toDigit) => {
                    const isDiagonal = fromDigit === toDigit;
                    return (
                      <td
                        key={toDigit}
                        className={`p-1.5 border border-[#262626] ${
                          isDiagonal && count > 0
                            ? 'bg-yellow-500/20 text-yellow-300 font-bold'
                            : count > 2
                            ? 'bg-blue-500/20 text-blue-300 font-semibold'
                            : count > 0
                            ? 'text-gray-300'
                            : 'text-gray-600'
                        }`}
                      >
                        {count}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crucial Statistical Disclaimer */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 text-xs font-mono text-gray-400 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-gray-200 uppercase tracking-wide">
            Statistical Independence Notice:
          </span>
          <p className="text-gray-400 leading-relaxed">
            Historical frequency, overdue states, and streaks describe past outcomes within the sampled window. 
            In random synthetic and market processes, each tick is statistically independent. 
            A digit appearing frequently or infrequently in the past does not guarantee, prevent, or prove its next occurrence.
          </p>
        </div>
      </div>
    </div>
  );
};
