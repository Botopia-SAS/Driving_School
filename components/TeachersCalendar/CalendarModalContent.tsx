import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import type { Class as CalendarClass } from './types';
import { normalizeType, openNavigationLink } from './calendarUtils';

interface CalendarModalContentProps {
  selectedBlock: CalendarClass | null;
  studentInfo: { firstName?: string; lastName?: string; email?: string; phone?: string; address?: string; emergencyContact?: string } | null;
  ticketClassInfo: unknown;
  drivingClassInfo: unknown;
  locationInfo: unknown;
  studentsInfo: unknown[];
  loadingExtra: boolean;
}

export const CalendarModalContent: React.FC<CalendarModalContentProps> = ({
  selectedBlock,
  studentInfo,
  ticketClassInfo,
  drivingClassInfo,
  locationInfo,
  studentsInfo,
  loadingExtra
}) => {
  if (!selectedBlock) return null;

  return (
    <div className="py-6 px-2 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-[#e0e0e0] mx-auto flex flex-col items-center justify-center" style={{ minWidth: '0', width: '100%' }}>
      <h2 className="text-2xl font-extrabold mb-6 text-[#0056b3] text-center tracking-wide">Class Details</h2>
      <div className="space-y-3 w-full">
        <div><span className="font-semibold text-[#27ae60]">Date:</span> <span className="text-gray-800">{selectedBlock.date ? (selectedBlock.date instanceof Date ? selectedBlock.date.toLocaleDateString() : new Date(selectedBlock.date).toLocaleDateString()) : ''}</span></div>
        <div><span className="font-semibold text-[#27ae60]">Start Hour:</span> <span className="text-gray-800">{selectedBlock.start ? selectedBlock.start : (selectedBlock.hour !== undefined ? `${selectedBlock.hour.toString().padStart(2, '0')}:00` : '')}</span></div>
        <div><span className="font-semibold text-[#27ae60]">End Hour:</span> <span className="text-gray-800">{selectedBlock.end ? selectedBlock.end : (selectedBlock.hour !== undefined ? `${(selectedBlock.hour + 1).toString().padStart(2, '0')}:00` : '')}</span></div>
        <div><span className="font-semibold text-[#0056b3]">Status:</span> <span className="capitalize text-gray-800">{selectedBlock.status}</span></div>
        {selectedBlock.classType && (
          <div><span className="font-semibold text-[#0056b3]">Class Type:</span> <span className="capitalize text-gray-800">{selectedBlock.classType}</span></div>
        )}

        {/* DRIVING TEST: igual que antes */}
        {selectedBlock.classType === 'driving test' && (
          <div className="rounded-xl border border-[#f39c12] bg-[#fff7e6] p-3 mt-2 space-y-2">
            <div className="font-bold text-[#f39c12] text-lg">Driving Test Details</div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0056b3]">Pickup Location:</span>
              {selectedBlock.pickupLocation ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-800">{selectedBlock.pickupLocation}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openNavigationLink(selectedBlock.pickupLocation!, 'maps')}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                      title="Open in Google Maps"
                    >
                      🗺️ Maps
                    </button>
                    <button
                      onClick={() => openNavigationLink(selectedBlock.pickupLocation!, 'waze')}
                      className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                      title="Open in Waze"
                    >
                      🚗 Waze
                    </button>
                  </div>
                </div>
              ) : (
                <span className="italic text-gray-400">Not specified</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0056b3]">Dropoff Location:</span>
              {selectedBlock.dropoffLocation ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-800">{selectedBlock.dropoffLocation}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openNavigationLink(selectedBlock.dropoffLocation!, 'maps')}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                      title="Open in Google Maps"
                    >
                      🗺️ Maps
                    </button>
                    <button
                      onClick={() => openNavigationLink(selectedBlock.dropoffLocation!, 'waze')}
                      className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                      title="Open in Waze"
                    >
                      🚗 Waze
                    </button>
                  </div>
                </div>
              ) : (
                <span className="italic text-gray-400">Not specified</span>
              )}
            </div>
            <div><span className="font-semibold text-[#0056b3]">Amount:</span> <span className="text-gray-800">{selectedBlock.amount !== undefined ? `$${selectedBlock.amount}` : <span className="italic text-gray-400">Not specified</span>}</span></div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0056b3]">Paid:</span>
              {selectedBlock.paid ? (
                <span className="inline-flex items-center gap-1 text-green-600 font-bold"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Paid</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-red-500 font-bold"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Not Paid</span>
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

        {!['ticket class', 'D.A.T.E.', 'A.D.I.', 'B.D.I.'].includes(normalizeType(selectedBlock.classType ?? '')) && (
          selectedBlock.studentId ? (
            <div className="pt-2 border-t border-gray-200">
              <span className="font-semibold text-[#0056b3] text-lg mb-2 block">Student Information:</span>
              {studentInfo ? (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👤</span>
                    <span className="text-gray-900 font-bold text-lg">{studentInfo.firstName} {studentInfo.lastName}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">📧</span>
                      <span className="text-gray-700">{studentInfo.email}</span>
                    </div>

                    {studentInfo.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">📞</span>
                        <a href={`tel:${studentInfo.phone}`} className="text-blue-600 hover:underline">
                          {studentInfo.phone}
                        </a>
                      </div>
                    )}

                    {studentInfo.address && (
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600">🏠</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">{studentInfo.address}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openNavigationLink(studentInfo.address!, 'maps')}
                              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                              title="Navigate to student address"
                            >
                              🗺️
                            </button>
                            <button
                              onClick={() => openNavigationLink(studentInfo.address!, 'waze')}
                              className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                              title="Navigate with Waze"
                            >
                              🚗
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {studentInfo.emergencyContact && (
                      <div className="flex items-center gap-2">
                        <span className="text-red-600">🚨</span>
                        <span className="text-gray-700">
                          Emergency: <a href={`tel:${studentInfo.emergencyContact}`} className="text-red-600 hover:underline font-medium">
                            {studentInfo.emergencyContact}
                          </a>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <LoadingSpinner />
              )}
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-200 text-gray-400"><span className="font-semibold">Student:</span> Not assigned</div>
          )
        )}
      </div>
    </div>
  );
};