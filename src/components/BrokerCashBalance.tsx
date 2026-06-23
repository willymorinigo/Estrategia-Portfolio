/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Wallet, DollarSign, Check, Coins } from "lucide-react";
import { formatInputARS, parseInputARS, formatARS } from "../utils/formatter";

interface BrokerCashBalanceProps {
  cashARS: number;
  cashUSD: number;
  cclRate: number;
  onUpdateCash: (ars: number, usd: number) => void;
}

export default function BrokerCashBalance({
  cashARS,
  cashUSD,
  cclRate,
  onUpdateCash,
}: BrokerCashBalanceProps) {
  // Input states (as strings for the masked formatting)
  const [inputARS, setInputARS] = useState("");
  const [inputUSD, setInputUSD] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Sync with prop updates
  useEffect(() => {
    // If props or storage values load:
    const initialARS = cashARS > 0 ? new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(cashARS) : "";
    const initialUSD = cashUSD > 0 ? new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(cashUSD) : "";
    setInputARS(initialARS);
    setInputUSD(initialUSD);
  }, [cashARS, cashUSD]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedARS = parseInputARS(inputARS);
    const parsedUSD = parseInputARS(inputUSD);
    
    onUpdateCash(parsedARS, parsedUSD);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Convert USD liquid portion to ARS at reference CCL
  const usdInARS = cashUSD * cclRate;
  const totalLiquidARS = cashARS + usdInARS;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-slate-100 text-slate-800 rounded">
          <Coins className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Efectivo en Cuenta (Broker)</h2>
          <p className="text-[11px] text-slate-400">Registra tus pesos o dólares líquidos sin colocar en activos.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Liquidez Pesos ARS */}
          <div>
            <label htmlFor="cash-ars-input" className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Saldo Líquido Pesos (ARS)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold text-[10px] select-none">
                $
              </span>
              <input
                id="cash-ars-input"
                type="text"
                placeholder="0,00"
                value={inputARS}
                onChange={(e) => setInputARS(formatInputARS(e.target.value))}
                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>

          {/* Liquidez Dólares USD */}
          <div>
            <label htmlFor="cash-usd-input" className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Saldo Líquido Dólares (USD)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold text-[10px] select-none">
                u$s
              </span>
              <input
                id="cash-usd-input"
                type="text"
                placeholder="0,00"
                value={inputUSD}
                onChange={(e) => setInputUSD(formatInputARS(e.target.value))}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Resumen de liquidez calculada */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-[11px]">
          <div>
            <span className="text-slate-400 font-medium font-sans">Efectivo Total Proyectado:</span>
            <span className="block text-[10px] text-slate-400 font-mono italic">
              (u$s {cashUSD.toLocaleString("es-AR", { minimumFractionDigits: 2 })} @ CCL ${cclRate})
            </span>
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-800 font-mono">{formatARS(totalLiquidARS)}</span>
            <span className="block text-[10px] font-bold text-slate-500 font-mono">
              ≈ USD {(totalLiquidARS / cclRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <button
          type="submit"
          className={`w-full py-2 px-4 rounded-lg shadow-sm text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
            isSaved 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-slate-900 hover:bg-slate-800 text-white"
          }`}
        >
          {isSaved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Saldos Guardados</span>
            </>
          ) : (
            <span>Guardar Saldos Líquidos</span>
          )}
        </button>
      </form>
    </div>
  );
}
