"use client";

import React from 'react';

interface ClassTypeSelectorProps {
  selectedClassType: string;
  onClassTypeChange: (type: string) => void;
}

const ClassTypeSelector: React.FC<ClassTypeSelectorProps> = ({
  selectedClassType,
  onClassTypeChange
}) => {
  const classTypes = [
    { value: "ticket class", label: "Ticket Classes", color: "bg-green-500" },
    { value: "driving lesson", label: "Driving Lessons", color: "bg-blue-500" },
    { value: "driving test", label: "Driving Tests", color: "bg-orange-500" }
  ];

  return (
    <div className="mb-4 w-full">
      <h3 className="text-lg font-semibold text-center mb-3 text-blue-600">Select Class Type</h3>
      <div className="grid grid-cols-3 gap-2">
        {classTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => onClassTypeChange(type.value)}
            className={`py-2 px-4 rounded-lg font-medium transition-all ${
              selectedClassType === type.value
                ? `${type.color} text-white`
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ClassTypeSelector;
