import React from "react";

interface ChecklistHeaderProps {
  isSaving: boolean;
  lastSaved: Date | null;
}

export const ChecklistHeader: React.FC<ChecklistHeaderProps> = ({
  isSaving,
  lastSaved,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-3 sm:p-4 rounded-lg border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#0056b3]">
            Driving Skills Basics
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Track progress and add notes for each skill
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          {isSaving ? (
            <span className="text-blue-600 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </span>
          ) : lastSaved ? (
            <span className="text-green-600 flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Saved
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-blue-600 bg-blue-100 px-2 sm:px-3 py-2 rounded-lg">
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
        <span className="font-medium">
          <span className="hidden sm:inline">Click on any row to add comments • Auto-saves every second</span>
          <span className="sm:hidden">Tap row to add notes • Auto-save</span>
        </span>
      </div>
    </div>
  );
};
