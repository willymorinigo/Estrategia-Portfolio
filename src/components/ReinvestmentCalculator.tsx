/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { StockHolding } from "../types";
import { 
  Calculator, 
  ArrowRightLeft, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  CircleDollarSign,
  ArrowRight
} from "lucide-react";
import { formatARS, formatNumberAr, formatInputARS, parseInputARS } from "../utils/formatter";

interface ReinvestmentCalculatorProps {
  holdings: StockHolding[];
  selectedHolding: StockHolding | null;
  onRegisterSale?: (ticker: string, sharesToSell: number, salePrice: number) => void;
}

export default function ReinvestmentCalculator({ holdings, selectedHolding, onRegisterSale }: ReinvestmentCalculatorProps) {
  const [activeAsset, setActiveAsset] = useState<StockHolding | null>(null);
  const [exitPriceInput, setExitPriceInput] = useState<string>("0");
  const [sellPercent, setSellPercent] = useState<number>(100); // 100% standard
  const [otherTargetId, setOtherTargetId] = useState<string>("");

  // Sync with selectedHolding on parent load
  useEffect(() => {
    if (selectedHolding) {
      setActiveAsset(selectedHolding);
      setExitPriceInput(formatInputARS(selectedHolding.currentPrice.toString()));
    } else if (holdings.length > 0 && !activeAsset) {
      setActiveAsset(holdings[0]);
      setExitPriceInput(formatInputARS(holdings[0].currentPrice.toString()));
    }
  }, [selectedHolding, holdings]);

  // Set selected other target asset for rotation
  useEffect(() => {
    if (activeAsset) {
      const otherAssets = holdings.filter(h => h.id !== activeAsset.id);
      if (otherAssets.length > 0) {
        setOtherTargetId(otherAssets[0].id);
      } else {
        setOtherTargetId("");
      }
    }
  }, [activeAsset, holdings]);

  if (holdings.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <Calculator className="h-8 w-8 text-slate-300 mb-2" />
        <h3 className="text-sm font-bold text-slate-500">Calculadora de Reinversión inactiva</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[240px] text-center">
          Agrega al menos un activo en tu portafolio para poder modelar tomas de ganancia y planes de recompra.
        </p>
      </div>
    );
  }

  const currentAsset = activeAsset || holdings[0];

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = holdings.find(h => h.id === e.target.value);
    if (selected) {
      setActiveAsset(selected);
      setExitPriceInput(formatInputARS(selected.currentPrice.toString()));
    }
  };

  // Convert the formatted input value to a float number for calculations
  const parsedExitPrice = parseInputARS(exitPriceInput);

  // Calculations
  const qtyToSell = (currentAsset.quantity * sellPercent) / 100;
  const initialCost = qtyToSell * currentAsset.buyPrice;
  const releasedCash = qtyToSell * parsedExitPrice;
  const netEarnings = releasedCash - initialCost;
  const isGain = netEarnings >= 0;
  const profitPercentage = initialCost > 0 ? (netEarnings / initialCost) * 100 : 0;

  // Strategy A: Reinvest on Dip (Buy Back same asset)
  // Support Price is calculated: price minus 1.5x - 2.5x ATR, or roughly 10% below current depending on ATR availability.
  const calculatedSupportPrice = currentAsset.atr 
    ? Math.max(currentAsset.currentPrice - (currentAsset.atr * 2), currentAsset.currentPrice * 0.8) 
    : currentAsset.currentPrice * 0.9;
  const supportPrice = Number(calculatedSupportPrice.toFixed(2));
  
  // Reinvested shares we can get at support
  const newSharesAtSupport = supportPrice > 0 ? releasedCash / supportPrice : 0;
  // Net share increase compared to how many we sold
  const netNewShares = newSharesAtSupport - qtyToSell;
  const shareIncreasePct = qtyToSell > 0 ? (netNewShares / qtyToSell) * 100 : 0;

  // Strategy B: Rotate Portfolio (Reinvest in another specific asset)
  const otherAssetTarget = holdings.find(h => h.id === otherTargetId);
  const targetCurrentPrice = otherAssetTarget ? otherAssetTarget.currentPrice : 0;
  const targetSharesFromRotation = targetCurrentPrice > 0 ? releasedCash / targetCurrentPrice : 0;

  return (
    <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      
      {/* Tool Header */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
        <div className="p-2 bg-slate-100 text-slate-850 rounded">
          <Calculator className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Simulación de Retornos & Reinversión</h2>
          <p className="text-[11px] text-slate-400">Modela tomas de ganancia y optimiza el crecimiento del número de acciones.</p>
        </div>
      </div>

      {/* Asset selection and exit fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Selector de Activo */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Activo a Simular
          </label>
          <select
            value={currentAsset.id}
            onChange={handleAssetChange}
            className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-slate-500 font-sans"
          >
            {holdings.map(h => (
              <option key={h.id} value={h.id} className="font-sans text-slate-900">
                {h.ticker} - {h.name || `${h.ticker} Asset`}
              </option>
            ))}
          </select>
        </div>

        {/* Exit price input */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Precio de Salida (ARS)
          </label>
          <input
            type="text"
            value={exitPriceInput}
            onChange={(e) => setExitPriceInput(formatInputARS(e.target.value))}
            className="w-full bg-white border border-slate-200 text-slate-900 font-semibold font-mono py-1.5 px-3 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {currentAsset.recommendedTP && (
              <>
                <button
                  type="button"
                  onClick={() => setExitPriceInput(formatInputARS(currentAsset.recommendedTP!.conservative.toString()))}
                  className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-[10px] text-orange-600 font-bold border border-slate-150 rounded transition-colors cursor-pointer"
                >
                  cons
                </button>
                <button
                  type="button"
                  onClick={() => setExitPriceInput(formatInputARS(currentAsset.recommendedTP!.moderate.toString()))}
                  className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-[10px] text-orange-700 font-bold border border-slate-150 rounded transition-colors cursor-pointer"
                >
                  mod
                </button>
                <button
                  type="button"
                  onClick={() => setExitPriceInput(formatInputARS(currentAsset.recommendedTP!.aggressive.toString()))}
                  className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-[10px] text-orange-850 font-bold border border-slate-150 rounded transition-colors cursor-pointer"
                >
                  agr
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sell slider */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 justify-between flex">
            <span>Vender Posición:</span>
            <span className="text-slate-900 font-mono font-bold">{sellPercent}%</span>
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={sellPercent}
              onChange={(e) => setSellPercent(Number(e.target.value))}
              className="w-full accent-slate-900"
            />
            <div className="flex gap-1">
              <button 
                onClick={() => setSellPercent(25)}
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${sellPercent === 25 ? 'bg-slate-900 text-white':'bg-slate-100 text-slate-700 border border-slate-200'}`}
              >25%</button>
              <button 
                onClick={() => setSellPercent(50)}
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${sellPercent === 50 ? 'bg-slate-900 text-white':'bg-slate-100 text-slate-700 border border-slate-200'}`}
              >50%</button>
              <button 
                onClick={() => setSellPercent(100)}
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${sellPercent === 100 ? 'bg-slate-900 text-white':'bg-slate-100 text-slate-700 border border-slate-200'}`}
              >100%</button>
            </div>
          </div>
        </div>

      </div>

      {/* Primary exit output metrics block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-lg border border-slate-200 font-mono">
        
        {/* Cantidad Vendida */}
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-widest">Activos Vendidos</p>
          <p className="text-base font-bold text-slate-900">{formatNumberAr(qtyToSell, 4)} <span className="text-xs text-slate-400 font-sans font-semibold">{currentAsset.ticker}</span></p>
          <p className="text-[11px] text-slate-500 font-sans">Costo inicial: {formatARS(initialCost)}</p>
        </div>

        {/* Efectivo Liberado */}
        <div className="space-y-1 border-y md:border-y-0 md:border-x border-slate-200 py-3 md:py-0 md:px-4">
          <p className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-widest">Efectivo Liberado</p>
          <p className="text-base font-bold text-slate-900 font-mono flex items-center gap-1.5">
            <CircleDollarSign className="h-4 w-4 text-slate-650" />
            {formatARS(releasedCash)}
          </p>
          <p className="text-[11px] text-slate-500 font-sans">Disponibilidad líquida en cartera</p>
        </div>

        {/* Rendimiento Neto Realizado */}
        <div className="space-y-1 md:pl-4">
          <p className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-widest">Retorno Neto</p>
          <div className="flex items-center gap-1.5">
            <span className={`text-base font-bold ${isGain ? "text-green-650" : "text-red-650"}`}>
              {isGain ? "+" : ""}{formatARS(netEarnings)}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isGain ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {isGain ? "+" : ""}{profitPercentage.toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-sans flex items-center gap-1">
            {isGain ? (
              <span className="text-green-800">Crecimiento de patrimonio</span>
            ) : (
              <span className="text-red-800">Menor valor generado</span>
            )}
          </p>
        </div>

      </div>

      {/* REGISTRO DE VENTA REAL */}
      <button
        type="button"
        id="btn-execute-reallocation-trade"
        onClick={() => {
          if (onRegisterSale) {
            onRegisterSale(currentAsset.ticker, qtyToSell, parsedExitPrice);
          }
        }}
        className="w-full bg-slate-950 hover:bg-slate-850 text-white font-medium py-3 px-4 rounded-lg shadow-sm text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-800"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        <span>Registrar Operación de Venta en Historial ({currentAsset.ticker} @ {formatARS(parsedExitPrice)})</span>
      </button>

      {/* Strategies Reallocator Panel */}
      <div className="space-y-4">
        <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400 font-sans flex items-center gap-2">
          <ArrowRightLeft className="h-3.5 w-3.5 text-slate-500" />
          Alternativas Inteligentes de Reinversión
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* ESTRATEGIA A: COMPUESTA RECOMPRA BAJO SOPORTE DE CORRECCION (DIP BUY) */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between font-sans">
                <span className="text-[10px] font-bold text-orange-850 bg-orange-100/50 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" /> Plan A: Recompra en Soporte
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Soporte: {formatARS(supportPrice)}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Espera que <b className="font-bold text-slate-800">{currentAsset.ticker}</b> retroceda a soporte técnico de <b className="text-slate-800">{formatARS(supportPrice)}</b> antes de volver a ingresar en mínimos.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center bg-white">
                <span className="text-[11px] text-slate-400">Cantidad resultante:</span>
                <span className="text-xs font-bold font-mono text-slate-900">{formatNumberAr(newSharesAtSupport, 4)} acciones</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded mt-2 border border-slate-150">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Incremento:</span>
                <span className="text-xs font-bold font-mono text-slate-950">
                  +{formatNumberAr(netNewShares, 4)} (+{shareIncreasePct.toFixed(1)}%)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 text-center italic mt-2">
                ¡Sumas más unidades sin inyectar capital fresco!
              </p>
            </div>
          </div>

          {/* ESTRATEGIA B: ROTACION DE ACTIVOS EN EL PORTAFOLIO */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-900 bg-slate-150 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                  <Coins className="h-3 w-3" /> Plan B: Rotación de Capital
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-sans">Rotar hacia:</span>
                {holdings.length > 1 ? (
                  <select
                    value={otherTargetId}
                    onChange={(e) => setOtherTargetId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-900 py-0.5 px-2 rounded text-[11px] font-bold focus:outline-none"
                  >
                    {holdings
                      .filter(h => h.id !== currentAsset.id)
                      .map(h => (
                        <option key={h.id} value={h.id}>{h.ticker}</option>
                      ))}
                  </select>
                ) : (
                  <span className="text-xs text-amber-600 font-semibold font-sans">1 único activo activo</span>
                )}
              </div>
              
              {otherAssetTarget ? (
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  Asigna el capital en <b className="text-slate-800">{otherAssetTarget.ticker}</b> a su cotización de <b className="text-slate-800">{formatARS(otherAssetTarget.currentPrice)}</b>, aprovechando otro soporte técnico sectorial rezagado.
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 font-sans italic">
                  Agrega más activos para calcular simulaciones cruzadas del portafolio.
                </p>
              )}
            </div>

            {otherAssetTarget && (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[11px] text-slate-400">Conversión:</span>
                  <span className="text-xs font-mono text-slate-600">
                    {otherAssetTarget.ticker} @ {formatARS(otherAssetTarget.currentPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-150">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-sans">Acciones a sumarse:</span>
                  <span className="text-xs font-bold font-mono text-slate-900">
                    +{formatNumberAr(targetSharesFromRotation, 4)} {otherAssetTarget.ticker}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* High Yield Reserve Choice */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-900 flex items-center gap-1 uppercase tracking-wider text-[10px]">
            Plan C: Fondo de Resguardo Pasivo (Liquidez Segura)
          </p>
          <p className="text-[11px] text-slate-500 max-w-md">
            Coloca el total generado en fondos conservadores del mercado monetario a tasa de renta fija pasiva del 4.5% anual mientras aguardas mejores puntos de entrada de mercado.
          </p>
        </div>
        <div className="text-left font-mono self-center shrink-0">
          <p className="text-[9px] text-slate-400 font-sans uppercase font-bold tracking-widest">Renta Anual Estimada</p>
          <p className="text-xs font-bold text-slate-900">+{formatARS(releasedCash * 0.045)} ARS</p>
        </div>
      </div>

    </div>
  );
}
