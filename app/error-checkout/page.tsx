
"use client";

/**
 * Checkout Error Page
 * Shows error overlay with animation and explanatory message
 * Allows user to retry or return to cart page
 * 
 * NEW: Also handles payment cancellations automatically
 *
 * Features:
 * - Professional animation to communicate the error
 * - Clear and explanatory message
 * - Possibility to retry the process
 * - Redirection to cart page when closing
 * - Automatic payment cancellation processing
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/components/AuthContext";
import CheckoutErrorOverlay from "./components/CheckoutErrorOverlay";

function ErrorCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart, cart } = useCart();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isProcessingCancellation, setIsProcessingCancellation] = useState(false);
  const [cancellationMessage, setCancellationMessage] = useState("");
  const [showOverlayAfterCancellation, setShowOverlayAfterCancellation] = useState(false);

  // Coordinates for animation expansion effect (centered)
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  /**
   * Helper function to clean up slots before clearing cart
   * Uses the exact same endpoints as the Clear All button
   */
  const cleanupSlotsBeforeClearCart = async (userId: string) => {
    if (!userId) {
      console.log("🗑️ [ERROR-CHECKOUT] No userId provided, skipping slot cleanup");
      return;
    }

    console.log("🗑️ [ERROR-CHECKOUT] Starting slot cleanup using same endpoints as Clear All...");

    try {
      // Use the exact same endpoints as CartContext clearCart
      const responses = await Promise.allSettled([
        // Clear user cart (for driving tests) and free slots - THIS IS THE KEY ENDPOINT
        fetch("/api/cart/clear-user-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }),
        
        // Force clean as backup
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

  /**
   * Process payment cancellation automatically
   * - Extract orderId and userId from SSL parameters
   * - Call API to cancel the order
   * - Clear cart and redirect to home
   */
  const processCancellation = async () => {
    // Extract from SSL parameters (from Converge payment gateway)
    const orderId = searchParams?.get('ssl_custom2') || 
                   searchParams?.get('ssl_user_defined_2')?.replace('oid:', '');
    const userId = searchParams?.get('ssl_custom1') || 
                  searchParams?.get('ssl_user_defined_1')?.replace('uid:', '');
    
    // Check if this is a cancellation (has SSL parameters)
    const isSSLCancellation = searchParams?.get('ssl_custom1') || searchParams?.get('ssl_custom2');
    
    // Also check for explicit cancellation flag
    const isExplicitCancellation = searchParams?.get('cancelled') === 'true';

    if (!isSSLCancellation && !isExplicitCancellation) {
      return; // Not a cancellation request
    }

    if (!orderId || !userId) {
      console.warn('⚠️ [ERROR-CHECKOUT] Missing orderId or userId in SSL parameters');
      return;
    }

    setIsProcessingCancellation(true);
    setCancellationMessage("Processing payment cancellation...");

    try {
      console.log(`🔄 [ERROR-CHECKOUT] Processing cancellation for order: ${orderId}, user: ${userId}`);

      // FIRST: Clean up slots BEFORE cancelling the order
      console.log(`🔄 [ERROR-CHECKOUT] Step 1: Cleaning up slots first...`);
      await cleanupSlotsBeforeClearCart(userId);
      
      // SECOND: Call the cancellation API
      console.log(`🔄 [ERROR-CHECKOUT] Step 2: Cancelling order...`);
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, userId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [ERROR-CHECKOUT] Cancellation successful:`, result);
        
        // Mostrar mensaje detallado
        let message = `Payment cancelled successfully.`;
        if (result.slotsReleased > 0) {
          message += ` Released ${result.slotsReleased} pending slot(s).`;
        }
        if (result.slotsSkipped > 0) {
          message += ` ${result.slotsSkipped} slot(s) were already confirmed.`;
        }
        
        setCancellationMessage(message);
        
        // Finally clear cart
        clearCart();
        localStorage.removeItem("cart");
        
        // Mostrar el overlay después de completar todo
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

  /**
   * Handles overlay closure and redirection
   * - Smoothly closes the animation
   * - Redirects user to home page
   */
  const handleClose = () => {
    setOpen(false);

    // Small delay before redirecting to allow closing animation to finish
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  // Initialize position only on client to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
    setTriggerPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    // Check if this is a payment cancellation request
    const isCancellation = searchParams?.get('ssl_custom1') || searchParams?.get('ssl_custom2') || searchParams?.get('cancelled') === 'true';
    
    if (isCancellation) {
      processCancellation();
    } else {
      // If no cancellation parameters, show overlay immediately (normal error case)
      setOpen(true);
    }
  }, [searchParams]);

  // Adjust position when window size changes
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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <CheckoutErrorOverlay
        open={open}
        onClose={handleClose}
        locale="en"
        triggerPosition={triggerPosition}
        isProcessingCancellation={isProcessingCancellation}
        cancellationMessage={cancellationMessage}
        showHomeButton={showOverlayAfterCancellation}
      />
    </div>
  );
}

export default function ErrorCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ErrorCheckoutContent />
    </Suspense>
  );
}
