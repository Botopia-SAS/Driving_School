import React from 'react';
import type { Class as CalendarClass } from './types';
import { openNavigationLink } from './calendarUtils';

interface SessionDetailsCardProps {
  selectedBlock: CalendarClass;
  studentInfo: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  } | null;
}

export const SessionDetailsCard: React.FC<SessionDetailsCardProps> = ({
  selectedBlock,
  studentInfo
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
      {/* Header */}
      <div className="text-center mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
        <h2 className="text-lg sm:text-xl font-extrabold text-[#0056b3] tracking-wide">
          Session Details
        </h2>
        <div
          className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold mt-2 ${
            selectedBlock.status === 'scheduled'
              ? 'bg-blue-100 text-blue-700'
              : selectedBlock.status === 'cancelled'
              ? 'bg-red-100 text-red-700'
              : selectedBlock.status === 'pending'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {selectedBlock.status?.toUpperCase()}
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#27ae60] text-sm sm:text-base">Date:</span>
          <span className="text-gray-800 font-medium text-sm sm:text-base">
            {selectedBlock.date
              ? selectedBlock.date instanceof Date
                ? selectedBlock.date.toLocaleDateString()
                : new Date(selectedBlock.date).toLocaleDateString()
              : ''}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#27ae60] text-sm sm:text-base">Time:</span>
          <span className="text-gray-800 font-medium font-mono bg-gray-50 px-2 py-1 rounded text-xs sm:text-sm">
            {selectedBlock.start
              ? selectedBlock.start
              : selectedBlock.hour !== undefined
              ? `${selectedBlock.hour.toString().padStart(2, '0')}:00`
              : ''}
            {' - '}
            {selectedBlock.end
              ? selectedBlock.end
              : selectedBlock.hour !== undefined
              ? `${(selectedBlock.hour + 1).toString().padStart(2, '0')}:00`
              : ''}
          </span>
        </div>

        {selectedBlock.classType && (
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#0056b3] text-sm sm:text-base">Class Type:</span>
            <span className="capitalize text-gray-800 font-medium bg-blue-50 px-2 py-1 rounded text-xs sm:text-sm">
              {selectedBlock.classType}
            </span>
          </div>
        )}

        {selectedBlock.amount !== undefined && (
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#27ae60] text-sm sm:text-base">Amount:</span>
            <span className="text-gray-800 font-bold text-base sm:text-lg">
              ${selectedBlock.amount}
            </span>
          </div>
        )}
      </div>

      {/* Student Information */}
      {studentInfo && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
          <h3 className="font-bold text-[#0056b3] text-xs sm:text-sm mb-2 sm:mb-3">
            Student Information
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-2 sm:p-3 rounded-lg space-y-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                {studentInfo.firstName?.[0]}
                {studentInfo.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm sm:text-base text-gray-900 truncate">
                  {studentInfo.firstName} {studentInfo.lastName}
                </div>
                <div className="text-xs text-gray-600">Student</div>
              </div>
            </div>

            {studentInfo.email && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-white rounded text-xs sm:text-sm gap-1">
                <span className="font-semibold text-gray-600">Email</span>
                <a
                  href={`mailto:${studentInfo.email}`}
                  className="text-blue-600 hover:underline font-medium truncate"
                >
                  {studentInfo.email}
                </a>
              </div>
            )}

            {studentInfo.phone && (
              <div className="flex items-center justify-between p-2 bg-white rounded text-xs sm:text-sm">
                <span className="font-semibold text-gray-600">Phone</span>
                <a
                  href={`tel:${studentInfo.phone}`}
                  className="text-green-600 hover:underline font-medium"
                >
                  {studentInfo.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Locations */}
      {(selectedBlock.pickupLocation || selectedBlock.dropoffLocation) && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 space-y-2 sm:space-y-3">
          {selectedBlock.pickupLocation && (
            <div>
              <span className="text-xs sm:text-sm font-semibold text-gray-600 block mb-1">
                Pickup Location
              </span>
              <div className="bg-gray-50 p-2 rounded text-xs sm:text-sm">
                <div className="text-gray-800 mb-2 break-words">
                  {selectedBlock.pickupLocation}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      openNavigationLink(selectedBlock.pickupLocation!, 'maps')
                    }
                    className="flex-1 sm:flex-none px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                  >
                    Google Maps
                  </button>
                  <button
                    onClick={() =>
                      openNavigationLink(selectedBlock.pickupLocation!, 'waze')
                    }
                    className="flex-1 sm:flex-none px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                  >
                    Waze
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedBlock.dropoffLocation && (
            <div>
              <span className="text-xs sm:text-sm font-semibold text-gray-600 block mb-1">
                Dropoff Location
              </span>
              <div className="bg-gray-50 p-2 rounded text-xs sm:text-sm">
                <div className="text-gray-800 mb-2 break-words">
                  {selectedBlock.dropoffLocation}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      openNavigationLink(selectedBlock.dropoffLocation!, 'maps')
                    }
                    className="flex-1 sm:flex-none px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                  >
                    Google Maps
                  </button>
                  <button
                    onClick={() =>
                      openNavigationLink(selectedBlock.dropoffLocation!, 'waze')
                    }
                    className="flex-1 sm:flex-none px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                  >
                    Waze
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
