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
  orderId?: string;
  orderNumber?: string;
  // For driving lesson packages
  packageDetails?: {
    productId: string;
    packageTitle: string;
    packagePrice: number;
    totalHours: number;
    selectedHours: number;
    pickupLocation: string;
    dropoffLocation: string;
    uniquePackageId?: string; // Add this for multiple instances
  };
  selectedSlots?: string[];
  instructorData?: Array<{
    _id: string;
    name: string;
    photo?: string;
  }>;
  slotDetails?: Array<{
    slotKey: string;
    instructorId: string;
    instructorName: string;
    slotId: string;
    date: string;
    start: string;
    end: string;
  }>;
  // For driving test appointments
  instructorId?: string;
  instructorName?: string;
  instructorPhoto?: string;
  date?: string;
  start?: string;
  end?: string;
  classType?: string;
  amount?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  slotId?: string; // Add slotId for driving tests and lessons
  // For ticket classes
  ticketClassId?: string;
}

interface CartContextType {
  cart: CartItem[];
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
  // Removed unused cartLoading state
  const { user } = useAuth();

  // Load cart from localStorage on initial load - SIMPLIFIED to avoid clearing issues
  useEffect(() => {
    console.log("🔄 [CartContext] Initial cart load from localStorage");

    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        console.log(
          "🔄 [CartContext] Found cart in localStorage:",
          parsedCart.length,
          "items"
        );
        setCart(parsedCart);
      } catch (e) {
        console.warn("Error parsing cart from localStorage:", e);
        // Don't clear localStorage on parse errors - just use empty cart
        setCart([]);
      }
    } else {
      console.log("🔄 [CartContext] No cart found in localStorage");
      setCart([]);
    }
  }, []);

  // Sync cart with database when user is available - BUT PRESERVE EXISTING CART
  const syncedRef = React.useRef(false);
  const lastUserIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Reset sync flag when user changes
    if (user?._id !== lastUserIdRef.current) {
      syncedRef.current = false;
      lastUserIdRef.current = user?._id || null;
    }

    // Only sync once when user becomes available AND avoid clearing existing cart
    if (user?._id && !syncedRef.current) {
      syncedRef.current = true;
      console.log(
        "🔄 [CartContext] CAREFUL sync with database for user:",
        user._id,
        "- preserving existing cart"
      );

      // Always prioritize preserving user's cart data
      console.log(
        "🔄 [CartContext] Prioritizing cart preservation during sync"
      );

      // Get current localStorage cart AND current cart state
      const storedCart = localStorage.getItem("cart");
      const localCartItems = storedCart ? JSON.parse(storedCart) : [];
      const currentCartItems = cart; // Current cart state

      console.log(
        "🔄 [CartContext] SYNC CHECK - Current cart in state:",
        currentCartItems.length,
        "items"
      );
      console.log(
        "🔄 [CartContext] SYNC CHECK - LocalStorage cart:",
        localCartItems.length,
        "items"
      );

      // If we already have items in the cart state, DON'T overwrite them
      if (currentCartItems.length > 0) {
        console.log(
          "🛑 [CartContext] Cart already has items - SKIPPING database sync to preserve data"
        );
        return;
      }

      // Check cart status from database only if current cart is empty
      fetch(`/api/cart/status?userId=${user._id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log(
              "🔄 [CartContext] Database cart items:",
              data.cartItems.length
            );
            console.log(
              "🔄 [CartContext] Local cart items:",
              localCartItems.length
            );

            if (data.cartItems.length > 0) {
              console.log(
                "🔄 [CartContext] Found items in database, syncing with local state"
              );
              setCart(data.cartItems);
              localStorage.setItem("cart", JSON.stringify(data.cartItems));
            } else if (localCartItems.length > 0) {
              // Database is empty but localStorage has items - ALWAYS KEEP localStorage items
              console.log(
                "🔄 [CartContext] Database empty, localStorage has items - KEEPING localStorage data and updating DB"
              );
              setCart(localCartItems);

              // Save to database as well to keep them in sync
              setTimeout(async () => {
                if (user?._id) {
                  try {
                    console.log(
                      "🔄 [CartContext] Saving localStorage items to database..."
                    );
                    await fetch("/api/cart", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: user._id,
                        items: localCartItems,
                      }),
                    });
                    console.log(
                      "✅ [CartContext] Successfully synced localStorage to database"
                    );
                  } catch (err) {
                    console.warn(
                      "[CartContext] Failed to sync localStorage items to DB:",
                      err
                    );
                  }
                }
              }, 100);
            } else {
              // Both are empty - this is OK for new users
              console.log(
                "🔄 [CartContext] Both database and localStorage are empty - normal for new users"
              );
              // Don't force setCart([]) here - let it be handled by initial load
            }
          }
        })
        .catch((err) => {
          console.warn("[CartContext] Failed to sync with database:", err);
          // On error, keep localStorage items
          if (localCartItems.length > 0) {
            console.log(
              "🔄 [CartContext] Sync failed, keeping localStorage items"
            );
            setCart(localCartItems);
          }
        });
    }
  }, [user?._id, cart]); // Run when user._id changes or cart changes

  // 🔄 SSE Connection for real-time cart updates - RE-ENABLED
  useEffect(() => {
    if (!user?._id) return;

    // Re-enable SSE since we fixed the reload issue in CartIcon
    console.log("🔄 Setting up SSE connection for cart updates");

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let isConnecting = false;

    const connectSSE = () => {
      if (isConnecting) return; // Prevent multiple simultaneous connections
      isConnecting = true;

      try {
        // Close existing connection if any
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        if (!user?._id) {
          console.log("🛒 No user ID available for cart SSE connection");
          return;
        }

        console.log("🛒 Connecting to cart SSE for user:", user._id);
        eventSource = new EventSource(`/api/cart/updates?userId=${user._id}`);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (
              data.type === "update" &&
              data.cart &&
              Array.isArray(data.cart.items)
            ) {
              setCart(data.cart.items);
            }
          } catch (error) {
            console.warn("Failed to parse cart SSE data:", error);
          }
        };

        eventSource.onerror = (err) => {
          const readyState = (eventSource as any)?.readyState;
          console.warn("Cart EventSource error:", {
            type: (err as any)?.type,
            readyState,
          });
          isConnecting = false;

          if (eventSource) {
            try {
              eventSource.close();
            } catch {
              // Ignore close errors
            }
            eventSource = null;
          }

          // If page hidden or offline, wait for visibility/online events to reconnect
          if (typeof document !== "undefined" && document.hidden) {
            console.log(
              "⏸️ Page hidden - Cart SSE will retry when page visible"
            );
            const onVisible = () => {
              document.removeEventListener("visibilitychange", onVisible);
              connectSSE();
            };
            document.addEventListener("visibilitychange", onVisible);
            return;
          }

          if (typeof navigator !== "undefined" && !navigator.onLine) {
            console.log("⏸️ Offline - Cart SSE will retry when back online");
            const onOnline = () => {
              window.removeEventListener("online", onOnline);
              connectSSE();
            };
            window.addEventListener("online", onOnline);
            return;
          }

          // Implement reconnection logic
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttempts),
              10000
            ); // Exponential backoff, max 10s
            console.log(
              `🔄 Cart SSE reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`
            );
            reconnectTimeout = setTimeout(() => {
              connectSSE();
            }, delay);
          } else {
            console.error(
              "❌ Cart SSE failed to reconnect after multiple attempts"
            );
          }
        };

        eventSource.onopen = () => {
          console.log("✅ Cart SSE connection established");
          reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          isConnecting = false;
        };
      } catch (error) {
        console.warn("Failed to create Cart EventSource:", error);
        isConnecting = false;

        // Implement reconnection logic for creation errors
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          reconnectTimeout = setTimeout(() => {
            connectSSE();
          }, delay);
        }
      }
    };

    connectSSE();

    // Cleanup on component unmount or user change
    return () => {
      isConnecting = false;
      if (eventSource) {
        try {
          eventSource.close();
        } catch {
          // Ignore close errors
        }
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [user]);

  // 💾 Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // DB persistence function
  const saveCartToDB = async (cartItems: CartItem[]) => {
    if (user && user._id) {
      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id, items: cartItems }),
        });

        if (!response.ok) {
          console.warn(
            "[CartContext] Failed to save cart to DB:",
            response.status,
            response.statusText
          );
        }
      } catch (err) {
        console.warn("[CartContext] Failed to save cart to DB:", err);
      }
    }
  };

  const addToCart = async (item: CartItem) => {
    console.log("🛒 [CartContext] Adding item to cart:", item);
    let newCart: CartItem[] = [];
    setCart((prevCart) => {
      if (prevCart.find((cartItem) => cartItem.id === item.id)) {
        console.log("🛒 [CartContext] Item already in cart, skipping");
        newCart = prevCart;
        return prevCart;
      }
      newCart = [...prevCart, { ...item, quantity: 1 }];
      console.log("🛒 [CartContext] New cart state:", newCart);
      return newCart;
    });

    // For driving lesson packages, don't save to DB here since the endpoint already does it
    if (!item.selectedSlots) {
      // Use a short timeout to allow state to update before saving
      setTimeout(() => saveCartToDB(newCart), 50);
    } else {
      console.log(
        "🛒 [CartContext] Driving lesson package - skipping DB save (already done by endpoint)"
      );
    }
  };

  const removeFromCart = async (id: string) => {
    if (!user?._id) return;

    // Find the item to remove first to check its type
    const itemToRemove = cart.find((item) => item.id === id);

    if (
      itemToRemove &&
      itemToRemove.selectedSlots &&
      itemToRemove.selectedSlots.length > 0
    ) {
      // This is a driving lesson package - free slots first
      console.log("🗑️ Removing driving lesson package and freeing slots...");

      try {
        const response = await fetch(
          "/api/cart/remove-driving-lesson-package",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user._id,
              itemId: id,
              selectedSlots: itemToRemove.selectedSlots,
            }),
          }
        );

        if (response.ok) {
          let updatedCart: CartItem[] = [];
          setCart((prevCart) => {
            updatedCart = prevCart.filter((item) => item.id !== id);
            return updatedCart;
          });
          setTimeout(() => saveCartToDB(updatedCart), 50);
          console.log("✅ Driving lesson package removed and slots freed");

          // SSE will automatically update the schedule - no need to refresh page
          console.log(
            "📡 SSE will automatically update the schedule with freed slots"
          );
        } else {
          const errorData = await response.json();
          console.error(
            "❌ Failed to remove driving lesson package:",
            errorData.error
          );
          alert(`Error removing package: ${errorData.error}`);
        }
      } catch (error) {
        console.error("❌ Error removing driving lesson package:", error);
        alert("Error removing package from cart");
      }
    } else if (
      itemToRemove &&
      itemToRemove.classType === "driving test" &&
      itemToRemove.instructorId
    ) {
      // This is a driving test appointment - free the slot first
      console.log("🗑️ Removing driving test appointment and freeing slot...");

      try {
        const response = await fetch("/api/cart/remove-driving-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            instructorId: itemToRemove.instructorId,
            date: itemToRemove.date,
            start: itemToRemove.start,
            end: itemToRemove.end,
            classType: itemToRemove.classType,
          }),
        });

        if (response.ok) {
          let updatedCart: CartItem[] = [];
          setCart((prevCart) => {
            updatedCart = prevCart.filter((item) => item.id !== id);
            return updatedCart;
          });
          setTimeout(() => saveCartToDB(updatedCart), 50);
          console.log("✅ Driving test appointment removed and slot freed");

          // SSE will automatically update the schedule - no need to refresh page
          console.log(
            "📡 SSE will automatically update the schedule with freed slot"
          );
        } else {
          const errorData = await response.json();
          console.error(
            "❌ Failed to remove driving test appointment:",
            errorData.error
          );
          alert(`Error removing appointment: ${errorData.error}`);
        }
      } catch (error) {
        console.error("❌ Error removing driving test appointment:", error);
        alert("Error removing appointment from cart");
      }
    } else if (itemToRemove && itemToRemove.ticketClassId) {
      // This is a ticket class - remove student request first
      console.log("🗑️ Removing ticket class and student request...");

      try {
        const response = await fetch("/api/cart/remove-ticket-class", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            ticketClassId: itemToRemove.ticketClassId,
            itemId: id,
          }),
        });

        if (response.ok) {
          let updatedCart: CartItem[] = [];
          setCart((prevCart) => {
            updatedCart = prevCart.filter((item) => item.id !== id);
            return updatedCart;
          });
          setTimeout(() => saveCartToDB(updatedCart), 50);
          console.log("✅ Ticket class removed and student request deleted");

          // SSE will automatically update the schedule - no need to refresh page
          console.log(
            "📡 SSE will automatically update the ticket class with removed request"
          );
        } else {
          const errorData = await response.json();
          console.error("❌ Failed to remove ticket class:", errorData.error);
          alert(`Error removing ticket class: ${errorData.error}`);
        }
      } catch (error) {
        console.error("❌ Error removing ticket class:", error);
        alert("Error removing ticket class from cart");
      }
    } else {
      // Regular cart item - just remove from cart
      let updatedCart: CartItem[] = [];
      setCart((prevCart) => {
        updatedCart = prevCart.filter((item) => item.id !== id);
        return updatedCart;
      });
      setTimeout(() => saveCartToDB(updatedCart), 50);
    }
  };

  const clearCart = async () => {
    console.log("🗑️ [CartContext] Clearing cart completely...");

    // First, handle ticket classes, driving tests, and driving lesson packages before clearing the cart
    if (user?._id && cart.length > 0) {
      const ticketClassItems = cart.filter((item) => item.ticketClassId);
      const drivingTestItems = cart.filter(
        (item) => item.classType === "driving test" && item.instructorId
      );
      const drivingLessonItems = cart.filter(
        (item) =>
          Array.isArray(item.selectedSlots) && item.selectedSlots.length > 0
      );

      if (ticketClassItems.length > 0) {
        console.log(
          `🗑️ [CartContext] Removing ${ticketClassItems.length} ticket class(es) and their student requests...`
        );

        // Remove each ticket class individually to clean up studentRequests
        for (const item of ticketClassItems) {
          try {
            await fetch("/api/cart/remove-ticket-class", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user._id,
                ticketClassId: item.ticketClassId,
                itemId: item.id,
              }),
            });
            console.log(
              `✅ [CartContext] Ticket class ${item.title} student request removed`
            );
          } catch (error) {
            console.warn(
              `⚠️ [CartContext] Failed to remove ticket class ${item.title}:`,
              error
            );
          }
        }
      }

      if (drivingTestItems.length > 0) {
        console.log(
          `🗑️ [CartContext] Removing ${drivingTestItems.length} driving test appointment(s) and freeing their slots...`
        );

        // Remove each driving test individually to free up slots
        for (const item of drivingTestItems) {
          try {
            await fetch("/api/cart/remove-driving-test", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user._id,
                instructorId: item.instructorId,
                date: item.date,
                start: item.start,
                end: item.end,
                classType: item.classType,
                slotId: item.slotId, // Include slotId if available for precise slot targeting
              }),
            });
            console.log(
              `✅ [CartContext] Driving test appointment ${item.title} slot freed`
            );
          } catch (error) {
            console.warn(
              `⚠️ [CartContext] Failed to remove driving test appointment ${item.title}:`,
              error
            );
          }
        }
      }

      if (drivingLessonItems.length > 0) {
        console.log(
          `🗑️ [CartContext] Freeing slots for ${drivingLessonItems.length} driving lesson package(s)...`
        );
        try {
          // Free all driving-lesson slots in parallel
          await Promise.all(
            drivingLessonItems.map((item) =>
              fetch("/api/cart/remove-driving-lesson-package", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: user._id,
                  itemId: item.id,
                  selectedSlots: item.selectedSlots,
                }),
              }).then(async (res) => {
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  console.warn(
                    "[CartContext] Failed to free driving lesson slots:",
                    res.status,
                    data?.error
                  );
                }
              })
            )
          );
          console.log("✅ [CartContext] Driving lesson slots freed");
        } catch (error) {
          console.warn(
            "[CartContext] Failed freeing driving lesson slots during clearCart:",
            error
          );
        }
      }
    }

    // Clear local state first
    setCart([]);

    // Clear all cart-related localStorage items
    localStorage.removeItem("cart");
    localStorage.removeItem("applied-discount");
    localStorage.removeItem("current-order");
    localStorage.removeItem("checkout-data");

    // Mark that cart was intentionally cleared (to prevent auto-restore)
    localStorage.setItem("cart-cleared", Date.now().toString());

    // Clear both regular cart and user cart (for driving tests)
    if (user?._id) {
      try {
        // Clear regular cart collection
        await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id }),
        });
        console.log("✅ [CartContext] Regular cart cleared from database");

        // Clear user cart (for driving tests) and free slots
        await fetch("/api/cart/clear-user-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id }),
        });
        console.log("✅ [CartContext] User cart cleared and slots freed");

        // Also use force-clean as backup
        await fetch("/api/cart/force-clean", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id }),
        });
        console.log("✅ [CartContext] Cart force cleaned as backup");
      } catch (err) {
        console.warn("[CartContext] Failed to clear cart from database:", err);
      }
    }

    console.log("✅ [CartContext] Cart completely cleared");
  };

  const reloadCartFromDB = async () => {
    if (!user?._id) return;

    console.log("🔄 [CartContext] Manual cart reload requested...");
    try {
      const response = await fetch(`/api/cart/status?userId=${user._id}`);
      const data = await response.json();

      if (data.success) {
        console.log(
          "🔄 [CartContext] Manual reload - found",
          data.cartItems.length,
          "items"
        );
        setCart(data.cartItems);
        localStorage.setItem("cart", JSON.stringify(data.cartItems));
      }
    } catch (error) {
      console.error("❌ Failed to reload cart from DB:", error);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, reloadCartFromDB }}
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
