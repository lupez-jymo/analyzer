import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Calculator, DollarSign, Percent, ShieldCheck } from 'lucide-react';

export const RiskManagementView: React.FC = () => {
  const [accountBalance, setAccountBalance] = useState<number>(1000);
  const [riskPercentPerTrade, setRiskPercentPerTrade] = useState<number>(1.5);
  const [dailyLossLimitPct, setDailyLossLimitPct] = useState<number>(5.0);
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState<number>(3);

  const recommendedStake = (accountBalance * (riskPercentPerTrade / 100)).toFixed(2);
  const maxDailyLossDollars = (accountBalance * (dailyLossLimitPct / 100)).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
            Capital Protection &amp; Risk Sizing Engine
          </h2>
        </div>
        <p className="text-xs text-gray-400 mt-1 font-mono">
          Calculate safe mathematical position sizing, enforce daily drawdown stops, and prevent catastrophic ruin.
        </p>
      </div>

      {/* Calculator Inputs Grid */}
      <div className="bg-[#0f0f0f] border border-[#262626] p-6 rounded-xl space-y-6 shadow-sm">
        <h3 className="text-xs font-mono font-bold text-gray-100 uppercase tracking-widest flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-400" />
          Account &amp; Risk Thresholds
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {/* Account Balance */}
          <div>
            <label className="text-gray-400 block mb-1">Total Account Balance ($)</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-gray-500 absolute left-2.5 top-2.5" />
              <input
                type="number"
                value={accountBalance}
                onChange={(e) => setAccountBalance(Math.max(1, Number(e.target.value) || 0))}
                className="w-full bg-[#141414] border border-[#262626] pl-8 pr-3 py-2 rounded text-gray-100 font-bold outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Risk % per trade */}
          <div>
            <label className="text-gray-400 block mb-1">Max Risk % per Trade</label>
            <div className="relative">
              <Percent className="w-4 h-4 text-gray-500 absolute left-2.5 top-2.5" />
              <input
                type="number"
                step="0.1"
                value={riskPercentPerTrade}
                onChange={(e) => setRiskPercentPerTrade(Math.max(0.1, Math.min(10, Number(e.target.value) || 0)))}
                className="w-full bg-[#141414] border border-[#262626] pl-8 pr-3 py-2 rounded text-gray-100 font-bold outline-none focus:border-blue-500"
              />
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">Recommended: 1.0% – 2.0%</span>
          </div>

          {/* Daily Loss Limit */}
          <div>
            <label className="text-gray-400 block mb-1">Daily Stop-Loss Limit (%)</label>
            <div className="relative">
              <Percent className="w-4 h-4 text-gray-500 absolute left-2.5 top-2.5" />
              <input
                type="number"
                step="0.5"
                value={dailyLossLimitPct}
                onChange={(e) => setDailyLossLimitPct(Math.max(1, Number(e.target.value) || 0))}
                className="w-full bg-[#141414] border border-[#262626] pl-8 pr-3 py-2 rounded text-gray-100 font-bold outline-none focus:border-blue-500"
              />
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">Hard circuit breaker</span>
          </div>

          {/* Max Consecutive Losses */}
          <div>
            <label className="text-gray-400 block mb-1">Max Consecutive Loss Limit</label>
            <input
              type="number"
              value={maxConsecutiveLosses}
              onChange={(e) => setMaxConsecutiveLosses(Math.max(1, Number(e.target.value) || 0))}
              className="w-full bg-[#141414] border border-[#262626] px-3 py-2 rounded text-gray-100 font-bold outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-gray-500 mt-1 block">Stop session on reach</span>
          </div>
        </div>
      </div>

      {/* Calculated Sizing Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        <div className="bg-[#0f0f0f] border border-[#262626] p-5 rounded-xl">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Recommended Stake per Trade</span>
          <span className="text-3xl font-bold text-blue-400 mt-2 block">
            ${recommendedStake}
          </span>
          <span className="text-xs text-gray-400 mt-1 block">
            Exact {riskPercentPerTrade}% of capital
          </span>
        </div>

        <div className="bg-[#0f0f0f] border border-[#262626] p-5 rounded-xl">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Max Daily Drawdown Cap</span>
          <span className="text-3xl font-bold text-red-400 mt-2 block">
            ${maxDailyLossDollars}
          </span>
          <span className="text-xs text-gray-400 mt-1 block">
            Immediately cease trading if reached
          </span>
        </div>

        <div className="bg-[#0f0f0f] border border-[#262626] p-5 rounded-xl">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Max Losing Trades Tolerance</span>
          <span className="text-3xl font-bold text-amber-400 mt-2 block">
            {maxConsecutiveLosses} Losses
          </span>
          <span className="text-xs text-gray-400 mt-1 block">
            Mandatory cooling-off period
          </span>
        </div>
      </div>

      {/* High Risk Warning Box (Martingale Danger) */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 text-xs font-mono text-red-300 space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-widest text-sm">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span>Severe Risk Warning: Martingale &amp; Recovery Multipliers</span>
        </div>
        <p className="leading-relaxed text-gray-300">
          Martingale or aggressive negative progression systems (doubling stakes after losses) dramatically increase the probability of total capital wipeout. 
          In synthetic volatility markets, digit and directional streaks can persist for 10–15+ consecutive ticks, which quickly exceeds account margins and broker maximum stake limits. 
          Always use fixed fractional sizing and pre-defined maximum stop limits.
        </p>
      </div>
    </div>
  );
};
