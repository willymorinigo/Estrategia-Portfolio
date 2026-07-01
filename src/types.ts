/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StockHolding {
  id: string;
  ticker: string;
  name: string;
  buyPrice: number;
  quantity: number;
  currentPrice: number;
  currentPriceSource: "manual" | "gemini" | "local-fallback";
  atr?: number; // Average True Range (Volatility indicator)
  volatilityPercentage?: number; // Historical annualized or recent volatility
  recommendedTP?: {
    conservative: number;
    moderate: number;
    aggressive: number;
    description: string;
  };
  recommendedSL?: {
    conservative: number;
    moderate: number;
    aggressive: number;
    description: string;
  };
  technicalAdvice?: string;
  allocationAdvice?: string; // What to do with the Take Profit capital
  lastUpdated?: string;
}

export interface PortfolioSummary {
  totalInvestment: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  numberOfAssets: number;
  cashARS?: number;
  cashUSD?: number;
  totalCashValueARS?: number;
  totalCombinedValueARS?: number;
}

export interface Transaction {
  id: string;
  date: string;
  ticker: string;
  type: "COMPRA" | "VENTA";
  shares: number;
  price: number;
  totalAmount: number;
  isPartial?: boolean;
}

export interface GeminiAnalysisResponse {
  ticker: string;
  name: string;
  currentPrice: number;
  atr: number;
  volatilityPercentage: number;
  recommendedTP: {
    conservative: number;
    moderate: number;
    aggressive: number;
    description: string;
  };
  recommendedSL: {
    conservative: number;
    moderate: number;
    aggressive: number;
    description: string;
  };
  technicalAdvice: string;
  allocationAdvice: string;
}
