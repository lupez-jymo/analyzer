import React, { useState } from 'react';
import { ChevronsUpDown, Info, Sliders } from 'lucide-react';
import { Tick } from '../types';
import { calculateOverUnderStats } from '../utils/statistics';

interface OverUnderViewProps {
  ticks: Tick[];
}

export const OverUnderView: React.FC<OverUnderViewProps> = ({ ticks }) => {
  const [threshold, setThreshold] = useState<number>(5);
  const [windowSize, setWindowSize] = useState<number>(100);

  const stats = calculateOverUnderStats(ticks, threshold, windowSize);
  const thresholds = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <ChevronsUpDown className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
              Over / Under Analysis Engine
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Evaluate digit distribution above or below configurable thresholds (Under 1–9 and Over 0–8).
          </p>
        </div>

        {/* Threshold Picker */}
        <div className="flex items-center gap-2 bg-[#141414] p-1.5 rounded-lg border border-[#262626]">
          <Sliders className="w-4 h-4 text-blue-400 ml-1" />
          <span className="text-xs font-mono text-gray-400">Threshold:</span>
          <div className="flex items-center gap-1">
            {thresholds.map((th) => (
              <button
                key={th}
                id={`threshold-btn-${th}`}
                onClick={() => setThreshold(th)}
                className={`w-7 h-7 rounded text-xs font-mono font-bold transition-colors ${
                  threshold === th
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#282828]'
                }`}
              >
                {th}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison: UNDER vs OVER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Under Card */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm relative">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <div>
              <span className="text-xs font-mono text-blue-400 uppercase tracking-widest font-semibold">Contract Condition</span>
              <h3 className="text-lg font-bold font-mono text-gray-100 mt-0.5">
                UNDER {threshold}
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Target digits: {Array.from({ length: threshold }, (_, i) => i).join(', ')}
              </p>
            </div>
            <span className="text-xs font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded">
              Expected: {threshold * 10}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Historical Frequency</span>
              <span className="text-2xl font-bold font-mono text-gray-100 mt-1 block">
                {stats.underPercentage}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {stats.underCount} of {stats.sampleSize} ticks
              </span>
            </div>

            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Estimated Probability</span>
              <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">
                {stats.estimatedProbUnder}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Bayesian posterior</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs font-mono border-t border-[#262626] pt-3 text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-400">Recent 25-Tick Frequency:</span>
              <span className="font-semibold text-gray-200">{stats.recentUnderPct}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Longest Under Streak:</span>
              <span className="font-semibold text-gray-200">{stats.longestUnderStreak} ticks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sample Size:</span>
              <span className="font-semibold text-gray-400">{stats.sampleSize} ticks</span>
            </div>
          </div>
        </div>

        {/* Over Card */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm relative">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <div>
              <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-semibold">Contract Condition</span>
              <h3 className="text-lg font-bold font-mono text-gray-100 mt-0.5">
                OVER {threshold}
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Target digits: {Array.from({ length: 9 - threshold }, (_, i) => threshold + 1 + i).join(', ')}
              </p>
            </div>
            <span className="text-xs font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded">
              Expected: {(9 - threshold) * 10}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Historical Frequency</span>
              <span className="text-2xl font-bold font-mono text-gray-100 mt-1 block">
                {stats.overPercentage}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {stats.overCount} of {stats.sampleSize} ticks
              </span>
            </div>

            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Estimated Probability</span>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
                {stats.estimatedProbOver}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Bayesian posterior</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs font-mono border-t border-[#262626] pt-3 text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-400">Recent 25-Tick Frequency:</span>
              <span className="font-semibold text-gray-200">{stats.recentOverPct}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Longest Over Streak:</span>
              <span className="font-semibold text-gray-200">{stats.longestOverStreak} ticks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sample Size:</span>
              <span className="font-semibold text-gray-400">{stats.sampleSize} ticks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Probability Comparison Chart across all thresholds (0-9) */}
      <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-gray-300 font-mono uppercase tracking-widest mb-4">
          PROBABILITY COMPARISON ACROSS ALL THRESHOLDS
        </h3>

        <div className="space-y-3">
          {thresholds.map((th) => {
            const tempStats = calculateOverUnderStats(ticks, th, windowSize);
            const isSelected = th === threshold;

            return (
              <div 
                key={th} 
                className={`p-2.5 rounded-lg border transition-colors ${
                  isSelected ? 'bg-[#141414] border-blue-500/50' : 'bg-[#141414]/50 border-[#262626]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="font-bold text-gray-200">
                    Threshold {th} {isSelected && '(Selected)'}
                  </span>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-blue-400">Under: {tempStats.underPercentage}%</span>
                    <span className="text-amber-400">Over: {tempStats.overPercentage}%</span>
                  </div>
                </div>

                <div className="w-full h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-600 transition-all duration-300"
                    style={{ width: `${tempStats.underPercentage}%` }}
                  />
                  <div
                    className="bg-amber-600 transition-all duration-300"
                    style={{ width: `${tempStats.overPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
