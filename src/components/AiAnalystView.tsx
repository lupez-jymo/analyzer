import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Activity,
  Layers
} from 'lucide-react';
import { Market, Tick, TechnicalIndicators, AiAnalystReport } from '../types';
import { calculateDigitStats, calculateEvenOddStats, calculateRiseFallStats } from '../utils/statistics';

interface AiAnalystViewProps {
  market: Market;
  ticks: Tick[];
  indicators: TechnicalIndicators;
}

export const AiAnalystView: React.FC<AiAnalystViewProps> = ({
  market,
  ticks,
  indicators,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<AiAnalystReport | null>(null);
  const [sampleSize, setSampleSize] = useState<number>(100);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateAnalysis = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const digitStats = calculateDigitStats(ticks, sampleSize);
      const evenOddStats = calculateEvenOddStats(ticks, sampleSize);
      const riseFallStats = calculateRiseFallStats(ticks, sampleSize);

      const payload = {
        market: market.name,
        symbol: market.symbol,
        currentPrice: ticks.length > 0 ? ticks[ticks.length - 1].quote : market.defaultPrice,
        digitStats,
        evenOddStats,
        riseFallStats,
        volatility: indicators.volatility,
        rsi: indicators.rsi[indicators.rsi.length - 1] ?? 50,
        sampleSize,
      };

      const res = await fetch('/api/analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: AiAnalystReport = await res.json();
      setReport(data);
    } catch (err: any) {
      console.error('Error generating AI analysis:', err);
      setErrorMsg('Failed to contact AI Analyst server. Using deterministic statistical synthesis.');
    } finally {
      setLoading(false);
    }
  };

  // Initial generation on first view if null
  React.useEffect(() => {
    if (!report && ticks.length > 20) {
      generateAnalysis();
    }
  }, [market.symbol]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
              AI Market Analyst (Assistant Mode)
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Grounded synthesis combining statistical probability models, multi-timeframe drift, and risk warnings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sample Size */}
          <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-lg border border-[#262626] text-xs font-mono">
            <span className="text-gray-400 px-1 tracking-wider uppercase text-[10px]">Sample:</span>
            {[50, 100, 250, 500].map((s) => (
              <button
                key={s}
                onClick={() => setSampleSize(s)}
                className={`px-2 py-0.5 rounded font-bold transition-colors ${
                  sampleSize === s ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Regenerate Button */}
          <button
            onClick={generateAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-mono font-bold rounded-lg transition-colors border border-indigo-500/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Synthesize Report'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-xs font-mono text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading && !report ? (
        <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-12 text-center font-mono space-y-3">
          <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse mx-auto" />
          <p className="text-gray-200 font-bold">Synthesizing multi-factor statistical model...</p>
          <p className="text-xs text-gray-500">Querying server-side analytical reasoning engine</p>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
                  Executive Analytical Summary
                </h3>
              </div>
              <span className="text-xs font-mono text-gray-500">
                Sample: {report.sampleSizeTransparency} ticks analyzed
              </span>
            </div>

            <p className="text-gray-200 text-sm leading-relaxed font-sans">
              {report.summary}
            </p>
          </div>

          {/* 3 Core Analytical Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Key Digit Insights */}
            <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-bold uppercase tracking-widest border-b border-[#262626] pb-2">
                <Activity className="w-4 h-4" />
                <span>Digit Distribution Dynamics</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300 font-mono">
                {report.keyDigitInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trend & Momentum Assessment */}
            <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-green-400 font-mono text-xs font-bold uppercase tracking-widest border-b border-[#262626] pb-2">
                <TrendingUp className="w-4 h-4" />
                <span>Directional Assessment</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-mono">
                {report.trendAssessment}
              </p>
            </div>

            {/* Conflicting Indicators */}
            <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-widest border-b border-[#262626] pb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Conflicting Indicators</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300 font-mono">
                {report.conflictingIndicators.map((warning, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Potential Statistical Opportunities & Risk Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opportunities */}
            <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 space-y-3 shadow-sm">
              <h4 className="text-xs font-mono font-bold text-gray-100 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Statistical Confluence Areas</span>
              </h4>
              <ul className="space-y-2 text-xs text-gray-300 font-mono">
                {report.potentialOpportunities.map((opp, i) => (
                  <li key={i} className="p-2.5 rounded bg-[#141414] border border-[#262626]">
                    {opp}
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Considerations */}
            <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl p-5 space-y-3 shadow-sm">
              <h4 className="text-xs font-mono font-bold text-gray-100 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <span>Capital & Risk Protections</span>
              </h4>
              <ul className="space-y-2 text-xs text-gray-300 font-mono">
                {report.riskConsiderations.map((risk, i) => (
                  <li key={i} className="p-2.5 rounded bg-[#141414] border border-[#262626]">
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
