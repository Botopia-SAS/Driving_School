import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={onClose}
    >
      <div
        className="relative bg-white text-black rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col mx-4"
        style={{
          minWidth: '350px',
          maxWidth: '500px',
          width: '90vw',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cierre mejorado */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 z-[9999] transition-all duration-300 bg-red-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-600 hover:text-gray-900"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {children}
      </div>
    </div>
  );
};

export default Modal;