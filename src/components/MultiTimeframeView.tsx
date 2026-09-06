import React from 'react';
import { Layers, CheckCircle, AlertTriangle, HelpCircle, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Tick, Market } from '../types';
import { calculateRiseFallStats, calculateEvenOddStats } from '../utils/statistics';

interface MultiTimeframeViewProps {
  ticks: Tick[];
  market: Market;
}

export const MultiTimeframeView: React.FC<MultiTimeframeViewProps> = ({ ticks, market }) => {
  const windows = [10, 25, 50, 100, 250, 500, 1000];

  const analysis = windows.map((w) => {
    const rf = calculateRiseFallStats(ticks, w);
    const eo = calculateEvenOddStats(ticks, w);

    let bias: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
    if (rf.risePercentage > 54) bias = 'Bullish';
    else if (rf.fallPercentage > 54) bias = 'Bearish';

    return {
      window: w,
      risingPct: rf.risePercentage,
      fallingPct: rf.fallPercentage,
      evenPct: eo.evenPercentage,
      oddPct: eo.oddPercentage,
      bias,
      trend: rf.shortTermTrend,
    };
  });

  const bullishCount = analysis.filter((a) => a.bias === 'Bullish').length;
  const bearishCount = analysis.filter((a) => a.bias === 'Bearish').length;

  let overallConsensus: 'Bullish' | 'Bearish' | 'Neutral' | 'Mixed' = 'Neutral';
  if (bullishCount >= 4) overallConsensus = 'Bullish';
  else if (bearishCount >= 4) overallConsensus = 'Bearish';
  else if (bullishCount > 0 && bearishCount > 0) overallConsensus = 'Mixed';

  const agreementScore = Math.round((Math.max(bullishCount, bearishCount) / windows.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
              Multi-Timeframe Agreement Matrix
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Evaluate statistical alignment across 10 to 1,000 tick observation windows.
          </p>
        </div>

        {/* Overall Consensus Bias Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Consensus Bias</span>
            <span className={`text-sm font-bold font-mono ${
              overallConsensus === 'Bullish' ? 'text-green-400' :
              overallConsensus === 'Bearish' ? 'text-red-400' :
              overallConsensus === 'Mixed' ? 'text-amber-400' : 'text-gray-300'
            }`}>
              {overallConsensus}
            </span>
          </div>

          <div className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold ${
            agreementScore >= 70
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : agreementScore >= 50
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              : 'bg-[#1e1e1e] border-[#262626] text-gray-400'
          }`}>
            {agreementScore}% Agreement
          </div>
        </div>
      </div>

      {/* Grid of Timeframes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {analysis.map((item) => (
          <div
            key={item.window}
            className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#262626] pb-2">
              <span className="font-bold text-gray-100 font-mono text-sm">
                {item.window} Ticks
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 border ${
                item.bias === 'Bullish'
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : item.bias === 'Bearish'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-[#1e1e1e] text-gray-400 border-[#262626]'
              }`}>
                {item.bias === 'Bullish' && <ArrowUpRight className="w-3 h-3" />}
                {item.bias === 'Bearish' && <ArrowDownRight className="w-3 h-3" />}
                {item.bias === 'Neutral' && <Minus className="w-3 h-3" />}
                {item.bias}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-gray-400">
                <span>Rising / Falling:</span>
                <span className="font-semibold text-gray-100">
                  <span className="text-green-400">{item.risingPct}%</span> / <span className="text-red-400">{item.fallingPct}%</span>
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Even / Odd:</span>
                <span className="font-semibold text-gray-100">
                  <span className="text-indigo-400">{item.evenPct}%</span> / <span className="text-amber-400">{item.oddPct}%</span>
                </span>
              </div>
            </div>

            <div className="w-full h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden flex">
              <div className="bg-green-500" style={{ width: `${item.risingPct}%` }} />
              <div className="bg-red-500" style={{ width: `${item.fallingPct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
