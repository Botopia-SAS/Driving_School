"use client";

import React from 'react';
import Link from 'next/link';

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
        <Link 
          href="/PrivacyPolicy" 
          className="text-blue-600 hover:text-blue-800 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms and Conditions
        </Link>
      </label>
    </div>
  );
};

export default TermsCheckbox;