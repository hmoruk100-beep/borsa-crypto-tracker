import { useEffect, useState } from "react";
import { useStore } from "../store";
import { Card, Badge, Spinner, EmptyState } from "../components/ui";
import Modal from "../components/Modal";
import { formatTimeAgo, formatCurrency } from "../lib/indicators";

const ALERT_TYPES = [
  { value: "price_above", label: "Fiyat Üstüne Çıktığında", needsThreshold: true },
  { value: "price_below", label: "Fiyat Altına Düştüğünde", needsThreshold: true },
  { value: "rsi_overbought", label: "RSI Aşırı Alım (>70)", needsThreshold: false },
  { value: "rsi_oversold", label: "RSI Aşırı Satım (<30)", needsThreshold: false },
];

export default function AlertsPage() {
  const {
    alerts,
    notifications,
    tickers,
    loadAlerts,
    loadNotifications,
    loadTickers,
    addAlert,
    updateAlert,
    deleteAlert,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    symbol: "",
    asset_type: "crypto",
    alert_type: "price_above",
    threshold_value: "",
    interval: "1h",
    cooldown_minutes: "60",
  });
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"alerts" | "notifications">("alerts");

  useEffect(() => {
    loadAlerts();
    loadNotifications();
    loadTickers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addAlert({
        symbol: form.symbol.toUpperCase().trim(),
        asset_type: form.asset_type,
        alert_type: form.alert_type,
        threshold_value: parseFloat(form.threshold_value) || 0,
        interval: form.interval,
        cooldown_minutes: parseInt(form.cooldown_minutes) || 60,
        is_active: true,
      });
      setModalOpen(false);
      setForm({ symbol: "", asset_type: "crypto", alert_type: "price_above", threshold_value: "", interval: "1h", cooldown_minutes: "60" });
    } catch (err) {
      alert("Hata: " + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await updateAlert(id, { is_active: !isActive });
    } catch (err) {
      alert("Hata: " + (err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu alarmı silmek istediğinize emin misiniz?")) return;
    try {
      await deleteAlert(id);
    } catch (err) {
      alert("Hata: " + (err as Error).message);
    }
  };

  const alertTypeLabel = (type: string) =>
    ALERT_TYPES.find((t) => t.value === type)?.label ?? type;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Alarmlar</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Fiyat ve gösterge alarmları oluşturun, bildirimleri takip edin
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Alarm Ekle
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab("alerts")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === "alerts" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
          }`}
        >
          Alarmlar ({alerts.length})
        </button>
        <button
          onClick={() => setTab("notifications")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === "notifications" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
          }`}
        >
          Bildirimler ({notifications.length})
          {unreadCount > 0 && (
            <span className="ml-1.5 bg-error-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {tab === "alerts" ? (
        alerts.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"
              title="Alarm yok"
              description="Fiyat hareketleri için alarm oluşturun"
              action={
                <button onClick={() => setModalOpen(true)} className="btn-primary">
                  + Alarm Ekle
                </button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((a) => {
              const ticker = tickers.find((t) => t.symbol === a.symbol.toUpperCase());
              const isTriggered =
                a.alert_type === "price_above" && ticker && ticker.price >= a.threshold_value
                  ? true
                  : a.alert_type === "price_below" && ticker && ticker.price <= a.threshold_value
                  ? true
                  : false;

              return (
                <Card key={a.id} className={`p-5 ${isTriggered ? "border-accent-300 bg-accent-50/30" : ""}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-bold text-neutral-600">
                        {a.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">{a.symbol}</p>
                        <p className="text-xs text-neutral-500">{alertTypeLabel(a.alert_type)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isTriggered && <Badge variant="warning">Tetiklendi</Badge>}
                      <button
                        onClick={() => handleToggle(a.id, a.is_active)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          a.is_active ? "bg-primary-600" : "bg-neutral-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                            a.is_active ? "translate-x-5" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {a.alert_type === "price_above" || a.alert_type === "price_below" ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500">Eşik:</span>
                        <span className="font-medium text-neutral-800">{formatCurrency(a.threshold_value)}</span>
                      </div>
                    ) : null}
                    {ticker && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500">Güncel Fiyat:</span>
                        <span className="font-medium text-neutral-800">{formatCurrency(ticker.price)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Aralık:</span>
                      <span className="font-medium text-neutral-800">{a.interval}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Bekleme:</span>
                      <span className="font-medium text-neutral-800">{a.cooldown_minutes} dk</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                    <span className="text-xs text-neutral-400">{formatTimeAgo(a.created_at)}</span>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-sm text-error-600 hover:text-error-700 font-medium"
                    >
                      Sil
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        <Card className="overflow-hidden">
          {notifications.length === 0 ? (
            <EmptyState
              icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"
              title="Bildirim yok"
              description="Alarm tetiklendiğinde bildirimler burada görünür"
            />
          ) : (
            <>
              {unreadCount > 0 && (
                <div className="px-6 py-3 border-b border-neutral-100 bg-primary-50/50">
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Tümünü okundu işaretle
                  </button>
                </div>
              )}
              <div className="divide-y divide-neutral-100">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-4 hover:bg-neutral-50 transition-colors ${
                      !n.is_read ? "bg-primary-50/30" : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        n.severity === "error" ? "bg-error-500" :
                        n.severity === "warning" ? "bg-warning-500" : "bg-primary-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm ${n.is_read ? "font-medium text-neutral-700" : "font-semibold text-neutral-900"}`}>
                          {n.title}
                        </p>
                        <span className="text-xs text-neutral-400 flex-shrink-0">
                          {formatTimeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 mt-0.5">{n.message}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.is_read && (
                        <button
                          onClick={() => markNotificationRead(n.id)}
                          className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Okundu işaretle"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="p-1.5 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Add Alert Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Yeni Alarm"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">
              İptal
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
              {submitting ? "Oluşturuluyor..." : "Oluştur"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Sembol</label>
            <input
              type="text"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              placeholder="BTC, ETH, SOL..."
              className="input"
              required
              list="ticker-list"
            />
            <datalist id="ticker-list">
              {tickers.map((t) => (
                <option key={t.symbol} value={t.symbol}>{t.name}</option>
              ))}
            </datalist>
          </div>
          <div>
            <label className="label">Alarm Tipi</label>
            <select
              value={form.alert_type}
              onChange={(e) => setForm({ ...form, alert_type: e.target.value })}
              className="input"
            >
              {ALERT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {(form.alert_type === "price_above" || form.alert_type === "price_below") && (
            <div>
              <label className="label">Eşik Değeri (USD)</label>
              <input
                type="number"
                step="any"
                value={form.threshold_value}
                onChange={(e) => setForm({ ...form, threshold_value: e.target.value })}
                placeholder="65000"
                className="input"
                required
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kontrol Aralığı</label>
              <select
                value={form.interval}
                onChange={(e) => setForm({ ...form, interval: e.target.value })}
                className="input"
              >
                <option value="1m">1 Dakika</option>
                <option value="5m">5 Dakika</option>
                <option value="15m">15 Dakika</option>
                <option value="1h">1 Saat</option>
                <option value="4h">4 Saat</option>
                <option value="1d">1 Gün</option>
              </select>
            </div>
            <div>
              <label className="label">Bekleme (dk)</label>
              <input
                type="number"
                value={form.cooldown_minutes}
                onChange={(e) => setForm({ ...form, cooldown_minutes: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
