"use client";

import { create } from "zustand";

export type CartItem = {
  productId: string;
  variantId: string;
  title: string;
  size: string | null;
  unitPrice: number;
  imageUrl: string | null;
  qty: number;
};

type CartState = {
  tenantSlug: string | null;
  items: CartItem[];
  setTenantSlug: (slug: string) => void;
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  setQty: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  subtotal: () => number;
  totalQty: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  tenantSlug: null,
  items: [],
  setTenantSlug: (slug) => {
    const current = get().tenantSlug;
    if (current && current !== slug) {
      set({ tenantSlug: slug, items: [] });
      return;
    }
    set({ tenantSlug: slug });
  },
  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.variantId === item.variantId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.variantId === item.variantId
              ? { ...i, qty: i.qty + (item.qty ?? 1) }
              : i,
          ),
        };
      }
      return {
        items: [...state.items, { ...item, qty: item.qty ?? 1 }],
      };
    });
  },
  setQty: (variantId, qty) => {
    if (qty <= 0) {
      set((state) => ({
        items: state.items.filter((i) => i.variantId !== variantId),
      }));
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.variantId === variantId ? { ...i, qty } : i,
      ),
    }));
  },
  removeItem: (variantId) =>
    set((state) => ({
      items: state.items.filter((i) => i.variantId !== variantId),
    })),
  clear: () => set({ items: [] }),
  subtotal: () =>
    get().items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
  totalQty: () => get().items.reduce((sum, item) => sum + item.qty, 0),
}));
