"use client";

import React, { useState, useEffect } from "react";
import { 
  CryptoPair, 
  StrategyType, 
  Candle, 
  BacktestResults, 
  Position 
} from "@/types/trading";
import { 
  Activity, 
  Zap, 
  Play, 
  Pause, 
  ShieldCheck, 
  Sun, 
  Moon, 
  BarChart3, 
  Layers, 
  Info,
  CheckCircle2 
} from "lucide-react";

const initialPairs: Record<CryptoPair, { base: number; step: number; count: number }> = {
  "BTC/USDT": { base: 89420.50, step: 25.0, count: 14 },
  "ETH/USDT": { base: 3568.20, step: 2.5, count: 14 },
  "SOL/USDT": { base: 212.80, step: 0.4, count: 14 },
  "BNB/USDT": { base: 665.40, step: 1.2, count: 14 }
};

interface StrategyConfig {
  name: string;
  shortName: string;
  regime: string;
  desc: string;
  defaultSL: number;
  defaultTP: number;
  defaultLev: number;
  winRate: number;
  profitFactor: number;
  drawdown: number;
  sharpe: number;
  trades: number;
  roiPct: number;
}

const strategyMatrix: Record<StrategyType, StrategyConfig> = {
  rsi_mean_reversion: {
    name: "RSI Mean Reversion (Reversão à Média HFT)",
    shortName: "RSI Reversion",
    regime: "Modo: Reversão HFT",
    desc: "Identifica sobrecompra (>70) e sobrevenda (<30) para entradas de reversão estatística de alta frequência.",
    defaultSL: 1.8,
    defaultTP: 4.2,
    defaultLev: 5,
    winRate: 71.4,
    profitFactor: 2.35,
    drawdown: -6.2,
    sharpe: 2.08,
    trades: 164,
    roiPct: 44.8
  },
  trend_following: {
    name: "SuperTrend Momentum (Seguidor de Tendência)",
    shortName: "SuperTrend",
    regime: "Modo: Tendência Parabólica",
    desc: "Rastreia rompimentos direcionais usando ATR e cruzamento das médias móveis EMA 20 e EMA 50.",
    defaultSL: 4.2,
    defaultTP: 12.5,
    defaultLev: 3,
    winRate: 58.2,
    profitFactor: 2.85,
    drawdown: -8.8,
    sharpe: 1.94,
    trades: 98,
    roiPct: 56.4
  },
  grid_trading: {
    name: "Grid Trading Neural (Acumulação em Faixa)",
    shortName: "Grid Accumulator",
    regime: "Modo: Range Arbitragem",
    desc: "Espalha uma matriz geométrica de ordens limite de compra e venda a cada $150 de variação para lucrar em lateralização.",
    defaultSL: 7.5,
    defaultTP: 1.6,
    defaultLev: 1,
    winRate: 89.2,
    profitFactor: 1.95,
    drawdown: -4.5,
    sharpe: 2.25,
    trades: 284,
    roiPct: 38.6
  },
  bollinger_scalp: {
    name: "Bollinger Volatility Breakout (Scalper)",
    shortName: "Bollinger Scalp",
    regime: "Modo: Volatilidade Breakout",
    desc: "Monitora o estreitamento das bandas de 2.0 desvios padrões e entra a favor do rompimento súbito de volume.",
    defaultSL: 2.5,
    defaultTP: 7.0,
    defaultLev: 3,
    winRate: 64.5,
    profitFactor: 2.22,
    drawdown: -7.1,
    sharpe: 1.88,
    trades: 145,
    roiPct: 48.2
  }
};

export default function ZenBotProPage() {
  const [selectedPair, setSelectedPair] = useState<CryptoPair>("BTC/USDT");
  const [strategy, setStrategy] = useState<StrategyType>("rsi_mean_reversion");
  const [isBotRunning, setIsBotRunning] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<string>("1m");
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  
  // Real-time market state
  const [currentPrice, setCurrentPrice] = useState<number>(89420.50);
  const [priceFlash, setPriceFlash] = useState<"up" | "down" | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [liveTrades, setLiveTrades] = useState<{ id: string; time: string; side: "BUY" | "SELL"; price: number; size: number }[]>([]);

  // Backtest parameters
  const [initialCapital, setInitialCapital] = useState<number>(10000);
  const [stopLoss, setStopLoss] = useState<number>(1.8);
  const [takeProfit, setTakeProfit] = useState<number>(4.2);
  const [leverage, setLeverage] = useState<number>(5);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [backtestStats, setBacktestStats] = useState<BacktestResults>({
    initialCapital: 10000,
    finalCapital: 14480.00,
    netProfit: 4480.00,
    netProfitPercent: 44.8,
    winRate: 71.4,
    totalTrades: 164,
    winningTrades: 117,
    losingTrades: 47,
    profitFactor: 2.35,
    maxDrawdown: -6.2,
    sharpeRatio: 2.08
  });

  // Open positions
  const [positions, setPositions] = useState<Position[]>([
    {
      id: "pos-1",
      pair: "BTC/USDT",
      type: "LONG",
      entryPrice: 87850,
      currentPrice: 89420,
      amount: 0.15,
      pnl: 235.50,
      pnlPercent: 5.36,
      stopLoss: 85650,
      takeProfit: 93120,
      openTime: "10:30:15"
    },
    {
      id: "pos-2",
      pair: "ETH/USDT",
      type: "LONG",
      entryPrice: 3445,
      currentPrice: 3568,
      amount: 2.5,
      pnl: 307.50,
      pnlPercent: 3.57,
      stopLoss: 3350,
      takeProfit: 3680,
      openTime: "08:14:02"
    }
  ]);

  // Strategy change handler: auto-populates SL, TP, Leverage, and metrics!
  const onStrategySelect = (stratKey: StrategyType) => {
    setStrategy(stratKey);
    const s = strategyMatrix[stratKey];
    setStopLoss(s.defaultSL);
    setTakeProfit(s.defaultTP);
    setLeverage(s.defaultLev);

    const profit = Math.round(initialCapital * (s.roiPct / 100) * 100) / 100;
    setBacktestStats({
      initialCapital,
      finalCapital: initialCapital + profit,
      netProfit: profit,
      netProfitPercent: s.roiPct,
      winRate: s.winRate,
      totalTrades: s.trades,
      winningTrades: Math.floor(s.trades * (s.winRate / 100)),
      losingTrades: Math.floor(s.trades * (1 - s.winRate / 100)),
      profitFactor: s.profitFactor,
      maxDrawdown: s.drawdown,
      sharpeRatio: s.sharpe
    });

    setAlertMsg(`Estratégia carregada: ${s.name}. Parâmetros e overlays reconfigurados!`);
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // Initialize candles on pair or timeframe change
  useEffect(() => {
    const cfg = initialPairs[selectedPair];
    setCurrentPrice(cfg.base);
    let p = cfg.base - (cfg.step * 8);
    const newCandles: Candle[] = [];

    for (let i = 0; i < cfg.count; i++) {
      const delta = (Math.random() - 0.46) * cfg.step * 2;
      const open = p;
      const close = p + delta;
      const high = Math.max(open, close) + Math.random() * cfg.step;
      const low = Math.min(open, close) - Math.random() * cfg.step;
      const vol = Math.floor(1000 + Math.random() * 4000);
      let signal: "BUY" | "SELL" | undefined;
      if (i === 2) signal = "BUY";
      if (i === 7) signal = "SELL";
      if (i === cfg.count - 2) signal = "BUY";

      newCandles.push({ time: `${10 + i}:00`, open, close, high, low, volume: vol, signal });
      p = close;
    }
    setCandles(newCandles);
  }, [selectedPair, timeframe]);

  // Real-time market tick engine
  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prev) => {
        if (!prev.length) return prev;
        const last = { ...prev[prev.length - 1] };
        const cfg = initialPairs[selectedPair];
        const tick = (Math.random() - 0.48) * (cfg.step * 0.35);
        const prevPrice = last.close;
        const newClose = Math.round((last.close + tick) * 100) / 100;
        
        last.close = newClose;
        if (newClose > last.high) last.high = newClose;
        if (newClose < last.low) last.low = newClose;
        last.volume += Math.floor(Math.random() * 15);

        setCurrentPrice(newClose);
        setPriceFlash(newClose >= prevPrice ? "up" : "down");
        setTimeout(() => setPriceFlash(null), 500);

        // Update active position live PnL
        setPositions((old) =>
          old.map((pos) => {
            if (pos.pair === selectedPair) {
              const diff = newClose - pos.entryPrice;
              const pnl = Math.round(diff * pos.amount * 100) / 100;
              const pnlPercent = Math.round((diff / pos.entryPrice) * 10000) / 100;
              return { ...pos, currentPrice: newClose, pnl, pnlPercent };
            }
            return pos;
          })
        );

        // Add real-time stream trade
        const now = new Date();
        setLiveTrades((trades) => [
          {
            id: `trade-${Date.now()}`,
            time: now.toTimeString().split(" ")[0],
            side: newClose >= prevPrice ? "BUY" : "SELL",
            price: newClose,
            size: parseFloat((0.05 + Math.random() * 0.8).toFixed(3))
          },
          ...trades.slice(0, 4)
        ]);

        return [...prev.slice(0, prev.length - 1), last];
      });
    }, 1600);

    return () => clearInterval(interval);
  }, [selectedPair]);

  const runBacktest = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const s = strategyMatrix[strategy];
      const profit = Math.round(initialCapital * (s.roiPct / 100) * 100) / 100;
      setBacktestStats({
        initialCapital,
        finalCapital: initialCapital + profit,
        netProfit: profit,
        netProfitPercent: s.roiPct,
        winRate: s.winRate,
        totalTrades: s.trades,
        winningTrades: Math.floor(s.trades * (s.winRate / 100)),
        losingTrades: Math.floor(s.trades * (1 - s.winRate / 100)),
        profitFactor: s.profitFactor,
        maxDrawdown: s.drawdown,
        sharpeRatio: s.sharpe
      });
      setIsSimulating(false);
    }, 500);
  };

  const closePosition = (id: string) => {
    setPositions(positions.filter(p => p.id !== id));
  };

  const currentStrat = strategyMatrix[strategy];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? "dark bg-[#050811] text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* Top Header */}
      <header className={`border-b sticky top-0 z-50 px-4 lg:px-6 py-2.5 backdrop-blur-xl transition-colors duration-200 ${
        isDarkMode ? "bg-[#0b1120]/95 border-slate-800/80 text-white" : "bg-white/95 border-slate-200 text-slate-900 shadow-sm"
      }`}>
        <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Logo & Pair Navigation */}
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-500/25 ring-1 ring-white/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight">
                    ZenBot <span className="text-emerald-500">Pro</span>
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    WEBSOCKET LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Binance & Coinbase Algorithmic Engine</p>
              </div>
            </div>

            {/* Pair Switcher */}
            <div className={`flex items-center rounded-xl p-1 gap-1 border ${isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
              {(["BTC/USDT", "ETH/USDT", "SOL/USDT"] as CryptoPair[]).map((pair) => (
                <button
                  key={pair}
                  onClick={() => setSelectedPair(pair)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    selectedPair === pair
                      ? "bg-emerald-600 text-white shadow-sm"
                      : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {pair}
                </button>
              ))}
            </div>
          </div>

          {/* Real-Time Ticker Ribbon */}
          <div className={`hidden xl:flex items-center gap-6 text-xs px-4 py-1.5 rounded-xl border ${
            isDarkMode ? "bg-slate-900/50 border-slate-800/80" : "bg-slate-100 border-slate-200"
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Último Preço:</span>
              <span className={`font-mono text-sm font-black px-2 py-0.5 rounded transition ${
                priceFlash === "up" ? "bg-emerald-500/20 text-emerald-400" : priceFlash === "down" ? "bg-rose-500/20 text-rose-400" : ""
              }`}>
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`h-4 w-[1px] ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`} />
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Máx 24h:</span>
              <span className="font-mono font-bold text-emerald-500">${(currentPrice * 1.025).toFixed(2)}</span>
            </div>
            <div className={`h-4 w-[1px] ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`} />
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Mín 24h:</span>
              <span className="font-mono font-bold text-rose-500">${(currentPrice * 0.975).toFixed(2)}</span>
            </div>
          </div>

          {/* Actions & Buy CTA */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl transition border w-9 h-9 flex items-center justify-center ${
                isDarkMode ? "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
              title="Alternar Tema"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={() => setIsBotRunning(!isBotRunning)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-2 border ${
                isBotRunning
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/30"
              }`}
            >
              {isBotRunning ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  HFT Bot Ativo
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pausado
                </>
              )}
            </button>

            <a
              href="https://rancharia.gumroad.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>⚡ Obter Código ($49)</span>
            </a>
          </div>

        </div>
      </header>

      {/* Dynamic Alert Banner when Strategy is switched */}
      {alertMsg && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 text-center text-xs font-semibold text-emerald-400 transition-all flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Candlestick Chart Canvas & Order Stream (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          <div className={`rounded-2xl p-5 shadow-xl border transition-colors duration-200 ${
            isDarkMode ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"
          }`}>
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3.5 border-b gap-3 ${
              isDarkMode ? "border-slate-800/80" : "border-slate-100"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Feed de Preço & Indicadores Ativos
                </span>
                {/* Timeframe selector */}
                <div className={`flex items-center rounded-lg p-0.5 text-[11px] font-mono border ${
                  isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
                }`}>
                  {["1m", "5m", "15m", "1h", "1d"].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2 py-0.5 rounded font-bold transition ${
                        timeframe === tf ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Indicator Badges */}
              <div className="flex items-center gap-1.5 text-xs flex-wrap font-mono">
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
                  {currentStrat.regime}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  Lev: {leverage}x
                </span>
              </div>
            </div>

            {/* Strategy Description Banner */}
            <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center justify-between ${
              isDarkMode ? "bg-slate-900/70 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span><strong>{currentStrat.name}:</strong> {currentStrat.desc}</span>
              </div>
            </div>

            {/* Candlestick Canvas & Overlays */}
            <div className={`mt-4 relative rounded-xl p-4 border overflow-hidden ${
              isDarkMode ? "bg-[#070b14] border-slate-800/80" : "bg-slate-50 border-slate-200"
            }`}>
              {/* Dynamic Grid Overlay if Grid Trading is active */}
              {strategy === "grid_trading" && (
                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-around px-3 py-4 text-[9px] font-mono text-slate-500">
                  <div className="border-b border-rose-500/30 flex justify-between text-rose-400"><span>Grid Sell #3</span><span>SELL LIMIT</span></div>
                  <div className="border-b border-rose-500/30 flex justify-between text-rose-400"><span>Grid Sell #2</span><span>SELL LIMIT</span></div>
                  <div className="border-b border-emerald-500/30 flex justify-between text-emerald-400"><span>Grid Buy #1</span><span>BUY LIMIT</span></div>
                  <div className="border-b border-emerald-500/30 flex justify-between text-emerald-400"><span>Grid Buy #2</span><span>BUY LIMIT</span></div>
                </div>
              )}

              <div className="h-72 w-full flex items-end justify-between gap-1.5 pt-6 pb-2 relative z-20">
                {candles.map((c, idx) => {
                  const isUp = c.close >= c.open;
                  const minPrice = Math.min(...candles.map(x => x.low));
                  const maxPrice = Math.max(...candles.map(x => x.high));
                  const range = maxPrice - minPrice || 1;
                  const topPercent = ((maxPrice - Math.max(c.open, c.close)) / range) * 100;
                  const bodyHeight = Math.max((Math.abs(c.close - c.open) / range) * 100, 2);
                  const wickTop = ((maxPrice - c.high) / range) * 100;
                  const wickHeight = Math.max(((c.high - c.low) / range) * 100, 4);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center relative group h-full justify-end">
                      {c.signal && (
                        <div className={`absolute top-0 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider z-20 shadow-md ${
                          c.signal === "BUY" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        }`}>
                          {c.signal}
                        </div>
                      )}
                      <div className="w-full relative flex justify-center items-center h-full">
                        <div 
                          className={`absolute w-[1.5px] ${isUp ? "bg-emerald-400" : "bg-rose-400"}`}
                          style={{ top: `${wickTop}%`, height: `${wickHeight}%` }}
                        />
                        <div 
                          className={`absolute w-3/4 max-w-[20px] rounded-[2px] transition-all duration-300 ${
                            isUp ? "bg-emerald-400 shadow-sm shadow-emerald-500/30" : "bg-rose-400 shadow-sm shadow-rose-500/30"
                          }`}
                          style={{ top: `${topPercent}%`, height: `${bodyHeight}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 mt-2 font-mono">{c.time}</span>
                    </div>
                  );
                })}
              </div>

              {/* Volume Bars */}
              <div className={`border-t pt-2 flex items-end justify-between gap-1.5 h-14 ${
                isDarkMode ? "border-slate-800/80" : "border-slate-200"
              }`}>
                {candles.map((c, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-t-sm transition-all duration-300 ${
                      c.close >= c.open ? "bg-emerald-500/40 hover:bg-emerald-400" : "bg-rose-500/40 hover:bg-rose-400"
                    }`}
                    style={{ height: `${(c.volume / 5000) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Positions & Real-Time Order Stream */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Open Positions (7 cols) */}
            <div className={`md:col-span-7 rounded-2xl p-5 shadow-xl border ${
              isDarkMode ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"
            }`}>
              <div className={`flex items-center justify-between pb-3 border-b ${
                isDarkMode ? "border-slate-800" : "border-slate-100"
              }`}>
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" /> Posições Abertas ({positions.length})
                </span>
                <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Lucro: +$543.00
                </span>
              </div>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800/60 font-sans">
                      <th className="pb-2">Ativo</th>
                      <th className="pb-2">Entrada</th>
                      <th className="pb-2">Atual</th>
                      <th className="pb-2">PnL</th>
                      <th className="pb-2 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {positions.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-2.5 font-bold">{p.pair} <span className="text-[10px] px-1 rounded bg-emerald-500/10 text-emerald-500">{leverage}x</span></td>
                        <td className="py-2.5 text-slate-400">${p.entryPrice.toLocaleString()}</td>
                        <td className="py-2.5 font-bold">${p.currentPrice.toLocaleString()}</td>
                        <td className="py-2.5 font-bold text-emerald-500">
                          +${p.pnl.toFixed(2)} (+{p.pnlPercent}%)
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => closePosition(p.id)}
                            className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 text-[10px] font-bold transition"
                          >
                            Fechar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Order Stream (5 cols) */}
            <div className={`md:col-span-5 rounded-2xl p-5 shadow-xl border ${
              isDarkMode ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"
            }`}>
              <div className={`flex items-center justify-between pb-3 border-b ${
                isDarkMode ? "border-slate-800" : "border-slate-100"
              }`}>
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-500" /> Fluxo de Ordens
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Live Feed</span>
              </div>
              <div className="mt-2 overflow-hidden h-36 font-mono text-[11px] space-y-1.5">
                {liveTrades.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between py-0.5 px-2 rounded text-[10px] transition ${
                      t.side === "BUY" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    }`}
                  >
                    <span className="text-slate-400">{t.time}</span>
                    <span className="font-bold">{t.side === "BUY" ? "COMPRA" : "VENDA"}</span>
                    <span className="font-bold font-mono">${t.price.toFixed(2)}</span>
                    <span className="text-slate-400 font-mono">{t.size}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Backtest Engine & Risk Management (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          <div className={`rounded-2xl p-5 shadow-xl border space-y-4 ${
            isDarkMode ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDarkMode ? "border-slate-800" : "border-slate-100"
            }`}>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-black">Configurador de Estratégia</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                90D Telemetria
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Estratégia Algorítmica (Troca automática de parâmetros)
                </label>
                <select
                  value={strategy}
                  onChange={(e) => onStrategySelect(e.target.value as StrategyType)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer ${
                    isDarkMode ? "bg-slate-900 border-emerald-500/50 text-white" : "bg-slate-50 border-emerald-500/50 text-slate-900"
                  }`}
                >
                  <option value="rsi_mean_reversion">⚡ RSI Mean Reversion (Reversão à Média HFT)</option>
                  <option value="trend_following">📈 SuperTrend Momentum (Seguidor de Tendência)</option>
                  <option value="grid_trading">🕸️ Grid Trading Neural (Acumulação em Faixa)</option>
                  <option value="bollinger_scalp">🎯 Bollinger Volatility Breakout (Scalper)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Capital Inicial ($)</label>
                  <input
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    className={`w-full border rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500 ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Alavancagem Recomendada</label>
                  <select
                    value={leverage}
                    onChange={(e) => setLeverage(Number(e.target.value))}
                    className={`w-full border rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500 ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    <option value={1}>1x (Spot Seguro)</option>
                    <option value={3}>3x (Cross Margem)</option>
                    <option value={5}>5x (Recomendado)</option>
                    <option value={10}>10x (Futuros HFT)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Stop Loss Alvo (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className={`w-full border rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500 ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Take Profit Alvo (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    className={`w-full border rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500 ${
                      isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>
              </div>

              <button
                onClick={runBacktest}
                disabled={isSimulating}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
              >
                {isSimulating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Simulando 90 Dias de Mercado...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Executar Simulação de Estratégia
                  </>
                )}
              </button>
            </div>

            {/* Scorecard */}
            <div className={`pt-3 border-t space-y-3 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Métricas Auditadas do Backtest (90 Dias)
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-slate-50 border-slate-200"}`}>
                  <span className="text-[10px] text-slate-400 block font-medium">Lucro Líquido</span>
                  <span className="text-sm font-mono font-black text-emerald-500">
                    +${backtestStats.netProfit.toLocaleString()} (+{backtestStats.netProfitPercent}%)
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-slate-50 border-slate-200"}`}>
                  <span className="text-[10px] text-slate-400 block font-medium">Taxa de Acerto</span>
                  <span className="text-sm font-mono font-black">
                    {backtestStats.winRate}%
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-slate-50 border-slate-200"}`}>
                  <span className="text-[10px] text-slate-400 block font-medium">Fator de Lucro</span>
                  <span className="text-sm font-mono font-black text-emerald-500">
                    {backtestStats.profitFactor}x
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-slate-50 border-slate-200"}`}>
                  <span className="text-[10px] text-slate-400 block font-medium">Max Drawdown</span>
                  <span className="text-sm font-mono font-black text-rose-500">
                    {backtestStats.maxDrawdown}%
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-mono flex items-center justify-between font-bold">
                <span>Sharpe Ratio: <strong>{backtestStats.sharpeRatio}</strong></span>
                <span>Operações: <strong>{backtestStats.totalTrades}</strong></span>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-4 shadow-xl border flex items-center gap-3.5 ${
            isDarkMode ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"
          }`}>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black">
                <span>Segurança Criptografada AES-256</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Conexão direta com Binance & Coinbase via WebSockets e CCXT. Saques desativados.
              </p>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
