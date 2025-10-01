import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Overlay de éxito de compra con animaciones premium, accesibilidad y microinteracciones.
 * @see https://tailwindcss.com/docs/animation
 */
export type CheckoutSuccessOverlayProps = {
  open: boolean;
  onClose?: () => void;
  message?: string;
  className?: string;
  testId?: string;
  locale?: string;
  triggerPosition?: { x: number; y: number };
};

const DEFAULT_MESSAGE: Record<string, string> = {
  es: "Tu compra ha sido exitosa",
  en: "Your purchase was successful",
};

/**
 * Animación de éxito de compra premium.
 * - Fondo verde se expande desde el botón hasta cubrir la pantalla.
 * - Ícono animado (video MP4) centrado arriba del texto.
 * - Mensaje de éxito centrado.
 * - Accesibilidad y microinteracciones.
 */
function CheckoutSuccessOverlay({
  open,
  onClose,
  message,
  className = "",
  testId = "checkout-success-overlay",
  locale = "es",
  triggerPosition,
}: CheckoutSuccessOverlayProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const headingId = "checkout-success-heading";
  const [expand, setExpand] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const msg =
    typeof message === "string" ? message : DEFAULT_MESSAGE[locale ?? "es"];

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
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-auto transition-all duration-1000 ${
        expand ? "bg-[#009047]/90 backdrop-blur-sm" : "bg-[#009047]/0"
      } ${className}`}
      data-testid={testId}
      style={{
        transitionProperty: "background-color,backdrop-filter",
        transitionTimingFunction: "cubic-bezier(0.77,0,0.175,1)",
      }}
    >
      {/* Expansión radial premium desde el botón de finalizar pago */}
      <div
        className={`absolute w-24 h-12 rounded-full bg-[#009047] shadow-2xl ${
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
          boxShadow: "0 8px 64px #00904799",
        }}
        aria-hidden="true"
      />
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
          {/* Mensaje de éxito */}
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
            onClick={() => {
              if (onClose) onClose();
              router.push("/tracking-service");
            }}
            className="mt-8 px-8 py-3 rounded-xl bg-white text-[#009047] text-lg font-bold shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009047] transition-all hover:bg-[#e6ffe6]"
            data-testid="checkout-success-continue"
            style={{ boxShadow: "0 2px 16px #00904733" }}
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
      `}</style>
    </div>
  );
}

CheckoutSuccessOverlay.displayName = "CheckoutSuccessOverlay";
export default React.memo(CheckoutSuccessOverlay);
