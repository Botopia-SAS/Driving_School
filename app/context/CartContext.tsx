"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/components/AuthContext";

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  cartLoading: boolean;
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => void;
  reloadCartFromDB: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(false);
  const { user } = useAuth();

  // 🛒 Cargar el carrito desde la base de datos si el usuario está logueado, si no, desde localStorage
  useEffect(() => {
    async function loadCart() {
      if (user && user._id) {
        try {
          const res = await fetch(`/api/cart?userId=${user._id}`);
          const data = await res.json();
          if (data.cart && Array.isArray(data.cart.items)) {
            setCart(data.cart.items);
            return;
          }
        } catch (err) {
          console.error("[CartContext] Failed to load cart from DB:", err);
        }
      } else {
        // Solo si no hay usuario, usa localStorage
        const storedCart = localStorage.getItem("cart");
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
      }
    }
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 💾 Guardar el carrito en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // 🔄 Sincronizar el carrito entre pestañas
  useEffect(() => {
    const syncCart = (e: StorageEvent) => {
      if (e.key === "cart") {
        setCart(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener("storage", syncCart);
    return () => window.removeEventListener("storage", syncCart);
  }, []);

  // Save cart to DB every time it changes and user is logged in
  useEffect(() => {
    async function saveCartToDB() {
      if (user && user._id && cart.length > 0) {
        try {
          await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id, items: cart }),
          });
        } catch (err) {
          console.error("[CartContext] Failed to save cart to DB:", err);
        }
      }
    }
    saveCartToDB();
  }, [cart, user]);

  // Función auxiliar para guardar el carrito en la base de datos
  const saveCartToDB = async (cartItems: CartItem[]) => {
    if (user && user._id) {
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id, items: cartItems }),
        });
      } catch (err) {
        console.error("[CartContext] Failed to save cart to DB:", err);
      }
    }
  };

  // 🚀 Función para agregar productos al carrito
  const addToCart = async (item: CartItem) => {
    setCartLoading(true);
    let newCart: CartItem[] = [];
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        newCart = prevCart;
        return prevCart;
      }
      newCart = [...prevCart, { ...item, quantity: 1 }];
      return newCart;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await saveCartToDB(newCart);
    setCartLoading(false);
  };

  // ❌ Función para eliminar un producto del carrito
  const removeFromCart = async (id: string) => {
    setCartLoading(true);
    let updatedCart: CartItem[] = [];
    setCart((prevCart) => {
      updatedCart = prevCart.filter((item) => item.id !== id);
      return updatedCart;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await saveCartToDB(updatedCart);
    setCartLoading(false);
  };

  // 🧹 Función para vaciar el carrito
  const clearCart = () => {
    setCart([]);
  };

  // Sincronizar la base de datos cuando el carrito se vacía
  useEffect(() => {
    if (user && user._id && cart.length === 0) {
      saveCartToDB([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, user]);

  // Función para recargar el carrito desde la base de datos
  const reloadCartFromDB = async () => {
    if (user && user._id) {
      try {
        const res = await fetch(`/api/cart?userId=${user._id}`);
        const data = await res.json();
        if (data.cart && Array.isArray(data.cart.items)) {
          setCart(data.cart.items);
        }
      } catch (err) {
        console.error("[CartContext] Failed to reload cart from DB:", err);
      }
    }
  };

  // Sincronizar el carrito al volver, navegar con flechas o recargar
  useEffect(() => {
    const handleSync = () => {
      reloadCartFromDB();
    };
    window.addEventListener("popstate", handleSync);
    window.addEventListener("focus", handleSync);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        handleSync();
      }
    });
    return () => {
      window.removeEventListener("popstate", handleSync);
      window.removeEventListener("focus", handleSync);
      document.removeEventListener("visibilitychange", handleSync);
    };
  }, [reloadCartFromDB, user]);

  return (
    <CartContext.Provider
      value={{ cart, cartLoading, addToCart, removeFromCart, clearCart, reloadCartFromDB }}
    >
      {children}
    </CartContext.Provider>
  );
};

// 📌 Hook para usar el contexto del carrito
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe ser usado dentro de un CartProvider");
  }
  return context;
};
