import React from "react";

export const CancelFallback: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-500 mb-4"></div>
        <p className="text-gray-600">Processing cancellation...</p>
      </div>
    </div>
  );
};
