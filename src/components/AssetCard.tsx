/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { StockHolding } from "../types";
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Award,
  ShieldAlert,
  Edit,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { formatARS, formatNumberAr, formatInputARS, parseInputARS } from "../utils/formatter";

interface AssetCardProps {
  key?: string;
  holding: StockHolding;
  isSelected: boolean;
  onSelect: () => void;
  onRefresh: (id: string, ticker: string, buyPrice: number, quantity: number) => any;
  onDelete: (id: string) => void;
  onUpdatePosition: (id: string, buyPrice: number, quantity: number) => void;
  isActionLoading: boolean;
  cclRate: number;
}

export default function AssetCard({
  holding,
  isSelected,
  onSelect,
  onRefresh,
  onDelete,
  onUpdatePosition,
  isActionLoading,
  cclRate,
}: AssetCardProps) {
  const {
    id,
    ticker,
    name,
    buyPrice,
    quantity,
    currentPrice,
    recommendedTP,
    recommendedSL,
    volatilityPercentage
  } = holding;

  const [isEditing, setIsEditing] = React.useState(false);
  const [editPrice, setEditPrice] = React.useState(formatInputARS(buyPrice.toString()));
  const [editQty, setEditQty] = React.useState(quantity.toString().replace(/\./g, ","));
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Keep internal state updated if holding changes outside
  React.useEffect(() => {
    setEditPrice(formatInputARS(buyPrice.toString()));
    setEditQty(quantity.toString().replace(/\./g, ","));
  }, [buyPrice, quantity]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditPrice(formatInputARS(buyPrice.toString()));
    setEditQty(quantity.toString().replace(/\./g, ","));
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-xl border p-5 transition-all duration-200 flex flex-col justify-between ${
          isSelected
            ? "border-slate-900 bg-slate-50/20 shadow-md ring-1 ring-slate-900"
            : "border-slate-200 shadow-sm hover:border-slate-350"
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <span className="text-sm font-bold text-slate-900 font-mono">Editar Posición: {ticker}</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Actualizar cantidad o costo promedio.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Precio Promedio Compra (ARS)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 font-bold text-[10px] text-slate-400 select-none">
                  $
                </span>
                <input
                  type="text"
                  value={editPrice}
                  onChange={(e) => setEditPrice(formatInputARS(e.target.value))}
                  className="w-full pl-6 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Cantidad / Papeles
              </label>
              <input
                type="text"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 font-sans">
            <button
              type="button"
              onClick={() => {
                const parseP = parseInputARS(editPrice);
                const parseQ = parseInputARS(editQty);
                if (isNaN(parseP) || parseP <= 0) {
                  alert("Por favor ingresa un precio promedio válido.");
                  return;
                }
                if (isNaN(parseQ) || parseQ <= 0) {
                  alert("Por favor ingresa una cantidad válida de papeles.");
                  return;
                }
                onUpdatePosition(id, parseP, parseQ);
                setIsEditing(false);
              }}
              className="flex-1 bg-slate-950 hover:bg-slate-850 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer text-center border border-slate-900"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer text-center border border-slate-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalCost = buyPrice * quantity;
  const currentValue = currentPrice * quantity;
  const gain = currentValue - totalCost;
  const gainPct = totalCost > 0 ? (gain / totalCost) * 100 : 0;
  const isPositive = gain >= 0;

  // Detect threshold alerts
  let alertMessage = "";
  let alertType: "safe" | "tp" | "sl" = "safe";

  if (recommendedTP) {
    if (currentPrice >= recommendedTP.aggressive) {
      alertMessage = "¡Toma de Ganancias AGRESIVO completado!";
      alertType = "tp";
    } else if (currentPrice >= recommendedTP.moderate) {
      alertMessage = "Take Profit MODERADO alcanzado. Excelente zona de venta.";
      alertType = "tp";
    } else if (currentPrice >= recommendedTP.conservative) {
      alertMessage = "Zona de Take Profit CONSERVADOR alcanzada.";
      alertType = "tp";
    }
  }

  if (recommendedSL && alertType === "safe") {
    if (currentPrice <= recommendedSL.aggressive) {
      alertMessage = "¡ALERTA de riesgo! Precio descendió del Stop Loss Técnico largo plazo.";
      alertType = "sl";
    } else if (currentPrice <= recommendedSL.moderate) {
      alertMessage = "Precio por debajo del Stop Loss Moderado recomendado.";
      alertType = "sl";
    } else if (currentPrice <= recommendedSL.conservative) {
      alertMessage = "Bajo Stop Loss Conservador de corto plazo.";
      alertType = "sl";
    }
  }

  // Calculate relative position for the visual scale
  const minScale = recommendedSL ? recommendedSL.aggressive * 0.9 : buyPrice * 0.8;
  const maxScale = recommendedTP ? recommendedTP.aggressive * 1.1 : buyPrice * 1.3;
  const scaleRange = maxScale - minScale;

  const getPercent = (val: number) => {
    const pct = ((val - minScale) / scaleRange) * 100;
    return Math.min(Math.max(pct, 0), 100);
  };

  const buyPricePct = getPercent(buyPrice);
  const currentPricePct = getPercent(currentPrice);
  const slConservativePct = recommendedSL ? getPercent(recommendedSL.conservative) : 15;
  const slModeratePct = recommendedSL ? getPercent(recommendedSL.moderate) : 25;
  const tpConservativePct = recommendedTP ? getPercent(recommendedTP.conservative) : 75;
  const tpModeratePct = recommendedTP ? getPercent(recommendedTP.moderate) : 85;

  return (
    <div
      onClick={onSelect}
      className={`relative bg-white rounded-xl border p-3 md:p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        isSelected
          ? "border-slate-900 bg-slate-50/30 shadow-md ring-1 ring-slate-900"
          : "border-slate-200 shadow-xs hover:border-slate-350 hover:shadow-xs"
      }`}
    >
      {/* Slim Header View always visible */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold tracking-tight text-slate-900 font-mono">
              {ticker}
            </span>
            <span className={`text-[9px] font-bold px-1 py-0.2 rounded flex items-center gap-0.5 ${isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {isPositive ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
              {isPositive ? "+" : ""}{gainPct.toFixed(1)}%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px] mt-0.5" title={name || `${ticker} Asset`}>
            {name || `${ticker} Asset`}
          </p>
        </div>

        {/* Compact value at a glance */}
        <div className="text-right px-1 shrink-0 flex flex-col items-end">
          <p className="text-[11px] font-mono font-bold text-slate-900">
            {formatARS(currentValue, 0)}
          </p>
          <p className="text-[9px] font-mono text-slate-400">
            {formatNumberAr(quantity, 1)} u. @ {formatARS(currentPrice, 0)}
          </p>
          {cclRate > 0 && (
            <span className="text-[8px] font-bold font-mono text-slate-500 bg-slate-100/70 px-1 rounded mt-0.5" title="Conversión aproximada por Dólar CCL">
              ≈ USD {(currentValue / cclRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>

        {/* Action button bar */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleStartEdit}
            title="Editar ponderación (precio/cantidad)"
            className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
          >
            <Edit className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh(id, ticker, buyPrice, quantity);
            }}
            title="Sincronizar y analizar con Gemini"
            disabled={isActionLoading}
            className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isActionLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            title="Eliminar de portafolio"
            className="p-1 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded transition-colors cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          
          {/* Dropdown collapsible trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            title={isExpanded ? "Ocultar información" : "Ver detalles completos"}
            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer ml-0.5"
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Dropdown collapsible contents */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2.5 animate-fadeIn">
          {/* Extra volatility detail */}
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span>Volatilidad Estimada (TP/SL):</span>
            <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
              {volatilityPercentage ? `${volatilityPercentage}%` : "Cargando..."}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Tu Compra Promedio</p>
              <p className="text-[11px] font-semibold text-slate-700 font-mono">
                {formatARS(buyPrice)}
              </p>
              <p className="text-[9px] text-slate-400">
                Cant: <span className="font-mono text-slate-500">{formatNumberAr(quantity, 4)}</span>
              </p>
              {cclRate > 0 && (
                <p className="text-[9px] text-slate-500 font-mono font-medium mt-0.5">
                  Ref: <span className="font-bold">USD {(buyPrice / cclRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>
              )}
            </div>

            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Precio Actual</p>
              <p className="text-[11px] font-bold text-slate-800 font-mono flex items-center gap-1">
                {formatARS(currentPrice)}
              </p>
              <p className={`text-[9px] font-bold flex items-center gap-0.5 ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                {isPositive ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                {isPositive ? "+" : ""}{gainPct.toFixed(2)}%
              </p>
              {cclRate > 0 && (
                <p className="text-[9px] text-slate-500 font-mono font-medium mt-0.5">
                  Ref: <span className="font-bold">USD {(currentPrice / cclRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>
              )}
            </div>
          </div>

          {/* Value comparison */}
          <div className="flex items-center justify-between text-[11px] border-b border-dashed border-slate-100 pb-2">
            <span className="text-slate-500 font-semibold">Rendimiento Histórico:</span>
            <div className="text-right">
              <span className={`font-bold font-mono text-[11px] ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                {isPositive ? "+" : ""}{formatARS(gain)}
              </span>
            </div>
          </div>

          {/* Visual Sliders Metric Rule */}
          {recommendedTP && recommendedSL && (
            <div className="space-y-1">
              <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest px-0.5">
                <span>Riesgo (SL)</span>
                <span>Objetivo (TP)</span>
              </div>
              <div className="relative w-full h-1.5 bg-slate-100 rounded-full my-1 overflow-visible">
                {/* Purchase Price Marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-2 bg-indigo-500 rounded-md z-10"
                  style={{ left: `${buyPricePct}%` }}
                  title={`Precio Compra: ${formatARS(buyPrice)}`}
                />
                {/* TP Conservative Marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-emerald-400 rounded-full z-10"
                  style={{ left: `${tpConservativePct}%` }}
                  title={`TP Conservador: ${formatARS(recommendedTP.conservative)}`}
                />
                {/* TP Moderate Marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-emerald-500 rounded-full z-10"
                  style={{ left: `${tpModeratePct}%` }}
                  title={`TP Moderado: ${formatARS(recommendedTP.moderate)}`}
                />
                {/* SL Conservative Marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-rose-400 rounded-full z-10"
                  style={{ left: `${slConservativePct}%` }}
                  title={`SL Conservador: ${formatARS(recommendedSL.conservative)}`}
                />
                {/* SL Moderate Marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-1.5 bg-rose-500 rounded-full z-10"
                  style={{ left: `${slModeratePct}%` }}
                  title={`SL Moderado: ${formatARS(recommendedSL.moderate)}`}
                />

                {/* Current Price Marker */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white z-20 shadow-xs ${
                    isPositive ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                  style={{ left: `${currentPricePct}%` }}
                  title={`Precio Actual: ${formatARS(currentPrice)}`}
                />
              </div>
              <div className="flex justify-between text-[8px] font-mono text-slate-450 px-0.5">
                <span>SL: {formatARS(recommendedSL.moderate, 0)}</span>
                <span>Compra: {formatARS(buyPrice, 0)}</span>
                <span>TP: {formatARS(recommendedTP.moderate, 0)}</span>
              </div>
            </div>
          )}

          {/* Alert Warning Block */}
          {alertMessage && (
            <div
              className={`p-2 rounded-lg text-[10px] flex items-center gap-1.5 border ${
                alertType === "tp"
                  ? "bg-orange-50 text-orange-800 border-orange-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {alertType === "tp" ? (
                <Award className="h-3 w-3 text-orange-600 shrink-0" />
              ) : (
                <ShieldAlert className="h-3 w-3 text-red-650 shrink-0" />
              )}
              <span className="font-semibold leading-normal">{alertMessage}</span>
            </div>
          )}

          {/* Focus indicator / guide */}
          <div className="flex items-center justify-end text-[9px] font-bold text-slate-900 group hover:translate-x-0.5 transition-transform uppercase tracking-wider">
            <span className="group-hover:underline">Ver Gestión de Riesgo</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      )}
    </div>
  );
}
