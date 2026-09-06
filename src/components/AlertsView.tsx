import React, { useState } from 'react';
import { Bell, Plus, Trash2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Market } from '../types';

export interface AlertRule {
  id: string;
  name: string;
  conditionType: 'DIGIT_FREQUENCY' | 'PARITY_STREAK' | 'DIRECTION_STREAK' | 'RSI_THRESHOLD' | 'VOLATILITY_EXPANSION';
  marketSymbol: string;
  thresholdValue: number;
  windowTicks: number;
  targetDigit?: number;
  isActive: boolean;
  createdAt: number;
  triggerCount: number;
}

interface AlertsViewProps {
  market: Market;
  alerts: AlertRule[];
  onAddAlert: (rule: Omit<AlertRule, 'id' | 'createdAt' | 'triggerCount'>) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  market,
  alerts,
  onAddAlert,
  onToggleAlert,
  onDeleteAlert,
}) => {
  const [conditionType, setConditionType] = useState<AlertRule['conditionType']>('PARITY_STREAK');
  const [thresholdValue, setThresholdValue] = useState<number>(4);
  const [windowTicks, setWindowTicks] = useState<number>(50);
  const [targetDigit, setTargetDigit] = useState<number>(7);
  const [alertName, setAlertName] = useState<string>('Parity Streak 4+ Warning');

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAlert({
      name: alertName || `${conditionType} (${thresholdValue})`,
      conditionType,
      marketSymbol: market.symbol,
      thresholdValue,
      windowTicks,
      targetDigit: conditionType === 'DIGIT_FREQUENCY' ? targetDigit : undefined,
      isActive: true,
    });
    // Reset defaults
    setAlertName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
            Quantitative Alert Rule Monitor
          </h2>
        </div>
        <p className="text-xs text-gray-400 mt-1 font-mono">
          Configure automated triggers for statistical anomalies, parity runs, RSI extremes, and volatility spikes.
        </p>
      </div>

      {/* Create Alert Form */}
      <form onSubmit={handleCreateAlert} className="bg-[#0f0f0f] border border-[#262626] p-5 rounded-xl space-y-4 shadow-sm">
        <h3 className="text-xs font-mono font-bold text-gray-100 uppercase tracking-widest flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-blue-400" />
          Create New Alert Rule
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
          {/* Rule Name */}
          <div className="lg:col-span-2">
            <label className="text-gray-400 block mb-1">Rule Name</label>
            <input
              type="text"
              placeholder="e.g. Even Streak 4+ Alert"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] p-2 rounded text-gray-100 outline-none focus:border-blue-500 placeholder:text-gray-600"
            />
          </div>

          {/* Condition Type */}
          <div>
            <label className="text-gray-400 block mb-1">Trigger Condition</label>
            <select
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value as any)}
              className="w-full bg-[#141414] border border-[#262626] p-2 rounded text-gray-100 outline-none focus:border-blue-500"
            >
              <option value="PARITY_STREAK" className="bg-[#141414]">Parity Streak (Even/Odd)</option>
              <option value="DIRECTION_STREAK" className="bg-[#141414]">Directional Streak (Rise/Fall)</option>
              <option value="DIGIT_FREQUENCY" className="bg-[#141414]">Digit Count in Window</option>
              <option value="RSI_THRESHOLD" className="bg-[#141414]">RSI Extremes (&gt; 70 / &lt; 30)</option>
              <option value="VOLATILITY_EXPANSION" className="bg-[#141414]">Volatility Expansion</option>
            </select>
          </div>

          {/* Threshold */}
          <div>
            <label className="text-gray-400 block mb-1">Threshold Value</label>
            <input
              type="number"
              value={thresholdValue}
              onChange={(e) => setThresholdValue(Number(e.target.value) || 1)}
              className="w-full bg-[#141414] border border-[#262626] p-2 rounded text-gray-100 outline-none focus:border-blue-500"
            />
          </div>

          {/* Target Digit if applicable */}
          {conditionType === 'DIGIT_FREQUENCY' ? (
            <div>
              <label className="text-gray-400 block mb-1">Digit (0-9)</label>
              <select
                value={targetDigit}
                onChange={(e) => setTargetDigit(Number(e.target.value))}
                className="w-full bg-[#141414] border border-[#262626] p-2 rounded text-gray-100 outline-none focus:border-blue-500"
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={i} className="bg-[#141414]">Digit {i}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-gray-400 block mb-1">Window Ticks</label>
              <select
                value={windowTicks}
                onChange={(e) => setWindowTicks(Number(e.target.value))}
                className="w-full bg-[#141414] border border-[#262626] p-2 rounded text-gray-100 outline-none focus:border-blue-500"
              >
                <option value={25} className="bg-[#141414]">25 Ticks</option>
                <option value={50} className="bg-[#141414]">50 Ticks</option>
                <option value={100} className="bg-[#141414]">100 Ticks</option>
                <option value={250} className="bg-[#141414]">250 Ticks</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded-lg transition-colors border border-blue-500/30"
          >
            Save Alert Rule
          </button>
        </div>
      </form>

      {/* Active Rules List */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest">
          Configured Alert Rules ({alerts.length})
        </h3>

        {alerts.length === 0 ? (
          <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-8 text-center font-mono">
            <p className="text-gray-400">No alert rules configured yet.</p>
            <p className="text-xs text-gray-500 mt-1">Create an alert above to monitor conditions in real-time.</p>
          </div>
        ) : (
          alerts.map((rule) => (
            <div
              key={rule.id}
              className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 flex items-center justify-between gap-4 font-mono shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  rule.isActive ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-[#141414] text-gray-500 border-[#262626]'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-100">{rule.name}</h4>
                  <p className="text-xs text-gray-400">
                    Market: <strong className="text-gray-200">{rule.marketSymbol}</strong> | Condition: {rule.conditionType} | Threshold: {rule.thresholdValue}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  Triggers: {rule.triggerCount}
                </span>

                {/* Toggle Active */}
                <button
                  onClick={() => onToggleAlert(rule.id)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors border ${
                    rule.isActive
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-[#141414] text-gray-400 border-[#262626]'
                  }`}
                >
                  {rule.isActive ? 'Active' : 'Muted'}
                </button>

                {/* Delete */}
                <button
                  onClick={() => onDeleteAlert(rule.id)}
                  className="p-1.5 rounded bg-[#141414] hover:bg-red-950/30 hover:text-red-400 text-gray-400 border border-[#262626] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
