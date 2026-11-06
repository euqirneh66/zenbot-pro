"use client";

import React, { useState, useEffect } from "react";
import { 
  CryptoPair, 
  StrategyType, 
  Candle, 
  BacktestResults, 
  Position, 
  TradeOrder 
} from "@/types/trading";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  ShieldCheck, 
  Sun, 
  Moon, 
  DollarSign, 
  BarChart3, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

// Mock historical candle data
const sampleCandles: Record<CryptoPair, Candle[]> = {
  "BTC/USDT": [
    { time: "00:00", open: 86200, high: 86900, low: 86100, close: 86750, volume: 1420 },
    { time: "02:00", open: 86750, high: 87400, low: 86500, close: 87200, volume: 1890, signal: "BUY" },
    { time: "04:00", open: 87200, high: 87600, low: 86900, close: 87100, volume: 1250 },
    { time: "06:00", open: 87100, high: 87900, low: 87050, close: 87850, volume: 2100 },
    { time: "08:00", open: 87850, high: 88500, low: 87600, close: 88420, volume: 3450 },
    { time: "10:00", open: 88420, high: 88950, low: 88100, close: 88600, volume: 2800 },
    { time: "12:00", open: 88600, high: 88800, low: 87900, close: 88150, volume: 1950 },
    { time: "14:00", open: 88150, high: 88400, low: 87600, close: 87800, volume: 1600, signal: "SELL" },
    { time: "16:00", open: 87800, high: 88300, low: 87700, close: 88100, volume: 1750 },
    { time: "18:00", open: 88100, high: 88900, low: 88000, close: 88750, volume: 2900, signal: "BUY" },
    { time: "20:00", open: 88750, high: 89200, low: 88500, close: 89050, volume: 3100 },
    { time: "22:00", open: 89050, high: 89450, low: 88800, close: 89320, volume: 2650 },
  ],
  "ETH/USDT": [
    { time: "00:00", open: 3380, high: 3420, low: 3360, close: 3410, volume: 5200 },
    { time: "04:00", open: 3410, high: 3460, low: 3400, close: 3445, volume: 6400, signal: "BUY" },
    { time: "08:00", open: 3445, high: 3510, low: 3440, close: 3490, volume: 8900 },
    { time: "12:00", open: 3490, high: 3525, low: 3470, close: 3480, volume: 7100 },
    { time: "16:00", open: 3480, high: 3530, low: 3475, close: 3520, volume: 8300 },
    { time: "20:00", open: 3520, high: 3580, low: 3510, close: 3565, volume: 9200 },
  ],
  "SOL/USDT": [
    { time: "00:00", open: 185, high: 191, low: 184, close: 190, volume: 15200 },
    { time: "04:00", open: 190, high: 196, low: 189, close: 195, volume: 18400, signal: "BUY" },
    { time: "08:00", open: 195, high: 202, low: 194, close: 201, volume: 24900 },
    { time: "12:00", open: 201, high: 205, low: 199, close: 202, volume: 21100 },
    { time: "16:00", open: 202, high: 208, low: 201, close: 207, volume: 23300 },
    { time: "20:00", open: 207, high: 214, low: 206, close: 212, volume: 27200 },
  ],
  "BNB/USDT": [
    { time: "00:00", open: 640, high: 648, low: 638, close: 646, volume: 3200 },
    { time: "04:00", open: 646, high: 655, low: 644, close: 652, volume: 4400, signal: "BUY" },
    { time: "08:00", open: 652, high: 660, low: 650, close: 658, volume: 5900 },
    { time: "12:00", open: 658, high: 664, low: 655, close: 661, volume: 4800 },
    { time: "16:00", open: 661, high: 668, low: 659, close: 665, volume: 5300 },
    { time: "20:00", open: 665, high: 672, low: 663, close: 670, volume: 6100 },
  ]
};

export default function ZenBotPage() {
  const [selectedPair, setSelectedPair] = useState<CryptoPair>("BTC/USDT");
  const [strategy, setStrategy] = useState<StrategyType>("rsi_mean_reversion");
  const [isBotRunning, setIsBotRunning] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"positions" | "orders">("positions");
  
  // Strategy settings
  const [initialCapital, setInitialCapital] = useState<number>(10000);
  const [stopLoss, setStopLoss] = useState<number>(2.5);
  const [takeProfit, setTakeProfit] = useState<number>(6.0);
  const [leverage, setLeverage] = useState<number>(3);
  
  // Backtest state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [backtestStats, setBacktestStats] = useState<BacktestResults>({
    initialCapital: 10000,
    finalCapital: 14285.50,
    netProfit: 4285.50,
    netProfitPercent: 42.85,
    winRate: 68.4,
    totalTrades: 142,
    winningTrades: 97,
    losingTrades: 45,
    profitFactor: 2.14,
    maxDrawdown: -7.8,
    sharpeRatio: 1.92
  });

  const candles = sampleCandles[selectedPair];
  const currentPrice = candles[candles.length - 1].close;
  const priceChange = ((currentPrice - candles[0].open) / candles[0].open) * 100;

  // Active positions state
  const [positions, setPositions] = useState<Position[]>([
    {
      id: "pos-1",
      pair: "BTC/USDT",
      type: "LONG",
      entryPrice: 87850,
      currentPrice: 89320,
      amount: 0.15,
      pnl: 220.50,
      pnlPercent: 5.02,
      stopLoss: 85650,
      takeProfit: 93120,
      openTime: "Hoje 08:30"
    },
    {
      id: "pos-2",
      pair: "ETH/USDT",
      type: "LONG",
      entryPrice: 3445,
      currentPrice: 3565,
      amount: 2.5,
      pnl: 300.00,
      pnlPercent: 3.48,
      stopLoss: 3350,
      takeProfit: 3680,
      openTime: "Hoje 04:15"
    }
  ]);

  const [orders] = useState<TradeOrder[]>([
    { id: "ord-101", timestamp: "18:02:14", pair: "BTC/USDT", side: "BUY", price: 88100, amount: 0.15, total: 13215, status: "FILLED", strategy: "RSI Mean Reversion" },
    { id: "ord-100", timestamp: "14:15:30", pair: "BTC/USDT", side: "SELL", price: 87800, amount: 0.15, total: 13170, status: "FILLED", strategy: "Stop Loss Trigger" },
    { id: "ord-099", timestamp: "08:04:10", pair: "BTC/USDT", side: "BUY", price: 87850, amount: 0.20, total: 17570, status: "FILLED", strategy: "Trend SuperTrend" },
    { id: "ord-098", timestamp: "02:11:45", pair: "BTC/USDT", side: "BUY", price: 86750, amount: 0.10, total: 8675, status: "FILLED", strategy: "Grid Accumulator" },
  ]);

  const runBacktest = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const mult = strategy === "rsi_mean_reversion" ? 1.05 : strategy === "trend_following" ? 1.15 : 0.95;
      const profit = Math.round(initialCapital * (0.35 * mult) * 100) / 100;
      setBacktestStats({
        initialCapital,
        finalCapital: initialCapital + profit,
        netProfit: profit,
        netProfitPercent: Math.round((profit / initialCapital) * 10000) / 100,
        winRate: Math.round((64 + Math.random() * 8) * 10) / 10,
        totalTrades: Math.floor(120 + Math.random() * 40),
        winningTrades: Math.floor(85 + Math.random() * 15),
        losingTrades: Math.floor(35 + Math.random() * 10),
        profitFactor: Math.round((1.8 + Math.random() * 0.5) * 100) / 100,
        maxDrawdown: -Math.round((6 + Math.random() * 4) * 10) / 10,
        sharpeRatio: Math.round((1.7 + Math.random() * 0.4) * 100) / 100,
      });
      setIsSimulating(false);
    }, 600);
  };

  const closePosition = (id: string) => {
    setPositions(positions.filter(p => p.id !== id));
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${isDarkMode ? "dark bg-[#080d1a] text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      {/* Top Telemetry Header */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0c1322]/90 backdrop-blur sticky top-0 z-50 px-4 md:px-6 py-3 transition-colors">
        <div className="max-w-[1700px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Logo & Exchange Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                    ZenBot <span className="text-emerald-500">Pro</span>
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    v2.0 Algorithmic
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Binance / Coinbase API Connector
                </p>
              </div>
            </div>

            {/* Pair Selector Buttons */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-1">
              {(["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT"] as CryptoPair[]).map((pair) => (
                <button
                  key={pair}
                  onClick={() => setSelectedPair(pair)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    selectedPair === pair
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {pair}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Ticker Metrics */}
          <div className="hidden xl:flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Preço Atual</span>
              <span className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                ${currentPrice.toLocaleString()}
                <span className={`text-xs font-bold ${priceChange >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
                </span>
              </span>
            </div>
            <div className="h-7 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Volume 24h</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">$1,428.5M</span>
            </div>
            <div className="h-7 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Máxima 24h</span>
              <span className="font-bold text-emerald-500">${(currentPrice * 1.03).toFixed(0)}</span>
            </div>
            <div className="h-7 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Mínima 24h</span>
              <span className="font-bold text-rose-500">${(currentPrice * 0.97).toFixed(0)}</span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 transition border border-slate-200 dark:border-slate-800 w-9 h-9 flex items-center justify-center"
              title="Alternar Tema"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={() => setIsBotRunning(!isBotRunning)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border ${
                isBotRunning
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
              }`}
            >
              {isBotRunning ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Bot Ativo
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pausado
                </>
              )}
            </button>

            {/* Gumroad Buy Code CTA Button */}
            <a
              href="https://rancharia.gumroad.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/20"
            >
              <span>⚡ Obter Código ($49)</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Candlestick Chart & Position Management (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Chart Header & Controls */}
          <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 gap-3">
              <div className="flex items-center gap-3">
                <span className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Gráfico de Preços & Sinais Algorítmicos
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Timeframe: 1H</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">EMA 20</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">EMA 50</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 font-bold border border-purple-500/20">RSI (14): 62.4</span>
              </div>
            </div>

            {/* Custom Interactive Candlestick SVG Canvas */}
            <div className="mt-4 relative bg-slate-50 dark:bg-[#070b14] rounded-xl p-4 border border-slate-100 dark:border-slate-800/60 overflow-hidden">
              <div className="h-72 w-full flex items-end justify-between gap-1 pt-6 pb-2">
                {candles.map((c, i) => {
                  const isUp = c.close >= c.open;
                  const minPrice = Math.min(...candles.map(x => x.low));
                  const maxPrice = Math.max(...candles.map(x => x.high));
                  const range = maxPrice - minPrice || 1;
                  
                  const topPercent = ((maxPrice - Math.max(c.open, c.close)) / range) * 100;
                  const bodyHeightPercent = (Math.abs(c.close - c.open) / range) * 100;
                  const wickTopPercent = ((maxPrice - c.high) / range) * 100;
                  const wickHeightPercent = ((c.high - c.low) / range) * 100;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center relative group h-full justify-end">
                      {/* Signal Marker Badge */}
                      {c.signal && (
                        <div className={`absolute top-0 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-sm z-10 ${
                          c.signal === "BUY" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        }`}>
                          {c.signal}
                        </div>
                      )}

                      {/* Candlestick Body & Wick */}
                      <div className="w-full relative flex justify-center items-center h-full">
                        {/* High/Low Wick Line */}
                        <div 
                          className={`absolute w-[1.5px] ${isUp ? "bg-emerald-500" : "bg-rose-500"}`}
                          style={{
                            top: `${wickTopPercent}%`,
                            height: `${Math.max(wickHeightPercent, 4)}%`
                          }}
                        />
                        {/* Open/Close Candle Body */}
                        <div 
                          className={`absolute w-3/4 max-w-[18px] rounded-[2px] transition-all ${
                            isUp ? "bg-emerald-500 shadow-sm shadow-emerald-500/20" : "bg-rose-500 shadow-sm shadow-rose-500/20"
                          }`}
                          style={{
                            top: `${topPercent}%`,
                            height: `${Math.max(bodyHeightPercent, 3)}%`
                          }}
                        />
                      </div>

                      {/* Time Label */}
                      <span className="text-[10px] text-slate-400 mt-2 font-mono">{c.time}</span>

                      {/* Tooltip on Hover */}
                      <div className="absolute bottom-10 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl border border-slate-700 z-30 pointer-events-none whitespace-nowrap">
                        <span className="font-bold text-slate-300">{selectedPair} — {c.time}</span>
                        <span>Abertura: ${c.open}</span>
                        <span>Máxima: ${c.high}</span>
                        <span>Mínima: ${c.low}</span>
                        <span className="font-bold text-emerald-400">Fechamento: ${c.close}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Volume Bars Sub-chart */}
              <div className="h-14 w-full flex items-end justify-between gap-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                {candles.map((c, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-slate-300 dark:bg-slate-800 hover:bg-emerald-500/60 rounded-t-sm transition-colors"
                    style={{ height: `${(c.volume / 3500) * 100}%` }}
                    title={`Volume: ${c.volume}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Positions & Order Execution Feed */}
          <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("positions")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === "positions"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Posições Abertas ({positions.length})
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === "orders"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> Histórico de Ordens
                </button>
              </div>
              <span className="text-xs text-slate-400 font-medium">Execução: 100% Automática</span>
            </div>

            {/* Positions Table */}
            {activeTab === "positions" ? (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100 dark:border-slate-800/60">
                      <th className="pb-2">Ativo</th>
                      <th className="pb-2">Tipo</th>
                      <th className="pb-2">Entrada</th>
                      <th className="pb-2">Preço Atual</th>
                      <th className="pb-2">Lucro / PnL</th>
                      <th className="pb-2">Stop Loss</th>
                      <th className="pb-2">Take Profit</th>
                      <th className="pb-2 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {positions.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                        <td className="py-3 font-bold text-slate-900 dark:text-white">{p.pair}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            {p.type} {leverage}x
                          </span>
                        </td>
                        <td className="py-3 font-mono">${p.entryPrice.toLocaleString()}</td>
                        <td className="py-3 font-mono font-bold">${p.currentPrice.toLocaleString()}</td>
                        <td className="py-3 font-mono font-bold text-emerald-500">
                          +${p.pnl.toFixed(2)} (+{p.pnlPercent}%)
                        </td>
                        <td className="py-3 font-mono text-slate-400">${p.stopLoss.toLocaleString()}</td>
                        <td className="py-3 font-mono text-slate-400">${p.takeProfit.toLocaleString()}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => closePosition(p.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 text-[11px] font-bold transition border border-rose-500/20"
                          >
                            Fechar Posição
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100 dark:border-slate-800/60">
                      <th className="pb-2">Horário</th>
                      <th className="pb-2">Ativo</th>
                      <th className="pb-2">Lado</th>
                      <th className="pb-2">Preço</th>
                      <th className="pb-2">Total ($)</th>
                      <th className="pb-2">Estratégia</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                        <td className="py-2.5 text-slate-400">{o.timestamp}</td>
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">{o.pair}</td>
                        <td className="py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            o.side === "BUY" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                          }`}>
                            {o.side}
                          </span>
                        </td>
                        <td className="py-2.5">${o.price.toLocaleString()}</td>
                        <td className="py-2.5">${o.total.toLocaleString()}</td>
                        <td className="py-2.5 text-slate-400 font-sans">{o.strategy}</td>
                        <td className="py-2.5 text-right">
                          <span className="text-[10px] font-bold text-emerald-500 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Visual Backtest Engine & Risk Management (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Backtesting Simulator Panel */}
          <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Simulador de Backtest
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Histórico 90D
              </span>
            </div>

            {/* Strategy Selector */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estratégia Algorítmica
                </label>
                <select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value as StrategyType)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="rsi_mean_reversion">RSI Mean Reversion (Reversão à Média)</option>
                  <option value="trend_following">SuperTrend Momentum (Seguidor de Tendência)</option>
                  <option value="grid_trading">Grid Trading (Acumulação em Faixa)</option>
                  <option value="bollinger_scalp">Bollinger Bands Scalper (Alta Frequência)</option>
                </select>
              </div>

              {/* Capital & Parameters */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Capital Inicial ($)
                  </label>
                  <input
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alavancagem
                  </label>
                  <select
                    value={leverage}
                    onChange={(e) => setLeverage(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value={1}>1x (Spot)</option>
                    <option value={3}>3x Cross</option>
                    <option value={5}>5x Margem</option>
                    <option value={10}>10x Futuros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stop Loss (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Take Profit (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Execute Backtest Button */}
              <button
                onClick={runBacktest}
                disabled={isSimulating}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando Simulação...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Executar Backtest da Estratégia
                  </>
                )}
              </button>
            </div>

            {/* Backtest Scorecard Results */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Métricas de Performance da Estratégia
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Lucro Líquido</span>
                  <span className="text-sm font-black text-emerald-500">
                    +${backtestStats.netProfit.toLocaleString()} (+{backtestStats.netProfitPercent}%)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Taxa de Acerto (Win Rate)</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {backtestStats.winRate}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Fator de Lucro</span>
                  <span className="text-sm font-black text-emerald-500">
                    {backtestStats.profitFactor}x
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Max Drawdown</span>
                  <span className="text-sm font-black text-rose-500">
                    {backtestStats.maxDrawdown}%
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center justify-between font-semibold">
                <span>Sharpe Ratio: <strong>{backtestStats.sharpeRatio}</strong></span>
                <span>Total Operações: <strong>{backtestStats.totalTrades}</strong></span>
              </div>
            </div>
          </div>

          {/* Risk Management & Security Card */}
          <div className="bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Modo Seguro: Chaves API Criptografadas</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Permissão de leitura e trade apenas. Saques desabilitados por padrão.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
