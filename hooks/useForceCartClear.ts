import { useCallback } from "react";
import { useAuth } from "../components/AuthContext";
import { useCart } from "../app/context/CartContext";

/**
 * Custom hook for force clearing the cart when there are persistent cache issues
 * This provides a nuclear option to completely clean all cart-related data
 */
export const useForceCartClear = () => {
  const { user } = useAuth();
  const { clearCart } = useCart();

  const forceCartClear = useCallback(async () => {
    console.log("🧹 [useForceCartClear] Starting force cart clear...");
    
    try {
      // 1. Clear local state using cart context
      clearCart();

      // 2. Clear all localStorage items related to cart
      const cartRelatedKeys = [
        "cart",
        "applied-discount", 
        "current-order",
        "checkout-data",
        "cart-cleared"
      ];
      
      cartRelatedKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // 3. Mark cart as cleared
      localStorage.setItem("cart-cleared", Date.now().toString());

      // 4. Force clean from database if user is logged in
      if (user?._id) {
        const responses = await Promise.allSettled([
          // Regular cart
          fetch("/api/cart", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id }),
          }),
          
          // User cart (driving tests)
          fetch("/api/cart/clear-user-cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id }),
          }),
          
          // Force clean (nuclear option)
          fetch("/api/cart/force-clean", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user._id }),
          })
        ]);

        responses.forEach((response, index) => {
          const endpoints = ["cart", "clear-user-cart", "force-clean"];
          if (response.status === "fulfilled") {
            console.log(`✅ [useForceCartClear] ${endpoints[index]} cleared successfully`);
          } else {
            console.warn(`⚠️ [useForceCartClear] ${endpoints[index]} failed:`, response.reason);
          }
        });
      }

      console.log("✅ [useForceCartClear] Force cart clear completed");
      return { success: true, message: "Cart cleared successfully" };
      
    } catch (error) {
      console.error("❌ [useForceCartClear] Error during force clear:", error);
      return { 
        success: false, 
        message: "Error clearing cart", 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }, [user?._id, clearCart]);

  return { forceCartClear };
};