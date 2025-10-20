import React, { useState, useEffect } from "react";
import { ChecklistHeader } from "./ChecklistHeader";
import { ChecklistItemRow } from "./ChecklistItemRow";

interface ChecklistItem {
  name: string;
  completed: boolean;
  completedAt?: string;
  rating?: number;
  comments?: string;
  tally: number;
}

interface ChecklistsTabProps {
  sessionId: string;
  studentId: string;
  instructorId: string;
}

const DEFAULT_CHECKLIST_ITEMS = [
  "Seat & Headrest Adjustment",
  "Starting Car",
  "Mirror Adjustment",
  "Vehicle's Controls",
  "Acceleration",
  "Braking",
  "Steering Pull Push",
  "Scanning",
  "Blind Spots",
  "Judgement",
  "Hand Over Hand Steering",
  "Merging",
  "Traffic Driving",
  "motorway driving",
  "U Turns",
  "Hill Starts",
  "Turn Around Manouvre",
];

export const ChecklistsTab: React.FC<ChecklistsTabProps> = ({
  sessionId,
  studentId,
  instructorId,
}) => {
  const [items, setItems] = useState<ChecklistItem[]>(
    DEFAULT_CHECKLIST_ITEMS.map((name) => ({
      name,
      completed: false,
      tally: 0,
      rating: undefined,
      comments: "",
    }))
  );
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load existing checklist data on mount
  useEffect(() => {
    const loadChecklist = async () => {
      try {
        const res = await fetch(
          `/api/session-checklist?sessionId=${sessionId}`
        );
        const data = await res.json();

        if (
          data.checklist &&
          data.checklist.items &&
          data.checklist.items.length > 0
        ) {
          setItems(data.checklist.items);
        }
      } catch (error) {
        console.error("Error loading checklist:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    if (sessionId) {
      loadChecklist();
    } else {
      setIsInitialized(true);
    }
  }, [sessionId]);

  // Auto-save function with debounce
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      saveChecklist();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [items, isInitialized]);

  const saveChecklist = async () => {
    if (!sessionId || !studentId || !instructorId) {
      console.warn("Missing required IDs for saving checklist:", {
        sessionId,
        studentId,
        instructorId,
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        sessionId,
        studentId,
        instructorId,
        checklistType: "Driving Skills Basics",
        items,
      };

      const res = await fetch("/api/session-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setLastSaved(new Date());
      } else {
        console.error("Failed to save checklist.");
      }
    } catch (error) {
      console.error("Error saving checklist:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRowClick = (itemName: string) => {
    setExpandedItem(expandedItem === itemName ? null : itemName);
  };

  const handleRatingChange = (index: number, rating: number) => {
    const updatedItems = [...items];
    updatedItems[index].rating = rating;
    setItems(updatedItems);
  };

  const handleCommentsChange = (index: number, comments: string) => {
    const updatedItems = [...items];
    updatedItems[index].comments = comments;
    setItems(updatedItems);
  };

  const handleMarkComplete = (
    index: number,
    hasRating: boolean,
    hasComments: boolean
  ) => {
    const updatedItems = [...items];
    if (hasRating && hasComments) {
      updatedItems[index].completed = true;
      updatedItems[index].completedAt = new Date().toLocaleString();
      updatedItems[index].tally += 1;
    } else {
      updatedItems[index].completed = false;
      updatedItems[index].completedAt = undefined;
    }
    setItems(updatedItems);
  };

  return (
    <div className="space-y-4">
      <ChecklistHeader isSaving={isSaving} lastSaved={lastSaved} />

      <div className="space-y-2">
        {/* Table Header - Desktop only */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 rounded-t-lg font-semibold text-sm text-gray-700 sticky top-0 z-10">
          <div className="col-span-4">Item Name</div>
          <div className="col-span-2 text-center">Rating</div>
          <div className="col-span-3 text-center">Last Completed</div>
          <div className="col-span-2 text-center">Tally</div>
          <div className="col-span-1 text-center">Comments</div>
        </div>

        {/* Checklist Items */}
        {items.map((item, index) => (
          <ChecklistItemRow
            key={index}
            item={item}
            index={index}
            isExpanded={expandedItem === item.name}
            onRowClick={() => handleRowClick(item.name)}
            onRatingChange={(rating) => handleRatingChange(index, rating)}
            onCommentsChange={(comments) =>
              handleCommentsChange(index, comments)
            }
            onMarkComplete={(hasRating, hasComments) =>
              handleMarkComplete(index, hasRating, hasComments)
            }
          />
        ))}
      </div>
    </div>
  );
};
