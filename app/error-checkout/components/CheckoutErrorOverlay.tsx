import React, { useEffect, useRef, useState } from "react";

/**
 * Purchase error overlay with premium animations, accessibility and microinteractions.
 * @see https://tailwindcss.com/docs/animation
 */
export type CheckoutErrorOverlayProps = {
  open: boolean;
  onClose?: () => void;
  className?: string;
  testId?: string;
  locale?: string;
  triggerPosition?: { x: number; y: number };
  isProcessingCancellation?: boolean;
  cancellationMessage?: string;
  showHomeButton?: boolean;
};

interface ErrorContentType {
  title: string;
  subtitle: string;
  description: string;
  retryBtn: string;
  contactSupport: string;
}

const ERROR_CONTENT: Record<string, ErrorContentType> = {
  es: {
    title: "Error en el Pago",
    subtitle: "Hubo un problema al procesar tu pago",
    description: "Por favor, verifica tu información de pago e inténtalo de nuevo.",
    retryBtn: "Volver a Home",
    contactSupport: "Si el problema persiste, contacta con soporte.",
  },
  en: {
    title: "Payment Error",
    subtitle: "There was a problem processing your payment",
    description: "Please verify your payment information and try again.",
    retryBtn: "Back to Home",
    contactSupport: "If the problem persists, please contact support.",
  },
};

function CheckoutErrorOverlay({
  open,
  onClose,
  className = "",
  testId = "checkout-error-overlay",
  locale = "en",
  triggerPosition,
  isProcessingCancellation = false,
  cancellationMessage = "",
  showHomeButton = false,
}: CheckoutErrorOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const headingId = "checkout-error-heading";
  const [expand, setExpand] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const content = ERROR_CONTENT[locale ?? "en"];

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
          {/* Processing cancellation or error message */}
          {isProcessingCancellation ? (
            <div className="text-center mb-4">
              <div className="flex justify-center w-full mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
              </div>
              <h2
                id={headingId}
                tabIndex={-1}
                className="text-white text-3xl md:text-4xl font-extrabold outline-none animate-riseFade drop-shadow-lg mb-2"
                style={{ letterSpacing: "-1px" }}
              >
                Processing...
              </h2>
              <p className="text-white/90 text-lg font-medium animate-riseFade">
                {cancellationMessage || "Processing payment cancellation..."}
              </p>
            </div>
          ) : (
            <>
              {/* Error message */}
              <div className="text-center mb-4">
                <h2
                  id={headingId}
                  tabIndex={-1}
                  className="text-white text-3xl md:text-4xl font-extrabold outline-none animate-riseFade drop-shadow-lg mb-2"
                  style={{ letterSpacing: "-1px" }}
                >
                  {cancellationMessage ? "Cancellation Complete" : content.title}
                </h2>
                <p className="text-white/90 text-lg font-medium animate-riseFade">
                  {cancellationMessage || content.subtitle}
                </p>
              </div>

              {/* Error details */}
              <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 animate-fadeInContent">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-white/90 text-sm mb-4">
                    {cancellationMessage || content.description}
                  </p>
                  <p className="text-white/70 text-xs">
                    {content.contactSupport}
                  </p>
                </div>
              </div>

              {/* Show button only after cancellation is complete */}
              {showHomeButton && (
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={onClose}
                  className="mt-6 px-8 py-4 rounded-xl bg-white text-[#d32f2f] text-lg font-bold shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d32f2f] transition-all hover:bg-[#ffe6e6] hover:scale-105 transform"
                  data-testid="checkout-error-continue"
                  style={{ boxShadow: "0 4px 24px #d32f2f33" }}
                >
                  {content.retryBtn}
                </button>
              )}
            </>
          )}
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
