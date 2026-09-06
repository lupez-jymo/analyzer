import React, { useState } from 'react';
import { Target, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Tick } from '../types';
import { calculateMatchesDiffersStats } from '../utils/statistics';

interface MatchesDiffersViewProps {
  ticks: Tick[];
}

export const MatchesDiffersView: React.FC<MatchesDiffersViewProps> = ({ ticks }) => {
  const [targetDigit, setTargetDigit] = useState<number>(7);
  const [windowSize, setWindowSize] = useState<number>(100);

  const stats = calculateMatchesDiffersStats(ticks, targetDigit, windowSize);
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="space-y-6">
      {/* Header & Target Digit Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
              Matches / Differs Engine
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Compare target digit exact hit likelihood vs differential frequency over sampled ticks.
          </p>
        </div>

        {/* Target Digit Picker */}
        <div className="flex items-center gap-2 bg-[#141414] p-1.5 rounded-lg border border-[#262626]">
          <span className="text-xs font-mono text-gray-400 pl-1">Target Digit:</span>
          <div className="flex items-center gap-1">
            {digits.map((d) => (
              <button
                key={d}
                id={`target-digit-btn-${d}`}
                onClick={() => setTargetDigit(d)}
                className={`w-7 h-7 rounded text-xs font-mono font-bold transition-colors ${
                  targetDigit === d
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#282828]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison: MATCHES vs DIFFERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matches Card */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm relative">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-mono text-gray-100">
                  MATCHES {targetDigit}
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Last digit equals exactly {targetDigit}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded">
              Baseline: ~10%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Historical Frequency</span>
              <span className="text-2xl font-bold font-mono text-gray-100 mt-1 block">
                {stats.matchesPercentage}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {stats.matchesCount} of {stats.sampleSize} ticks
              </span>
            </div>

            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Estimated Probability</span>
              <span className="text-2xl font-bold font-mono text-green-400 mt-1 block">
                {stats.estimatedProbMatches}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Bayesian shrinkage</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs font-mono border-t border-[#262626] pt-3 text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-400">Current Streak:</span>
              <span className="font-semibold text-gray-200">
                {stats.streakType === 'MATCH' ? `${stats.currentStreak}x consecutive hits` : '0 (Differs active)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Recent 25-Tick Occurrences:</span>
              <span className="font-semibold text-gray-200">{stats.recentOccurrences} hits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sample Size:</span>
              <span className="font-semibold text-gray-400">{stats.sampleSize} ticks</span>
            </div>
          </div>
        </div>

        {/* Differs Card */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm relative">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-mono text-gray-100">
                  DIFFERS {targetDigit}
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Last digit is any digit other than {targetDigit}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded">
              Baseline: ~90%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Historical Frequency</span>
              <span className="text-2xl font-bold font-mono text-gray-100 mt-1 block">
                {stats.differsPercentage}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {stats.differsCount} of {stats.sampleSize} ticks
              </span>
            </div>

            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Estimated Probability</span>
              <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">
                {stats.estimatedProbDiffers}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Bayesian shrinkage</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs font-mono border-t border-[#262626] pt-3 text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-400">Current Streak:</span>
              <span className="font-semibold text-blue-300">
                {stats.streakType === 'DIFFER' ? `${stats.currentStreak} consecutive non-matches` : '0 (Just matched)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Recent 25-Tick Non-Matches:</span>
              <span className="font-semibold text-gray-200">{25 - stats.recentOccurrences} of 25</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sample Size:</span>
              <span className="font-semibold text-gray-400">{stats.sampleSize} ticks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Probability ratio */}
      <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-mono text-gray-300 mb-2">
          <span>MATCHES {targetDigit}: {stats.matchesPercentage}%</span>
          <span>DIFFERS {targetDigit}: {stats.differsPercentage}%</span>
        </div>
        <div className="w-full h-3 bg-[#1a1a1a] rounded-full overflow-hidden flex">
          <div 
            className="bg-green-500 transition-all duration-300"
            style={{ width: `${stats.matchesPercentage}%` }}
          />
          <div 
            className="bg-blue-600 transition-all duration-300"
            style={{ width: `${stats.differsPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
