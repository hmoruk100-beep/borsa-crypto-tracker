import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { Holding, Alert, Notification } from "../types";
import { getBatchPrices, getTopTickers } from "../lib/coingecko";
import type { Ticker } from "../types";
import type { Portfolio, PortfolioHolding } from "../types";

interface AppState {
  holdings: Holding[];
  alerts: Alert[];
  notifications: Notification[];
  tickers: Ticker[];
  tickersLoading: boolean;
  loading: boolean;
  error: string | null;

  loadHoldings: () => Promise<void>;
  addHolding: (data: Omit<Holding, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateHolding: (id: string, data: Partial<Holding>) => Promise<void>;
  deleteHolding: (id: string) => Promise<void>;
  getPortfolio: () => Promise<Portfolio>;

  loadAlerts: () => Promise<void>;
  addAlert: (data: Omit<Alert, "id" | "created_at">) => Promise<void>;
  updateAlert: (id: string, data: Partial<Alert>) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;

  loadNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  loadTickers: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  holdings: [],
  alerts: [],
  notifications: [],
  tickers: [],
  tickersLoading: false,
  loading: false,
  error: null,

  loadHoldings: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("holdings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      set({ holdings: data ?? [], loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  addHolding: async (data) => {
    const { error } = await supabase.from("holdings").insert(data);
    if (error) throw error;
    await get().loadHoldings();
  },

  updateHolding: async (id, data) => {
    const { error } = await supabase
      .from("holdings")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    await get().loadHoldings();
  },

  deleteHolding: async (id) => {
    const { error } = await supabase.from("holdings").delete().eq("id", id);
    if (error) throw error;
    await get().loadHoldings();
  },

  getPortfolio: async () => {
    const { holdings } = get();
    if (holdings.length === 0) {
      return {
        total_value: 0,
        total_cost_basis: 0,
        total_profit_loss_amount: 0,
        total_profit_loss_pct: 0,
        holdings: [],
      };
    }
    const symbols = holdings.map((h) => h.symbol);
    const prices = await getBatchPrices(symbols);
    const tickerData = await getTopTickers();

    const enriched: PortfolioHolding[] = holdings.map((h) => {
      const current_price = prices[h.symbol] ?? 0;
      const ticker = tickerData.find((t) => t.symbol === h.symbol.toUpperCase());
      const cost_basis = h.quantity * h.average_buy_price;
      const current_value = h.quantity * current_price;
      return {
        ...h,
        current_price,
        current_name: ticker?.name ?? h.name ?? h.symbol,
        cost_basis,
        current_value,
        profit_loss_amount: current_value - cost_basis,
        profit_loss_pct: cost_basis > 0 ? ((current_value - cost_basis) / cost_basis) * 100 : 0,
        allocation_pct: 0,
      };
    });

    const total_value = enriched.reduce((sum, h) => sum + h.current_value, 0);
    const total_cost_basis = enriched.reduce((sum, h) => sum + h.cost_basis, 0);

    for (const h of enriched) {
      h.allocation_pct = total_value > 0 ? (h.current_value / total_value) * 100 : 0;
    }

    return {
      total_value,
      total_cost_basis,
      total_profit_loss_amount: total_value - total_cost_basis,
      total_profit_loss_pct: total_cost_basis > 0 ? ((total_value - total_cost_basis) / total_cost_basis) * 100 : 0,
      holdings: enriched.sort((a, b) => b.current_value - a.current_value),
    };
  },

  loadAlerts: async () => {
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      set({ alerts: data ?? [] });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  addAlert: async (data) => {
    const { error } = await supabase.from("alerts").insert(data);
    if (error) throw error;
    await get().loadAlerts();
  },

  updateAlert: async (id, data) => {
    const { error } = await supabase
      .from("alerts")
      .update(data)
      .eq("id", id);
    if (error) throw error;
    await get().loadAlerts();
  },

  deleteAlert: async (id) => {
    const { error } = await supabase.from("alerts").delete().eq("id", id);
    if (error) throw error;
    await get().loadAlerts();
  },

  loadNotifications: async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      set({ notifications: data ?? [] });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  markNotificationRead: async (id) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) throw error;
    await get().loadNotifications();
  },

  markAllNotificationsRead: async () => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);
    if (error) throw error;
    await get().loadNotifications();
  },

  deleteNotification: async (id) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) throw error;
    await get().loadNotifications();
  },

  loadTickers: async () => {
    set({ tickersLoading: true });
    try {
      const tickers = await getTopTickers();
      set({ tickers, tickersLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, tickersLoading: false });
    }
  },
}));
