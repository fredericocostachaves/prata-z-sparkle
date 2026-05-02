import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

interface FavoritesContextValue {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string, name?: string) => void;
  count: number;
  clear: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const STORAGE_KEY = "prataz-favorites-v1";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setIds(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {}
  }, [ids]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      ids,
      count: ids.length,
      has: (id) => ids.includes(id),
      toggle: (id, name) =>
        setIds((prev) => {
          if (prev.includes(id)) {
            toast("Removido dos favoritos", { description: name });
            return prev.filter((x) => x !== id);
          }
          toast.success("Salvo nos favoritos", { description: name });
          return [...prev, id];
        }),
      clear: () => setIds([]),
    }),
    [ids],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
