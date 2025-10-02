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

  // Load cart from localStorage on initial load
  useEffect(() => {
    // Check if cart was recently cleared intentionally
    const cartCleared = localStorage.getItem("cart-cleared");
    if (cartCleared) {
      const clearedTime = parseInt(cartCleared);
      const timeSinceCleared = Date.now() - clearedTime;
      // If cleared in the last 10 minutes, don't load from localStorage
      if (timeSinceCleared < 10 * 60 * 1000) { // 10 minutes
        console.log('🔄 [CartContext] Cart was recently cleared, not loading from localStorage');
        setCart([]);
        return;
      } else {
        // Remove old cleared marker
        localStorage.removeItem("cart-cleared");
      }
    }
    
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        console.log('🔄 [CartContext] Loading cart from localStorage:', parsedCart);
        setCart(parsedCart);
      } catch (e) {
        console.error("Error parsing cart from localStorage", e);
        localStorage.removeItem("cart");
        setCart([]);
      }
    } else {
      setCart([]);
    }
  }, []);

  // Sync cart with database when user is available (only once)
  useEffect(() => {
    if (user?._id) {
      console.log('🔄 [CartContext] Syncing cart with database for user:', user._id);
      
      // Check if cart was recently cleared intentionally
      const cartCleared = localStorage.getItem("cart-cleared");
      const now = Date.now();
      if (cartCleared) {
        const clearedTime = parseInt(cartCleared);
        const timeSinceCleared = now - clearedTime;
        // If cleared in the last 10 minutes, don't sync from database
        if (timeSinceCleared < 10 * 60 * 1000) { // 10 minutes
          console.log('🔄 [CartContext] Cart was recently cleared, skipping sync from database');
          setCart([]);
          return;
        } else {
          // Remove old cleared marker
          localStorage.removeItem("cart-cleared");
        }
      }
      
      // Check cart status from database
      fetch(`/api/cart/status?userId=${user._id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('🔄 [CartContext] Database cart items:', data.cartItems);
            if (data.cartItems.length > 0) {
              console.log('🔄 [CartContext] Found items in database, syncing with local state');
              setCart(data.cartItems);
              localStorage.setItem("cart", JSON.stringify(data.cartItems));
            } else {
              // If database is empty, clear everything (DB is source of truth)
              console.log('🔄 [CartContext] Database is empty, clearing cart and localStorage');
              setCart([]);
              localStorage.removeItem("cart");
            }
          }
        })
        .catch(err => {
          console.warn('[CartContext] Failed to sync with database:', err);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // NO DEPENDENCIES - only run once on mount, user._id will be null initially

  // 🔄 SSE Connection for real-time cart updates - TEMPORARILY DISABLED
  useEffect(() => {
    if (!user?._id) return;
    
    // TEMPORARILY DISABLE SSE TO STOP INFINITE LOOP
    console.log('🔄 SSE temporarily disabled to stop infinite loop');
    return;

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
          console.log('🛒 No user ID available for cart SSE connection');
          return;
        }
        
        console.log('🛒 Connecting to cart SSE for user:', user._id);
        eventSource = new EventSource(`/api/cart/updates?userId=${user._id}`);
    
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'update' && data.cart && Array.isArray(data.cart.items)) {
              setCart(data.cart.items);
            }
          } catch (error) {
            console.warn("Failed to parse cart SSE data:", error);
          }
        };

        eventSource.onerror = (err) => {
          console.warn("Cart EventSource error:", err);
          isConnecting = false;
          
          if (eventSource) {
            try {
              eventSource.close();
            } catch {
              // Ignore close errors
            }
            eventSource = null;
          }
          
          // Implement reconnection logic
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000); // Exponential backoff, max 10s
            console.log(`🔄 Cart SSE reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
            reconnectTimeout = setTimeout(() => {
              connectSSE();
            }, delay);
          } else {
            console.error('❌ Cart SSE failed to reconnect after multiple attempts');
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
          console.warn("[CartContext] Failed to save cart to DB:", response.status, response.statusText);
        }
      } catch (err) {
        console.warn("[CartContext] Failed to save cart to DB:", err);
      }
    }
  };

  const addToCart = async (item: CartItem) => {
    console.log('🛒 [CartContext] Adding item to cart:', item);
    let newCart: CartItem[] = [];
    setCart((prevCart) => {
      if (prevCart.find((cartItem) => cartItem.id === item.id)) {
        console.log('🛒 [CartContext] Item already in cart, skipping');
        newCart = prevCart;
        return prevCart;
      }
      newCart = [...prevCart, { ...item, quantity: 1 }];
      console.log('🛒 [CartContext] New cart state:', newCart);
      return newCart;
    });
    
    // For driving lesson packages, don't save to DB here since the endpoint already does it
    if (!item.selectedSlots) {
      // Use a short timeout to allow state to update before saving
      setTimeout(() => saveCartToDB(newCart), 50);
    } else {
      console.log('🛒 [CartContext] Driving lesson package - skipping DB save (already done by endpoint)');
    }
  };
  
  const removeFromCart = async (id: string) => {
    if (!user?._id) return;

    // Find the item to remove first to check its type
    const itemToRemove = cart.find(item => item.id === id);
    
    if (itemToRemove && itemToRemove.selectedSlots && itemToRemove.selectedSlots.length > 0) {
      // This is a driving lesson package - free slots first
      console.log('🗑️ Removing driving lesson package and freeing slots...');
      
      try {
        const response = await fetch("/api/cart/remove-driving-lesson-package", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: user._id, 
            itemId: id, 
            selectedSlots: itemToRemove.selectedSlots 
          }),
        });

        if (response.ok) {
          let updatedCart: CartItem[] = [];
          setCart((prevCart) => {
            updatedCart = prevCart.filter((item) => item.id !== id);
            return updatedCart;
          });
          setTimeout(() => saveCartToDB(updatedCart), 50);
          console.log("✅ Driving lesson package removed and slots freed");
          
          // SSE will automatically update the schedule - no need to refresh page
          console.log("📡 SSE will automatically update the schedule with freed slots");
        } else {
          const errorData = await response.json();
          console.error("❌ Failed to remove driving lesson package:", errorData.error);
          alert(`Error removing package: ${errorData.error}`);
        }
      } catch (error) {
        console.error("❌ Error removing driving lesson package:", error);
        alert('Error removing package from cart');
      }
    } else if (itemToRemove && itemToRemove.classType === 'driving test' && itemToRemove.instructorId) {
      // This is a driving test appointment - free the slot first
      console.log('🗑️ Removing driving test appointment and freeing slot...');
      
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
            classType: itemToRemove.classType
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
          console.log("📡 SSE will automatically update the schedule with freed slot");
        } else {
          const errorData = await response.json();
          console.error("❌ Failed to remove driving test appointment:", errorData.error);
          alert(`Error removing appointment: ${errorData.error}`);
        }
      } catch (error) {
        console.error("❌ Error removing driving test appointment:", error);
        alert('Error removing appointment from cart');
      }
    } else if (itemToRemove && itemToRemove.ticketClassId) {
      // This is a ticket class - remove student request first
      console.log('🗑️ Removing ticket class and student request...');
      
      try {
        const response = await fetch("/api/cart/remove-ticket-class", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: user._id, 
            ticketClassId: itemToRemove.ticketClassId,
            itemId: id
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
          console.log("📡 SSE will automatically update the ticket class with removed request");
        } else {
          const errorData = await response.json();
          console.error("❌ Failed to remove ticket class:", errorData.error);
          alert(`Error removing ticket class: ${errorData.error}`);
        }
      } catch (error) {
        console.error("❌ Error removing ticket class:", error);
        alert('Error removing ticket class from cart');
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
    console.log('🗑️ [CartContext] Clearing cart completely...');
    
    // First, handle ticket classes and driving lesson packages before clearing the cart
    if (user?._id && cart.length > 0) {
      const ticketClassItems = cart.filter(item => item.ticketClassId);
      const drivingLessonItems = cart.filter(item => Array.isArray(item.selectedSlots) && item.selectedSlots.length > 0);
      
      if (ticketClassItems.length > 0) {
        console.log(`🗑️ [CartContext] Removing ${ticketClassItems.length} ticket class(es) and their student requests...`);
        
        // Remove each ticket class individually to clean up studentRequests
        for (const item of ticketClassItems) {
          try {
            await fetch("/api/cart/remove-ticket-class", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                userId: user._id, 
                ticketClassId: item.ticketClassId,
                itemId: item.id
              }),
            });
            console.log(`✅ [CartContext] Ticket class ${item.title} student request removed`);
          } catch (error) {
            console.warn(`⚠️ [CartContext] Failed to remove ticket class ${item.title}:`, error);
          }
        }
      }

      if (drivingLessonItems.length > 0) {
        console.log(`🗑️ [CartContext] Freeing slots for ${drivingLessonItems.length} driving lesson package(s)...`);
        try {
          // Free all driving-lesson slots in parallel
          await Promise.all(
            drivingLessonItems.map(item =>
              fetch("/api/cart/remove-driving-lesson-package", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: user._id,
                  itemId: item.id,
                  selectedSlots: item.selectedSlots
                })
              }).then(async res => {
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  console.warn('[CartContext] Failed to free driving lesson slots:', res.status, data?.error);
                }
              })
            )
          );
          console.log('✅ [CartContext] Driving lesson slots freed');
        } catch (error) {
          console.warn('[CartContext] Failed freeing driving lesson slots during clearCart:', error);
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
        console.log('✅ [CartContext] Regular cart cleared from database');
        
        // Clear user cart (for driving tests) and free slots
        await fetch("/api/cart/clear-user-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id }),
        });
        console.log('✅ [CartContext] User cart cleared and slots freed');
        
        // Also use force-clean as backup
        await fetch("/api/cart/force-clean", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id }),
        });
        console.log('✅ [CartContext] Cart force cleaned as backup');
        
      } catch (err) {
        console.warn('[CartContext] Failed to clear cart from database:', err);
      }
    }
    
    console.log('✅ [CartContext] Cart completely cleared');
  };
  
  const reloadCartFromDB = () => {
    // This function is now effectively handled by the SSE connection.
    // It can be kept for specific manual refresh scenarios if needed, but is not essential for sync.
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
