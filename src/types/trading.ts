export type CryptoPair = "BTC/USDT" | "ETH/USDT" | "SOL/USDT" | "BNB/USDT";

export type StrategyType = 
  | "rsi_mean_reversion" 
  | "trend_following" 
  | "grid_trading" 
  | "bollinger_scalp";

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  signal?: "BUY" | "SELL";
}

export interface BacktestResults {
  initialCapital: number;
  finalCapital: number;
  netProfit: number;
  netProfitPercent: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export interface Position {
  id: string;
  pair: CryptoPair;
  type: "LONG" | "SHORT";
  entryPrice: number;
  currentPrice: number;
  amount: number;
  pnl: number;
  pnlPercent: number;
  stopLoss: number;
  takeProfit: number;
  openTime: string;
}

export interface TradeOrder {
  id: string;
  timestamp: string;
  pair: CryptoPair;
  side: "BUY" | "SELL";
  price: number;
  amount: number;
  total: number;
  status: "FILLED" | "PENDING";
  strategy: string;
}
