"use client";
import React, { useState, useEffect } from "react";
import BackButton from "./BackButton";
import { useHeaderOffset } from "../hooks/useHeaderOffset";

/**
 * Dock para BackButton:
 * - Desktop (md+): sticky justo debajo del header, alineado al lado izquierdo del contenido.
 * - Mobile: fijo en esquina inferior izquierda.
 */
const BackDock: React.FC<{ className?: string }> = ({ className = "" }) => {
  const top = useHeaderOffset(96, 16); // fallback 96px de header + 16px margen
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar si es mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px es el breakpoint md de Tailwind
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Renderizado condicional completamente diferente para mobile
  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 9999,
        }}
      >
        <BackButton className="!px-3 !py-2 !text-base !rounded-md !shadow-lg" />
      </div>
    );
  }

  // Desktop: sticky
  return (
    <div
      className={`sticky self-start shrink-0 z-40 ${className}`}
      style={{ top: `${top}px` }}
    >
      <BackButton className="!px-4 !py-2 !text-base !rounded-md" />
    </div>
  );
};

export default BackDock;
