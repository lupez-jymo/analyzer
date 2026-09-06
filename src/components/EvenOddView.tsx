import React, { useState } from 'react';
import { Split, Info, ShieldCheck, Flame } from 'lucide-react';
import { Tick } from '../types';
import { calculateEvenOddStats } from '../utils/statistics';

interface EvenOddViewProps {
  ticks: Tick[];
}

export const EvenOddView: React.FC<EvenOddViewProps> = ({ ticks }) => {
  const [windowSize, setWindowSize] = useState<number>(100);
  const windows = [25, 50, 100, 250, 500, 1000];

  const stats = calculateEvenOddStats(ticks, windowSize);

  return (
    <div className="space-y-6">
      {/* Header & Window Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Split className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
              Even / Odd Analysis Panel
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Analyzing parity distribution, streak resistance, and sample-weighted probability estimates.
          </p>
        </div>

        {/* Window Selector */}
        <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded-lg border border-[#262626]">
          <span className="text-xs font-mono text-gray-400 px-2">Sample Window:</span>
          {windows.map((w) => (
            <button
              key={w}
              onClick={() => setWindowSize(w)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md font-semibold transition-colors ${
                windowSize === w
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#1f1f1f]'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Comparison: EVEN vs ODD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EVEN Card */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-mono font-bold text-white text-base">
                E
              </span>
              <div>
                <h3 className="font-bold text-base text-gray-100 font-mono">EVEN</h3>
                <p className="text-xs text-gray-400 font-mono">Digits 0, 2, 4, 6, 8</p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
              stats.confidence === 'High'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : stats.confidence === 'Medium'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-[#141414] text-gray-400 border-[#262626]'
            }`}>
              Confidence: {stats.confidence}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[11px] font-mono text-gray-400 block uppercase tracking-widest">Probability Estimate</span>
              <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">
                {stats.estimatedProbEven}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Bayesian posterior estimate</span>
            </div>

            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[11px] font-mono text-gray-400 block uppercase tracking-widest">Historical Frequency</span>
              <span className="text-2xl font-bold font-mono text-gray-200 mt-1 block">
                {stats.evenPercentage}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {stats.evenCount} of {stats.sampleSize} ticks
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#262626] space-y-2 text-xs font-mono">
            <div className="flex justify-between text-gray-400">
              <span>Recent 25-Tick Frequency:</span>
              <span className="text-gray-200 font-semibold">{stats.recent25EvenPct}%</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Longest Even Streak:</span>
              <span className="text-gray-200 font-semibold">{stats.longestEvenStreak} consecutive ticks</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Active Parity Streak:</span>
              <span className="font-semibold text-blue-400">
                {stats.currentStreakType === 'EVEN' ? `${stats.currentStreak}x Active` : 'None (Odd active)'}
              </span>
            </div>
          </div>
        </div>

        {/* ODD Card */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center font-mono font-bold text-white text-base">
                O
              </span>
              <div>
                <h3 className="font-bold text-base text-gray-100 font-mono">ODD</h3>
                <p className="text-xs text-gray-400 font-mono">Digits 1, 3, 5, 7, 9</p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
              stats.confidence === 'High'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : stats.confidence === 'Medium'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-[#141414] text-gray-400 border-[#262626]'
            }`}>
              Confidence: {stats.confidence}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[11px] font-mono text-gray-400 block uppercase tracking-widest">Probability Estimate</span>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
                {stats.estimatedProbOdd}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Bayesian posterior estimate</span>
            </div>

            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[11px] font-mono text-gray-400 block uppercase tracking-widest">Historical Frequency</span>
              <span className="text-2xl font-bold font-mono text-gray-200 mt-1 block">
                {stats.oddPercentage}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {stats.oddCount} of {stats.sampleSize} ticks
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#262626] space-y-2 text-xs font-mono">
            <div className="flex justify-between text-gray-400">
              <span>Recent 25-Tick Frequency:</span>
              <span className="text-gray-200 font-semibold">{stats.recent25OddPct}%</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Longest Odd Streak:</span>
              <span className="text-gray-200 font-semibold">{stats.longestOddStreak} consecutive ticks</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Active Parity Streak:</span>
              <span className="font-semibold text-amber-400">
                {stats.currentStreakType === 'ODD' ? `${stats.currentStreak}x Active` : 'None (Even active)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Ratio Progress Bar */}
      <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-mono text-gray-300 mb-2">
          <span>EVEN: {stats.evenPercentage}%</span>
          <span className="text-gray-500">Sample: {stats.sampleSize} Ticks</span>
          <span>ODD: {stats.oddPercentage}%</span>
        </div>
        <div className="w-full h-3 bg-[#1a1a1a] rounded-full overflow-hidden flex">
          <div 
            className="bg-blue-600 transition-all duration-300"
            style={{ width: `${stats.evenPercentage}%` }}
          />
          <div 
            className="bg-amber-600 transition-all duration-300"
            style={{ width: `${stats.oddPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-center gap-6 mt-3 text-xs font-mono text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Even ({stats.evenCount})
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-600 inline-block" /> Odd ({stats.oddCount})
          </div>
        </div>
      </div>

      {/* Disclaimers & Integrity */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 text-xs font-mono text-gray-400 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-gray-200">Probability Estimate Transparency</p>
          <p>
            Statistical models combine historical empirical counts with a 50.0% uninformative prior and streak dampeners. 
            These figures represent mathematical descriptive indicators, NOT guaranteed trading results or future certainty.
          </p>
        </div>
      </div>
    </div>
  );
};
