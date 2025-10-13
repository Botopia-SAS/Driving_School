"use client";

import React from "react";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:p-8"
      onClick={onClose}
      style={{
        margin: '0',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="relative bg-white text-black rounded-3xl shadow-2xl border border-gray-300 max-h-[90vh] flex flex-col w-full"
        style={{
          maxWidth: '960px',
          minWidth: '320px',
          overflow: 'hidden',
          margin: '0',
          padding: '0',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cierre mejorado */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 z-[9999] transition-all duration-300 bg-red-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close modal"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-600 hover:text-gray-900"
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

export default LocationModal;
