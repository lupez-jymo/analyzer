import React, { useState } from 'react';
import { Coins, Search, Activity, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import { Market, Tick } from '../types';

interface MarketsViewProps {
  markets: Market[];
  selectedMarket: Market;
  onSelectMarket: (market: Market) => void;
  currentTick: Tick | null;
}

export const MarketsView: React.FC<MarketsViewProps> = ({
  markets,
  selectedMarket,
  onSelectMarket,
  currentTick,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Volatility Indices', 'Crash/Boom', 'Step Indices', 'Jump Indices'];

  const filteredMarkets = markets.filter((m) => {
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.symbol.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
              Synthetic Markets Explorer
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Browse full range of continuous synthetic volatility, crash/boom, and jump index markets.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#141414] px-3 py-1.5 rounded-lg border border-[#262626] text-xs font-mono">
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search symbols..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-gray-100 outline-none w-44 placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors shrink-0 ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#0f0f0f] text-gray-400 hover:text-gray-100 border border-[#262626]'
            }`}
          >
            {cat === 'all' ? 'All Synthetic Indices' : cat}
          </button>
        ))}
      </div>

      {/* Markets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMarkets.map((market) => {
          const isCurrent = market.symbol === selectedMarket.symbol;
          const price = isCurrent && currentTick ? currentTick.quote : market.defaultPrice;

          return (
            <div
              key={market.symbol}
              className={`bg-[#0f0f0f] border rounded-xl p-5 shadow-sm space-y-4 transition-all ${
                isCurrent
                  ? 'border-blue-500/80 bg-[#141414]'
                  : 'border-[#262626] hover:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest block">
                    {market.category}
                  </span>
                  <h3 className="font-bold text-gray-100 text-base font-mono mt-0.5">
                    {market.name}
                  </h3>
                  <span className="text-xs font-mono text-gray-500">
                    Symbol: <strong className="text-gray-300">{market.symbol}</strong>
                  </span>
                </div>

                {isCurrent && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    ACTIVE
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-400 leading-relaxed font-sans min-h-[36px]">
                {market.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#141414] p-2.5 rounded-lg border border-[#262626]">
                <div>
                  <span className="text-gray-500 text-[10px] block">REF PRICE</span>
                  <span className="font-bold text-gray-100 text-sm">
                    {price.toFixed(market.decimals)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">FREQUENCY</span>
                  <span className="font-semibold text-gray-300">
                    {market.tickFrequency}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#262626]">
                <span className="text-[11px] font-mono text-gray-400">
                  Vol Rate: <strong className="text-blue-400">{(market.volatilityRate * 100).toFixed(0)}%</strong>
                </span>

                <button
                  onClick={() => onSelectMarket(market)}
                  disabled={isCurrent}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                    isCurrent
                      ? 'bg-[#1e1e1e] text-gray-500 cursor-default border border-[#262626]'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                  }`}
                >
                  <span>{isCurrent ? 'Selected' : 'Load Instrument'}</span>
                  {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
