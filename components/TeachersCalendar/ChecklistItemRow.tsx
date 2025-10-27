import React from "react";
import { ChecklistItemComments } from "./ChecklistItemComments";

interface ChecklistItem {
  name: string;
  completed: boolean;
  completedAt?: string;
  rating?: number;
  comments?: string;
  tally: number;
}

interface ChecklistItemRowProps {
  item: ChecklistItem;
  index: number;
  isExpanded: boolean;
  onRowClick: () => void;
  onRatingChange: (rating: number) => void;
  onCommentsChange: (comments: string) => void;
  onMarkComplete: (hasRating: boolean, hasComments: boolean) => void;
}

export const ChecklistItemRow: React.FC<ChecklistItemRowProps> = React.memo(({
  item,
  isExpanded,
  onRowClick,
  onRatingChange,
  onCommentsChange,
  onMarkComplete,
}) => {
  const handleRatingSelect = (value: string) => {
    // Prevent if value hasn't changed
    if (value === String(item.rating || '')) {
      return;
    }

    const rating = value ? parseInt(value) : 0;
    onRatingChange(rating);

    // Use setTimeout to ensure state updates don't interfere with dropdown
    setTimeout(() => {
      onMarkComplete(!!value, !!item.comments);
    }, 0);
  };

  const handleCommentsUpdate = (comments: string) => {
    onCommentsChange(comments);
    onMarkComplete(!!item.rating, !!comments);
  };

  const ExpandIcon = () => (
    <div
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
        isExpanded
          ? "bg-blue-500 text-white"
          : item.comments
          ? "bg-green-100 text-green-600"
          : "bg-gray-100 text-gray-400"
      }`}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
        />
      </svg>
    </div>
  );

  const RatingSelector = ({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => (
    <select
      value={item.rating || ""}
      onChange={(e) => handleRatingSelect(e.target.value)}
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 cursor-pointer"
    >
      <option value="">-</option>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
        <option key={num} value={num}>
          {num}
        </option>
      ))}
    </select>
  );

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg transition-all ${
        isExpanded
          ? "shadow-lg border-blue-300"
          : "hover:shadow-md hover:border-gray-300"
      }`}
    >
      {/* Desktop View */}
      <div
        className="hidden md:grid grid-cols-12 gap-2 p-3 items-center cursor-pointer"
        onClick={onRowClick}
      >
        <div className="col-span-3 flex items-center gap-2">
          <span
            className={`text-sm ${
              item.rating && item.comments
                ? "text-gray-500 line-through"
                : "text-gray-900 font-medium"
            }`}
          >
            {item.name}
          </span>
        </div>

        <div
          className="col-span-2 flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <RatingSelector onClick={(e) => e.stopPropagation()} />
        </div>

        <div className="col-span-3 text-center text-xs text-gray-600">
          {item.completedAt || "-"}
        </div>

        <div className="col-span-2 flex items-center justify-center">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
            {item.tally}
          </span>
        </div>

        <div className="col-span-2 flex items-center justify-center">
          <ExpandIcon />
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden p-3 cursor-pointer" onClick={onRowClick}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <h4
              className={`text-sm font-medium ${
                item.rating && item.comments
                  ? "text-gray-500 line-through"
                  : "text-gray-900"
              }`}
            >
              {item.name}
            </h4>
            {item.completedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Completed: {item.completedAt}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <ExpandIcon />
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-600 mb-1">
              Rating
            </label>
            <select
              value={item.rating || ""}
              onChange={(e) => handleRatingSelect(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="px-2 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 cursor-pointer"
            >
              <option value="">-</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-center justify-center">
            <label className="text-xs font-semibold text-gray-600 mb-1">
              Tally
            </label>
            <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 rounded-full font-bold text-base">
              {item.tally}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Comments */}
      {isExpanded && (
        <ChecklistItemComments
          itemName={item.name}
          comments={item.comments || ""}
          onCommentsChange={handleCommentsUpdate}
        />
      )}
    </div>
  );
});

ChecklistItemRow.displayName = 'ChecklistItemRow';
