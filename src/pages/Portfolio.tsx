import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { Card, ChangePct, Spinner, EmptyState, Badge } from "../components/ui";
import Modal from "../components/Modal";
import { formatCurrency, formatPct, formatNumber } from "../lib/indicators";
import type { Portfolio } from "../types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "recharts";

const PIE_COLORS = [
  "#2563eb", "#14b8a6", "#f59e0b", "#22c55e", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#84cc16",
];

export default function Portfolio() {
  const navigate = useNavigate();
  const { holdings, getPortfolio, addHolding, updateHolding, deleteHolding, loadHoldings, tickers, loadTickers } = useStore();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    symbol: "",
    name: "",
    asset_type: "crypto",
    quantity: "",
    average_buy_price: "",
    currency: "USD",
  });
  const [submitting, setSubmitting] = useState(false);

  const refreshPortfolio = () => {
    setLoading(true);
    getPortfolio().then((p) => {
      setPortfolio(p);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadHoldings();
    loadTickers();
  }, []);

  useEffect(() => {
    refreshPortfolio();
  }, [holdings.length]);

  const openAddModal = () => {
    setEditId(null);
    setForm({ symbol: "", name: "", asset_type: "crypto", quantity: "", average_buy_price: "", currency: "USD" });
    setModalOpen(true);
  };

  const openEditModal = (id: string) => {
    const h = holdings.find((x) => x.id === id);
    if (!h) return;
    setEditId(id);
    setForm({
      symbol: h.symbol,
      name: h.name ?? "",
      asset_type: h.asset_type,
      quantity: String(h.quantity),
      average_buy_price: String(h.average_buy_price),
      currency: h.currency,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        symbol: form.symbol.toUpperCase().trim(),
        name: form.name.trim() || null,
        asset_type: form.asset_type,
        quantity: parseFloat(form.quantity) || 0,
        average_buy_price: parseFloat(form.average_buy_price) || 0,
        currency: form.currency,
      };
      if (editId) {
        await updateHolding(editId, data);
      } else {
        await addHolding(data);
      }
      setModalOpen(false);
    } catch (err) {
      alert("Hata: " + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu pozisyonu silmek istediğinize emin misiniz?")) return;
    try {
      await deleteHolding(id);
    } catch (err) {
      alert("Hata: " + (err as Error).message);
    }
  };

  const pieData = portfolio?.holdings
    .filter((h) => h.current_value > 0)
    .map((h) => ({ name: h.symbol, value: h.current_value })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Portföyüm</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Pozisyonlarınızı yönetin ve performansı takip edin
          </p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Pozisyon Ekle
        </button>
      </div>

      {/* Portfolio summary */}
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : portfolio && portfolio.holdings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-sm text-neutral-500 font-medium">Toplam Değer</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {formatCurrency(portfolio.total_value)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-neutral-500 font-medium">Toplam Maliyet</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {formatCurrency(portfolio.total_cost_basis)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-neutral-500 font-medium">Kâr / Zarar</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p
                  className={`text-2xl font-bold ${
                    portfolio.total_profit_loss_amount >= 0 ? "text-success-600" : "text-error-600"
                  }`}
                >
                  {formatCurrency(portfolio.total_profit_loss_amount)}
                </p>
                <span
                  className={`text-sm font-medium ${
                    portfolio.total_profit_loss_pct >= 0 ? "text-success-600" : "text-error-600"
                  }`}
                >
                  ({formatPct(portfolio.total_profit_loss_pct)})
                </span>
              </div>
            </Card>
          </div>

          {/* Allocation chart + Holdings table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Dağılım</h2>
              {pieData.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {portfolio.holdings.map((h, i) => (
                      <div key={h.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-sm"
                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="font-medium text-neutral-700">{h.symbol}</span>
                        </div>
                        <span className="text-neutral-500">{h.allocation_pct.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-400">Dağılım verisi yok</p>
              )}
            </Card>

            <Card className="lg:col-span-2 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 text-xs text-neutral-500 font-medium">
                      <th className="text-left px-6 py-3">VARLIK</th>
                      <th className="text-right px-6 py-3">MİKTAR</th>
                      <th className="text-right px-6 py-3 hidden sm:table-cell">MALİYET</th>
                      <th className="text-right px-6 py-3">DEĞER</th>
                      <th className="text-right px-6 py-3">K/Z</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.holdings.map((h) => (
                      <tr
                        key={h.id}
                        className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => navigate(`/asset/${h.symbol}`)}
                          >
                            <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
                              {h.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900">{h.symbol}</p>
                              <p className="text-xs text-neutral-500">{h.current_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-neutral-600">
                          {formatNumber(h.quantity, 4)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-neutral-600 hidden sm:table-cell">
                          {formatCurrency(h.average_buy_price)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-medium text-neutral-900">{formatCurrency(h.current_value)}</p>
                          <p className="text-xs text-neutral-500">{formatCurrency(h.current_price)}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChangePct value={h.profit_loss_pct} showIcon={false} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(h.id)}
                              className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(h.id)}
                              className="p-1.5 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-8">
          <EmptyState
            icon="M21 13.255A48.108 48.108 0 0112 12c-2.916 0-5.765.235-8.5.675M3 20.5v-3.379a1 1 0 01.75-.97l1.5-.376M3 13.255V8.5m0 4.755a48.108 48.108 0 018.5-.675c2.916 0 5.765.235 8.5.675M3 8.5l9-6 9 6"
            title="Portfönüz boş"
            description="İlk pozisyonunuzu ekleyerek portföy takibine başlayın"
            action={
              <button onClick={openAddModal} className="btn-primary">
                + Pozisyon Ekle
              </button>
            }
          />
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Pozisyon Düzenle" : "Yeni Pozisyon"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">
              İptal
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
              {submitting ? "Kaydediliyor..." : editId ? "Güncelle" : "Ekle"}
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
              disabled={!!editId}
            />
          </div>
          <div>
            <label className="label">İsim (opsiyonel)</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Bitcoin"
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Miktar</label>
              <input
                type="number"
                step="any"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="0.5"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Ortalama Alış Fiyatı</label>
              <input
                type="number"
                step="any"
                value={form.average_buy_price}
                onChange={(e) => setForm({ ...form, average_buy_price: e.target.value })}
                placeholder="45000"
                className="input"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Varlık Tipi</label>
              <select
                value={form.asset_type}
                onChange={(e) => setForm({ ...form, asset_type: e.target.value })}
                className="input"
              >
                <option value="crypto">Kripto</option>
                <option value="stock">BIST Hisse</option>
              </select>
            </div>
            <div>
              <label className="label">Para Birimi</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="input"
              >
                <option value="USD">USD</option>
                <option value="TRY">TRY</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
