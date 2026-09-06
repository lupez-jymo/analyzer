import React, { useState } from 'react';
import { History, Download, Filter, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { SignalLog } from '../types';

interface HistoryViewProps {
  logs: SignalLog[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ logs }) => {
  const [selectedMarket, setSelectedMarket] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<string>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    if (selectedMarket !== 'all' && log.market !== selectedMarket) return false;
    if (selectedContract !== 'all' && log.contractType !== selectedContract) return false;
    if (selectedOutcome !== 'all' && log.outcome !== selectedOutcome) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.market.toLowerCase().includes(q) ||
        log.contractType.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Market', 'ContractType', 'SignalType', 'Confidence', 'Outcome', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.timestamp).toISOString(),
      l.market,
      l.contractType,
      l.signalType,
      l.confidence,
      l.outcome,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `deriv_analyzer_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (filteredLogs.length === 0) return;
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deriv_analyzer_logs_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f0f0f] border border-[#262626] p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-widest">
              Signal &amp; Analytical Alert History Log
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Auditable archive of historical confluence alerts and verified outcome performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#1a1a1a] text-gray-200 text-xs font-mono rounded-lg border border-[#262626] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#1a1a1a] text-gray-200 text-xs font-mono rounded-lg border border-[#262626] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#0f0f0f] border border-[#262626] p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="flex items-center gap-1.5 bg-[#141414] px-2.5 py-1 rounded-lg border border-[#262626]">
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-gray-100 outline-none w-36 placeholder:text-gray-600"
            />
          </div>

          {/* Market filter */}
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="bg-[#141414] border border-[#262626] px-2.5 py-1 rounded-lg text-gray-300 outline-none"
          >
            <option value="all" className="bg-[#141414]">All Markets</option>
            <option value="1HZ100V" className="bg-[#141414]">1HZ100V</option>
            <option value="1HZ75V" className="bg-[#141414]">1HZ75V</option>
            <option value="1HZ50V" className="bg-[#141414]">1HZ50V</option>
            <option value="R_100" className="bg-[#141414]">R_100</option>
            <option value="CRASH_500" className="bg-[#141414]">CRASH_500</option>
          </select>

          {/* Contract filter */}
          <select
            value={selectedContract}
            onChange={(e) => setSelectedContract(e.target.value)}
            className="bg-[#141414] border border-[#262626] px-2.5 py-1 rounded-lg text-gray-300 outline-none"
          >
            <option value="all" className="bg-[#141414]">All Contract Types</option>
            <option value="EVEN_ODD" className="bg-[#141414]">Even / Odd</option>
            <option value="OVER_UNDER" className="bg-[#141414]">Over / Under</option>
            <option value="RISE_FALL" className="bg-[#141414]">Rise / Fall</option>
            <option value="MATCHES_DIFFERS" className="bg-[#141414]">Matches / Differs</option>
            <option value="TOUCH_NO_TOUCH" className="bg-[#141414]">Touch / No Touch</option>
          </select>

          {/* Outcome filter */}
          <select
            value={selectedOutcome}
            onChange={(e) => setSelectedOutcome(e.target.value)}
            className="bg-[#141414] border border-[#262626] px-2.5 py-1 rounded-lg text-gray-300 outline-none"
          >
            <option value="all" className="bg-[#141414]">All Outcomes</option>
            <option value="WIN" className="bg-[#141414]">WIN</option>
            <option value="LOSS" className="bg-[#141414]">LOSS</option>
            <option value="PENDING" className="bg-[#141414]">PENDING</option>
          </select>
        </div>

        <span className="text-gray-500">
          Showing {filteredLogs.length} records
        </span>
      </div>

      {/* Log Table */}
      <div className="bg-[#0f0f0f] border border-[#262626] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#262626] text-gray-400 uppercase tracking-widest bg-[#141414]">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Market</th>
                <th className="py-2.5 px-3">Contract</th>
                <th className="py-2.5 px-3">Signal Type</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Outcome</th>
                <th className="py-2.5 px-3">Confluence Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No historical logs recorded yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#141414] transition-colors">
                    <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-gray-200">
                      {log.market}
                    </td>
                    <td className="py-2.5 px-3 text-gray-300">
                      {log.contractType.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.signalType.includes('STRONG')
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : log.signalType.includes('MODERATE')
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-[#1e1e1e] text-gray-400 border-[#262626]'
                      }`}>
                        {log.signalType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-blue-400">
                      {log.confidence}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        log.outcome === 'WIN'
                          ? 'text-green-400'
                          : log.outcome === 'LOSS'
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}>
                        {log.outcome === 'WIN' && <CheckCircle className="w-3.5 h-3.5" />}
                        {log.outcome === 'LOSS' && <XCircle className="w-3.5 h-3.5" />}
                        {log.outcome === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                        {log.outcome}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-400 truncate max-w-xs">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
