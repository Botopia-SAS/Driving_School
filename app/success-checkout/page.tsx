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
import { useState } from "react";
import CheckoutSuccessOverlay from "./components/CheckoutSuccessOverlay";
import { useCart } from "../context/CartContext";
import { useForceCartClear } from "../../hooks/useForceCartClear";

export default function SuccessCheckoutPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const { clearCart } = useCart();
  const { forceCartClear } = useForceCartClear();

  /**
   * Handles overlay closure and redirection to home page
   * - Smoothly closes the animation
   * - Cleans the shopping cart completely
   * - Redirects user to the home page
   */
  const handleClose = async () => {
    setOpen(false);

    // Small delay before redirecting to allow closing animation to finish
    setTimeout(async () => {
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
      } finally {
        // Redirect to home page regardless of cleanup success
        router.push("/");
      }
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#009047] overflow-hidden">
      <CheckoutSuccessOverlay
        open={open}
        onClose={handleClose}
        locale="en"
      />
    </div>
  );
}
