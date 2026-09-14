"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { api, type ApiCartItem } from "@/lib/api";

type CartState = {
  items: ApiCartItem[];
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (productSlug: string, quantity?: number) => Promise<void>;
  updateItem: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<ApiCartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setItems(await api.cart());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productSlug: string, quantity = 1) => {
      await api.addToCart(productSlug, quantity);
      await refresh();
    },
    [refresh],
  );

  const updateItem = useCallback(async (id: number, quantity: number) => {
    const updated = await api.updateCartItem(id, quantity);
    setItems((list) => list.map((i) => (i.id === id ? updated : i)));
  }, []);

  const removeItem = useCallback(async (id: number) => {
    await api.removeCartItem(id);
    setItems((list) => list.filter((i) => i.id !== id));
  }, []);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, loading, refresh, addItem, updateItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart CartProvider ichida ishlatilishi kerak");
  return context;
}
