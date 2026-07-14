import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, ChangePct, Spinner, Badge, EmptyState } from "../components/ui";
import { formatCurrency, formatNumber, formatPct, formatTimeAgo } from "../lib/indicators";
import {
  getTechnicalAnalysis,
  getAIAnalysis,
  getNewsForSymbol,
  getPriceHistory,
  symbolToCoinId,
} from "../lib/coingecko";
import type { TechnicalAnalysis, AIAnalysis, NewsItem, PricePoint } from "../types";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Cell as BarCell,
} from "recharts";

const TIME_RANGES = [
  { label: "1G", days: 1 },
  { label: "7G", days: 7 },
  { label: "30G", days: 30 },
  { label: "90G", days: 90 },
  { label: "1Y", days: 365 },
];

export default function AssetDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [selectedRange, setSelectedRange] = useState(7);
  const [ta, setTa] = useState<TechnicalAnalysis | null>(null);
  const [ai, setAi] = useState<AIAnalysis | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [taLoading, setTaLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setTaLoading(true);

    const coinId = symbolToCoinId(symbol);

    getPriceHistory(coinId, selectedRange).then((prices) => {
      setPriceHistory(prices);
      setLoading(false);
    });

    getNewsForSymbol(symbol).then(setNews);

    getTechnicalAnalysis(symbol, "1d").then(async (analysis) => {
      setTa(analysis);
      const newsData = await getNewsForSymbol(symbol);
      const aiAnalysis = await getAIAnalysis(symbol, analysis, newsData);
      setAi(aiAnalysis);
      setTaLoading(false);
    });
  }, [symbol, selectedRange]);

  const chartData = priceHistory.map((p) => ({
    time: new Date(p.timestamp).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }),
    price: p.price,
  }));

  const currentPrice = priceHistory[priceHistory.length - 1]?.price ?? 0;
  const firstPrice = priceHistory[0]?.price ?? currentPrice;
  const rangeChange = firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;

  const scenarioData = ai
    ? [
        { name: "Boğa", value: ai.scenarios.bullish_probability, color: "#22c55e" },
        { name: "Nötr", value: ai.scenarios.neutral_probability, color: "#94a3b8" },
        { name: "Ayı", value: ai.scenarios.bearish_probability, color: "#ef4444" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold">
            {symbol?.slice(0, 2)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{symbol}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-lg font-semibold text-neutral-700">{formatCurrency(currentPrice)}</span>
              <ChangePct value={rangeChange} />
            </div>
          </div>
        </div>
      </div>

      {/* Price chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Fiyat Grafiği</h2>
          <div className="flex gap-1">
            {TIME_RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setSelectedRange(r.days)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  selectedRange === r.days
                    ? "bg-primary-600 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                interval={Math.max(0, Math.floor(chartData.length / 8))}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(v) => formatCurrency(v)}
              />
              <ChartTooltip
                formatter={(value: number) => [formatCurrency(value), "Fiyat"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technical Analysis */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Teknik Analiz</h2>
          {taLoading || !ta ? (
            <div className="h-48 flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Score gauge */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50">
                <div>
                  <p className="text-sm text-neutral-500">Teknik Skor</p>
                  <p className={`text-3xl font-bold ${
                    ta.technical_score > 20 ? "text-success-600" :
                    ta.technical_score < -20 ? "text-error-600" : "text-neutral-600"
                  }`}>
                    {ta.technical_score}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant={ta.trend.label === "Yükseliş" ? "success" : ta.trend.label === "Düşüş" ? "error" : "neutral"}>
                    Trend: {ta.trend.label}
                  </Badge>
                  <Badge variant={ta.momentum.label === "Güçlü" ? "success" : ta.momentum.label === "Zayıf" ? "error" : "neutral"}>
                    Momentum: {ta.momentum.label}
                  </Badge>
                </div>
              </div>

              {/* Indicators */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-neutral-100">
                  <p className="text-xs text-neutral-500">RSI (14)</p>
                  <p className={`text-lg font-semibold ${
                    ta.momentum.rsi_14 > 70 ? "text-error-600" :
                    ta.momentum.rsi_14 < 30 ? "text-success-600" : "text-neutral-700"
                  }`}>
                    {ta.momentum.rsi_14.toFixed(1)}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-neutral-100">
                  <p className="text-xs text-neutral-500">MACD</p>
                  <p className={`text-lg font-semibold ${
                    ta.momentum.macd.histogram > 0 ? "text-success-600" : "text-error-600"
                  }`}>
                    {ta.momentum.macd.histogram > 0 ? "+" : ""}{ta.momentum.macd.histogram.toFixed(4)}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-neutral-100">
                  <p className="text-xs text-neutral-500">SMA 20</p>
                  <p className="text-lg font-semibold text-neutral-700">
                    {ta.trend.moving_averages.sma_20 ? formatCurrency(ta.trend.moving_averages.sma_20) : "-"}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-neutral-100">
                  <p className="text-xs text-neutral-500">SMA 50</p>
                  <p className="text-lg font-semibold text-neutral-700">
                    {ta.trend.moving_averages.sma_50 ? formatCurrency(ta.trend.moving_averages.sma_50) : "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">Risk Seviyesi:</span>
                <Badge variant={
                  ta.risk_level === "Yüksek" ? "error" :
                  ta.risk_level === "Orta" ? "warning" : "success"
                }>
                  {ta.risk_level}
                </Badge>
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed">{ta.summary}</p>
            </div>
          )}
        </Card>

        {/* AI Analysis */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">AI Analiz</h2>
          {taLoading || !ai ? (
            <div className="h-48 flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scenario probabilities */}
              <div>
                <p className="text-sm text-neutral-500 mb-2">Senaryo Olasılıkları</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={scenarioData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: "#475569" }} axisLine={false} tickLine={false} width={50} />
                    <ChartTooltip
                      formatter={(value: number) => [`${value}%`, "Olasılık"]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {scenarioData.map((entry, i) => (
                        <BarCell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Factors */}
              <div className="grid grid-cols-1 gap-3">
                {ai.positive_factors.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-success-600 mb-1.5">POZİTİF FAKTÖRLER</p>
                    <ul className="space-y-1">
                      {ai.positive_factors.map((f, i) => (
                        <li key={i} className="text-sm text-neutral-700 flex items-start gap-2">
                          <span className="text-success-500 mt-0.5">+</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {ai.negative_factors.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-error-600 mb-1.5">NEGATİF FAKTÖRLER</p>
                    <ul className="space-y-1">
                      {ai.negative_factors.map((f, i) => (
                        <li key={i} className="text-sm text-neutral-700 flex items-start gap-2">
                          <span className="text-error-500 mt-0.5">-</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-primary-50 border border-primary-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-primary-700">AI Görüşü</span>
                  <Badge variant="info">Güven: {ai.ai_confidence}%</Badge>
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed">{ai.narrative}</p>
              </div>

              <p className="text-xs text-neutral-400 italic">{ai.disclaimer}</p>
            </div>
          )}
        </Card>
      </div>

      {/* News */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Haberler ve Sentiment</h2>
        {news.length === 0 ? (
          <EmptyState title="Haber bulunamadı" description="Bu varlık için henüz haber yok" />
        ) : (
          <div className="space-y-3">
            {news.map((n) => (
              <div
                key={n.id}
                className="flex items-start justify-between p-4 rounded-lg border border-neutral-100 hover:border-neutral-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 text-sm">{n.title}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {n.source && <span className="text-xs text-neutral-500">{n.source}</span>}
                    {n.published_at && <span className="text-xs text-neutral-400">{formatTimeAgo(n.published_at)}</span>}
                    <Badge variant="neutral">{n.category}</Badge>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-4">
                  <Badge variant={
                    n.sentiment_label === "positive" ? "success" :
                    n.sentiment_label === "negative" ? "error" : "neutral"
                  }>
                    {n.sentiment_label === "positive" ? "Pozitif" :
                     n.sentiment_label === "negative" ? "Negatif" : "Nötr"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${i < Math.round(n.importance_score) ? "text-accent-500" : "text-neutral-200"}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
