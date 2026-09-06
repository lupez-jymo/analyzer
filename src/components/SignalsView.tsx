import React, { useState } from 'react';
import { 
  Radio, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  TrendingUp, 
  Activity, 
  Sliders 
} from 'lucide-react';
import { Signal, Market, ContractType } from '../types';

interface SignalsViewProps {
  signals: Signal[];
  market: Market;
  onRefreshSignals: () => void;
}

export const SignalsView: React.FC<SignalsViewProps> = ({
  signals,
  market,
  onRefreshSignals,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0);

  const filteredSignals = signals.filter((s) => {
    if (filterType !== 'all' && s.contractType !== filterType) return false;
    if (s.confidenceScore < minConfidence) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
              Statistical Decision-Support Engine
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Real-time quantitative confluence scanner across digits, volatility, and trend momentum.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#141414] px-2.5 py-1.5 rounded-lg border border-[#262626] text-xs font-mono">
            <span className="text-gray-400">Contract:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-gray-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#141414]">All Contracts</option>
              <option value="EVEN_ODD" className="bg-[#141414]">Even / Odd</option>
              <option value="OVER_UNDER" className="bg-[#141414]">Over / Under</option>
              <option value="RISE_FALL" className="bg-[#141414]">Rise / Fall</option>
              <option value="MATCHES_DIFFERS" className="bg-[#141414]">Matches / Differs</option>
              <option value="TOUCH_NO_TOUCH" className="bg-[#141414]">Touch / No Touch</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#141414] px-2.5 py-1.5 rounded-lg border border-[#262626] text-xs font-mono">
            <span className="text-gray-400">Min Conf:</span>
            <select
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="bg-transparent text-gray-200 outline-none cursor-pointer"
            >
              <option value={0} className="bg-[#141414]">0%+</option>
              <option value={50} className="bg-[#141414]">50%+</option>
              <option value={70} className="bg-[#141414]">70%+</option>
              <option value={80} className="bg-[#141414]">80%+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSignals.length === 0 ? (
          <div className="col-span-2 bg-[#0f0f0f] border border-[#262626] rounded-xl p-8 text-center font-mono">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-gray-200 font-bold">No active signals match the selected filter criteria.</p>
            <p className="text-xs text-gray-500 mt-1">
              The engine only displays opportunities with strict statistical confluence.
            </p>
          </div>
        ) : (
          filteredSignals.map((signal) => {
            const isStrong = signal.signalType === 'STRONG_BIAS';
            const isModerate = signal.signalType === 'MODERATE_BIAS';
            const isNeutral = signal.signalType === 'NEUTRAL';
            const isUncertain = signal.signalType === 'HIGH_UNCERTAINTY';

            return (
              <div
                key={signal.id}
                className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm space-y-4 hover:border-gray-700 transition-colors"
              >
                {/* Top Bar of Signal Card */}
                <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                      isStrong
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : isModerate
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : isNeutral
                        ? 'bg-[#1e1e1e] text-gray-400 border-[#262626]'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {signal.signalType.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      {signal.contractType.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Confidence Score</span>
                    <span className="text-sm font-bold font-mono text-blue-400">
                      {signal.confidenceScore} / 100
                    </span>
                  </div>
                </div>

                {/* Recommendation Focus Banner */}
                <div className="bg-[#141414] p-3.5 rounded-lg border border-[#262626] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 block uppercase tracking-widest">Recommended Direction</span>
                    <span className="text-base font-bold font-mono text-gray-100 mt-0.5 block">
                      {signal.direction}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-gray-400 block uppercase tracking-widest">Estimated Probability</span>
                    <span className="text-xl font-bold font-mono text-green-400">
                      {signal.estimatedProbability}%
                    </span>
                  </div>
                </div>

                {/* Confluence Factor Breakdown */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-semibold">
                    Factor Breakdown
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-[#141414] p-2 rounded border border-[#262626] flex items-center justify-between">
                      <span className="text-gray-400">Trend Alignment:</span>
                      <span className="font-semibold text-gray-200">{signal.factors.trendAlignment}</span>
                    </div>

                    <div className="bg-[#141414] p-2 rounded border border-[#262626] flex items-center justify-between">
                      <span className="text-gray-400">Volatility:</span>
                      <span className="font-semibold text-gray-200">{signal.factors.volatilityCondition}</span>
                    </div>

                    <div className="bg-[#141414] p-2 rounded border border-[#262626] flex items-center justify-between">
                      <span className="text-gray-400">MA Confirmation:</span>
                      <span className="font-semibold text-gray-200">{signal.factors.maConfirmation}</span>
                    </div>

                    <div className="bg-[#141414] p-2 rounded border border-[#262626] flex items-center justify-between">
                      <span className="text-gray-400">Streak Condition:</span>
                      <span className="font-semibold text-gray-200">{signal.factors.streakCondition}</span>
                    </div>
                  </div>
                </div>

                {/* Invalidation & Risk */}
                <div className="border-t border-[#262626] pt-3 space-y-1.5 text-xs font-mono">
                  <div className="flex items-start gap-2 text-red-300">
                    <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
                    <span>
                      <strong className="text-gray-400">Invalidation:</strong> {signal.invalidationCondition}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400 pt-1">
                    <span>Risk Rating: <strong className="text-amber-400">{signal.riskRating}</strong></span>
                    <span className="text-[10px] text-gray-500">
                      Sample Size: {signal.factors.sampleSizeAdequacy}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mandatory Disclaimer */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 text-xs font-mono text-gray-400 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-gray-200 uppercase tracking-widest">Decision-Support Disclaimer:</span>
          <p className="mt-1 leading-relaxed text-gray-400">
            Signals represent quantitative statistical alignment and probability models. They do NOT guarantee outcomes or eliminate risk. 
            Never risk money you cannot afford to lose. All trades must be evaluated individually.
          </p>
        </div>
      </div>
    </div>
  );
};
