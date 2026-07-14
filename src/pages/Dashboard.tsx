import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { Card, StatCard, ChangePct, Spinner, EmptyState, Badge } from "../components/ui";
import { formatCurrency, formatPct, formatTimeAgo } from "../lib/indicators";
import type { Portfolio } from "../types";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const { tickers, tickersLoading, loadTickers, holdings, getPortfolio, alerts, notifications } =
    useStore();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  useEffect(() => {
    loadTickers();
  }, []);

  useEffect(() => {
    if (holdings.length >= 0) {
      setPortfolioLoading(true);
      getPortfolio().then((p) => {
        setPortfolio(p);
        setPortfolioLoading(false);
      });
    }
  }, [holdings.length]);

  const topMovers = [...tickers]
    .sort((a, b) => Math.abs(b.change_24h_pct) - Math.abs(a.change_24h_pct))
    .slice(0, 5);

  const topGainers = tickers.filter((t) => t.change_24h_pct > 0).slice(0, 3);
  const topLosers = tickers.filter((t) => t.change_24h_pct < 0).slice(0, 3);

  const activeAlerts = alerts.filter((a) => a.is_active);
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Genel Bakış</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Portföy özeti, piyasa hareketleri ve son bildirimler
        </p>
      </div>

      {/* Portfolio stats */}
      {portfolioLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-neutral-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Toplam Portföy Değeri"
            value={formatCurrency(portfolio?.total_value ?? 0)}
            subValue={`${holdings.length} pozisyon`}
            trend="neutral"
            icon="M21 13.255A48.108 48.108 0 0112 12c-2.916 0-5.765.235-8.5.675M3 20.5v-3.379a1 1 0 01.75-.97l1.5-.376M3 13.255V8.5m0 4.755a48.108 48.108 0 018.5-.675c2.916 0 5.765.235 8.5.675M3 8.5l9-6 9 6"
          />
          <StatCard
            label="Toplam Maliyet"
            value={formatCurrency(portfolio?.total_cost_basis ?? 0)}
            subValue="Başlangıç yatırımı"
            trend="neutral"
            icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
          <StatCard
            label="Kâr/Zarar"
            value={formatCurrency(portfolio?.total_profit_loss_amount ?? 0)}
            subValue={formatPct(portfolio?.total_profit_loss_pct ?? 0)}
            trend={(portfolio?.total_profit_loss_amount ?? 0) >= 0 ? "up" : "down"}
            icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
          <StatCard
            label="Aktif Alarm"
            value={String(activeAlerts.length)}
            subValue={`${alerts.length} toplam alarm`}
            trend="neutral"
            icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top movers chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Piyasa Hareketleri</h2>
            <button
              onClick={() => navigate("/markets")}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Tümünü Gör →
            </button>
          </div>

          {tickersLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-3">
              {topMovers.map((t) => (
                <div
                  key={t.symbol}
                  onClick={() => navigate(`/asset/${t.symbol}`)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {t.image ? (
                      <img src={t.image} alt={t.symbol} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600">
                        {t.symbol.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-neutral-900">{t.symbol}</p>
                      <p className="text-xs text-neutral-500">{t.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-neutral-900">{formatCurrency(t.price)}</span>
                    <ChangePct value={t.change_24h_pct} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Gain/Loss summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Yükselen / Düşen</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-success-600 mb-2">EN ÇOK YÜKSELEN</p>
              {topGainers.length === 0 ? (
                <p className="text-sm text-neutral-400">Veri yok</p>
              ) : (
                topGainers.map((t) => (
                  <div key={t.symbol} className="flex items-center justify-between py-1.5">
                    <span className="text-sm font-medium text-neutral-700">{t.symbol}</span>
                    <ChangePct value={t.change_24h_pct} />
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-neutral-100 pt-3">
              <p className="text-xs font-medium text-error-600 mb-2">EN ÇOK DÜŞEN</p>
              {topLosers.length === 0 ? (
                <p className="text-sm text-neutral-400">Veri yok</p>
              ) : (
                topLosers.map((t) => (
                  <div key={t.symbol} className="flex items-center justify-between py-1.5">
                    <span className="text-sm font-medium text-neutral-700">{t.symbol}</span>
                    <ChangePct value={t.change_24h_pct} />
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Portfolio holdings preview + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Portföm</h2>
            <button
              onClick={() => navigate("/portfolio")}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Detaylar →
            </button>
          </div>
          {portfolioLoading ? (
            <div className="h-40 flex items-center justify-center">
              <Spinner />
            </div>
          ) : portfolio && portfolio.holdings.length > 0 ? (
            <div className="space-y-2">
              {portfolio.holdings.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  onClick={() => navigate(`/asset/${h.symbol}`)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
                      {h.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{h.symbol}</p>
                      <p className="text-xs text-neutral-500">{h.quantity} adet</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-neutral-900">{formatCurrency(h.current_value)}</p>
                    <ChangePct value={h.profit_loss_pct} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="M21 13.255A48.108 48.108 0 0112 12c-2.916 0-5.765.235-8.5.675M3 20.5v-3.379a1 1 0 01.75-.97l1.5-.376M3 13.255V8.5m0 4.755a48.108 48.108 0 018.5-.675c2.916 0 5.765.235 8.5.675M3 8.5l9-6 9 6"
              title="Portfönüz boş"
              description="İlk pozisyonunuzu ekleyerek başlayın"
              action={
                <button onClick={() => navigate("/portfolio")} className="btn-primary">
                  + Pozisyon Ekle
                </button>
              }
            />
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Bildirimler</h2>
            {notifications.length > 0 && (
              <button
                onClick={() => navigate("/alerts")}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Tümü →
              </button>
            )}
          </div>
          {recentNotifications.length === 0 ? (
            <EmptyState
              icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"
              title="Bildirim yok"
              description="Alarm tetiklendiğinde burada görünür"
            />
          ) : (
            <div className="space-y-2">
              {recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg border ${
                    n.is_read ? "border-neutral-100 bg-white" : "border-primary-100 bg-primary-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-800">{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{n.message}</p>
                  <p className="text-xs text-neutral-400 mt-1">{formatTimeAgo(n.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
