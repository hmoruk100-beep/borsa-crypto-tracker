import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { Card, ChangePct, Spinner, Badge } from "../components/ui";
import { formatCurrency, formatNumber } from "../lib/indicators";

type SortField = "market_cap" | "price" | "change_24h_pct" | "volume_24h";
type SortDir = "asc" | "desc";

export default function Markets() {
  const navigate = useNavigate();
  const { tickers, tickersLoading, loadTickers } = useStore();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("market_cap");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all");

  useEffect(() => {
    loadTickers();
  }, []);

  const filtered = useMemo(() => {
    let result = [...tickers];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
      );
    }
    if (filter === "gainers") result = result.filter((t) => t.change_24h_pct > 0);
    else if (filter === "losers") result = result.filter((t) => t.change_24h_pct < 0);

    result.sort((a, b) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return result;
  }, [tickers, search, sortField, sortDir, filter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-neutral-900 transition-colors"
    >
      {label}
      {sortField === field && (
        <span className="text-xs">{sortDir === "desc" ? "↓" : "↑"}</span>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Piyasalar</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Kripto para piyasası canlı verileri
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Sembol veya isim ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "gainers", "losers"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-primary-600 text-white"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {f === "all" ? "Tümü" : f === "gainers" ? "Yükselen" : "Düşen"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {tickersLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-neutral-400 text-sm">
            Sonuç bulunamadı
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 text-xs text-neutral-500 font-medium">
                  <th className="text-left px-6 py-3">#</th>
                  <th className="text-left px-6 py-3">VARLIK</th>
                  <th className="text-right px-6 py-3">
                    <SortHeader field="price" label="FİYAT" />
                  </th>
                  <th className="text-right px-6 py-3">
                    <SortHeader field="change_24h_pct" label="24S DEĞİŞİM" />
                  </th>
                  <th className="text-right px-6 py-3 hidden md:table-cell">
                    <SortHeader field="volume_24h" label="HACİM" />
                  </th>
                  <th className="text-right px-6 py-3 hidden lg:table-cell">
                    <SortHeader field="market_cap" label="PIYASA DEĞERİ" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr
                    key={t.symbol}
                    onClick={() => navigate(`/asset/${t.symbol}`)}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-neutral-400">{i + 1}</td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-neutral-900">
                      {formatCurrency(t.price)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChangePct value={t.change_24h_pct} />
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-neutral-600 hidden md:table-cell">
                      {t.volume_24h ? formatCurrency(t.volume_24h) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-neutral-600 hidden lg:table-cell">
                      {t.market_cap ? formatCurrency(t.market_cap) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
