/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { StockHolding, PortfolioSummary } from "../types";
import { TrendingUp, TrendingDown, Wallet, PieChart, ShieldCheck } from "lucide-react";
import { formatARS } from "../utils/formatter";

interface PortfolioStatsProps {
  holdings: StockHolding[];
  summary: PortfolioSummary;
  cclRate: number;
}

export default function PortfolioStats({ holdings, summary, cclRate }: PortfolioStatsProps) {
  const hasAssets = holdings.length > 0;

  // Calculate some supplementary statistics
  const positiveHoldings = holdings.filter(h => h.currentPrice > h.buyPrice);
  const winRate = holdings.length > 0 ? (positiveHoldings.length / holdings.length) * 100 : 0;

  // Calculate risk profile weight
  // If we have recommended SL, check how far current price is from moderate SL
  const averageRiskBuffer = holdings.reduce((acc, curr) => {
    if (curr.recommendedSL && curr.currentPrice > 0) {
      const moderateSL = curr.recommendedSL.moderate;
      const pctDropToSL = ((curr.currentPrice - moderateSL) / curr.currentPrice) * 100;
      return acc + pctDropToSL;
    }
    return acc + 10; // Default buffer
  }, 0) / (holdings.length || 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Balance Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Valor Total Portafolio</span>
          <div className="p-1.5 bg-slate-100 text-slate-600 rounded">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3.5 space-y-2">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight font-mono leading-none" title="Activos + Liquidez en Broker">
              {formatARS(summary.totalCombinedValueARS || summary.totalCurrentValue)}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Activos + Saldo Líquido</span>
          </div>

          <div className="text-[11px] space-y-1 text-slate-500 border-t border-slate-100 pt-2 font-sans">
            <div className="flex items-center justify-between">
              <span>Activos Colocados:</span>
              <span className="font-mono font-semibold text-slate-700">{formatARS(summary.totalCurrentValue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Efectivo Líquido:</span>
              <span className="font-mono font-semibold text-slate-700">{formatARS(summary.totalCashValueARS || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Inversión inicial:</span>
              <span className="font-mono text-slate-400">{formatARS(summary.totalInvestment)}</span>
            </div>
          </div>

          <div className="text-[11px] border-t border-slate-100 pt-1.5 flex items-center justify-between">
            <span className="text-slate-500 font-medium font-sans">Equiv. CCL Total:</span>
            <span className="font-mono font-bold text-slate-700">
              ${((summary.totalCombinedValueARS || summary.totalCurrentValue) / cclRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>

          {(summary.totalCombinedValueARS || 0) > 0 && (
            <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 font-bold tracking-wider">
              <span>ACT: {((summary.totalCurrentValue / (summary.totalCombinedValueARS || 1)) * 100).toFixed(0)}%</span>
              <span>LIQ: {(((summary.totalCashValueARS || 0) / (summary.totalCombinedValueARS || 1)) * 105 - 5 > 0 ? ((summary.totalCashValueARS || 0) / (summary.totalCombinedValueARS || 1)) * 100 : 0).toFixed(0)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Net Returns Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rendimiento Neto</span>
          <div className={`p-1.5 rounded ${summary.totalGainLoss >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {summary.totalGainLoss >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
        </div>
        <div className="mt-4">
          <h3 className={`text-2xl font-bold tracking-tight font-mono ${summary.totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
            {summary.totalGainLoss >= 0 ? "+" : ""}
            {formatARS(summary.totalGainLoss)}
          </h3>
          <p className={`text-xs font-bold flex items-center gap-1 mt-1 ${summary.totalGainLoss >= 0 ? "text-green-700" : "text-red-700"}`}>
            {summary.totalGainLoss >= 0 ? "+" : ""}
            {summary.totalGainLossPercentage.toFixed(2)}% YTD
          </p>
        </div>
      </div>

      {/* Diversification & Win Rate */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Tasa de Rendimiento</span>
          <div className="p-1.5 bg-slate-100 text-slate-600 rounded">
            <PieChart className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-light text-slate-900 tracking-tight font-mono">
            {winRate.toFixed(0)}%
          </h3>
          <div className="w-full bg-slate-150 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-slate-900 h-full rounded-full transition-all duration-500" 
              style={{ width: `${winRate}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 flex justify-between font-medium">
            <span>{positiveHoldings.length} en ganancias</span>
            <span>{holdings.length - positiveHoldings.length} en pérdidas</span>
          </p>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Margen de Resguardo</span>
          <div className="p-1.5 bg-slate-100 text-slate-600 rounded">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-light text-slate-900 tracking-tight font-mono">
            {hasAssets ? `${averageRiskBuffer.toFixed(1)}%` : "N/D"}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Espacio promedio hasta Stop Loss
          </p>
          <div className="flex gap-1 mt-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              !hasAssets ? "bg-slate-100 text-slate-500" :
              averageRiskBuffer > 15 ? "bg-green-100 text-green-800" :
              averageRiskBuffer > 8 ? "bg-orange-100 text-orange-850" : "bg-red-100 text-red-800"
            }`}>
              {!hasAssets ? "Sin Activos" : averageRiskBuffer > 15 ? "Seguridad Alta" : averageRiskBuffer > 8 ? "Medio Riesgo" : "Alerta de Stop Loss"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
