import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import type { Class as CalendarClass } from './types';
import { normalizeType, openNavigationLink } from './calendarUtils';
import { SessionTabsContainer } from './SessionTabsContainer';

interface CalendarModalContentProps {
  selectedBlock: CalendarClass | null;
  studentInfo: { firstName?: string; lastName?: string; email?: string; phone?: string; address?: string; emergencyContact?: string } | null;
  ticketClassInfo: unknown;
  drivingClassInfo: unknown;
  locationInfo: unknown;
  studentsInfo: unknown[];
  loadingExtra: boolean;
  instructorId?: string;
}

export const CalendarModalContent: React.FC<CalendarModalContentProps> = ({
  selectedBlock,
  studentInfo,
  ticketClassInfo,
  drivingClassInfo,
  locationInfo,
  studentsInfo,
  loadingExtra,
  instructorId
}) => {
  if (!selectedBlock) return null;

  // For regular driving lessons/tests with a student, use the new tabbed interface
  const isRegularLesson = selectedBlock.studentId &&
    !['ticket class', 'D.A.T.E.', 'A.D.I.', 'B.D.I.'].includes(normalizeType(selectedBlock.classType ?? ''));

  if (isRegularLesson) {
    return (
      <div className="w-full py-3 px-2 sm:py-4 sm:px-4" style={{ minWidth: '0' }}>
        <SessionTabsContainer
          selectedBlock={selectedBlock}
          studentInfo={studentInfo}
          instructorId={instructorId}
        />
      </div>
    );
  }

  // For ticket classes and sessions without students, show the original view
  return (
    <div className="py-4 px-4 w-full" style={{ minWidth: '0', width: '100%' }}>
      <div className="text-center mb-4">
        <h2 className="text-xl font-extrabold text-[#0056b3] tracking-wide">Session Details</h2>
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
          selectedBlock.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
          selectedBlock.status === 'cancelled' ? 'bg-red-100 text-red-700' :
          selectedBlock.status === 'pending' ? 'bg-orange-100 text-orange-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {selectedBlock.status?.toUpperCase()}
        </div>
      </div>
      <div className="space-y-3 w-full">
        {/* Basic Session Info */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#27ae60]">Date:</span>
            <span className="text-gray-800 font-medium">
              {selectedBlock.date ? (selectedBlock.date instanceof Date ? selectedBlock.date.toLocaleDateString() : new Date(selectedBlock.date).toLocaleDateString()) : ''}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#27ae60]">Time:</span>
            <span className="text-gray-800 font-medium font-mono bg-white px-2 py-1 rounded">
              {selectedBlock.start ? selectedBlock.start : (selectedBlock.hour !== undefined ? `${selectedBlock.hour.toString().padStart(2, '0')}:00` : '')}
              {' - '}
              {selectedBlock.end ? selectedBlock.end : (selectedBlock.hour !== undefined ? `${(selectedBlock.hour + 1).toString().padStart(2, '0')}:00` : '')}
            </span>
          </div>
          {selectedBlock.classType && (
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#0056b3]">Class Type:</span>
              <span className="capitalize text-gray-800 font-medium bg-blue-50 px-2 py-1 rounded">
                {selectedBlock.classType}
              </span>
            </div>
          )}
          {selectedBlock.amount !== undefined && (
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#27ae60]">Amount:</span>
              <span className="text-gray-800 font-bold text-lg">${selectedBlock.amount}</span>
            </div>
          )}
          {selectedBlock.paymentMethod && (
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#0056b3]">Payment Method:</span>
              <span className="text-gray-800 font-medium capitalize">{selectedBlock.paymentMethod}</span>
            </div>
          )}
        </div>

        {/* DRIVING TEST: igual que antes */}
        {selectedBlock.classType === 'driving test' && (
          <div className="rounded-xl border border-[#f39c12] bg-[#fff7e6] p-3 space-y-2">
            <div className="font-bold text-[#f39c12] text-base border-b border-orange-200 pb-1">Driving Test Details</div>

            {selectedBlock.pickupLocation && (
              <div className="space-y-2">
                <span className="font-semibold text-[#0056b3] block">Pickup Location:</span>
                <div className="bg-white p-3 rounded border">
                  <div className="text-gray-800 mb-2">{selectedBlock.pickupLocation}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openNavigationLink(selectedBlock.pickupLocation!, 'maps')}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    >
                      Google Maps
                    </button>
                    <button
                      onClick={() => openNavigationLink(selectedBlock.pickupLocation!, 'waze')}
                      className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                    >
                      Waze
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedBlock.dropoffLocation && (
              <div className="space-y-2">
                <span className="font-semibold text-[#0056b3] block">Dropoff Location:</span>
                <div className="bg-white p-3 rounded border">
                  <div className="text-gray-800 mb-2">{selectedBlock.dropoffLocation}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openNavigationLink(selectedBlock.dropoffLocation!, 'maps')}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    >
                      Google Maps
                    </button>
                    <button
                      onClick={() => openNavigationLink(selectedBlock.dropoffLocation!, 'waze')}
                      className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                    >
                      Waze
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <span className="font-semibold text-[#0056b3]">Payment Status:</span>
              {selectedBlock.paid ? (
                <span className="inline-flex items-center gap-2 text-green-600 font-bold">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-red-500 font-bold">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  Unpaid
                </span>
              )}
            </div>
          </div>
        )}

        {/* Ticket Classes - Info avanzada */}
        {['ticket class', 'D.A.T.E.', 'A.D.I.', 'B.D.I.'].includes(normalizeType(selectedBlock.classType ?? '')) && (
          <div className="rounded-xl border border-[#0056b3] bg-[#e3f6fc] p-3 mt-2 space-y-2 animate-fade-in">
            {loadingExtra ? (
              <div className="flex items-center gap-2 text-[#0056b3] font-bold"><LoadingSpinner /> Loading class details...</div>
            ) : (
              <>
                <div className="font-bold text-[#0056b3] text-lg mb-2">Class Group Details</div>
                <div><span className="font-semibold">Class Name:</span> <span className="text-gray-800">{(drivingClassInfo as { title?: string })?.title || <span className="italic text-gray-400">Not found</span>}</span></div>
                <div><span className="font-semibold">Location:</span> <span className="text-gray-800">{(locationInfo as { title?: string })?.title || <span className="italic text-gray-400">Not found</span>}</span></div>
                <div><span className="font-semibold">Total Spots:</span> <span className="text-gray-800">{(ticketClassInfo as { cupos?: number })?.cupos ?? <span className="italic text-gray-400">?</span>}</span></div>
                <div><span className="font-semibold">Occupied:</span> <span className="text-gray-800">{studentsInfo.length}</span></div>
                <div className="font-semibold mt-2 mb-1">Students:</div>
                {studentsInfo.length === 0 ? (
                  <div className="italic text-gray-400">No students enrolled yet.</div>
                ) : (
                  <ul className="divide-y divide-[#b2f2d7]">
                    {studentsInfo.map((s, idx) => {
                      const student = s as { _id?: string; firstName?: string; lastName?: string; email?: string };
                      return (
                        <li key={student._id || idx} className="py-1 flex flex-col sm:flex-row sm:items-center gap-1">
                          <span className="font-bold text-[#0056b3]">{student.firstName} {student.lastName}</span>
                          <span className="text-gray-600 text-sm">{student.email}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        )}

        {/* Student Information Section */}
        {!['ticket class', 'D.A.T.E.', 'A.D.I.', 'B.D.I.'].includes(normalizeType(selectedBlock.classType ?? '')) && (
          selectedBlock.studentId ? (
            <div className="border-t border-gray-200 pt-3">
              <h3 className="font-bold text-[#0056b3] text-base mb-2">Student Information</h3>
              {studentInfo ? (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {studentInfo.firstName?.[0]}{studentInfo.lastName?.[0]}
                    </div>
                    <div>
                      <div className="font-bold text-lg text-gray-900">{studentInfo.firstName} {studentInfo.lastName}</div>
                      <div className="text-sm text-gray-600">Student</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-sm font-semibold text-gray-600">Email</span>
                      <a href={`mailto:${studentInfo.email}`} className="text-blue-600 hover:underline text-sm font-medium">
                        {studentInfo.email}
                      </a>
                    </div>

                    {studentInfo.phone && (
                      <div className="flex items-center justify-between p-2 bg-white rounded border">
                        <span className="text-sm font-semibold text-gray-600">Phone</span>
                        <a href={`tel:${studentInfo.phone}`} className="text-green-600 hover:underline text-sm font-medium">
                          {studentInfo.phone}
                        </a>
                      </div>
                    )}

                    {selectedBlock.pickupLocation && (
                      <div className="p-2 bg-white rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-600">Pickup Location</span>
                        </div>
                        <div className="text-sm text-gray-800 mb-2">{selectedBlock.pickupLocation}</div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openNavigationLink(selectedBlock.pickupLocation!, 'maps')}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                          >
                            Google Maps
                          </button>
                          <button
                            onClick={() => openNavigationLink(selectedBlock.pickupLocation!, 'waze')}
                            className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                          >
                            Waze
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedBlock.dropoffLocation && (
                      <div className="p-2 bg-white rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-600">Dropoff Location</span>
                        </div>
                        <div className="text-sm text-gray-800 mb-2">{selectedBlock.dropoffLocation}</div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openNavigationLink(selectedBlock.dropoffLocation!, 'maps')}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                          >
                            Google Maps
                          </button>
                          <button
                            onClick={() => openNavigationLink(selectedBlock.dropoffLocation!, 'waze')}
                            className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                          >
                            Waze
                          </button>
                        </div>
                      </div>
                    )}

                    {studentInfo.emergencyContact && (
                      <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                        <span className="text-sm font-semibold text-red-600">Emergency Contact</span>
                        <a href={`tel:${studentInfo.emergencyContact}`} className="text-red-600 hover:underline font-medium text-sm">
                          {studentInfo.emergencyContact}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner />
                  <span className="ml-2 text-gray-600">Loading student information...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-4">
              <div className="text-center py-4 text-gray-400">
                <div className="text-lg font-semibold">No Student Assigned</div>
                <div className="text-sm">This session is available for booking</div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};