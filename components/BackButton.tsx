"use client";
import React from "react";

interface BackButtonProps {
  className?: string;
  label?: string;
}

const BackButton: React.FC<BackButtonProps> = ({
  className = "",
  label = "Back",
}) => {
  const onBack = () => {
    if (typeof window === "undefined") return;

    // Intentar cerrar la ventana/pestaña
    // Esto funciona si la ventana fue abierta con window.open() o como popup
    window.close();

    // Si window.close() no funciona (la pestaña no se cierra),
    // usar history.back() como fallback
    setTimeout(() => {
      // Si la ventana no se cerró, navegar hacia atrás
      if (!window.closed) {
        window.history.back();
      }
    }, 100);
  };

  return (
    <button
      onClick={onBack}
      className={`flex items-center px-4 py-2 bg-white border-2 border-green-600 rounded-md text-green-600 font-semibold text-base shadow hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400 ${className}`}
      aria-label={label}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        className="mr-2"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.5 15L8 10L12.5 5"
          stroke="#27ae60"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
};

export default BackButton;
