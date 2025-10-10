"use client";

import { useVerifySession } from "@/app/utils/auth";
import { saveActionData } from "@/app/utils/actions";

// Mejoramos la interfaz con tipos más específicos
export type ActionType = "buy" | "book" | "contact";

export interface ActionData {
  itemId?: string;
  title?: string;
  description?: string;
  price?: number;
  // Agregamos más propiedades si son necesarias
}

export function useHandleAction() {
  const isAuthenticated = useVerifySession();

  // Tipamos explícitamente los parámetros
  const handleAction = async (type: ActionType, data: ActionData) => {
    if (!isAuthenticated) {
      alert("❌ Debes iniciar sesión para continuar.");
      return;
    }

    try {
      await saveActionData(type, data);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error guardando la acción:", error.message);
      } else {
        console.error("Error desconocido al guardar la acción");
      }
      return;
    }

    if (type === "buy") {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: data }), // Enviar productos del carrito
      });

      const responseData = await res.json();

      if (responseData.url) {
  // Stripe Checkout eliminado
        window.location.href = responseData.url;
      } else {
        console.error("❌ Error creando la sesión de Checkout:", responseData);
        alert("Hubo un error al procesar el pago.");
      }
    } else if (type === "book") {
      window.location.href = "/schedule-confirmation";
    } else {
      window.location.href = "/contact-confirmation";
    }
  };

  return { handleAction };
}
