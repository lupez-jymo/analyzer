import { Market, Tick, ConnectionStatus, DataSourceMode } from '../types';
import { extractLastDigit } from '../utils/statistics';

export const SUPPORTED_MARKETS: Market[] = [
  {
    symbol: '1HZ100V',
    name: 'Volatility 100 (1s) Index',
    category: 'Volatility Indices',
    decimals: 2,
    tickFrequency: '1 tick / sec',
    description: 'Simulates constant 100% volatility with one tick every second.',
    defaultPrice: 1542.85,
    volatilityRate: 0.85,
  },
  {
    symbol: '1HZ75V',
    name: 'Volatility 75 (1s) Index',
    category: 'Volatility Indices',
    decimals: 2,
    tickFrequency: '1 tick / sec',
    description: 'Simulates constant 75% volatility with one tick every second.',
    defaultPrice: 4280.12,
    volatilityRate: 0.70,
  },
  {
    symbol: '1HZ50V',
    name: 'Volatility 50 (1s) Index',
    category: 'Volatility Indices',
    decimals: 2,
    tickFrequency: '1 tick / sec',
    description: 'Simulates constant 50% volatility with one tick every second.',
    defaultPrice: 285.45,
    volatilityRate: 0.50,
  },
  {
    symbol: '1HZ25V',
    name: 'Volatility 25 (1s) Index',
    category: 'Volatility Indices',
    decimals: 2,
    tickFrequency: '1 tick / sec',
    description: 'Simulates constant 25% volatility with one tick every second.',
    defaultPrice: 1980.35,
    volatilityRate: 0.35,
  },
  {
    symbol: '1HZ10V',
    name: 'Volatility 10 (1s) Index',
    category: 'Volatility Indices',
    decimals: 2,
    tickFrequency: '1 tick / sec',
    description: 'Simulates constant 10% volatility with one tick every second.',
    defaultPrice: 6512.20,
    volatilityRate: 0.20,
  },
  {
    symbol: 'R_100',
    name: 'Volatility 100 Index',
    category: 'Volatility Indices',
    decimals: 2,
    tickFrequency: '1 tick / 2 sec',
    description: 'Standard 100% volatility index with 2-second ticks.',
    defaultPrice: 2154.60,
    volatilityRate: 0.90,
  },
  {
    symbol: 'R_50',
    name: 'Volatility 50 Index',
    category: 'Volatility Indices',
    decimals: 4,
    tickFrequency: '1 tick / 2 sec',
    description: 'Standard 50% volatility index with 4-decimal precision.',
    defaultPrice: 341.5204,
    volatilityRate: 0.45,
  },
  {
    symbol: 'R_10',
    name: 'Volatility 10 Index',
    category: 'Volatility Indices',
    decimals: 3,
    tickFrequency: '1 tick / 2 sec',
    description: 'Low-volatility synthetic index with 3 decimal precision.',
    defaultPrice: 9481.150,
    volatilityRate: 0.15,
  },
  {
    symbol: 'CRASH_500',
    name: 'Crash 500 Index',
    category: 'Crash/Boom',
    decimals: 2,
    tickFrequency: '1 tick / sec',
    description: 'Average of 1 drop in 500 ticks, with steady upward trend between crashes.',
    defaultPrice: 3490.80,
    volatilityRate: 0.75,
  },
  {
    symbol: 'BOOM_500',
    name: 'Boom 500 Index',
    category: 'Crash/Boom',
    decimals: 2,
    tickFrequency: '1 tick / sec',
    description: 'Average of 1 spike in 500 ticks, with steady downward drift between booms.',
    defaultPrice: 4210.15,
    volatilityRate: 0.75,
  },
  {
    symbol: 'STEPINDEX',
    name: 'Step Index',
    category: 'Step Indices',
    decimals: 2,
    tickFrequency: '1 tick / sec',
    description: 'Equal probability of up/down step of 0.1 on each tick.',
    defaultPrice: 8714.20,
    volatilityRate: 0.40,
  },
  {
    symbol: 'JD50',
    name: 'Jump 50 Index',
    category: 'Jump Indices',
    decimals: 2,
    tickFrequency: '1 tick / sec',
    description: 'Simulates price jumps with 50% annualized volatility.',
    defaultPrice: 5120.40,
    volatilityRate: 0.65,
  },
];

export interface MarketDataProvider {
  mode: DataSourceMode;
  connect(): Promise<void>;
  disconnect(): void;
  getMarkets(): Market[];
  subscribeTicks(symbol: string, callback: (tick: Tick) => void): void;
  unsubscribeTicks(symbol: string): void;
  getHistoricalTicks(symbol: string, count: number): Promise<Tick[]>;
  getCurrentPrice(symbol: string): number | null;
  getStatus(): ConnectionStatus;
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void;
}

/**
 * Live Deriv WebSocket Provider
 * Connects to official Deriv public synthetic WebSocket endpoint.
 */
export class DerivLiveWebSocketProvider implements MarketDataProvider {
  public mode: DataSourceMode = 'LIVE_WEBSOCKET';
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'DISCONNECTED';
  private listeners: Set<(status: ConnectionStatus) => void> = new Set();
  private tickSubscribers: Map<string, (tick: Tick) => void> = new Map();
  private activeSymbol: string | null = null;
  private appId: string = '1089'; // Public client application ID for Deriv websockets
  private lastPrices: Map<string, number> = new Map();
  private historicalBuffer: Map<string, Tick[]> = new Map();
  private pingInterval: any = null;

  constructor(appId?: string) {
    if (appId) this.appId = appId;
  }

  private setStatus(s: ConnectionStatus) {
    this.status = s;
    this.listeners.forEach((cb) => cb(s));
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.listeners.add(callback);
    callback(this.status);
    return () => this.listeners.delete(callback);
  }

  public getMarkets(): Market[] {
    return SUPPORTED_MARKETS;
  }

  public getCurrentPrice(symbol: string): number | null {
    return this.lastPrices.get(symbol) ?? null;
  }

  public async connect(): Promise<void> {
    if (this.status === 'CONNECTED' || this.status === 'CONNECTING') return;

    this.setStatus('CONNECTING');

    return new Promise((resolve) => {
      try {
        const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.setStatus('CONNECTED');
          // Ping to keep connection alive
          this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ ping: 1 }));
            }
          }, 25000);

          // Resubscribe if we had an active symbol
          if (this.activeSymbol && this.tickSubscribers.has(this.activeSymbol)) {
            this.sendSubscription(this.activeSymbol);
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.warn('Deriv WS parse error:', e);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('Deriv WS error:', err);
          this.setStatus('ERROR');
          resolve();
        };

        this.ws.onclose = () => {
          this.setStatus('DISCONNECTED');
          if (this.pingInterval) clearInterval(this.pingInterval);
        };
      } catch (err) {
        console.error('Failed to create WebSocket:', err);
        this.setStatus('ERROR');
        resolve();
      }
    });
  }

  private sendSubscription(symbol: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // First request recent tick history and subscribe to ticks
    const market = SUPPORTED_MARKETS.find((m) => m.symbol === symbol);
    const count = 1000;

    const historyReq = {
      ticks_history: symbol,
      adjust_start_time: 1,
      count,
      end: 'latest',
      style: 'ticks',
      subscribe: 1,
    };
    this.ws.send(JSON.stringify(historyReq));
  }

  private handleMessage(data: any) {
    if (data.msg_type === 'history') {
      const symbol = data.echo_req?.ticks_history;
      const market = SUPPORTED_MARKETS.find((m) => m.symbol === symbol);
      const decimals = market ? market.decimals : 2;

      const prices: number[] = data.history?.prices || [];
      const times: number[] = data.history?.times || [];

      const ticks: Tick[] = [];
      for (let i = 0; i < prices.length; i++) {
        const quote = prices[i];
        const prevQuote = i > 0 ? prices[i - 1] : quote;
        const diff = quote - prevQuote;
        const direction: 'up' | 'down' | 'flat' = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
        const digit = extractLastDigit(quote, decimals);
        const prevDigit = i > 0 ? extractLastDigit(prevQuote, decimals) : undefined;

        ticks.push({
          epoch: times[i],
          quote,
          digit,
          previousDigit: prevDigit,
          diff: parseFloat(diff.toFixed(decimals)),
          direction,
          isDemo: false,
        });
      }

      if (symbol) {
        this.historicalBuffer.set(symbol, ticks);
        if (prices.length > 0) {
          this.lastPrices.set(symbol, prices[prices.length - 1]);
        }
      }
    } else if (data.msg_type === 'tick' && data.tick) {
      const tickData = data.tick;
      const symbol = tickData.symbol;
      const market = SUPPORTED_MARKETS.find((m) => m.symbol === symbol);
      const decimals = market ? market.decimals : 2;

      const quote = tickData.quote;
      const prevPrice = this.lastPrices.get(symbol) ?? quote;
      const diff = quote - prevPrice;
      const direction: 'up' | 'down' | 'flat' = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
      const digit = extractLastDigit(quote, decimals);
      const prevDigit = extractLastDigit(prevPrice, decimals);

      this.lastPrices.set(symbol, quote);

      const newTick: Tick = {
        epoch: tickData.epoch,
        quote,
        digit,
        previousDigit: prevDigit,
        diff: parseFloat(diff.toFixed(decimals)),
        direction,
        isDemo: false,
      };

      // Append to buffer
      const buf = this.historicalBuffer.get(symbol) || [];
      buf.push(newTick);
      if (buf.length > 1500) buf.shift();
      this.historicalBuffer.set(symbol, buf);

      // Notify subscriber
      const sub = this.tickSubscribers.get(symbol);
      if (sub) sub(newTick);
    }
  }

  public subscribeTicks(symbol: string, callback: (tick: Tick) => void): void {
    this.activeSymbol = symbol;
    this.tickSubscribers.set(symbol, callback);

    if (this.status === 'CONNECTED') {
      this.sendSubscription(symbol);
    } else {
      this.connect();
    }
  }

  public unsubscribeTicks(symbol: string): void {
    this.tickSubscribers.delete(symbol);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ forget_all: 'ticks' }));
    }
    if (this.activeSymbol === symbol) {
      this.activeSymbol = null;
    }
  }

  public async getHistoricalTicks(symbol: string, count: number): Promise<Tick[]> {
    const existing = this.historicalBuffer.get(symbol) || [];
    if (existing.length >= Math.min(count, 50)) {
      return existing.slice(-count);
    }
    // Return whatever buffer has or empty
    return existing.slice(-count);
  }

  public disconnect(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }
}

/**
 * Demo Simulation Provider
 * Accurately models synthetic indices with random walk, volatility leaps, and digit properties.
 * Explicitly labeled as DEMO DATA.
 */
export class DemoSimulationProvider implements MarketDataProvider {
  public mode: DataSourceMode = 'DEMO_SIMULATION';
  private status: ConnectionStatus = 'CONNECTED';
  private listeners: Set<(status: ConnectionStatus) => void> = new Set();
  private subscribers: Map<string, (tick: Tick) => void> = new Map();
  private intervals: Map<string, any> = new Map();
  private tickHistory: Map<string, Tick[]> = new Map();
  private currentPrices: Map<string, number> = new Map();

  constructor() {
    this.initDemoHistory();
  }

  private initDemoHistory() {
    for (const m of SUPPORTED_MARKETS) {
      const ticks: Tick[] = [];
      let price = m.defaultPrice;
      const now = Math.floor(Date.now() / 1000) - 1000;

      for (let i = 0; i < 1000; i++) {
        const step = (Math.random() - 0.498) * (m.volatilityRate * 0.45);
        const prevPrice = price;
        price = parseFloat(Math.max(1, price + step).toFixed(m.decimals));
        const diff = price - prevPrice;
        const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
        const digit = extractLastDigit(price, m.decimals);
        const prevDigit = extractLastDigit(prevPrice, m.decimals);

        ticks.push({
          epoch: now + i,
          quote: price,
          digit,
          previousDigit: prevDigit,
          diff: parseFloat(diff.toFixed(m.decimals)),
          direction,
          isDemo: true,
        });
      }
      this.tickHistory.set(m.symbol, ticks);
      this.currentPrices.set(m.symbol, price);
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.listeners.add(callback);
    callback(this.status);
    return () => this.listeners.delete(callback);
  }

  public getMarkets(): Market[] {
    return SUPPORTED_MARKETS;
  }

  public getCurrentPrice(symbol: string): number | null {
    return this.currentPrices.get(symbol) ?? null;
  }

  public async connect(): Promise<void> {
    this.status = 'CONNECTED';
    this.listeners.forEach((cb) => cb('CONNECTED'));
  }

  public subscribeTicks(symbol: string, callback: (tick: Tick) => void): void {
    this.subscribers.set(symbol, callback);

    if (this.intervals.has(symbol)) {
      clearInterval(this.intervals.get(symbol));
    }

    const market = SUPPORTED_MARKETS.find((m) => m.symbol === symbol) || SUPPORTED_MARKETS[0];
    const freqMs = market.tickFrequency.includes('2') ? 2000 : 1000;

    const interval = setInterval(() => {
      let price = this.currentPrices.get(symbol) ?? market.defaultPrice;
      const prevPrice = price;

      // Special handling for crash / boom
      let delta = (Math.random() - 0.495) * (market.volatilityRate * 0.5);
      if (market.symbol === 'CRASH_500' && Math.random() < 0.008) {
        delta = -market.volatilityRate * 8; // sudden crash drop
      } else if (market.symbol === 'BOOM_500' && Math.random() < 0.008) {
        delta = market.volatilityRate * 8; // sudden boom spike
      } else if (market.symbol === 'STEPINDEX') {
        delta = Math.random() > 0.5 ? 0.1 : -0.1;
      }

      price = parseFloat(Math.max(1, price + delta).toFixed(market.decimals));
      this.currentPrices.set(symbol, price);

      const diff = price - prevPrice;
      const direction: 'up' | 'down' | 'flat' = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
      const digit = extractLastDigit(price, market.decimals);
      const prevDigit = extractLastDigit(prevPrice, market.decimals);

      const newTick: Tick = {
        epoch: Math.floor(Date.now() / 1000),
        quote: price,
        digit,
        previousDigit: prevDigit,
        diff: parseFloat(diff.toFixed(market.decimals)),
        direction,
        isDemo: true,
      };

      const buf = this.tickHistory.get(symbol) || [];
      buf.push(newTick);
      if (buf.length > 1500) buf.shift();
      this.tickHistory.set(symbol, buf);

      const sub = this.subscribers.get(symbol);
      if (sub) sub(newTick);
    }, freqMs);

    this.intervals.set(symbol, interval);
  }

  public unsubscribeTicks(symbol: string): void {
    this.subscribers.delete(symbol);
    if (this.intervals.has(symbol)) {
      clearInterval(this.intervals.get(symbol));
      this.intervals.delete(symbol);
    }
  }

  public async getHistoricalTicks(symbol: string, count: number): Promise<Tick[]> {
    const list = this.tickHistory.get(symbol) || [];
    return list.slice(-count);
  }

  public disconnect(): void {
    this.intervals.forEach((timer) => clearInterval(timer));
    this.intervals.clear();
    this.subscribers.clear();
    this.status = 'DISCONNECTED';
    this.listeners.forEach((cb) => cb('DISCONNECTED'));
  }
}

/**
 * Unified Market Data Manager
 * Handles switching between Live Deriv WebSocket and Demo Data.
 */
class MarketDataManager {
  private currentMode: DataSourceMode = 'DEMO_SIMULATION';
  private activeProvider: MarketDataProvider;
  private demoProvider: DemoSimulationProvider;
  private liveProvider: DerivLiveWebSocketProvider;
  private listeners: Set<(mode: DataSourceMode, status: ConnectionStatus) => void> = new Set();
  private currentSymbol: string = '1HZ100V';

  constructor() {
    this.demoProvider = new DemoSimulationProvider();
    this.liveProvider = new DerivLiveWebSocketProvider();
    this.activeProvider = this.demoProvider;

    // Listen to provider status
    this.demoProvider.onStatusChange((status) => {
      if (this.currentMode === 'DEMO_SIMULATION') {
        this.notifyListeners(status);
      }
    });

    this.liveProvider.onStatusChange((status) => {
      if (this.currentMode === 'LIVE_WEBSOCKET') {
        this.notifyListeners(status);
      }
    });
  }

  private notifyListeners(status: ConnectionStatus) {
    this.listeners.forEach((cb) => cb(this.currentMode, status));
  }

  public onStateChange(callback: (mode: DataSourceMode, status: ConnectionStatus) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentMode, this.activeProvider.getStatus());
    return () => this.listeners.delete(callback);
  }

  public getMode(): DataSourceMode {
    return this.currentMode;
  }

  public getStatus(): ConnectionStatus {
    return this.activeProvider.getStatus();
  }

  public async setMode(mode: DataSourceMode, onTick?: (t: Tick) => void): Promise<void> {
    if (this.currentMode === mode) return;

    this.activeProvider.unsubscribeTicks(this.currentSymbol);
    if (this.currentMode === 'LIVE_WEBSOCKET') {
      this.liveProvider.disconnect();
    }

    this.currentMode = mode;
    this.activeProvider = mode === 'LIVE_WEBSOCKET' ? this.liveProvider : this.demoProvider;

    await this.activeProvider.connect();
    if (onTick) {
      this.activeProvider.subscribeTicks(this.currentSymbol, onTick);
    }
    this.notifyListeners(this.activeProvider.getStatus());
  }

  public getMarkets(): Market[] {
    return this.activeProvider.getMarkets();
  }

  public async getHistoricalTicks(symbol: string, count: number): Promise<Tick[]> {
    return this.activeProvider.getHistoricalTicks(symbol, count);
  }

  public subscribeTicks(symbol: string, callback: (tick: Tick) => void): void {
    this.currentSymbol = symbol;
    this.activeProvider.subscribeTicks(symbol, callback);
  }

  public unsubscribeTicks(symbol: string): void {
    this.activeProvider.unsubscribeTicks(symbol);
  }

  public getCurrentPrice(symbol: string): number | null {
    return this.activeProvider.getCurrentPrice(symbol);
  }
}

export const marketDataManager = new MarketDataManager();
