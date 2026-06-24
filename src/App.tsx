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
  FileSpreadsheet,
  Search,
  Database,
  Download,
  Upload
} from "lucide-react";
import PortfolioStats from "./components/PortfolioStats";
import AddAssetForm from "./components/AddAssetForm";
import AssetCard from "./components/AssetCard";
import RiskAnalysisDashboard from "./components/RiskAnalysisDashboard";
import ReinvestmentCalculator from "./components/ReinvestmentCalculator";
import BrokerCashBalance from "./components/BrokerCashBalance";
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

// Helper to parse strings like "23/6/2026 12:30" or general localized strings
const parseTransactionDateStr = (dateStr: string): Date => {
  try {
    const [dStr, tStr] = dateStr.split(" ");
    if (!dStr) return new Date();
    
    const dParts = dStr.split("/");
    const day = parseInt(dParts[0], 10);
    const month = parseInt(dParts[1], 10) - 1; // 0-indexed
    const year = parseInt(dParts[2], 10);
    
    let hours = 0;
    let minutes = 0;
    if (tStr) {
      const tParts = tStr.split(":");
      hours = parseInt(tParts[0], 10) || 0;
      minutes = parseInt(tParts[1], 10) || 0;
      const isPM = dateStr.toLowerCase().includes("p.") || dateStr.toLowerCase().includes("pm");
      const isAM = dateStr.toLowerCase().includes("a.") || dateStr.toLowerCase().includes("am");
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    }
    
    const d = new Date(year, month, day, hours, minutes);
    if (!isNaN(d.getTime())) return d;
  } catch (e) {
    console.warn("Unable to parse transaction date:", dateStr, e);
  }
  return new Date(); // fallback
};

// Helper to get raw Monday date of the week representing a given date
const getStartOfWeekMonday = (d: Date): Date => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  // Sunday is 0, Monday is 1, etc.
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

// Helper to group transactions into weekly blocks
interface WeeklyGroup {
  weekStart: Date;
  weekLabel: string;
  transactions: Transaction[];
}

const groupTransactionsByWeek = (txs: Transaction[]): WeeklyGroup[] => {
  const groupsMap = new Map<string, { weekStart: Date; transactions: Transaction[] }>();
  
  txs.forEach(tx => {
    const d = parseTransactionDateStr(tx.date);
    const monday = getStartOfWeekMonday(d);
    
    const yr = monday.getFullYear();
    const mo = String(monday.getMonth() + 1).padStart(2, '0');
    const dy = String(monday.getDate()).padStart(2, '0');
    const key = `${yr}-${mo}-${dy}`;
    
    if (!groupsMap.has(key)) {
      groupsMap.set(key, { weekStart: monday, transactions: [] });
    }
    groupsMap.get(key)!.transactions.push(tx);
  });
  
  const sortedKeys = Array.from(groupsMap.keys()).sort((a, b) => b.localeCompare(a));
  
  return sortedKeys.map(key => {
    const { weekStart, transactions } = groupsMap.get(key)!;
    const sunday = new Date(weekStart);
    sunday.setDate(weekStart.getDate() + 6);
    
    const fmt = (date: Date) => {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}/${date.getFullYear()}`;
    };
    
    return {
      weekStart,
      weekLabel: `Semana del ${fmt(weekStart)} al ${fmt(sunday)}`,
      transactions
    };
  });
};

export default function App() {
  const [holdings, setHoldings] = useState<StockHolding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(0);
  const [isGlobalSyncing, setIsGlobalSyncing] = useState<boolean>(false);
  const [isFormLoading, setIsFormLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [cclRate, setCclRate] = useState<number>(1265);
  const [cclUpdatedTime, setCclUpdatedTime] = useState<string>("");
  const [cashARS, setCashARS] = useState<number>(0);
  const [cashUSD, setCashUSD] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>( "");
  const [backupJsonText, setBackupJsonText] = useState<string>("");
  const [showBackupPanel, setShowBackupPanel] = useState<boolean>(false);

  const fetchCclRate = async () => {
    try {
      const res = await fetch("/api/market/ccl");
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.venta === "number") {
          setCclRate(data.venta);
          if (data.fechaActualizacion) {
            try {
              const dateObj = new Date(data.fechaActualizacion);
              setCclUpdatedTime(dateObj.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
            } catch (e) {
              setCclUpdatedTime("");
            }
          }
        }
      }
    } catch (err) {
      console.warn("Error fetching CCL rate in frontend:", err);
    }
  };

  // Load from local storage or preseed
  useEffect(() => {
    fetchCclRate();
    const saved = localStorage.getItem("gestor_portafolio_assets");
    const savedTransactions = localStorage.getItem("gestor_portafolio_transactions");
    const savedCashARS = localStorage.getItem("gestor_portafolio_cash_ars");
    const savedCashUSD = localStorage.getItem("gestor_portafolio_cash_usd");

    if (savedCashARS !== null) {
      setCashARS(Number(savedCashARS) || 0);
    }
    if (savedCashUSD !== null) {
      setCashUSD(Number(savedCashUSD) || 0);
    }
    
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

  const handleUpdateCash = (ars: number, usd: number) => {
    setCashARS(ars);
    setCashUSD(usd);
    localStorage.setItem("gestor_portafolio_cash_ars", ars.toString());
    localStorage.setItem("gestor_portafolio_cash_usd", usd.toString());
    triggerNotification("Saldos líquidos en el broker actualizados correctamente.");
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
    if (holdings.length === 0) {
      setIsGlobalSyncing(true);
      await fetchCclRate();
      setIsGlobalSyncing(false);
      triggerNotification("Cotización del dólar CCL actualizada con éxito.");
      return;
    }
    setIsGlobalSyncing(true);
    setErrorMessage("");
    
    // Concurrently fetch CCL rate or first update it
    await fetchCclRate();
    
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

  // Export entire portfolio data to a JSON download
  const handleExportPortfolio = () => {
    try {
      const backupData = {
        assets: holdings,
        transactions: transactions,
        cashARS: cashARS,
        cashUSD: cashUSD,
        version: "1.0",
        timestamp: new Date().toISOString()
      };
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `respaldo_portafolio_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerNotification("¡Portafolio exportado como archivo JSON con éxito!");
    } catch (err: any) {
      console.error("Error al exportar:", err);
      triggerNotification("Error al generar el archivo de exportación.", true);
    }
  };

  // Import portfolio data from raw JSON
  const handleImportPortfolio = (jsonData: string) => {
    try {
      if (!jsonData.trim()) {
        triggerNotification("Por favor ingresa o pega el texto de respaldo JSON.", true);
        return;
      }
      const parsed = JSON.parse(jsonData);
      if (!parsed || typeof parsed !== "object") {
        throw new Error("El archivo no tiene un formato de objeto válido.");
      }

      // Restore assets
      if (parsed.assets && Array.isArray(parsed.assets)) {
        setHoldings(parsed.assets);
        localStorage.setItem("gestor_portafolio_assets", JSON.stringify(parsed.assets));
        if (parsed.assets.length > 0) {
          setSelectedAssetId(parsed.assets[0].id);
        } else {
          setSelectedAssetId("");
        }
      }

      // Restore transactions
      if (parsed.transactions && Array.isArray(parsed.transactions)) {
        setTransactions(parsed.transactions);
        localStorage.setItem("gestor_portafolio_transactions", JSON.stringify(parsed.transactions));
      }

      // Restore cash
      if (parsed.cashARS !== undefined) {
        const ars = Number(parsed.cashARS) || 0;
        setCashARS(ars);
        localStorage.setItem("gestor_portafolio_cash_ars", ars.toString());
      }
      if (parsed.cashUSD !== undefined) {
        const usd = Number(parsed.cashUSD) || 0;
        setCashUSD(usd);
        localStorage.setItem("gestor_portafolio_cash_usd", usd.toString());
      }

      triggerNotification("¡Portafolio importado y restaurado correctamente!");
      setBackupJsonText("");
      setShowBackupPanel(false);
    } catch (err: any) {
      console.error("Error al importar:", err);
      triggerNotification("Error al procesar el respaldo: " + (err.message || "Formato inválido"), true);
    }
  };

  // Calculations for Portfolio stats
  const totalInvestment = holdings.reduce((acc, curr) => acc + (curr.buyPrice * curr.quantity), 0);
  const totalCurrentValue = holdings.reduce((acc, curr) => acc + (curr.currentPrice * curr.quantity), 0);
  const totalGainLoss = totalCurrentValue - totalInvestment;
  const actualGainLossPct = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;

  const totalCashValueARS = cashARS + (cashUSD * cclRate);
  const totalCombinedValueARS = totalCurrentValue + totalCashValueARS;

  const portfolioSummary: PortfolioSummary = {
    totalInvestment,
    totalCurrentValue,
    totalGainLoss,
    totalGainLossPercentage: actualGainLossPct,
    numberOfAssets: holdings.length,
    cashARS,
    cashUSD,
    totalCashValueARS,
    totalCombinedValueARS,
  };

  const activeHolding = holdings.find(h => h.id === selectedAssetId) || null;

  // Filter holdings based on search query
  const filteredHoldings = holdings.filter(holding => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      holding.ticker.toLowerCase().includes(query) ||
      (holding.name && holding.name.toLowerCase().includes(query))
    );
  });

  // Group and paginate transactions by week
  const weeklyGroups = groupTransactionsByWeek(transactions);
  const activeWeekIndex = Math.min(Math.max(0, currentWeekIndex), Math.max(0, weeklyGroups.length - 1));
  const activeWeeklyGroup = weeklyGroups[activeWeekIndex] || null;
  const activeTransactionsOnWeek = activeWeeklyGroup ? activeWeeklyGroup.transactions : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      
      {/* Main Clean Minimalism Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg select-none">
              S
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                Smart <span className="text-slate-400 font-normal">Asistent</span>
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Portafolio & Gestión de Riesgo Inteligente</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Dólar CCL Live Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200" title="Cotización de referencia del Dólar Cable / CCL en Argentina">
              <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest leading-none">Dólar CCL</span>
              <span className="text-sm font-bold font-mono text-slate-800 leading-none">${cclRate.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
              <span className="text-[9px] text-slate-400 font-medium">ARS</span>
              {cclUpdatedTime && (
                <span className="text-[9px] text-slate-400 border-l border-slate-200 pl-1.5 leading-none">
                  {cclUpdatedTime}
                </span>
              )}
            </div>

            <button
               onClick={() => setShowBackupPanel(!showBackupPanel)}
               className={`px-3 py-2 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer border ${
                 showBackupPanel 
                   ? "bg-slate-100 border-slate-300 text-slate-800 font-bold" 
                   : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
               }`}
               title="Exportar o Importar datos para transferir tu portafolio entre desarrollo y producción"
             >
              <Database className="h-3.5 w-3.5 text-slate-500" />
              <span>Copias de Respaldo</span>
            </button>

            <button
               id="sync-all-button"
               onClick={handleSyncAll}
               className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
             >
              <RefreshCw className={`h-3.5 w-3.5 ${isGlobalSyncing ? "animate-spin" : ""}`} />
              <span>{isGlobalSyncing ? "Actualizando con IA..." : "Sincronizar Todo"}</span>
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

        {/* Respaldo / Transferencia Panel */}
        {showBackupPanel && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fadeIn space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Database className="h-4 w-4 text-slate-700" />
                  Copia de Seguridad y Transferencia de Portafolio
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Transfiere de forma segura tus activos, transacciones y balances cargados entre la versión de <b>Desarrollo</b> y la versión <b>Publicada</b>, o guarda un respaldo de seguridad en tu computadora.
                </p>
              </div>
              <button 
                onClick={() => setShowBackupPanel(false)}
                className="text-slate-400 hover:text-slate-650 text-xs font-bold font-mono p-1 hover:bg-slate-50 rounded"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Export Column */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-750 uppercase tracking-widest flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5 text-slate-600" />
                  1. Exportar Datos
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Descarga un archivo <code>.json</code> con toda la información cargada en esta ventana (activos, efectivo y transacciones) para llevarla a otra versión.
                </p>
                
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleExportPortfolio}
                    className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Descargar Archivo JSON</span>
                  </button>

                  <button
                    onClick={() => {
                      const backupObj = {
                        assets: holdings,
                        transactions: transactions,
                        cashARS: cashARS,
                        cashUSD: cashUSD,
                        version: "1.0"
                      };
                      navigator.clipboard.writeText(JSON.stringify(backupObj, null, 2));
                      triggerNotification("¡Texto de respaldo copiado al portapapeles con éxito!");
                    }}
                    className="py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-750 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                    title="Copiar texto JSON al portapapeles"
                  >
                    Copiar Texto
                  </button>
                </div>
              </div>

              {/* Import Column */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-750 uppercase tracking-widest flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5 text-slate-600" />
                  2. Importar Datos
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pega el texto JSON de respaldo o selecciona un archivo para restaurar tu portafolio completo en esta ventana.
                </p>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    placeholder='Pega aquí el código JSON del portafolio...'
                    value={backupJsonText}
                    onChange={(e) => setBackupJsonText(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleImportPortfolio(backupJsonText)}
                      className="flex-1 py-1.5 px-3 bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Restaurar Portafolio</span>
                    </button>

                    {/* File upload input as alternative */}
                    <label className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5">
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const text = event.target?.result as string;
                              if (text) {
                                handleImportPortfolio(text);
                              }
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                      <span>Cargar Archivo</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3.5 flex flex-wrap items-center justify-between gap-4">
              <span className="text-[10px] text-slate-400 italic">
                ⚠️ Al importar se sobrescribirá cualquier activo, efectivo o historial cargados previamente en esta ventana.
              </span>
              <button
                onClick={handleResetPreseeds}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
              >
                Reiniciar a valores por defecto
              </button>
            </div>
          </div>
        )}

        {/* Portoflio Statistics Panel */}
        <PortfolioStats 
          holdings={holdings} 
          summary={portfolioSummary} 
          cclRate={cclRate}
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

              {holdings.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar activo (Ej: GGAL, AAPL)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-450 focus:border-slate-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer"
                    >
                      &times;
                    </button>
                  )}
                </div>
              )}

              {holdings.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-xs leading-relaxed">
                  No tienes activos registrados. Agrega uno arriba indicando símbolo, costo de compra y cantidad para activar la calculadora.
                </div>
              ) : filteredHoldings.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-xs italic">
                  No se encontraron activos que coincidan con la búsqueda.
                </div>
              ) : (
                <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                  {filteredHoldings.map((holding) => (
                    <AssetCard
                      key={holding.id}
                      holding={holding}
                      isSelected={holding.id === selectedAssetId}
                      onSelect={() => setSelectedAssetId(holding.id)}
                      onRefresh={handleRefreshAsset}
                      onDelete={handleDeleteAsset}
                      onUpdatePosition={handleUpdateAsset}
                      isActionLoading={isGlobalSyncing}
                      cclRate={cclRate}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Broker Cash Balance */}
            <BrokerCashBalance 
              cashARS={cashARS}
              cashUSD={cashUSD}
              cclRate={cclRate}
              onUpdateCash={handleUpdateCash}
            />

          </div>

          {/* RIGHT SIDEBAR: Intelligent Risk Management Board & Investment Simulator (Cols: 8/12) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Dashboard details of Take Profit and Stop Loss analysis */}
            <RiskAnalysisDashboard 
              holding={activeHolding} 
              isLoading={isFormLoading} 
              cclRate={cclRate}
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
            <div className="space-y-4">
              {weeklyGroups.length > 0 && (
                <div className="flex items-center justify-between gap-4 bg-slate-50/80 p-3 rounded-lg border border-slate-200/60 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title="Semana anterior (más antigua)"
                      disabled={activeWeekIndex >= weeklyGroups.length - 1}
                      onClick={() => setCurrentWeekIndex(activeWeekIndex + 1)}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                    >
                      ◀ Anterior (Anual / Pasada)
                    </button>
                    <button
                      type="button"
                      title="Semana siguiente (más reciente)"
                      disabled={activeWeekIndex <= 0}
                      onClick={() => setCurrentWeekIndex(activeWeekIndex - 1)}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                    >
                      Siguiente (Reciente) ▶
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-[11.5px] font-bold text-slate-800 font-mono bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs inline-block">
                      {activeWeeklyGroup?.weekLabel}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-bold tracking-tight mt-1">
                      Mostrando {activeTransactionsOnWeek.length} operaciones • Semana {activeWeekIndex + 1} de {weeklyGroups.length} del historial
                    </span>
                  </div>
                </div>
              )}

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
                    {activeTransactionsOnWeek.map((tx) => (
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
