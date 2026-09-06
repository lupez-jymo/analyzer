import React from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  RefreshCw, 
  Pause, 
  Play, 
  Layers,
  Sparkles
} from 'lucide-react';
import { Market, Tick, ConnectionStatus, DataSourceMode } from '../types';

interface TopBarProps {
  markets: Market[];
  selectedMarket: Market;
  onSelectMarket: (market: Market) => void;
  currentTick: Tick | null;
  previousTick: Tick | null;
  connectionStatus: ConnectionStatus;
  dataSourceMode: DataSourceMode;
  onToggleDataSource: () => void;
  timeframe: number;
  onChangeTimeframe: (tf: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onRefresh: () => void;
  volatilityEstimate: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  markets,
  selectedMarket,
  onSelectMarket,
  currentTick,
  previousTick,
  connectionStatus,
  dataSourceMode,
  onToggleDataSource,
  timeframe,
  onChangeTimeframe,
  isPaused,
  onTogglePause,
  onRefresh,
  volatilityEstimate,
}) => {
  const isUp = currentTick && previousTick ? currentTick.quote > previousTick.quote : false;
  const isDown = currentTick && previousTick ? currentTick.quote < previousTick.quote : false;

  const currentDigit = currentTick ? currentTick.digit : '-';
  const isEvenDigit = currentTick ? currentTick.digit % 2 === 0 : false;

  const timeframes = [10, 25, 50, 100, 250, 500, 1000];

  return (
    <header className="h-16 bg-[#0f0f0f] border-b border-[#262626] px-6 flex items-center justify-between gap-6 sticky top-0 z-30 select-none">
      {/* Left: Market Overview Information Cluster */}
      <div className="flex items-center space-x-6 sm:space-x-8">
        {/* Selected Market */}
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Selected Market</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <select
              id="market-selector-topbar"
              value={selectedMarket.symbol}
              onChange={(e) => {
                const found = markets.find((m) => m.symbol === e.target.value);
                if (found) onSelectMarket(found);
              }}
              className="bg-transparent text-sm font-bold text-gray-100 outline-none cursor-pointer hover:text-blue-400 transition-colors"
            >
              {markets.map((m) => (
                <option key={m.symbol} value={m.symbol} className="bg-[#0f0f0f] text-gray-200">
                  {m.name} ({m.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Price */}
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Current Price</span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span
              id="current-market-price"
              className={`text-sm font-mono font-bold transition-colors duration-200 ${
                isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-gray-100'
              }`}
            >
              {currentTick ? currentTick.quote.toFixed(selectedMarket.decimals) : '---.--'}
            </span>
            {currentTick && currentTick.diff !== 0 && (
              <span
                className={`text-[10px] font-mono font-medium ${
                  currentTick.diff > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {currentTick.diff > 0 ? `+${currentTick.diff}` : currentTick.diff}
              </span>
            )}
          </div>
        </div>

        {/* Last Digit */}
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Last Digit</span>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span
              id="last-digit-display"
              className={`text-sm font-mono font-black px-2 py-0.2 rounded ${
                isEvenDigit ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'bg-white/10 text-gray-100'
              }`}
            >
              {currentDigit}
            </span>
            <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">
              {isEvenDigit ? 'EVEN' : 'ODD'}
            </span>
          </div>
        </div>

        {/* Volatility StdDev */}
        <div className="hidden lg:flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Volatility</span>
          <span className="text-sm font-mono font-bold text-blue-400 mt-0.5">
            {volatilityEstimate.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Right: Mode, Timeframe & Control Actions */}
      <div className="flex items-center space-x-4">
        {/* Data Source Badge Toggle */}
        <button
          id="toggle-datasource-mode-btn"
          onClick={onToggleDataSource}
          title={`Click to switch between Live Deriv WebSocket and Demo Simulator`}
          className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
            dataSourceMode === 'LIVE_WEBSOCKET'
              ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
          }`}
        >
          {dataSourceMode === 'LIVE_WEBSOCKET' ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-green-400" />
              <span>LIVE DERIV WS</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>DEMO DATA</span>
            </>
          )}
        </button>

        {/* Timeframe Pills Group */}
        <div className="bg-[#1a1a1a] rounded flex p-1 border border-[#262626]">
          {[100, 500, 1000].map((tf) => (
            <button
              key={tf}
              onClick={() => onChangeTimeframe(tf)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                timeframe === tf
                  ? 'bg-[#333] text-gray-100 font-semibold'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tf === 1000 ? '1k' : tf} Ticks
            </button>
          ))}
          {/* Custom selector if not one of the default 3 */}
          {![100, 500, 1000].includes(timeframe) && (
            <span className="px-2 py-1 text-xs font-medium bg-[#333] text-blue-400 rounded">
              {timeframe}t
            </span>
          )}
        </div>

        {/* Pause/Live Stream Toggle */}
        <button
          id="pause-live-toggle-btn"
          onClick={onTogglePause}
          title={isPaused ? 'Resume live updates' : 'Pause updates'}
          className={`p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors ${
            isPaused ? 'text-amber-400 bg-amber-500/10' : ''
          }`}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        {/* Refresh Button */}
        <button
          id="refresh-ticks-btn"
          onClick={onRefresh}
          title="Force refresh data"
          className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
