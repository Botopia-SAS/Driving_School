"use client";

/**
 * Checkout Error Page
 * Shows error overlay with animation and explanatory message
 * Allows user to retry or return to cart page
 *
 * Features:
 * - Professional animation to communicate the error
 * - Clear and explanatory message
 * - Possibility to retry the process
 * - Redirection to cart page when closing
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CheckoutErrorOverlay from "./components/CheckoutErrorOverlay";

export default function ErrorCheckoutPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  // Coordinates for animation expansion effect (centered)
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  /**
   * Handles overlay closure and redirection
   * - Smoothly closes the animation
   * - Redirects user to the cart page
   */
  const handleClose = () => {
    setOpen(false);

    // Small delay before redirecting to allow closing animation to finish
    setTimeout(() => {
      // Always redirect to cart page in case of error
      router.push("/checkout");
    }, 300);
  };

  // Initialize position only on client to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
    setTriggerPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
  }, []);

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
      />
    </div>
  );
}
