/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Search, DollarSign, Archive, CircleAlert } from "lucide-react";
import { formatInputARS, parseInputARS, formatInputQty } from "../utils/formatter";

interface AddAssetFormProps {
  onAddAsset: (ticker: string, buyPrice: number, quantity: number) => void;
  isLoading: boolean;
}

export default function AddAssetForm({ onAddAsset, isLoading }: AddAssetFormProps) {
  const [ticker, setTicker] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!ticker.trim()) {
      setErrorMessage("Por favor ingresa un Ticker válido (Ej. AAPL, BTC, TSLA).");
      return;
    }

    const priceNum = parseInputARS(buyPrice);
    if (!buyPrice || isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage("El precio promedio de compra debe ser un número positivo.");
      return;
    }

    const qtyNum = parseInputARS(quantity);
    if (!quantity || isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMessage("La cantidad debe ser un número positivo.");
      return;
    }

    onAddAsset(ticker.toUpperCase().trim(), priceNum, qtyNum);
    
    // Reset form after successful submission
    setTicker("");
    setBuyPrice("");
    setQuantity("");
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-slate-100 text-slate-800 rounded">
          <Plus className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Registrar Nuevo Activo (IOL)</h2>
          <p className="text-[11px] text-slate-400">Analiza tus Cedears y Acciones locales Merval en pesos.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ticker Input */}
        <div>
          <label htmlFor="ticker-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Símbolo o Ticker (Merval o CEDEAR)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              id="ticker-input"
              type="text"
              placeholder="Ej: GGAL, YPFD, PAMP, AAPL, TSLA"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              disabled={isLoading}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold tracking-wide text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Precio Promedio de Compra */}
          <div>
            <label htmlFor="buy-price-input" className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Precio Promedio Compra (ARS)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold text-[10px] select-none">
                $
              </span>
              <input
                id="buy-price-input"
                type="text"
                placeholder="4.400,00"
                value={buyPrice}
                onChange={(e) => setBuyPrice(formatInputARS(e.target.value))}
                disabled={isLoading}
                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label htmlFor="quantity-input" className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Cant / Acciones
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Archive className="h-3.5 w-3.5" />
              </span>
              <input
                id="quantity-input"
                type="text"
                placeholder="100,0"
                value={quantity}
                onChange={(e) => setQuantity(formatInputQty(e.target.value))}
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2">
            <CircleAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="text-xs text-rose-700 leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analizando mercado en pesos (IOL)...</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span>Añadir e Iniciar Análisis</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-center text-slate-400 italic">
          La tecnología Gemini IA consultará cotizaciones históricas del Merval/Cedears en pesos de inmediato.
        </p>
      </form>
    </div>
  );
}
