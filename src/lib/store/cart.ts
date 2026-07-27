"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  productId: string;
  variantId: string;
  title: string;
  size: string | null;
  unitPrice: number;
  qty: number;
  imageUrl: string | null;
};

type CartState = {
  tenantSlug: string | null;
  items: CartItem[];
  setTenantSlug: (slug: string) => void;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  subtotal: () => number;
  totalQty: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
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
      addItem: (item, qty = 1) => {
        set((state) => {
          const existing = state.items.find(
            (row) => row.variantId === item.variantId,
          );
          if (existing) {
            return {
              items: state.items.map((row) =>
                row.variantId === item.variantId
                  ? { ...row, qty: row.qty + qty }
                  : row,
              ),
            };
          }
          return { items: [...state.items, { ...item, qty }] };
        });
      },
      setQty: (variantId, qty) => {
        if (qty <= 0) {
          set((state) => ({
            items: state.items.filter((row) => row.variantId !== variantId),
          }));
          return;
        }
        set((state) => ({
          items: state.items.map((row) =>
            row.variantId === variantId ? { ...row, qty } : row,
          ),
        }));
      },
      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((row) => row.variantId !== variantId),
        }));
      },
      clear: () => set({ items: [] }),
      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
      totalQty: () => get().items.reduce((sum, item) => sum + item.qty, 0),
    }),
    {
      name: "dukenim-cart",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        tenantSlug: state.tenantSlug,
        items: state.items,
      }),
    },
  ),
);
