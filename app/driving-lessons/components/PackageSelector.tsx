"use client";

import React from "react";
import Calendar from "react-calendar";
import Image from "next/image";
import "react-calendar/dist/Calendar.css";

type CalendarValue = Date | null | (Date | null)[];

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  buttonLabel: string;
  category: string;
  duration?: number;
  media?: string[];
}


interface Instructor {
  _id: string;
  name: string;
  photo?: string;
  email?: string;
  schedule_driving_lesson?: ScheduleEntry[];
}

interface ScheduleEntry {
  date: string;
  start: string;
  end: string;
  status: string;
  classType?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  selectedProduct?: string;
  studentId?: string;
  studentName?: string;
  paid?: boolean;
}

interface PackageSelectorProps {
  selectedDate: Date | null;
  onDateChange: (value: CalendarValue) => void;
  products: Product[];
  selectedProduct: Product | null;
  onProductSelect: (product: Product | null) => void;
  instructors: Instructor[];
  selectedInstructorForSchedule: Instructor | null;
  onInstructorSelect: (instructor: Instructor | null) => void;
}

export default function PackageSelector({
  selectedDate,
  onDateChange,
  products,
  selectedProduct,
  onProductSelect,
  instructors,
  selectedInstructorForSchedule,
  onInstructorSelect
}: PackageSelectorProps) {
  return (
    <div className="w-full lg:w-1/3 flex flex-col items-center mt-8 sm:mt-12">
      
      {/* Calendar Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 text-[#10B981]">
        Select Date
      </h2>
      
      {/* Calendar */}
      <div className="mb-4 w-full flex justify-center">
        <Calendar
          onChange={onDateChange}
          value={selectedDate}
          locale="en-US"
          className="border rounded-lg shadow-md w-full max-w-xs p-2"
          minDate={new Date()}
        />
      </div>


      {/* Available Driving Packages Title */}
      <h3 className="text-lg sm:text-xl font-semibold text-center mb-4 text-black">
        Available Driving Packages
      </h3>

      {/* Packages Dropdown */}
      <div className="w-full mb-4">
        <select
          value={selectedProduct?._id || ""}
          onChange={(e) => {
            const selectedId = e.target.value;
            const product = products.find(p => p._id === selectedId);
            onProductSelect(product || null);
          }}
          className="w-full p-4 border-2 border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg bg-white text-black font-medium"
        >
          <option value="" className="text-black text-lg">Select a driving package...</option>
          {products.map((product) => (
            <option key={product._id} value={product._id} className="text-black text-lg">
              {product.title} - ${product.price} ({product.duration || 0} hrs)
            </option>
          ))}
        </select>
      </div>

      {/* Instructors */}
      <div className="w-full mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-center mb-4 text-black">
          Instructors
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 justify-center">
          {instructors.map((instructor) => {
            const isSelected = selectedInstructorForSchedule?._id === instructor._id;

            return (
              <div
                key={instructor._id}
                className={`border-2 rounded-lg p-3 text-center bg-white shadow-lg cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl hover:scale-105 flex-shrink-0 w-[110px] ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
                onClick={() => onInstructorSelect(isSelected ? null : instructor)}
              >
                <div className="relative mb-2">
                  <Image
                    src={instructor.photo || '/default-instructor.png'}
                    alt={instructor.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full mx-auto object-cover border border-white shadow-md"
                  />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </div>
                <h4 className="font-semibold text-sm text-gray-800 truncate capitalize">{instructor.name}</h4>
              </div>
            );
          })}
        </div>
        
        {/* Show count when many instructors */}
        {instructors.length > 2 && (
          <div className="text-center mt-3">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {instructors.length} instructors available
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
