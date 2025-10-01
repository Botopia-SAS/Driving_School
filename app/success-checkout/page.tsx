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
import { useEffect, useState } from "react";
import CheckoutSuccessOverlay from "./components/CheckoutSuccessOverlay";
import { useCart } from "../context/CartContext";

export default function SuccessCheckoutPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const { clearCart } = useCart();

  // Coordenadas para el efecto de expansión de la animación (centrado)
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  /**
   * Handles overlay closure and redirection to home page
   * - Smoothly closes the animation
   * - Cleans the shopping cart
   * - Redirects user to the home page
   */
  const handleClose = () => {
    setOpen(false);

    // Small delay before redirecting to allow closing animation to finish
    setTimeout(() => {
      // Clean cart after successful completion using centralized hook
      clearCart();

      // Also clean other purchase-related data
      if (typeof window !== "undefined") {
        localStorage.removeItem("applied-discount");
        localStorage.removeItem("current-order");
      }

      // Redirect to home page
      router.push("/");
    }, 300);
  };

  // Inicializar posición solo en el cliente para evitar problemas de hidratación
  useEffect(() => {
    setIsClient(true);
    setTriggerPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
  }, []);

  // Ajustar posición al cambiar el tamaño de la ventana
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
      <CheckoutSuccessOverlay
        open={open}
        onClose={handleClose}
        locale="en"
        triggerPosition={triggerPosition}
      />
    </div>
  );
}
