"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/components/AuthContext";
import CheckoutErrorOverlay from "./CheckoutErrorOverlay";

export default function ErrorCheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isProcessingCancellation, setIsProcessingCancellation] = useState(false);
  const [cancellationMessage, setCancellationMessage] = useState("");
  const [showOverlayAfterCancellation, setShowOverlayAfterCancellation] = useState(false);
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  const cleanupSlotsBeforeClearCart = async (userId: string) => {
    if (!userId) {
      console.log("🗑️ [ERROR-CHECKOUT] No userId provided, skipping slot cleanup");
      return;
    }

    console.log("🗑️ [ERROR-CHECKOUT] Starting slot cleanup using same endpoints as Clear All...");

    try {
      const responses = await Promise.allSettled([
        fetch("/api/cart/clear-user-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }),
        fetch("/api/cart/force-clean", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        })
      ]);

      responses.forEach((response, index) => {
        const endpoints = ["clear-user-cart", "force-clean"];
        if (response.status === "fulfilled") {
          console.log(`✅ [ERROR-CHECKOUT] ${endpoints[index]} cleared successfully`);
        } else {
          console.warn(`⚠️ [ERROR-CHECKOUT] ${endpoints[index]} failed:`, response.reason);
        }
      });

      console.log("✅ [ERROR-CHECKOUT] Slot cleanup completed using Clear All endpoints");
    } catch (error) {
      console.error("❌ [ERROR-CHECKOUT] Error during slot cleanup:", error);
    }
  };

  const processCancellation = async () => {
    const orderId = searchParams?.get('ssl_custom2') ||
                   searchParams?.get('ssl_user_defined_2')?.replace('oid:', '');
    const userId = searchParams?.get('ssl_custom1') ||
                  searchParams?.get('ssl_user_defined_1')?.replace('uid:', '');

    const isSSLCancellation = searchParams?.get('ssl_custom1') || searchParams?.get('ssl_custom2');
    const isExplicitCancellation = searchParams?.get('cancelled') === 'true';

    if (!isSSLCancellation && !isExplicitCancellation) {
      return;
    }

    if (!orderId || !userId) {
      console.warn('⚠️ [ERROR-CHECKOUT] Missing orderId or userId in SSL parameters');
      return;
    }

    setIsProcessingCancellation(true);
    setCancellationMessage("Processing payment cancellation...");

    try {
      console.log(`🔄 [ERROR-CHECKOUT] Processing cancellation for order: ${orderId}, user: ${userId}`);

      console.log(`🔄 [ERROR-CHECKOUT] Step 1: Cleaning up slots first...`);
      await cleanupSlotsBeforeClearCart(userId);

      console.log(`🔄 [ERROR-CHECKOUT] Step 2: Cancelling order...`);
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, userId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [ERROR-CHECKOUT] Cancellation successful:`, result);

        let message = `Payment cancelled successfully.`;
        if (result.slotsReleased > 0) {
          message += ` Released ${result.slotsReleased} pending slot(s).`;
        }
        if (result.slotsSkipped > 0) {
          message += ` ${result.slotsSkipped} slot(s) were already confirmed.`;
        }

        setCancellationMessage(message);

        clearCart();
        localStorage.removeItem("cart");

        setTimeout(() => {
          setIsProcessingCancellation(false);
          setShowOverlayAfterCancellation(true);
          setOpen(true);
        }, 1000);

      } else {
        const errorData = await response.json();
        console.error(`❌ [ERROR-CHECKOUT] Cancellation failed:`, errorData);
        setCancellationMessage(`Error processing cancellation: ${errorData.error || 'Unknown error'}. Please contact support.`);
      }
    } catch (error) {
      console.error(`❌ [ERROR-CHECKOUT] Error during cancellation:`, error);
      setCancellationMessage("Error processing cancellation. Please contact support.");
    } finally {
      setIsProcessingCancellation(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  useEffect(() => {
    setIsClient(true);
    setTriggerPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const isCancellation = searchParams?.get('ssl_custom1') || searchParams?.get('ssl_custom2') || searchParams?.get('cancelled') === 'true';

    if (isCancellation) {
      processCancellation();
    } else {
      setOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isClient) return;

    const handleResize = () => {
      setTriggerPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isClient]);

  return (
    <CheckoutErrorOverlay
      open={open}
      onClose={handleClose}
      locale="en"
      triggerPosition={triggerPosition}
      isProcessingCancellation={isProcessingCancellation}
      cancellationMessage={cancellationMessage}
      showHomeButton={showOverlayAfterCancellation}
    />
  );
}
