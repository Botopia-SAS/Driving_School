"use client";

/**
 * Página de error en el proceso de checkout
 * Muestra overlay de error con animación y mensaje explicativo
 * Permite al usuario reintentar o volver a la página de carrito
 *
 * Características:
 * - Animación profesional para comunicar el error
 * - Mensaje claro y explicativo
 * - Posibilidad de reintentar el proceso
 * - Redirección a la página de carrito al cerrar
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CheckoutErrorOverlay from "./components/CheckoutErrorOverlay";

export default function ErrorCheckoutPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  // Obtener mensaje de error personalizado si existe (por ahora no se usa)
  const errorMessage = undefined;

  // Coordenadas para el efecto de expansión de la animación (centrado)
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  /**
   * Maneja el cierre del overlay y la redirección
   * - Cierra suavemente la animación
   * - Redirecciona al usuario a la página de carrito
   */
  const handleClose = () => {
    setOpen(false);

    // Pequeño retraso antes de redirigir para permitir que la animación de cierre termine
    setTimeout(() => {
      // Siempre redirigir a la página de carrito en caso de error
      router.push("/carrito");
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
      <CheckoutErrorOverlay
        open={open}
        onClose={handleClose}
        message={errorMessage}
        triggerPosition={triggerPosition}
      />
    </div>
  );
}
