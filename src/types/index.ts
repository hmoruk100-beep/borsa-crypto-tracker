export interface Ticker {
  symbol: string;
  name: string;
  price: number;
  change_24h_pct: number;
  high_24h?: number;
  low_24h?: number;
  volume_24h?: number;
  market_cap?: number;
  source: string;
  asset_type: string;
  image?: string;
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string | null;
  asset_type: string;
  quantity: number;
  average_buy_price: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioHolding extends Holding {
  current_price: number;
  current_name: string;
  cost_basis: number;
  current_value: number;
  profit_loss_amount: number;
  profit_loss_pct: number;
  allocation_pct: number;
}

export interface Portfolio {
  total_value: number;
  total_cost_basis: number;
  total_profit_loss_amount: number;
  total_profit_loss_pct: number;
  holdings: PortfolioHolding[];
}

export interface TechnicalAnalysis {
  symbol: string;
  interval: string;
  generated_at: string;
  price: number;
  technical_score: number;
  trend: {
    label: string;
    score: number;
    detail: string;
    moving_averages: {
      sma_20?: number;
      sma_50?: number;
      ema_12?: number;
      ema_26?: number;
    };
  };
  momentum: {
    label: string;
    score: number;
    rsi_14: number;
    macd: {
      macd_line: number;
      signal_line: number;
      histogram: number;
    };
  };
  volume: {
    label: string;
    score: number;
    volume_change_pct: number;
    is_abnormal: boolean;
  };
  risk_level: string;
  summary: string;
}

export interface AIAnalysis {
  symbol: string;
  asset_type: string;
  interval: string;
  generated_at: string;
  technical_view: string;
  positive_factors: string[];
  negative_factors: string[];
  scenarios: {
    bullish_probability: number;
    neutral_probability: number;
    bearish_probability: number;
  };
  risk_level: string;
  ai_confidence: number;
  narrative: string;
  disclaimer: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source?: string;
  url?: string;
  published_at?: string;
  category: string;
  sentiment_label: string;
  sentiment_score: number;
  importance_score: number;
}

export interface Alert {
  id: string;
  symbol: string;
  asset_type: string;
  alert_type: string;
  threshold_value: number;
  interval: string;
  is_active: boolean;
  cooldown_minutes: number;
  created_at: string;
  last_triggered_at?: string | null;
}

export interface Notification {
  id: string;
  alert_id: string | null;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}
