import React from "react";

interface ChecklistItemCommentsProps {
  itemName: string;
  comments: string;
  onCommentsChange: (comments: string) => void;
}

export const ChecklistItemComments: React.FC<ChecklistItemCommentsProps> = ({
  itemName,
  comments,
  onCommentsChange,
}) => {
  return (
    <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            <span className="hidden sm:inline">Comments for {itemName}</span>
            <span className="sm:hidden">Comments</span>
          </span>
        </div>
      </div>
      <textarea
        value={comments || ""}
        onChange={(e) => onCommentsChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder="Add specific notes, observations, or areas to improve..."
        className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 bg-white shadow-sm"
        rows={3}
      />
      <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="hidden sm:inline">Click anywhere outside to collapse</span>
          <span className="sm:hidden">Tap outside to close</span>
        </div>
        <div className="text-xs text-gray-500">
          {comments?.length || 0} characters
        </div>
      </div>
    </div>
  );
};
