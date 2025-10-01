import React, { useEffect, useRef, useState } from "react";

/**
 * Purchase success overlay with premium animations, accessibility and microinteractions.
 * @see https://tailwindcss.com/docs/animation
 */
export type CheckoutSuccessOverlayProps = {
  open: boolean;
  onClose?: () => void;
  className?: string;
  testId?: string;
  locale?: string;
};

interface ContentType {
  title: string;
  subtitle: string;
  continueBtn: string;
  thankYou: string;
  processing: string;
}

const CONTENT: Record<string, ContentType> = {
  es: {
    title: "¡Compra Exitosa!",
    subtitle: "Tu orden ha sido procesada correctamente",
    continueBtn: "Continuar",
    thankYou: "Gracias por tu compra",
    processing: "Procesando tu orden...",
  },
  en: {
    title: "Purchase Successful!",
    subtitle: "Your order has been processed successfully",
    continueBtn: "Continue to Home",
    thankYou: "Thank you for your purchase!",
    processing: "Processing your order...",
  },
};

/**
 * Premium purchase success animation.
 * - Green background expands from button to cover the screen.
 * - Animated icon (MP4 video) centered above text.
 * - Centered success message with purchase summary.
 * - Accessibility and microinteractions.
 */
function CheckoutSuccessOverlay({
  open,
  onClose,
  className = "",
  testId = "checkout-success-overlay",
  locale = "en",
}: CheckoutSuccessOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const headingId = "checkout-success-heading";
  const [expand, setExpand] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const content = CONTENT[locale ?? "en"];

  // Animación: expansión radial premium y fade-in del contenido
  useEffect(() => {
    if (open) {
      setExpand(true);
      // El contenido aparece aún más rápido (mejor UX)
      const timer = setTimeout(() => setShowContent(true), 400);
      return () => clearTimeout(timer);
    } else {
      setExpand(false);
      setShowContent(false);
    }
  }, [open]);

  /**
   * Forzar reproducción del video cada vez que se muestra el contenido.
   * Si autoplay es bloqueado por el navegador, intenta reproducirlo manualmente.
   */
  useEffect(() => {
    if (showContent && videoRef.current) {
      videoRef.current.currentTime = 0;
      // Intenta reproducir el video (algunos navegadores requieren muted para autoplay)
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Si autoplay es bloqueado, intenta reproducirlo de nuevo tras un pequeño delay
          setTimeout(() => {
            videoRef.current?.play();
          }, 100);
        });
      }
    }
  }, [showContent]);

  // El overlay solo se cierra con el botón continuar

  // El overlay NO se cierra automáticamente

  // Foco en botón continuar
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
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-auto transition-all duration-1000 bg-[#009047] ${className}`}
      data-testid={testId}
      style={{
        transitionProperty: "background-color,backdrop-filter",
        transitionTimingFunction: "cubic-bezier(0.77,0,0.175,1)",
      }}
    >
      {/* Efecto de ondas concentricas desde el centro */}
      <div
        className={`absolute inset-0 ${
          expand ? "animate-rippleEffect" : ""
        }`}
        aria-hidden="true"
      >
        {/* Ondas múltiples para mejor efecto visual */}
        <div className="absolute inset-0 bg-[#009047] animate-pulse opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-radial from-[#00a852] to-transparent opacity-20"></div>
      </div>
      {/* Contenido central animado */}
      {showContent && (
        <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md px-6 py-12 animate-fadeInContent">
          {/* Ícono animado (video MP4) */}
          <div className="flex justify-center w-full mb-2">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              controls={false}
              loop
              muted
              className="w-42 h-42 object-contain rounded-full shadow-2xl border-4 border-white"
              aria-label="Animación de éxito"
              style={{ boxShadow: "0 4px 32px #00904755" }}
            >
              <source src="/Payment_Success.mp4" type="video/mp4" />
              Tu navegador no soporta el video.
            </video>
          </div>
          {/* Success message */}
          <div className="text-center mb-4">
            <h2
              id={headingId}
              tabIndex={-1}
              className="text-white text-3xl md:text-4xl font-extrabold outline-none animate-riseFade drop-shadow-lg mb-2"
              style={{ letterSpacing: "-1px" }}
            >
              {content.title}
            </h2>
            <p className="text-white/90 text-lg font-medium animate-riseFade">
              {content.subtitle}
            </p>
          </div>

          {/* Purchase summary */}
          <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 animate-fadeInContent">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-bold mb-1">{content.thankYou}</h3>
              <p className="text-white/80 text-sm">
                {locale === "en" 
                  ? "Your booking has been confirmed and you will receive a confirmation email shortly."
                  : "Tu reserva ha sido confirmada y recibirás un email de confirmación en breve."
                }
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-white/90">
                <span>{locale === "en" ? "Status:" : "Estado:"}</span>
                <span className="font-semibold text-white">
                  {locale === "en" ? "Confirmed" : "Confirmado"}
                </span>
              </div>
              <div className="flex justify-between items-center text-white/90">
                <span>{locale === "en" ? "Next step:" : "Siguiente paso:"}</span>
                <span className="font-semibold text-white">
                  {locale === "en" ? "Check your email" : "Revisa tu email"}
                </span>
              </div>
            </div>
          </div>

          {/* Continue button */}
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => {
              if (onClose) onClose();
            }}
            className="mt-6 px-8 py-4 rounded-xl bg-white text-[#009047] text-lg font-bold shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009047] transition-all hover:bg-[#e6ffe6] hover:scale-105 transform"
            data-testid="checkout-success-continue"
            style={{ boxShadow: "0 4px 24px #00904733" }}
          >
            {content.continueBtn}
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
        @keyframes sheen {
          0% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.2);
          }
          100% {
            filter: brightness(1);
          }
        }
        .animate-sheen {
          animation: sheen 1.2s ease-in-out infinite;
        }
        @keyframes rippleEffect {
          0% {
            background: radial-gradient(circle at center, #00a852 0%, #009047 30%, transparent 70%);
            opacity: 0.8;
          }
          50% {
            background: radial-gradient(circle at center, #00c55a 0%, #00a852 20%, #009047 40%, transparent 80%);
            opacity: 0.6;
          }
          100% {
            background: radial-gradient(circle at center, transparent 0%, transparent 100%);
            opacity: 0.2;
          }
        }
        .animate-rippleEffect {
          animation: rippleEffect 1.5s cubic-bezier(0.77, 0, 0.175, 1) forwards;
        }
        @keyframes sheenSVG {
          0% {
            opacity: 0.1;
            background: linear-gradient(
              120deg,
              #fff2 0%,
              #fff7 50%,
              #fff2 100%
            );
          }
          50% {
            opacity: 0.25;
            background: linear-gradient(120deg, #fff7 0%, #fff 50%, #fff7 100%);
          }
          100% {
            opacity: 0.1;
            background: linear-gradient(
              120deg,
              #fff2 0%,
              #fff7 50%,
              #fff2 100%
            );
          }
        }
        .animate-sheenSVG {
          animation: sheenSVG 1.2s ease-in-out infinite;
        }
        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
}

CheckoutSuccessOverlay.displayName = "CheckoutSuccessOverlay";
export default React.memo(CheckoutSuccessOverlay);
