"use client";

/**
 * Successful Purchase Confirmation Page
 * Shows success overlay with animation and confirmation message
 * Always redirects user to the home page when clicking "Continue"
 *
 * Features:
 * - Premium animation with confirmation video
 * - Clear and direct message
 * - Automatic cart cleanup
 * - Redirect to home page to continue browsing
 * - Responsive and accessible design
 */

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import CheckoutSuccessOverlay from "./components/CheckoutSuccessOverlay";
import { useCart } from "../context/CartContext";
import { useForceCartClear } from "../../hooks/useForceCartClear";

export default function SuccessCheckoutPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const { clearCart } = useCart();
  const { forceCartClear } = useForceCartClear();

  // Set body background to green for full immersive experience
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#009047';
    
    // Cleanup when component unmounts
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, []);

  /**
   * Handles overlay closure and redirection to home page
   * - Immediately closes the animation for faster UX
   * - Cleans the shopping cart completely in background
   * - Redirects user to the home page instantly
   */
  const handleClose = async () => {
    console.log("🎉 User clicked Continue - processing...");
    
    // Set open to false immediately for instant UI response
    setOpen(false);

    // Start cart cleanup in background (non-blocking)
    const cleanupPromise = (async () => {
      try {
        // Method 1: Use context clearCart (improved version)
        await clearCart();
        console.log("✅ Cart cleared using context method");

        // Method 2: Use force cart clear as backup to ensure everything is cleaned
        const forceResult = await forceCartClear();
        if (forceResult.success) {
          console.log("✅ Force cart clear completed successfully");
        } else {
          console.warn("⚠️ Force cart clear had issues:", forceResult.message);
        }

      } catch (error) {
        console.warn("⚠️ Error during cart cleanup:", error);
        
        // Last resort: try force clear even if context method failed
        try {
          await forceCartClear();
          console.log("✅ Backup force cart clear completed");
        } catch (backupError) {
          console.error("❌ Backup cart clear also failed:", backupError);
        }
      }
    })();

    // Redirect immediately without waiting for cleanup
    console.log("🏠 Redirecting to home immediately...");
    router.push("/");
    
    // Cleanup continues in background
    cleanupPromise.catch(console.error);
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#009047] flex items-center justify-center overflow-hidden">
      <CheckoutSuccessOverlay
        open={open}
        onClose={handleClose}
        locale="en"
      />
    </div>
  );
}
