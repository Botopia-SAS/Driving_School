import React, { useState, useEffect, useCallback, useRef } from "react";
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
  classType?: string;
}

// Checklist for Driving Lessons
const DRIVING_LESSON_CHECKLIST_ITEMS = [
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
  "Motorway Driving",
  "U Turns",
  "Hill Starts",
  "Turn Around Manoeuvre",
  "Reversing along Curb",
  "Reverse Parallel Parking",
  "Car Park Parking",
  "Pedestrian Crossing",
  "Angle Parking",
  "Cornering",
  "Dirt Roads",
  "Driving in Bad Weather",
  "Refuelling",
  "Basic Vehicle Checks",
  "Areas",
  "SOVC",
  "Turning Left – On One Way Street",
  "Straight Line Backing",
  "Merging in Traffic",
  "Turns on Small Streets",
];

// Checklist for Driving Tests
const DRIVING_TEST_CHECKLIST_ITEMS = ["Seat Belt"];

export const ChecklistsTab: React.FC<ChecklistsTabProps> = ({
  sessionId,
  studentId,
  instructorId,
  classType = "driving lesson",
}) => {
  // Determine which checklist to use based on classType
  const getChecklistItems = () => {
    const normalizedClassType =
      classType?.toLowerCase().trim() || "driving lesson";
    if (normalizedClassType === "driving test") {
      return DRIVING_TEST_CHECKLIST_ITEMS;
    }
    return DRIVING_LESSON_CHECKLIST_ITEMS;
  };

  // Determine checklistType for API
  const getChecklistType = () => {
    const normalizedClassType =
      classType?.toLowerCase().trim() || "driving lesson";
    if (normalizedClassType === "driving test") {
      return "Driving Test Skills";
    }
    return "Driving Skills Basics";
  };

  const checklistItems = getChecklistItems();
  const checklistType = getChecklistType();

  const [items, setItems] = useState<ChecklistItem[]>(
    checklistItems.map((name) => ({
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

  // Use ref to track if a save is in progress without causing re-renders
  const saveInProgressRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const itemsRef = useRef(items);

  // Update itemsRef whenever items change
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Load existing checklist data on mount
  useEffect(() => {
    const loadChecklist = async () => {
      try {
        const res = await fetch(
          `/api/session-checklist?sessionId=${sessionId}&checklistType=${encodeURIComponent(
            checklistType
          )}`
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
  }, [sessionId, checklistType]);

  const saveChecklist = useCallback(async () => {
    if (!sessionId || !studentId || !instructorId) {
      console.warn("Missing required IDs for saving checklist:", {
        sessionId,
        studentId,
        instructorId,
      });
      return;
    }

    // Skip if already saving to prevent concurrent saves
    if (saveInProgressRef.current) {
      console.log("Save already in progress, skipping...");
      return;
    }

    // Mark as saving using ref (doesn't cause re-render)
    saveInProgressRef.current = true;

    // Only update UI state after a small delay to avoid disrupting dropdowns
    const savingIndicatorTimeout = setTimeout(() => {
      setIsSaving(true);
    }, 100);

    // Prepare payload using ref to get current items without triggering dependency
    const payload = {
      sessionId,
      studentId,
      instructorId,
      checklistType: checklistType,
      items: itemsRef.current,
    };

    // Save to server asynchronously without blocking
    fetch("/api/session-checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.ok) {
          setLastSaved(new Date());
        } else {
          console.error("Failed to save checklist. Status:", res.status);
        }
      })
      .catch((error) => {
        console.error("Error saving checklist:", error);
      })
      .finally(() => {
        clearTimeout(savingIndicatorTimeout);
        saveInProgressRef.current = false;
        setIsSaving(false);
      });
  }, [sessionId, studentId, instructorId, checklistType]);

  // Auto-save function with debounce - INCREASED to 3 seconds
  useEffect(() => {
    if (!isInitialized) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout with LONGER delay to prevent rapid saves
    saveTimeoutRef.current = setTimeout(() => {
      saveChecklist();
    }, 3000); // Increased from 1000ms to 3000ms

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [items, isInitialized, saveChecklist]);

  const handleRowClick = useCallback((itemName: string) => {
    setExpandedItem((prev) => prev === itemName ? null : itemName);
  }, []);

  const handleRatingChange = useCallback((index: number, rating: number) => {
    // Use functional update to avoid stale closures
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index].rating = rating;
      return updatedItems;
    });
  }, []);

  const handleCommentsChange = useCallback((index: number, comments: string) => {
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index].comments = comments;
      return updatedItems;
    });
  }, []);

  const handleMarkComplete = useCallback((
    index: number,
    hasRating: boolean,
    hasComments: boolean
  ) => {
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      if (hasRating && hasComments) {
        updatedItems[index].completed = true;
        updatedItems[index].completedAt = new Date().toLocaleString();
        updatedItems[index].tally += 1;
      } else {
        updatedItems[index].completed = false;
        updatedItems[index].completedAt = undefined;
      }
      return updatedItems;
    });
  }, []);

  return (
    <div className="space-y-4">
      <ChecklistHeader
        isSaving={isSaving}
        lastSaved={lastSaved}
        title={checklistType}
      />

      <div className="space-y-2">
        {/* Table Header - Desktop only */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 rounded-t-lg font-semibold text-sm text-gray-700 sticky top-0 z-10">
          <div className="col-span-3">Item Name</div>
          <div className="col-span-2 text-center">Rating</div>
          <div className="col-span-3 text-center">Last Completed</div>
          <div className="col-span-2 text-center">Tally</div>
          <div className="col-span-2 text-center">Comments</div>
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
