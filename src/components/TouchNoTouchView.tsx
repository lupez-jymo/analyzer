import React, { useState } from 'react';
import { Target, AlertTriangle, ShieldCheck, Activity, Gauge } from 'lucide-react';
import { Tick, Market, TechnicalIndicators } from '../types';
import { calculateTouchNoTouchStats } from '../utils/statistics';

interface TouchNoTouchViewProps {
  ticks: Tick[];
  market: Market;
  indicators: TechnicalIndicators;
}

export const TouchNoTouchView: React.FC<TouchNoTouchViewProps> = ({
  ticks,
  market,
  indicators,
}) => {
  const currentPrice = ticks.length > 0 ? ticks[ticks.length - 1].quote : market.defaultPrice;
  const defaultOffset = parseFloat((indicators.volatility * 1.5).toFixed(market.decimals)) || 1.5;

  const [barrierPrice, setBarrierPrice] = useState<number>(() => {
    return parseFloat((currentPrice + defaultOffset).toFixed(market.decimals));
  });
  const [durationTicks, setDurationTicks] = useState<number>(10);

  const barrierOffset = barrierPrice - currentPrice;
  const stats = calculateTouchNoTouchStats(ticks, barrierOffset, 100);
  const distancePct = currentPrice > 0 ? (stats.distance / currentPrice) * 100 : 0;
  const estProbTouch = stats.estimatedProbability;
  const estProbNoTouch = parseFloat((100 - stats.estimatedProbability).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
              Touch / No Touch Barrier Engine
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Simulate barrier breach probabilities based on historical tick path velocity and volatility distribution.
          </p>
        </div>

        {/* Barrier & Duration Inputs */}
        <div className="flex flex-wrap items-center gap-3 bg-[#141414] p-2 rounded-lg border border-[#262626]">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-gray-400">Barrier Price:</span>
            <input
              type="number"
              step="0.01"
              value={barrierPrice}
              onChange={(e) => setBarrierPrice(parseFloat(e.target.value) || currentPrice)}
              className="bg-[#1e1e1e] border border-[#262626] px-2 py-1 rounded text-gray-100 font-mono w-28 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-gray-400">Duration:</span>
            <select
              value={durationTicks}
              onChange={(e) => setDurationTicks(Number(e.target.value))}
              className="bg-[#1e1e1e] border border-[#262626] px-2 py-1 rounded text-gray-100 font-mono text-xs outline-none"
            >
              {[5, 10, 15, 25, 50, 100].map((d) => (
                <option key={d} value={d} className="bg-[#141414]">
                  {d} ticks
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Barrier Metrics Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Current Price */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Spot Price</span>
          <span className="text-xl font-bold font-mono text-gray-100 mt-1 block">
            {currentPrice.toFixed(market.decimals)}
          </span>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">Live spot quote</span>
        </div>

        {/* Distance to Barrier */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Distance to Barrier</span>
          <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">
            {stats.distance.toFixed(market.decimals)} pts
          </span>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">
            {distancePct.toFixed(2)}% delta from spot
          </span>
        </div>

        {/* Volatility Estimate */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Volatility StdDev</span>
          <span className="text-xl font-bold font-mono text-indigo-400 mt-1 block">
            {stats.recentVolatility.toFixed(3)}
          </span>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">Recent tick spread</span>
        </div>

        {/* Risk Rating */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4">
          <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Risk Rating</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2.5 py-0.5 rounded text-sm font-bold font-mono border ${
              stats.riskRating === 'Conservative'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : stats.riskRating === 'Balanced'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {stats.riskRating} Risk
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">For Touch contract</span>
        </div>
      </div>

      {/* Side-by-Side: TOUCH vs NO TOUCH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TOUCH Card */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <h3 className="text-base font-bold font-mono text-gray-100">TOUCH</h3>
            <span className="text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
              Breach within {durationTicks} ticks
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Historical Touch Rate</span>
              <span className="text-2xl font-bold font-mono text-gray-100 mt-1 block">
                {stats.historicalTouchRate}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Simulated path frequency</span>
            </div>

            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Estimated Probability</span>
              <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">
                {estProbTouch}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Brownian bridge estimate</span>
            </div>
          </div>
        </div>

        {/* NO TOUCH Card */}
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <h3 className="text-base font-bold font-mono text-gray-100">NO TOUCH</h3>
            <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
              Stays clear for {durationTicks} ticks
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Historical Safe Rate</span>
              <span className="text-2xl font-bold font-mono text-gray-100 mt-1 block">
                {(100 - stats.historicalTouchRate).toFixed(1)}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Simulated safe path frequency</span>
            </div>

            <div className="bg-[#141414] p-3 rounded-lg border border-[#262626]">
              <span className="text-[10px] uppercase tracking-widest font-mono text-gray-400 block">Estimated Probability</span>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
                {estProbNoTouch}%
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Brownian bridge estimate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
