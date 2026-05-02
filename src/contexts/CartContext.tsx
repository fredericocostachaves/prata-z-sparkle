import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Product } from "@/data/products";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  size?: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (p: Product, opts?: { qty?: number; size?: string }) => void;
  removeItem: (productId: string, size?: string) => void;
  updateQty: (productId: string, qty: number, size?: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "prataz-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    return {
      items,
      count,
      total,
      addItem: (p, opts) => {
        const qty = opts?.qty ?? 1;
        const size = opts?.size;
        setItems((prev) => {
          const idx = prev.findIndex((it) => it.productId === p.id && it.size === size);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], qty: next[idx].qty + qty };
            return next;
          }
          return [
            ...prev,
            {
              productId: p.id,
              slug: p.slug,
              name: p.name,
              price: p.price,
              image: p.images[0],
              qty,
              size,
            },
          ];
        });
        toast.success("Adicionado à sacola", { description: p.name });
      },
      removeItem: (productId, size) =>
        setItems((prev) => prev.filter((i) => !(i.productId === productId && i.size === size))),
      updateQty: (productId, qty, size) =>
        setItems((prev) =>
          prev
            .map((i) =>
              i.productId === productId && i.size === size ? { ...i, qty: Math.max(1, qty) } : i,
            ),
        ),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
