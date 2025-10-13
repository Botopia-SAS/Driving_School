"use client";
import { useEffect, useState } from "react";

/**
 * Devuelve la altura del header para ubicar elementos sticky justo debajo del logo.
 * - Busca por #site-header o <header data-sticky="true"> o primer <header>.
 * - Recalcula en resize y scroll.
 * - Usa fallback si no encuentra el header.
 */
export function useHeaderOffset(fallback = 96, extra = 16) {
  const [top, setTop] = useState<number>(fallback + extra);

  useEffect(() => {
    const getHeaderEl = (): HTMLElement | null => {
      return (
        (document.getElementById("site-header") as HTMLElement) ||
        (document.querySelector('header[data-sticky="true"]') as HTMLElement) ||
        (document.querySelector("header") as HTMLElement)
      );
    };

    const update = () => {
      const header = getHeaderEl();
      const h = header?.getBoundingClientRect().height ?? fallback;
      setTop(Math.max(0, h) + extra);
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [fallback, extra]);

  return top; // valor numérico de la altura del header + margen
}
