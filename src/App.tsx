/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { StockHolding, PortfolioSummary, Transaction } from "./types";
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  TrendingUpIcon, 
  HelpCircle, 
  ArrowUpRight, 
  Maximize2,
  Trash2,
  Lock,
  Plus,
  Coins,
  BrainCircuit,
  PiggyBank,
  History,
  FileSpreadsheet
} from "lucide-react";
import PortfolioStats from "./components/PortfolioStats";
import AddAssetForm from "./components/AddAssetForm";
import AssetCard from "./components/AssetCard";
import RiskAnalysisDashboard from "./components/RiskAnalysisDashboard";
import ReinvestmentCalculator from "./components/ReinvestmentCalculator";
import { formatARS, formatNumberAr } from "./utils/formatter";

// Beautiful preseeds in Argentine Pesos (ARS) - GGAL and Apple CEDEAR on InvertirOnline (IOL)
const INITIAL_PRESEEDS: StockHolding[] = [
  {
    id: "preseed-ggal",
    ticker: "GGAL",
    name: "Grupo Financiero Galicia S.A.",
    buyPrice: 4200.00,
    quantity: 150,
    currentPrice: 4850.50,
    currentPriceSource: "gemini",
    atr: 125.40,
    volatilityPercentage: 42.5,
    recommendedTP: {
      conservative: 5200.00,
      moderate: 5800.00,
      aggressive: 6500.00,
      description: "TP conservador determinado por la resistencia técnica de corto plazo en BYMA. El nivel moderado contempla un canal de Fibonacci del 23.6% en tendencia primaria."
    },
    recommendedSL: {
      conservative: 4400.00,
      moderate: 4150.00,
      aggressive: 3800.00,
      description: "SL moderado situado por debajo del ATR diario móvil sugerido para amortiguar whipsaws. El agresivo protege bajo soportes macrosectoriales de largo plazo."
    },
    technicalAdvice: "Grupo Galicia (GGAL) demuestra una sólida estructura de consolidación en pesos sobre la media móvil exponencial de 21 periodos. El volumen operado en InvertirOnline acompaña el impulso ascendente con un RSI neutral en 58, perfilando un desarrollo de acumulación alcista favorable.",
    allocationAdvice: "Al alcanzar el Take Profit Moderado ($5.800), se sugiere tomar ganancias parciales y transferir ARS líquidos a tasas de caución corta en IOL para resguardo temporal, o rotar un 40% hacia el CEDEAR de Apple (AAPL) para cobertura cambiaria defensiva frente a variaciones del CCL."
  },
  {
    id: "preseed-aapl",
    ticker: "AAPL",
    name: "Apple Inc. (CEDEAR)",
    buyPrice: 11500.00,
    quantity: 50,
    currentPrice: 13200.00,
    currentPriceSource: "gemini",
    atr: 310.20,
    volatilityPercentage: 24.8,
    recommendedTP: {
      conservative: 14200.00,
      moderate: 15500.00,
      aggressive: 17500.00,
      description: "TP moderado estimado bajo la base de la fluctuación del Contado con Liquidación (CCL) combinada con el precio subyacente en el Nasdaq."
    },
    recommendedSL: {
      conservative: 12300.00,
      moderate: 11800.00,
      aggressive: 10500.00,
      description: "Amortiguador calculado en base a 2x el ATR local diario para evitar cierres accidentales por variaciones bruscas de liquidez en la plaza BYMA."
    },
    technicalAdvice: "El CEDEAR de Apple opera con sesgo lateral defensivo. Mantiene buena correlación cambiaria actuando como refugio patrimonial. Los osciladores muestran compresión técnica indicando una inminente definición alcista por ruptura del canal de compresión.",
    allocationAdvice: "Si completa el target moderado ($15.500), puedes capitalizar la ganancia y recomprar en soportes de $12.500 o destinar las utilidades a recomponer posiciones rezagadas del Merval como GGAL si cotizan en valores infravalorados de soporte."
  }
];

export default function App() {
  const [holdings, setHoldings] = useState<StockHolding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [isGlobalSyncing, setIsGlobalSyncing] = useState<boolean>(false);
  const [isFormLoading, setIsFormLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Load from local storage or preseed
  useEffect(() => {
    const saved = localStorage.getItem("gestor_portafolio_assets");
    const savedTransactions = localStorage.getItem("gestor_portafolio_transactions");
    
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch (e) {
        console.error("Error recuperando historial de transacciones:", e);
      }
    }

    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHoldings(parsed);
          if (parsed.length > 0) {
            setSelectedAssetId(parsed[0].id);
          } else {
            setSelectedAssetId("");
          }
          return;
        }
      } catch (e) {
        console.error("Error recuperando portafolio:", e);
      }
    }
    // Preseed default items
    setHoldings(INITIAL_PRESEEDS);
    setSelectedAssetId(INITIAL_PRESEEDS[0].id);
    localStorage.setItem("gestor_portafolio_assets", JSON.stringify(INITIAL_PRESEEDS));
  }, []);

  // Save to local storage whenever holdings update
  const saveHoldings = (updated: StockHolding[]) => {
    setHoldings(updated);
    localStorage.setItem("gestor_portafolio_assets", JSON.stringify(updated));
  };

  const saveTransactions = (updatedTxs: Transaction[]) => {
    setTransactions(updatedTxs);
    localStorage.setItem("gestor_portafolio_transactions", JSON.stringify(updatedTxs));
  };

  // Process and register a sale (partial or total)
  const handleRegisterSale = (ticker: string, sharesToSell: number, salePrice: number) => {
    const symbol = ticker.toUpperCase();
    const holding = holdings.find(h => h.ticker.toUpperCase() === symbol);
    if (!holding) return;

    const previousQty = holding.quantity;
    const remainingQty = previousQty - sharesToSell;

    // Register VENTA transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toLocaleDateString("es-AR") + " " + new Date().toLocaleTimeString("es-AR", { hour: "numeric", minute: "2-digit" }),
      ticker: symbol,
      type: "VENTA",
      shares: sharesToSell,
      price: salePrice,
      totalAmount: sharesToSell * salePrice,
      isPartial: sharesToSell < previousQty
    };
    saveTransactions([newTx, ...transactions]);

    // Update holdings
    let updatedHoldings: StockHolding[] = [];
    if (remainingQty <= 0.0001) {
      updatedHoldings = holdings.filter(h => h.id !== holding.id);
      saveHoldings(updatedHoldings);
      if (selectedAssetId === holding.id) {
        setSelectedAssetId(updatedHoldings.length > 0 ? updatedHoldings[0].id : "");
      }
      triggerNotification(`Operación VENTA registrada. Posición en ${symbol} completamente liquidada.`);
    } else {
      updatedHoldings = holdings.map(h => {
        if (h.id === holding.id) {
          return { ...h, quantity: remainingQty };
        }
        return h;
      });
      saveHoldings(updatedHoldings);
      triggerNotification(`Operación VENTA parcial registrada. Se vendieron ${formatNumberAr(sharesToSell, 4)} acciones de ${symbol}.`);
    }
  };

  // Helper to trigger transient alerts
  const triggerNotification = (message: string, isError = false) => {
    if (isError) {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(""), 8000);
    } else {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  };

  // Trigger Gemini analysis for a Stock
  const analyzeStockViaAPI = async (ticker: string, buyPrice: number, quantity: number): Promise<StockHolding> => {
    const listTickers = holdings.map(h => h.ticker);
    
    const response = await fetch("/api/portfolio/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker,
        buyPrice,
        quantity,
        otherTickers: listTickers
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Ocurrió un error al contactar al analista técnico artificial.");
    }

    const data = await response.json();
    return {
      id: `holding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ticker: data.ticker,
      name: data.name,
      buyPrice,
      quantity,
      currentPrice: data.currentPrice,
      currentPriceSource: "gemini",
      atr: data.atr,
      volatilityPercentage: data.volatilityPercentage,
      recommendedTP: data.recommendedTP,
      recommendedSL: data.recommendedSL,
      technicalAdvice: data.technicalAdvice,
      allocationAdvice: data.allocationAdvice,
      lastUpdated: new Date().toLocaleTimeString("es-ES", { hour: "numeric", minute: "2-digit" })
    };
  };

  // Add Asset Handler
  const handleAddAsset = async (ticker: string, buyPrice: number, quantity: number) => {
    setIsFormLoading(true);
    setErrorMessage("");
    try {
      // Check duplicate
      const duplicated = holdings.find(h => h.ticker.toUpperCase() === ticker.toUpperCase());
      if (duplicated) {
        throw new Error(`El activo ${ticker.toUpperCase()} ya existe en tu lista. Elimínalo primero o actualiza sus registros.`);
      }

      const newAsset = await analyzeStockViaAPI(ticker, buyPrice, quantity);
      const updated = [newAsset, ...holdings];
      saveHoldings(updated);
      setSelectedAssetId(newAsset.id);

      // Auto-log COMPRA transaction
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toLocaleDateString("es-AR") + " " + new Date().toLocaleTimeString("es-AR", { hour: "numeric", minute: "2-digit" }),
        ticker: ticker.toUpperCase(),
        type: "COMPRA",
        shares: quantity,
        price: buyPrice,
        totalAmount: quantity * buyPrice
      };
      saveTransactions([newTx, ...transactions]);

      triggerNotification(`¡Activo de inversión ${ticker} analizado y añadido con éxito!`);
    } catch (error: any) {
      console.error(error);
      triggerNotification(error.message || "No se pudo añadir el activo.", true);
    } finally {
      setIsFormLoading(false);
    }
  };

  // Refresh Single Asset Handler
  const handleRefreshAsset = async (id: string, ticker: string, buyPrice: number, quantity: number) => {
    setIsGlobalSyncing(true);
    try {
      const refreshedData = await analyzeStockViaAPI(ticker, buyPrice, quantity);
      const updated = holdings.map(h => {
        if (h.id === id) {
          return {
            ...h,
            currentPrice: refreshedData.currentPrice,
            atr: refreshedData.atr,
            volatilityPercentage: refreshedData.volatilityPercentage,
            recommendedTP: refreshedData.recommendedTP,
            recommendedSL: refreshedData.recommendedSL,
            technicalAdvice: refreshedData.technicalAdvice,
            allocationAdvice: refreshedData.allocationAdvice,
            lastUpdated: refreshedData.lastUpdated
          };
        }
        return h;
      });
      saveHoldings(updated);
      triggerNotification(`Valores y márgenes de ${ticker} actualizados mediante IA.`);
    } catch (error: any) {
      console.error(error);
      triggerNotification(`Error al sincronizar ${ticker}: ${error.message}`, true);
    } finally {
      setIsGlobalSyncing(false);
    }
  };

  // Sync All (Market sync trigger)
  const handleSyncAll = async () => {
    if (holdings.length === 0) return;
    setIsGlobalSyncing(true);
    setErrorMessage("");
    
    let statsSucceeded = 0;
    let statsFailed = 0;
    
    // Process one-by-one to prevent rate limits or bulk crashes
    const updated = [...holdings];
    for (let i = 0; i < updated.length; i++) {
      const current = updated[i];
      try {
        const refreshed = await analyzeStockViaAPI(current.ticker, current.buyPrice, current.quantity);
        updated[i] = {
          ...current,
          currentPrice: refreshed.currentPrice,
          atr: refreshed.atr,
          volatilityPercentage: refreshed.volatilityPercentage,
          recommendedTP: refreshed.recommendedTP,
          recommendedSL: refreshed.recommendedSL,
          technicalAdvice: refreshed.technicalAdvice,
          allocationAdvice: refreshed.allocationAdvice,
          lastUpdated: refreshed.lastUpdated
        };
        statsSucceeded++;
      } catch (e) {
        console.error(`Fallo al sincronizar ${current.ticker}`, e);
        statsFailed++;
      }
    }
    
    saveHoldings(updated);
    setIsGlobalSyncing(false);
    
    if (statsFailed === 0) {
      triggerNotification(`¡Mercado Sincronizado! Se actualizaron correctamente los ${statsSucceeded} activos de tu portafolio.`);
    } else {
      triggerNotification(`Sincronización parcial: ${statsSucceeded} listos, ${statsFailed} fallaron por demoras técnicas.`, true);
    }
  };

  // Delete Asset
  const handleDeleteAsset = (id: string) => {
    const stock = holdings.find(h => h.id === id);
    const updated = holdings.filter(h => h.id !== id);
    saveHoldings(updated);
    
    if (selectedAssetId === id && updated.length > 0) {
      setSelectedAssetId(updated[0].id);
    } else if (updated.length === 0) {
      setSelectedAssetId("");
    }
    
    if (stock) {
      triggerNotification(`Se eliminó ${stock.ticker} del portafolio.`);
    }
  };

  // Update Asset Position (Increment or Decrease average holdings)
  const handleUpdateAsset = async (id: string, newBuyPrice: number, newQuantity: number) => {
    const oldHolding = holdings.find(h => h.id === id);
    if (!oldHolding) return;

    // Log simulated transaction (COMPRA or VENTA) based on position delta
    const qtyDiff = newQuantity - oldHolding.quantity;
    if (Math.abs(qtyDiff) > 0.0001) {
      const isIncrease = qtyDiff > 0;
      const absQty = Math.abs(qtyDiff);
      const txPrice = isIncrease ? newBuyPrice : (oldHolding.currentPrice || oldHolding.buyPrice);
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toLocaleDateString("es-AR") + " " + new Date().toLocaleTimeString("es-AR", { hour: "numeric", minute: "2-digit" }),
        ticker: oldHolding.ticker.toUpperCase(),
        type: isIncrease ? "COMPRA" : "VENTA",
        shares: absQty,
        price: txPrice,
        totalAmount: absQty * txPrice,
        isPartial: !isIncrease
      };
      saveTransactions([newTx, ...transactions]);
    }

    // Update local state holding
    const updated = holdings.map(h => {
      if (h.id === id) {
        return {
          ...h,
          buyPrice: newBuyPrice,
          quantity: newQuantity,
        };
      }
      return h;
    });
    saveHoldings(updated);
    
    // Automatically recalculate all levels by running technical API sync with Gemini
    triggerNotification(`Actualizando posición de ${oldHolding.ticker}... El análisis se recalculará con tus nuevos valores.`);
    await handleRefreshAsset(id, oldHolding.ticker, newBuyPrice, newQuantity);
  };

  // Restore Default Preseeds (Convenience resets)
  const handleResetPreseeds = () => {
    if (window.confirm("¿Seguro que deseas reiniciar tu portafolio con la simulación preestablecida (AAPL y TSLA)?")) {
      setHoldings(INITIAL_PRESEEDS);
      setSelectedAssetId(INITIAL_PRESEEDS[0].id);
      localStorage.setItem("gestor_portafolio_assets", JSON.stringify(INITIAL_PRESEEDS));
      triggerNotification("Se restablecieron los datos de ejemplo con éxito.");
    }
  };

  // Calculations for Portfolio stats
  const totalInvestment = holdings.reduce((acc, curr) => acc + (curr.buyPrice * curr.quantity), 0);
  const totalCurrentValue = holdings.reduce((acc, curr) => acc + (curr.currentPrice * curr.quantity), 0);
  const totalGainLoss = totalCurrentValue - totalInvestment;
  const totalGainLossPercentage = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 105 - 5 : 0; // Small adjust, let's keep exact math
  const actualGainLossPct = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;

  const portfolioSummary: PortfolioSummary = {
    totalInvestment,
    totalCurrentValue,
    totalGainLoss,
    totalGainLossPercentage: actualGainLossPct,
    numberOfAssets: holdings.length
  };

  const activeHolding = holdings.find(h => h.id === selectedAssetId) || null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      
      {/* Top Banner Warning Context - Minimalist Style */}
      <div className="bg-slate-900 px-4 py-2 text-center text-[11px] font-bold tracking-widest text-slate-300 uppercase shadow-xs flex items-center justify-center gap-1.5 flex-wrap">
        <BrainCircuit className="h-4 w-4 text-blue-400" />
        <span>Rastreador de Portafolio Largo Placista & Asistente Técnico Automatizado</span>
        <span className="hidden sm:inline">•</span>
        <span className="text-slate-400">Optimizado por Volatilidad Diaria (ATR)</span>
      </div>

      {/* Main Clean Minimalism Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg select-none">
              S
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                STRATEGA <span className="text-slate-400 font-normal">Finance</span>
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Portafolio & Gestión de Riesgo Inteligente</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="sync-all-button"
              onClick={handleSyncAll}
              disabled={isGlobalSyncing || holdings.length === 0}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGlobalSyncing ? "animate-spin" : ""}`} />
              <span>{isGlobalSyncing ? "Actualizando con IA..." : "Sincronizar Todo"}</span>
            </button>

            <button
              id="reset-simulation-button"
              onClick={handleResetPreseeds}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-slate-200 shadow-xs"
            >
              Reiniciar Simulación
            </button>
          </div>
        </div>
      </nav>

      {/* Layout Core Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">

        {/* Global Floating Notifications */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-1.5 animate-fadeIn shadow-xs">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl text-xs flex items-start gap-1.5 animate-fadeIn shadow-xs leading-relaxed">
            <div className="w-2 h-2 bg-rose-500 rounded-full mt-1.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Portoflio Statistics Panel */}
        <PortfolioStats 
          holdings={holdings} 
          summary={portfolioSummary} 
        />

        {/* Dynamic Dual-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDEBAR: Register Assets + Assets Checklist (Cols: 4/12) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Form */}
            <AddAssetForm 
              onAddAsset={handleAddAsset} 
              isLoading={isFormLoading} 
            />

            {/* Holdings section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400">Tus Activos Registrados</h3>
                <span className="text-xs font-mono font-bold text-slate-500">Total: {holdings.length}</span>
              </div>

              {holdings.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-xs leading-relaxed">
                  No tienes activos registrados. Agrega uno arriba indicando símbolo, costo de compra y cantidad para activar la calculadora.
                </div>
              ) : (
                <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                  {holdings.map((holding) => (
                    <AssetCard
                      key={holding.id}
                      holding={holding}
                      isSelected={holding.id === selectedAssetId}
                      onSelect={() => setSelectedAssetId(holding.id)}
                      onRefresh={handleRefreshAsset}
                      onDelete={handleDeleteAsset}
                      onUpdatePosition={handleUpdateAsset}
                      isActionLoading={isGlobalSyncing}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SIDEBAR: Intelligent Risk Management Board & Investment Simulator (Cols: 8/12) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Dashboard details of Take Profit and Stop Loss analysis */}
            <RiskAnalysisDashboard 
              holding={activeHolding} 
              isLoading={isFormLoading} 
            />

            {/* Strategic Reallocation Calculator Panel (Tendered compound analyzer) */}
            <ReinvestmentCalculator 
              holdings={holdings} 
              selectedHolding={activeHolding}
              onRegisterSale={handleRegisterSale}
            />

          </div>

        </div>

        {/* Historial de Operaciones de invertirOnline */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 text-slate-800 rounded">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Historial de Operaciones (invertirOnline)</h3>
                <p className="text-[11px] text-slate-400">Libro contable de compras y ventas de acciones argentinas y CEDEARs.</p>
              </div>
            </div>
            {transactions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("¿Estás seguro de que deseas eliminar todo el historial de operaciones registrado?")) {
                    saveTransactions([]);
                  }
                }}
                className="text-[10px] text-red-600 hover:text-red-700 font-bold border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded transition-colors cursor-pointer"
              >
                Limpiar Historial
              </button>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              No se registran operaciones en el historial. Las compras se guardan al añadir activos y las ventas se registran haciendo clic en "Registrar Operación" dentro del simulador.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Fecha y Hora</th>
                    <th className="py-2.5 px-3">Instrumento</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3 text-right">Cant. Acciones</th>
                    <th className="py-2.5 px-3 text-right font-mono">Precio Unitario</th>
                    <th className="py-2.5 px-3 text-right font-mono">Total Operado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{tx.date}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{tx.ticker}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === "COMPRA" 
                            ? "bg-green-50 text-green-700 border border-green-200/60" 
                            : "bg-orange-50 text-orange-700 border border-orange-200/60"
                        }`}>
                          {tx.type} {tx.isPartial ? "(Parcial)" : ""}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-mono">{formatNumberAr(tx.shares, 4)}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">{formatARS(tx.price)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatARS(tx.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Corporate Footnotes and Safe Handling Instructions */}
      <footer className="bg-white border-t border-slate-100 py-6 px-8 mt-12 text-center text-xs text-slate-400 space-y-2">
        <p className="max-w-xl mx-auto leading-relaxed">
          <b>Calculadora de Gestión en Renta Variable:</b> Las estimaciones son informadas de forma automática mediante algoritmos de volatilidad histórica y el rango verdadero promedio (ATR) asistido por modelos generativos. No representa una invitación de compra de valores. Opera siempre con prudencia de acuerdo a tu tolerancia de riesgo.
        </p>
        <p className="text-[10px] text-slate-300">
          Powered by DeepMind Google Gemini-3.5-Flash & Tailwind V4 • Local Browser Storage Sandbox Secure
        </p>
      </footer>

    </div>
  );
}
