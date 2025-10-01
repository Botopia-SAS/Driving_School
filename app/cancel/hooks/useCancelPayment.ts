import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "../../context/CartContext";

export interface CancelState {
  countdown: number;
  status: "processing" | "success" | "error";
  error: string | null;
  showCountdown: boolean;
}

export const useCancelPayment = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const hasInitialized = useRef(false);

  const [state, setState] = useState<CancelState>({
    countdown: 5,
    status: "processing",
    error: null,
    showCountdown: false,
  });

  const updateState = (updates: Partial<CancelState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const startCountdown = useCallback(() => {
    console.log("✅ Starting countdown for redirect to home");
    updateState({ showCountdown: true });

    const countdownTimer = setInterval(() => {
      setState(prev => {
        if (prev.countdown <= 1) {
          clearInterval(countdownTimer);
          router.replace("/");
          return { ...prev, countdown: 0 };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [router]);

  const revertSlotsAndClearCart = useCallback(async () => {
    const userId = searchParams ? searchParams.get("userId") : null;
    const orderId = searchParams ? searchParams.get("orderId") : null;

    console.log("🔄 [CANCEL] Starting payment cancellation process...");
    console.log("🔄 [CANCEL] UserId:", userId, "OrderId:", orderId);

    if (!userId) {
      console.error("❌ [CANCEL] No userId found in URL");
      updateState({
        status: "error",
        error: "Missing user information. Please contact support."
      });
      return;
    }

    try {
      // 1. Revertir los slots a available (liberar los slots reservados)
      if (orderId) {
        console.log("🔄 [CANCEL] Reverting slots for order:", orderId);

        try {
          const revertResponse = await fetch('/api/payments/revert-slots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, userId })
          });

          if (revertResponse.ok) {
            const result = await revertResponse.json();
            console.log("✅ [CANCEL] Slots reverted successfully:", result);
          } else {
            const errorData = await revertResponse.json();
            console.warn("⚠️ [CANCEL] Failed to revert some slots:", errorData);
            // No bloqueamos el proceso si falla - continuamos limpiando el carrito
          }
        } catch (error) {
          console.error("❌ [CANCEL] Error reverting slots:", error);
          // No bloqueamos el proceso si falla - continuamos limpiando el carrito
        }
      }

      // 2. Limpiar el carrito (localStorage y base de datos)
      console.log("🧹 [CANCEL] Clearing cart...");

      // Limpiar localStorage
      localStorage.removeItem("cart");

      // Limpiar carrito en la base de datos
      try {
        const cartClearResponse = await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (cartClearResponse.ok) {
          console.log("✅ [CANCEL] Cart cleared from database");
        } else {
          console.warn("⚠️ [CANCEL] Failed to clear cart from database");
        }
      } catch (error) {
        console.error("❌ [CANCEL] Error clearing cart from database:", error);
      }

      // Limpiar contexto de carrito
      clearCart();

      // 3. Marcar como éxito y iniciar countdown
      console.log("✅ [CANCEL] Cancellation process completed successfully");
      updateState({ status: "success" });

      // Esperar 1 segundo antes de iniciar el countdown
      setTimeout(() => {
        startCountdown();
      }, 1000);

    } catch (error) {
      console.error("❌ [CANCEL] Error during cancellation process:", error);
      updateState({
        status: "error",
        error: "An error occurred while processing the cancellation. Please contact support."
      });
    }
  }, [searchParams, clearCart, startCountdown]);

  // Initialize effect
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    console.log("🔄 [CANCEL] Initializing cancellation page");
    revertSlotsAndClearCart();
  }, [revertSlotsAndClearCart]);

  return {
    state,
    updateState,
  };
};
