"use client";

/**
 * Página de confirmación de compra exitosa
 * Muestra overlay de éxito con animación y mensaje de confirmación
 * Siempre redirige al usuario a la página principal al hacer clic en "Continuar"
 *
 * Características:
 * - Animación premium con video de confirmación
 * - Mensaje claro y directo
 * - Limpieza automática del carrito
 * - Redirección a la página principal para continuar comprando
 * - Diseño responsive y accesible
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
   * Maneja el cierre del overlay y la redirección al tracking service
   * - Cierra suavemente la animación
   * - Limpia el carrito de compras
   * - Redirecciona al usuario al tracking service
   */
  const handleClose = () => {
    setOpen(false);

    // Pequeño retraso antes de redirigir para permitir que la animación de cierre termine
    setTimeout(() => {
      // Limpiar carrito al finalizar exitosamente usando el hook centralizado
      clearCart();

      // También limpiar otros datos relacionados con la compra
      if (typeof window !== "undefined") {
        localStorage.removeItem("applied-discount");
        localStorage.removeItem("current-order");
      }

      // Redirigir al tracking service
      router.push("/tracking-service");
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
        message="¡Tu compra ha sido exitosa!"
        triggerPosition={triggerPosition}
      />
    </div>
  );
}
