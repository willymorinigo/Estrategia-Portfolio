/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { StockHolding } from "../types";
import { 
  ShieldCheck, 
  BrainCircuit, 
  AlertCircle, 
  Gauge, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  PiggyBank 
} from "lucide-react";
import { formatARS } from "../utils/formatter";

interface RiskAnalysisDashboardProps {
  holding: StockHolding | null;
  isLoading: boolean;
  cclRate: number;
}

export default function RiskAnalysisDashboard({ holding, isLoading, cclRate }: RiskAnalysisDashboardProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Ejecutando Análisis...</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-sm text-center italic">
          Recopilando fluctuaciones históricas en tiempo real y niveles de ATR mediante tecnología de inteligencia artificial.
        </p>
      </div>
    );
  }

  if (!holding) {
    return (
      <div className="bg-white p-8 rounded-xl border border-dashed border-slate-200 shadow-xs flex flex-col items-center justify-center min-h-[450px]">
        <div className="p-3 bg-slate-50 text-slate-400 rounded mb-4">
          <BrainCircuit className="h-6 w-6 animate-pulse" />
        </div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ningún Activo Seleccionado</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-xs text-center">
          Haz clic o registra un activo en la barra lateral izquierda para generar su recomendación automatizada de límites técnico-volátiles.
        </p>
      </div>
    );
  }

  const {
    ticker,
    name,
    buyPrice,
    currentPrice,
    atr,
    volatilityPercentage,
    recommendedTP,
    recommendedSL,
    technicalAdvice,
    allocationAdvice
  } = holding;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-light tracking-tight text-slate-900 font-mono">{ticker}</span>
            <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Asesoría IA
            </span>
          </div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">{name || `${ticker} Asset`}</h2>
          
          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Precio Actual:</span>
            <span className="text-base font-bold font-mono text-slate-900">{formatARS(currentPrice)}</span>
            {cclRate > 0 && (
              <span className="text-xs font-bold font-mono text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md flex items-center gap-1" title="Cotización aproximada convertida por Dólar CCL">
                ≈ USD {(currentPrice / cclRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400 font-normal">CCL</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Volatility indicators */}
        <div className="flex gap-3 flex-wrap">
          <div className="bg-white border border-slate-200 px-3 py-2 rounded-lg flex items-center gap-2 shadow-xs">
            <Gauge className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ATR Estimado</p>
              <p className="text-xs font-bold text-slate-800 font-mono">{holding.atr ? formatARS(holding.atr) : "Calculando..."}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 px-3 py-2 rounded-lg flex items-center gap-2 shadow-xs">
            <Gauge className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Volatilidad Anual</p>
              <p className="text-xs font-bold text-slate-800 font-mono">{volatilityPercentage ? `${volatilityPercentage}%` : "Calculando..."}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Limits Matrix Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* TAKE PROFIT (LIMITES ALZA) */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <div className="p-1 bg-slate-100 text-slate-700 rounded">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Límites Take Profit (TP)</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">TP Conservador</span>
              <div className="text-right">
                <p className="text-sm font-bold text-orange-650 font-mono">
                  {recommendedTP ? formatARS(recommendedTP.conservative) : "A calcular"}
                </p>
                {recommendedTP && cclRate > 0 && (
                  <p className="text-[9px] font-mono font-medium text-slate-400">
                    ≈ USD {(recommendedTP.conservative / cclRate).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded border border-slate-350 shadow-xs">
              <span className="text-[11px] font-bold text-slate-900">
                TP Moderado (Óptimo)
              </span>
              <div className="text-right">
                <p className="text-sm font-bold text-orange-700 font-mono">
                  {recommendedTP ? formatARS(recommendedTP.moderate) : "A calcular"}
                </p>
                {recommendedTP && cclRate > 0 && (
                  <p className="text-[9px] font-mono font-bold text-slate-500">
                    ≈ USD {(recommendedTP.moderate / cclRate).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">TP Agresivo</span>
              <div className="text-right">
                <p className="text-sm font-bold text-orange-850 font-mono">
                  {recommendedTP ? formatARS(recommendedTP.aggressive) : "A calcular"}
                </p>
                {recommendedTP && cclRate > 0 && (
                  <p className="text-[9px] font-mono font-medium text-slate-400">
                    ≈ USD {(recommendedTP.aggressive / cclRate).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <p className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded border border-slate-150 leading-relaxed">
            <span className="font-bold text-slate-800 uppercase tracking-widest text-[9px] block mb-1">Fundamento TP:</span> {recommendedTP ? recommendedTP.description : "Los targets estiman resistencias históricas de mediano plazo."}
          </p>
        </div>

        {/* STOP LOSS (LIMITES BAJA) */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <div className="p-1 bg-slate-100 text-slate-700 rounded">
              <ArrowDownRight className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Frenos Stop Loss (SL)</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">SL Conservador</span>
              <div className="text-right">
                <p className="text-sm font-bold text-red-650 font-mono">
                  {recommendedSL ? formatARS(recommendedSL.conservative) : "A calcular"}
                </p>
                {recommendedSL && cclRate > 0 && (
                  <p className="text-[9px] font-mono font-medium text-slate-400">
                    ≈ USD {(recommendedSL.conservative / cclRate).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded border border-slate-350 shadow-xs">
              <span className="text-[11px] font-bold text-slate-900">
                SL Moderado (Recomendado)
              </span>
              <div className="text-right">
                <p className="text-sm font-bold text-red-700 font-mono">
                  {recommendedSL ? formatARS(recommendedSL.moderate) : "A calcular"}
                </p>
                {recommendedSL && cclRate > 0 && (
                  <p className="text-[9px] font-mono font-bold text-slate-500">
                    ≈ USD {(recommendedSL.moderate / cclRate).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">SL Agresivo</span>
              <div className="text-right">
                <p className="text-sm font-bold text-red-800 font-mono">
                  {recommendedSL ? formatARS(recommendedSL.aggressive) : "A calcular"}
                </p>
                {recommendedSL && cclRate > 0 && (
                  <p className="text-[9px] font-mono font-medium text-slate-400">
                    ≈ USD {(recommendedSL.aggressive / cclRate).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded border border-slate-150 leading-relaxed">
            <span className="font-bold text-slate-800 uppercase tracking-widest text-[9px] block mb-1">Fundamento SL:</span> {recommendedSL ? recommendedSL.description : "Detención prudencial en base a múltiplos históricos de ATR."}
          </p>
        </div>

      </div>

      {/* Technical Status Comment */}
      <div className="bg-slate-50/55 p-4 rounded-lg border border-slate-200 space-y-1.5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
          Análisis Técnico & Estructura Operativa
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {technicalAdvice || "Buscando indicadores actualizados..."}
        </p>
      </div>

      {/* Take Profit Reinvestment Advice */}
      <div className="bg-slate-900 text-white p-5 rounded-lg space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-slate-200">
          <PiggyBank className="h-4 w-4 text-slate-300" />
          Plan de Reasignación Estratégica ante Toma de Ganancias (Take Profit)
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {allocationAdvice || "Este panel te aconsejará de manera exacta y personalizada qué hacer al alcanzar el objetivo: si recomprar el activo más abajo operando en la reversión técnica de mediano plazo o bien rotarlo a otro papel en un mejor soporte."}
        </p>
      </div>

    </div>
  );
}
