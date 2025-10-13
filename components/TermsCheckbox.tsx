"use client";

import React from 'react';

interface TermsCheckboxProps {
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

const TermsCheckbox: React.FC<TermsCheckboxProps> = ({
  isChecked,
  onChange,
  className = ""
}) => {
  // Abrir en nueva pestaña con window.open para mantener la relación window.opener
  const openInNewTab = (path: string, modal: string) => {
    if (typeof window === 'undefined') return;

    const currentUrl = window.location.href;
    const scrollY = window.scrollY || 0;
    const url = `${path}?from=${encodeURIComponent(currentUrl)}&modal=${encodeURIComponent(modal)}&scroll=${scrollY}`;

    // NO usar 'noopener' para mantener la relación window.opener
    // Esto permite que window.close() funcione en la ventana hija
    window.open(url, '_blank', 'noreferrer');
  };

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <input
        type="checkbox"
        id="terms-checkbox"
        checked={isChecked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <label htmlFor="terms-checkbox" className="text-sm text-gray-700 cursor-pointer">
        I accept the{' '}
        <button
          type="button"
          onClick={() => openInNewTab('/TermsOfServices', 'tos')}
          className="text-blue-600 hover:text-blue-800 underline cursor-pointer bg-transparent border-none p-0 font-inherit"
        >
          Terms and Conditions
        </button>
        {' '}and{' '}
        <button
          type="button"
          onClick={() => openInNewTab('/PrivacyPolicy', 'privacy')}
          className="text-blue-600 hover:text-blue-800 underline cursor-pointer bg-transparent border-none p-0 font-inherit"
        >
          Privacy Policy
        </button>
      </label>
    </div>
  );
};

export default TermsCheckbox;