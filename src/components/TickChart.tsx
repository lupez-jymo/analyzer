import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Layers, 
  Eye, 
  EyeOff, 
  Maximize2, 
  BarChart2 
} from 'lucide-react';
import { Market, Tick, TechnicalIndicators } from '../types';

interface TickChartProps {
  market: Market;
  ticks: Tick[];
  timeframe: number;
  onChangeTimeframe: (tf: number) => void;
  indicators: TechnicalIndicators;
  isLiveData: boolean;
}

export const TickChart: React.FC<TickChartProps> = ({
  market,
  ticks,
  timeframe,
  onChangeTimeframe,
  indicators,
  isLiveData,
}) => {
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showSupportResistance, setShowSupportResistance] = useState(true);
  const [showDigits, setShowDigits] = useState(true);
  const [subIndicator, setSubIndicator] = useState<'rsi' | 'macd' | 'none'>('rsi');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 380 });

  // Responsive resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: Math.max(300, entry.contentRect.width),
          height: 380,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const visibleTicks = useMemo(() => {
    return ticks.slice(-timeframe);
  }, [ticks, timeframe]);

  const currentTick = visibleTicks[visibleTicks.length - 1] ?? null;
  const prevTick = visibleTicks[visibleTicks.length - 2] ?? null;

  // Price range calculation for chart
  const quotes = visibleTicks.map((t) => t.quote);
  const minPrice = quotes.length > 0 ? Math.min(...quotes) : 1000;
  const maxPrice = quotes.length > 0 ? Math.max(...quotes) : 1001;
  const padding = (maxPrice - minPrice) * 0.1 || 1;
  const chartMin = minPrice - padding;
  const chartMax = maxPrice + padding;
  const priceRange = Math.max(0.0001, chartMax - chartMin);

  // Sub-chart height
  const hasSub = subIndicator !== 'none';
  const mainHeight = hasSub ? dimensions.height * 0.72 : dimensions.height - 30;
  const subHeight = hasSub ? dimensions.height * 0.24 : 0;
  const subTop = mainHeight + 10;

  // Coordinate mapping functions
  const getX = (index: number) => {
    const total = Math.max(1, visibleTicks.length - 1);
    const leftPad = 40;
    const rightPad = 70;
    return leftPad + (index / total) * (dimensions.width - leftPad - rightPad);
  };

  const getY = (price: number) => {
    const topPad = 25;
    const bottomPad = 25;
    const availableHeight = mainHeight - topPad - bottomPad;
    return mainHeight - bottomPad - ((price - chartMin) / priceRange) * availableHeight;
  };

  // SVG Paths for Main Price Line
  const pricePoints = visibleTicks.map((t, i) => `${getX(i)},${getY(t.quote)}`).join(' ');

  // Path for SMA10
  const smaSlice = indicators.sma10.slice(-visibleTicks.length);
  const smaPoints = smaSlice
    .map((val, i) => (val !== null ? `${getX(i)},${getY(val)}` : null))
    .filter(Boolean)
    .join(' ');

  // Path for EMA20
  const emaSlice = indicators.ema20.slice(-visibleTicks.length);
  const emaPoints = emaSlice
    .map((val, i) => (val !== null ? `${getX(i)},${getY(val)}` : null))
    .filter(Boolean)
    .join(' ');

  // Bollinger Bands
  const bbUpperSlice = indicators.upperBollinger.slice(-visibleTicks.length);
  const bbLowerSlice = indicators.lowerBollinger.slice(-visibleTicks.length);

  const bbUpperPoints = bbUpperSlice
    .map((val, i) => (val !== null ? `${getX(i)},${getY(val)}` : null))
    .filter(Boolean)
    .join(' ');

  const bbLowerPoints = bbLowerSlice
    .map((val, i) => (val !== null ? `${getX(i)},${getY(val)}` : null))
    .filter(Boolean)
    .join(' ');

  // Support / Resistance coordinates
  const supportY = getY(indicators.support);
  const resistanceY = getY(indicators.resistance);

  // RSI Coordinates
  const rsiSlice = indicators.rsi.slice(-visibleTicks.length);
  const getRsiY = (rsiVal: number) => {
    const norm = Math.max(0, Math.min(100, rsiVal));
    return subTop + subHeight - (norm / 100) * subHeight;
  };

  const rsiPoints = rsiSlice
    .map((val, i) => (val !== null ? `${getX(i)},${getRsiY(val)}` : null))
    .filter(Boolean)
    .join(' ');

  // MACD Coordinates
  const macdHistSlice = indicators.macdHist.slice(-visibleTicks.length);
  const macdMax = Math.max(0.1, ...macdHistSlice.map((v) => Math.abs(v || 0)));
  const getMacdY = (val: number) => {
    const center = subTop + subHeight / 2;
    return center - (val / macdMax) * (subHeight * 0.45);
  };

  // Hovered tick data
  const hoveredTick = hoveredIndex !== null && visibleTicks[hoveredIndex] ? visibleTicks[hoveredIndex] : null;

  return (
    <div className="space-y-4">
      {/* 1. Market Overview Card */}
      <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 text-xs">
          {/* Instrument */}
          <div className="bg-[#141414] p-2.5 rounded-lg border border-[#262626]">
            <span className="text-gray-500 font-mono block text-[10px] uppercase tracking-wider">Instrument</span>
            <span className="font-bold text-gray-200 truncate block mt-0.5" title={market.name}>
              {market.name}
            </span>
          </div>

          {/* Current Price */}
          <div className="bg-[#141414] p-2.5 rounded-lg border border-[#262626]">
            <span className="text-gray-500 font-mono block text-[10px] uppercase tracking-wider">Current Price</span>
            <span className="font-mono font-bold text-gray-100 text-sm block mt-0.5">
              {currentTick ? currentTick.quote.toFixed(market.decimals) : '---'}
            </span>
          </div>

          {/* Current Digit */}
          <div className="bg-[#141414] p-2.5 rounded-lg border border-[#262626]">
            <span className="text-gray-500 font-mono block text-[10px] uppercase tracking-wider">Current Digit</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`font-mono font-bold text-sm px-1.5 py-0.2 rounded text-white ${
                currentTick && currentTick.digit % 2 === 0 ? 'bg-blue-600' : 'bg-amber-600'
              }`}>
                {currentTick ? currentTick.digit : '-'}
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                {currentTick ? (currentTick.digit >= 5 ? 'Over 4' : 'Under 5') : ''}
              </span>
            </div>
          </div>

          {/* Previous Digit */}
          <div className="bg-[#141414] p-2.5 rounded-lg border border-[#262626]">
            <span className="text-gray-500 font-mono block text-[10px] uppercase tracking-wider">Prev Digit</span>
            <span className="font-mono font-semibold text-gray-300 text-sm block mt-0.5">
              {currentTick?.previousDigit ?? '-'}
            </span>
          </div>

          {/* Price Movement */}
          <div className="bg-[#141414] p-2.5 rounded-lg border border-[#262626]">
            <span className="text-gray-500 font-mono block text-[10px] uppercase tracking-wider">Movement</span>
            <div className="flex items-center gap-1 mt-0.5">
              {currentTick && currentTick.diff > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  <span className="font-mono text-green-400 font-semibold">+{currentTick.diff}</span>
                </>
              ) : currentTick && currentTick.diff < 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="font-mono text-red-400 font-semibold">{currentTick.diff}</span>
                </>
              ) : (
                <span className="font-mono text-gray-400 font-medium">Flat (0.00)</span>
              )}
            </div>
          </div>

          {/* Volatility */}
          <div className="bg-[#141414] p-2.5 rounded-lg border border-[#262626]">
            <span className="text-gray-500 font-mono block text-[10px] uppercase tracking-wider">Volatility</span>
            <span className="font-mono font-semibold text-blue-400 block mt-0.5">
              {indicators.volatility.toFixed(3)}
            </span>
          </div>

          {/* Tick Frequency */}
          <div className="bg-[#141414] p-2.5 rounded-lg border border-[#262626]">
            <span className="text-gray-500 font-mono block text-[10px] uppercase tracking-wider">Frequency</span>
            <span className="font-mono text-gray-300 block mt-0.5">
              {market.tickFrequency}
            </span>
          </div>

          {/* Trend */}
          <div className="bg-[#141414] p-2.5 rounded-lg border border-[#262626]">
            <span className="text-gray-500 font-mono block text-[10px] uppercase tracking-wider">Trend</span>
            <span className={`font-mono font-bold block mt-0.5 ${
              currentTick && prevTick && currentTick.quote > prevTick.quote ? 'text-green-400' : 'text-red-400'
            }`}>
              {currentTick && prevTick ? (currentTick.quote > prevTick.quote ? 'Bullish' : 'Bearish') : 'Neutral'}
            </span>
          </div>

          {/* Market Status */}
          <div className="bg-[#141414] p-2.5 rounded-lg border border-[#262626]">
            <span className="text-gray-500 font-mono block text-[10px] uppercase tracking-wider">Status</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-green-400 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {isLiveData ? 'LIVE FEED' : 'DEMO MODE'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Tick Chart */}
      <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-4 shadow-sm relative overflow-hidden">
        {/* Chart Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 font-mono">
              Tick-by-Tick Momentum
            </h3>
            <span className="text-xs text-gray-500 font-mono">
              ({visibleTicks.length} of {timeframe} ticks)
            </span>
          </div>

          {/* Overlays & Indicators Toggles */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* SMA 10 */}
            <button
              onClick={() => setShowSMA(!showSMA)}
              className={`px-2 py-0.5 rounded border text-[10px] font-mono transition-colors ${
                showSMA
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                  : 'bg-[#141414] border-[#262626] text-gray-500 hover:text-gray-300'
              }`}
            >
              SMA 10
            </button>

            {/* EMA 20 */}
            <button
              onClick={() => setShowEMA(!showEMA)}
              className={`px-2 py-0.5 rounded border text-[10px] font-mono transition-colors ${
                showEMA
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-[#141414] border-[#262626] text-gray-500 hover:text-gray-300'
              }`}
            >
              EMA 20
            </button>

            {/* Bollinger Bands */}
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2 py-0.5 rounded border text-[10px] font-mono transition-colors ${
                showBollinger
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                  : 'bg-[#141414] border-[#262626] text-gray-500 hover:text-gray-300'
              }`}
            >
              Bollinger Bands
            </button>

            {/* S/R Levels */}
            <button
              onClick={() => setShowSupportResistance(!showSupportResistance)}
              className={`px-2 py-0.5 rounded border text-[10px] font-mono transition-colors ${
                showSupportResistance
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  : 'bg-[#141414] border-[#262626] text-gray-500 hover:text-gray-300'
              }`}
            >
              Support/Resistance
            </button>

            {/* Show Digits on Ticks */}
            <button
              onClick={() => setShowDigits(!showDigits)}
              className={`px-2 py-0.5 rounded border text-[10px] font-mono transition-colors ${
                showDigits
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-[#141414] border-[#262626] text-gray-500 hover:text-gray-300'
              }`}
            >
              Digits
            </button>

            {/* Sub-Indicator Switch */}
            <div className="flex items-center bg-[#141414] rounded border border-[#262626] p-0.5">
              {(['rsi', 'macd', 'none'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSubIndicator(mode)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                    subIndicator === mode
                      ? 'bg-blue-600/30 text-blue-400 font-bold border border-blue-500/40'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SVG Chart Canvas */}
        <div 
          ref={containerRef} 
          className="relative w-full mt-3 select-none"
          style={{ height: dimensions.height }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <svg
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full overflow-visible"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              // Find closest tick
              let closest = 0;
              let minDist = Infinity;
              for (let i = 0; i < visibleTicks.length; i++) {
                const x = getX(i);
                const d = Math.abs(x - mouseX);
                if (d < minDist) {
                  minDist = d;
                  closest = i;
                }
              }
              setHoveredIndex(closest);
            }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="bbFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.06" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const p = chartMin + ratio * priceRange;
              const y = getY(p);
              return (
                <g key={ratio}>
                  <line
                    x1={40}
                    y1={y}
                    x2={dimensions.width - 70}
                    y2={y}
                    stroke="#262626"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={dimensions.width - 65}
                    y={y + 3}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {p.toFixed(market.decimals)}
                  </text>
                </g>
              );
            })}

            {/* Support and Resistance Bands */}
            {showSupportResistance && (
              <>
                <line
                  x1={40}
                  y1={resistanceY}
                  x2={dimensions.width - 70}
                  y2={resistanceY}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={45}
                  y={resistanceY - 5}
                  fill="#ef4444"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  RESISTANCE: {indicators.resistance.toFixed(market.decimals)}
                </text>

                <line
                  x1={40}
                  y1={supportY}
                  x2={dimensions.width - 70}
                  y2={supportY}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={45}
                  y={supportY + 12}
                  fill="#10b981"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  SUPPORT: {indicators.support.toFixed(market.decimals)}
                </text>
              </>
            )}

            {/* Bollinger Bands */}
            {showBollinger && bbUpperPoints && bbLowerPoints && (
              <>
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  points={bbUpperPoints}
                />
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  points={bbLowerPoints}
                />
              </>
            )}

            {/* SMA 10 Line */}
            {showSMA && smaPoints && (
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                points={smaPoints}
              />
            )}

            {/* EMA 20 Line */}
            {showEMA && emaPoints && (
              <polyline
                fill="none"
                stroke="#818cf8"
                strokeWidth="1.5"
                points={emaPoints}
              />
            )}

            {/* Price Area Fill */}
            {pricePoints && (
              <polygon
                fill="url(#priceGradient)"
                points={`40,${mainHeight - 25} ${pricePoints} ${dimensions.width - 70},${mainHeight - 25}`}
              />
            )}

            {/* Main Price Line */}
            {pricePoints && (
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points={pricePoints}
              />
            )}

            {/* Tick Nodes and Digits */}
            {visibleTicks.map((tick, i) => {
              const cx = getX(i);
              const cy = getY(tick.quote);
              const isUp = tick.diff > 0;
              const isDown = tick.diff < 0;
              const isEven = tick.digit % 2 === 0;

              // Only show digit text when tick density allows or on hover
              const shouldShowDigit = showDigits && (timeframe <= 100 || i % Math.ceil(timeframe / 60) === 0);

              return (
                <g key={i}>
                  {/* Tick circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={timeframe <= 50 ? 4 : 2.5}
                    fill={isUp ? '#10b981' : isDown ? '#f43f5e' : '#06b6d4'}
                    stroke="#0f172a"
                    strokeWidth="1"
                  />

                  {/* Digit label */}
                  {shouldShowDigit && (
                    <text
                      x={cx}
                      y={cy - 8}
                      textAnchor="middle"
                      fill={isEven ? '#818cf8' : '#fbbf24'}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {tick.digit}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Current Tick Pulsating Marker */}
            {currentTick && (
              <g>
                <circle
                  cx={getX(visibleTicks.length - 1)}
                  cy={getY(currentTick.quote)}
                  r="6"
                  fill="#06b6d4"
                  className="animate-ping opacity-75"
                />
                <circle
                  cx={getX(visibleTicks.length - 1)}
                  cy={getY(currentTick.quote)}
                  r="4.5"
                  fill="#ffffff"
                />
              </g>
            )}

            {/* Crosshair on hover */}
            {hoveredIndex !== null && hoveredTick && (
              <g>
                {/* Vertical line */}
                <line
                  x1={getX(hoveredIndex)}
                  y1={20}
                  x2={getX(hoveredIndex)}
                  y2={dimensions.height - 10}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                {/* Horizontal line */}
                <line
                  x1={40}
                  y1={getY(hoveredTick.quote)}
                  x2={dimensions.width - 70}
                  y2={getY(hoveredTick.quote)}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              </g>
            )}

            {/* Sub-chart: RSI */}
            {subIndicator === 'rsi' && (
              <g>
                {/* Sub-chart separator */}
                <line
                  x1={40}
                  y1={subTop}
                  x2={dimensions.width - 70}
                  y2={subTop}
                  stroke="#334155"
                  strokeWidth="1"
                />
                {/* 70 Overbought level */}
                <line
                  x1={40}
                  y1={getRsiY(70)}
                  x2={dimensions.width - 70}
                  y2={getRsiY(70)}
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={dimensions.width - 65}
                  y={getRsiY(70) + 3}
                  fill="#f43f5e"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  70
                </text>

                {/* 30 Oversold level */}
                <line
                  x1={40}
                  y1={getRsiY(30)}
                  x2={dimensions.width - 70}
                  y2={getRsiY(30)}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={dimensions.width - 65}
                  y={getRsiY(30) + 3}
                  fill="#10b981"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  30
                </text>

                {/* 50 Center line */}
                <line
                  x1={40}
                  y1={getRsiY(50)}
                  x2={dimensions.width - 70}
                  y2={getRsiY(50)}
                  stroke="#334155"
                  strokeDasharray="2 2"
                />

                {/* RSI Line */}
                {rsiPoints && (
                  <polyline
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    points={rsiPoints}
                  />
                )}
                <text
                  x={45}
                  y={subTop + 14}
                  fill="#c084fc"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  RSI (14): {indicators.rsi[indicators.rsi.length - 1] ?? '--'}
                </text>
              </g>
            )}

            {/* Sub-chart: MACD */}
            {subIndicator === 'macd' && (
              <g>
                <line
                  x1={40}
                  y1={subTop}
                  x2={dimensions.width - 70}
                  y2={subTop}
                  stroke="#334155"
                  strokeWidth="1"
                />
                {/* Zero line */}
                <line
                  x1={40}
                  y1={getMacdY(0)}
                  x2={dimensions.width - 70}
                  y2={getMacdY(0)}
                  stroke="#475569"
                />

                {/* Histogram Bars */}
                {macdHistSlice.map((val, i) => {
                  if (val === null) return null;
                  const x = getX(i);
                  const y = getMacdY(val);
                  const zeroY = getMacdY(0);
                  const h = Math.abs(y - zeroY);
                  const top = val >= 0 ? y : zeroY;
                  return (
                    <rect
                      key={i}
                      x={x - 1.5}
                      y={top}
                      width="3"
                      height={Math.max(1, h)}
                      fill={val >= 0 ? '#10b981' : '#f43f5e'}
                    />
                  );
                })}
                <text
                  x={45}
                  y={subTop + 14}
                  fill="#38bdf8"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  MACD (12, 26, 9)
                </text>
              </g>
            )}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredIndex !== null && hoveredTick && (
            <div
              className="absolute pointer-events-none bg-[#141414] border border-[#262626] p-2.5 rounded-lg shadow-xl text-xs font-mono z-20"
              style={{
                left: Math.min(dimensions.width - 180, Math.max(10, getX(hoveredIndex) - 90)),
                top: 10,
              }}
            >
              <div className="flex items-center justify-between gap-4 pb-1 border-b border-[#262626] text-[10px] text-gray-400">
                <span>Tick #{hoveredIndex + 1}</span>
                <span>{new Date(hoveredTick.epoch * 1000).toLocaleTimeString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1 text-[11px]">
                <span className="text-gray-400">Price:</span>
                <span className="font-bold text-white text-right">
                  {hoveredTick.quote.toFixed(market.decimals)}
                </span>
                <span className="text-gray-400">Digit:</span>
                <span className="font-bold text-blue-400 text-right">
                  {hoveredTick.digit} ({hoveredTick.digit % 2 === 0 ? 'EVEN' : 'ODD'})
                </span>
                <span className="text-gray-400">Change:</span>
                <span
                  className={`font-semibold text-right ${
                    hoveredTick.diff > 0 ? 'text-green-400' : hoveredTick.diff < 0 ? 'text-red-400' : 'text-gray-400'
                  }`}
                >
                  {hoveredTick.diff > 0 ? `+${hoveredTick.diff}` : hoveredTick.diff}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-gray-400 pt-3 border-t border-[#262626] mt-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 inline-block" /> Price Line
            </span>
            {showSMA && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-yellow-500 inline-block" /> SMA (10)
              </span>
            )}
            {showEMA && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-400 inline-block" /> EMA (20)
              </span>
            )}
            {showBollinger && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-yellow-400 inline-block" /> Bollinger
              </span>
            )}
          </div>
          <div className="text-gray-500">
            Hover over chart for tick-level parameters
          </div>
        </div>
      </div>
    </div>
  );
};
