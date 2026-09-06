import React from 'react';
import {
  LayoutDashboard,
  Coins,
  Binary,
  Split,
  ChevronsUpDown,
  TrendingUp,
  Target,
  ArrowUpRight,
  Radio,
  Cpu,
  History,
  Settings,
  ShieldAlert,
  Bell,
  LineChart,
  Layers,
  ChevronRight
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'markets'
  | 'digit_analysis'
  | 'even_odd'
  | 'over_under'
  | 'rise_fall'
  | 'touch_no_touch'
  | 'higher_lower'
  | 'ends_in_out'
  | 'multi_timeframe'
  | 'signals'
  | 'ai_analyst'
  | 'backtesting'
  | 'history'
  | 'alerts'
  | 'risk_management'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  pendingSignalsCount: number;
  activeAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingSignalsCount,
  activeAlertsCount,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: number; section?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Core Overview' },
    { id: 'markets', label: 'Markets', icon: Coins },
    { id: 'digit_analysis', label: 'Digit Analysis', icon: Binary, section: 'Contract Modules' },
    { id: 'even_odd', label: 'Even / Odd', icon: Split },
    { id: 'over_under', label: 'Over / Under', icon: ChevronsUpDown },
    { id: 'rise_fall', label: 'Rise / Fall', icon: TrendingUp },
    { id: 'touch_no_touch', label: 'Touch / No Touch', icon: Target },
    { id: 'higher_lower', label: 'Higher / Lower', icon: ArrowUpRight },
    { id: 'ends_in_out', label: 'Ends In / Out', icon: ChevronsUpDown },
    { id: 'multi_timeframe', label: 'Multi-Timeframe', icon: Layers, section: 'Decision Support' },
    { id: 'signals', label: 'Signals', icon: Radio, badge: pendingSignalsCount },
    { id: 'ai_analyst', label: 'AI Analyst', icon: Cpu },
    { id: 'backtesting', label: 'Backtesting', icon: LineChart, section: 'Management' },
    { id: 'history', label: 'History', icon: History },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: activeAlertsCount },
    { id: 'risk_management', label: 'Risk Management', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 bg-[#0f0f0f] border-r border-[#262626] flex flex-col shrink-0 h-screen sticky top-0 overflow-y-auto select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#262626]">
        <div className="text-xs font-black uppercase tracking-widest text-blue-500">Deriv Options</div>
        <div className="text-lg font-bold tracking-tight text-gray-100">Analyzer</div>
        <div className="text-[10px] text-gray-500 font-mono tracking-wider mt-1 uppercase">
          Quantitative Research
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-grow py-3 space-y-0.5">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const showSection = item.section && (index === 0 || navItems[index - 1]?.section !== item.section);

          return (
            <React.Fragment key={item.id}>
              {showSection && (
                <div className="px-6 pt-4 pb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  {item.section}
                </div>
              )}
              <button
                id={`sidebar-nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-6 py-2 transition-colors text-left group ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border-r-2 border-blue-500 font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-r-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'
                  }`} />
                  <span className="text-sm truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 ? (
                  <span className="bg-blue-500/20 text-blue-400 font-mono text-[10px] px-1.5 py-0.5 rounded border border-blue-500/30">
                    {item.badge}
                  </span>
                ) : isActive ? (
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400/60" />
                ) : null}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Bottom Live Status & Disclaimer Notice */}
      <div className="p-4 border-t border-[#262626] space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">Live Connected</span>
        </div>

        <div className="p-3 bg-[#141414] border border-[#262626] rounded-lg text-[10px] text-gray-500 leading-relaxed font-mono">
          <div className="font-semibold text-gray-400 mb-1 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Independent Platform</span>
          </div>
          <p className="text-gray-500 text-[9px]">
            Statistical analysis for decision support. Probabilistic estimates only.
          </p>
        </div>
      </div>
    </aside>
  );
};
