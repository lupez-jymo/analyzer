import React, { useState } from 'react';
import { 
  Settings, 
  Wifi, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Key, 
  Info, 
  ShieldCheck, 
  Check, 
  RefreshCw,
  Sliders
} from 'lucide-react';
import { DataSourceMode, ConnectionStatus } from '../types';

interface SettingsViewProps {
  dataSourceMode: DataSourceMode;
  onSelectMode: (mode: DataSourceMode) => void;
  connectionStatus: ConnectionStatus;
  derivAppId: string;
  onChangeDerivAppId: (appId: string) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onReconnect: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  dataSourceMode,
  onSelectMode,
  connectionStatus,
  derivAppId,
  onChangeDerivAppId,
  audioEnabled,
  onToggleAudio,
  onReconnect,
}) => {
  const [appIdInput, setAppIdInput] = useState(derivAppId);
  const [apiTokenInput, setApiTokenInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveAppId = () => {
    onChangeDerivAppId(appIdInput);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
            Platform Settings &amp; Connectivity
          </h2>
        </div>
        <p className="text-xs text-gray-400 mt-1 font-mono">
          Configure real-time market data feed sources, WebSocket client tokens, and system alerts.
        </p>
      </div>

      {/* 1. Data Provider Configuration */}
      <div className="bg-[#0f0f0f] border border-[#262626] p-6 rounded-xl space-y-4 shadow-sm">
        <h3 className="text-xs font-mono font-bold text-gray-100 uppercase tracking-widest flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          Market Data Feed Provider
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Live Deriv WebSocket */}
          <div
            onClick={() => onSelectMode('LIVE_WEBSOCKET')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              dataSourceMode === 'LIVE_WEBSOCKET'
                ? 'bg-green-500/10 border-green-500/50 shadow-sm'
                : 'bg-[#141414] border-[#262626] hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400 font-mono font-bold text-sm">
                <Wifi className="w-4 h-4" />
                <span>LIVE DERIV WEBSOCKET</span>
              </div>
              {dataSourceMode === 'LIVE_WEBSOCKET' && (
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2 font-mono leading-relaxed">
              Connects directly to the official public Deriv WebSocket gateway (<code className="text-gray-300 text-[11px]">wss://ws.derivws.com/websockets/v3</code>) for real-time synthetic indices.
            </p>
            <div className="mt-3 text-[11px] font-mono flex items-center gap-2 text-gray-500">
              <span>Status:</span>
              <span className={`font-bold ${
                connectionStatus === 'CONNECTED' ? 'text-green-400' :
                connectionStatus === 'CONNECTING' ? 'text-blue-400' :
                connectionStatus === 'ERROR' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {connectionStatus}
              </span>
            </div>
          </div>

          {/* Demo Simulation Provider */}
          <div
            onClick={() => onSelectMode('DEMO_SIMULATION')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              dataSourceMode === 'DEMO_SIMULATION'
                ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                : 'bg-[#141414] border-[#262626] hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>DEMO SIMULATION (MOCK)</span>
              </div>
              {dataSourceMode === 'DEMO_SIMULATION' && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2 font-mono leading-relaxed">
              Simulated tick environment with realistic Brownian random walk, digit extraction, and volatility dynamics. Clearly labeled as DEMO DATA.
            </p>
            <div className="mt-3 text-[11px] font-mono text-amber-400/80">
              Offline-ready / zero network dependency
            </div>
          </div>
        </div>

        {/* Reconnect Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onReconnect}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] hover:bg-[#1a1a1a] text-gray-200 text-xs font-mono rounded-lg border border-[#262626] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
            <span>Reconnect Gateway</span>
          </button>
        </div>
      </div>

      {/* 2. Deriv App ID & Token Settings */}
      <div className="bg-[#0f0f0f] border border-[#262626] p-6 rounded-xl space-y-4 shadow-sm">
        <h3 className="text-xs font-mono font-bold text-gray-100 uppercase tracking-widest flex items-center gap-2">
          <Key className="w-4 h-4 text-blue-400" />
          Gateway App ID &amp; Public Tokens
        </h3>

        <div className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-gray-400 block mb-1">
              Deriv WebSocket App ID (Default: 1089 for public synthetic ticks)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={appIdInput}
                onChange={(e) => setAppIdInput(e.target.value)}
                className="bg-[#141414] border border-[#262626] px-3 py-2 rounded text-gray-100 font-mono w-48 outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSaveAppId}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center gap-1.5 border border-blue-500/30"
              >
                {saveSuccess ? <Check className="w-4 h-4" /> : null}
                <span>{saveSuccess ? 'Saved' : 'Update ID'}</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              1089 is Deriv's standard public client ID allowing anonymous read-only synthetic index streams.
            </p>
          </div>

          <div className="pt-2 border-t border-[#262626]">
            <label className="text-gray-400 block mb-1">
              Authorized API Token (Optional Read-Only Token)
            </label>
            <input
              type="password"
              placeholder="Optional personal read-only token"
              value={apiTokenInput}
              onChange={(e) => setApiTokenInput(e.target.value)}
              className="w-full max-w-md bg-[#141414] border border-[#262626] px-3 py-2 rounded text-gray-100 font-mono outline-none focus:border-blue-500 placeholder:text-gray-600"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              This analyzer operates in independent analysis mode. It does not execute live trades.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Audio & Notifications */}
      <div className="bg-[#0f0f0f] border border-[#262626] p-6 rounded-xl space-y-4 shadow-sm">
        <h3 className="text-xs font-mono font-bold text-gray-100 uppercase tracking-widest flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-blue-400" />
          Sound &amp; Alert Notifications
        </h3>

        <div className="flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-gray-200 font-bold block">Audible Confluence Chimes</span>
            <span className="text-gray-500 text-[11px] block mt-0.5">
              Play subtle tone when a Strong Bias signal or configured alert fires
            </span>
          </div>

          <button
            onClick={onToggleAudio}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
              audioEnabled
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                : 'bg-[#141414] border-[#262626] text-gray-500'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
            <span>{audioEnabled ? 'Sound Enabled' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Independent Notice */}
      <div className="bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl text-xs font-mono text-gray-400 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-gray-200 uppercase tracking-wider">Independent Analytical Software Notice</p>
          <p className="mt-1 leading-relaxed">
            Deriv Options Analyzer is an independent mathematical decision-support software. It does not claim affiliation with Deriv Ltd., 
            does not hold client funds, and does not provide financial advice.
          </p>
        </div>
      </div>
    </div>
  );
};
