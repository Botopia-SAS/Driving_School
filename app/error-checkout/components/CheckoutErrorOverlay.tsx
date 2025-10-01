import React, { useEffect, useRef, useState } from "react";

/**
 * Overlay de error de compra con animaciones premium, accesibilidad y microinteracciones.
 * @see https://tailwindcss.com/docs/animation
 */
export type CheckoutErrorOverlayProps = {
  open: boolean;
  onClose?: () => void;
  message?: string;
  // reloadSrc and autoCloseMs removed (unused)
  className?: string;
  testId?: string;
  locale?: string;
  triggerPosition?: { x: number; y: number };
};

const DEFAULT_ERROR_MESSAGE: Record<string, string> = {
  es: "Ocurrió un error al procesar el pago",
  en: "There was an error processing your payment",
};

function CheckoutErrorOverlay({
  open,
  onClose,
  message,
  className = "",
  testId = "checkout-error-overlay",
  locale = "es",
  triggerPosition,
}: CheckoutErrorOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const headingId = "checkout-error-heading";
  const [expand, setExpand] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const msg =
    typeof message === "string"
      ? message
      : DEFAULT_ERROR_MESSAGE[locale ?? "es"];

  useEffect(() => {
    if (open) {
      setExpand(true);
      const timer = setTimeout(() => setShowContent(true), 400);
      return () => clearTimeout(timer);
    } else {
      setExpand(false);
      setShowContent(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && showContent) {
      closeBtnRef.current?.focus();
    }
  }, [open, showContent]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      tabIndex={-1}
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-auto transition-all duration-1000 ${
        expand ? "bg-[#d32f2f]/90 backdrop-blur-sm" : "bg-[#d32f2f]/0"
      } ${className}`}
      data-testid={testId}
      style={{
        transitionProperty: "background-color,backdrop-filter",
        transitionTimingFunction: "cubic-bezier(0.77,0,0.175,1)",
      }}
    >
      {/* Expansión radial premium desde el botón de finalizar pago */}
      <div
        className={`absolute w-24 h-12 rounded-full bg-[#d32f2f] shadow-2xl ${
          expand
            ? "scale-[120] opacity-100 blur-lg"
            : "scale-0 opacity-60 blur-none"
        } transition-all duration-[2000ms] ease-[cubic-bezier(0.77,0,0.175,1)] z-0 animate-bgPop`}
        style={{
          left: triggerPosition ? `${triggerPosition.x}px` : "50%",
          top: triggerPosition ? `${triggerPosition.y}px` : "auto",
          bottom: triggerPosition ? "auto" : "6rem",
          transformOrigin: triggerPosition ? "center center" : "center bottom",
          transitionProperty: "transform,opacity,filter",
          boxShadow: "0 8px 64px #d32f2f99",
        }}
        aria-hidden="true"
      />
      {/* Contenido central animado */}
      {showContent && (
        <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md px-6 py-12 animate-fadeInContent">
          {/* Ícono animado de error (SVG) */}
          <div className="flex justify-center w-full mb-2">
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="rounded-full shadow-2xl border-4 border-white bg-[#fff] animate-svgIcon"
              aria-label="Animación de error"
              style={{ boxShadow: "0 4px 32px #d32f2f55" }}
            >
              <circle cx="40" cy="40" r="36" fill="#d32f2f" opacity="0.15" />
              <circle cx="40" cy="40" r="32" fill="#d32f2f" opacity="0.25" />
              <path
                d="M40 24v20"
                stroke="#d32f2f"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <circle cx="40" cy="54" r="3.5" fill="#d32f2f" />
            </svg>
          </div>
          {/* Mensaje de error */}
          <h2
            id={headingId}
            tabIndex={-1}
            className="text-white text-3xl md:text-4xl font-extrabold text-center outline-none animate-riseFade drop-shadow-lg"
            style={{ letterSpacing: "-1px" }}
          >
            {msg}
          </h2>
          {/* Botón continuar */}
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="mt-8 px-8 py-3 rounded-xl bg-white text-[#d32f2f] text-lg font-bold shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d32f2f] transition-all hover:bg-[#ffe6e6]"
            data-testid="checkout-error-continue"
            style={{ boxShadow: "0 2px 16px #d32f2f33" }}
          >
            Continuar
          </button>
        </div>
      )}
      {/* Animaciones Tailwind y SVG personalizadas */}
      <style jsx>{`
        @keyframes fadeInContent {
          0% {
            opacity: 0;
            transform: scale(0.98) translateY(16px);
            filter: blur(8px);
          }
          60% {
            opacity: 0.7;
            transform: scale(1.01) translateY(-2px);
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }
        .animate-fadeInContent {
          animation: fadeInContent 0.5s cubic-bezier(0.77, 0, 0.175, 1);
        }
        @keyframes riseFade {
          from {
            opacity: 0;
            transform: translateY(32px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-riseFade {
          animation: riseFade 0.9s cubic-bezier(0.77, 0, 0.175, 1);
        }
        @keyframes svgIcon {
          0% {
            transform: scale(0.7);
            opacity: 0;
          }
          60% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-svgIcon {
          animation: svgIcon 0.9s cubic-bezier(0.77, 0, 0.175, 1);
        }
        @keyframes bgPop {
          0% {
            opacity: 0.6;
            filter: blur(0px);
            transform: scale(0);
          }
          40% {
            opacity: 0.8;
            filter: blur(2px);
            transform: scale(0.7);
          }
          70% {
            opacity: 1;
            filter: blur(8px);
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            filter: blur(16px);
            transform: scale(1.2);
          }
        }
        .animate-bgPop {
          animation: bgPop 2s cubic-bezier(0.77, 0, 0.175, 1);
        }
      `}</style>
    </div>
  );
}

CheckoutErrorOverlay.displayName = "CheckoutErrorOverlay";
export default React.memo(CheckoutErrorOverlay);
