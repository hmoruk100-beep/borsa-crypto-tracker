// Market Data
export interface Ticker {
  symbol: string;
  name: string;
  price: number;
  change_24h_pct: number;
  high_24h?: number;
  low_24h?: number;
  volume_24h?: number;
  source: string;
  asset_type: string;
}

// Portfolio
export interface Holding {
  id: number;
  symbol: string;
  asset_type: string;
  quantity: number;
  average_buy_price: number;
  current_price: number;
  currency: string;
  cost_basis: number;
  current_value: number;
  profit_loss_amount: number;
  profit_loss_pct: number;
  value_in_base_currency: number;
  cost_in_base_currency: number;
  allocation_pct: number;
  first_buy_date: string;
}

export interface Portfolio {
  base_currency: string;
  total_value: number;
  total_cost_basis: number;
  total_profit_loss_amount: number;
  total_profit_loss_pct: number;
  holdings: Holding[];
}

// Technical Analysis
export interface TechnicalAnalysis {
  symbol: string;
  asset_type: string;
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
      sma_200?: number;
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

// AI Analysis
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
  ai_generated: boolean;
  provider?: string;
}

// Portfolio Analysis
export interface PortfolioAnalysis {
  portfolio: Portfolio;
  risk: {
    risk_level: string;
    weighted_score: number;
    per_holding: Array<{
      symbol: string;
      allocation_pct: number;
      technical_risk: string;
      ai_risk: string;
    }>;
  };
  warnings: string[];
  ai_view: {
    overall_view: string;
    summary_narrative: string;
    key_opportunities: string[];
    key_risks: string[];
    ai_confidence: number;
    disclaimer: string;
    ai_generated: boolean;
  };
  generated_at: string;
}

// News
export interface NewsItem {
  id: number;
  title: string;
  source?: string;
  url?: string;
  published_at?: string;
  category: string;
  sentiment_label: string;
  sentiment_score: number;
  importance_score: number;
}

export interface NewsSentimentSummary {
  symbol: string;
  period_days: number;
  total_news_count: number;
  average_sentiment_score: number;
  overall_label: string;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  most_important_recent: NewsItem[];
}

// Alerts
export interface Alert {
  id: number;
  asset_id: number;
  symbol: string;
  alert_type: string;
  threshold_value: number;
  interval: string;
  is_active: boolean;
  cooldown_minutes?: number;
  created_at: string;
  last_triggered_at?: string;
}

export interface Notification {
  id: number;
  alert_id: number;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}
