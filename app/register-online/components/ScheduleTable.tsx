"use client";

import React, { useState, useEffect } from 'react';

interface Slot {
  _id: string;
  start: string;
  end: string;
  status: 'free' | 'scheduled' | 'cancelled' | 'available';
  studentId?: string;
  booked?: boolean;
  classType?: string;
  ticketClassId?: string;
}

interface Schedule {
  date: string;
  slots: Slot[];
}

interface Instructor {
  _id: string;
  name: string;
  schedule?: Schedule[];
}

interface ScheduleTableProps {
  selectedInstructor: Instructor | null;
  selectedDate: Date | null;
  selectedClassType: string;
  weekOffset: number;
  userId: string;
  onSlotClick: (slot: { start: string; end: string; date: string; ticketClassId?: string }) => void;
  getCompleteClassInfo: (ticketClassId: string) => any;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({
  selectedInstructor,
  selectedDate,
  selectedClassType,
  weekOffset,
  userId,
  onSlotClick,
  getCompleteClassInfo
}) => {
  const pad = (n: number) => n.toString().padStart(2, '0');

  const getWeekDates = (date: Date) => {
    const base = new Date(date);
    base.setDate(base.getDate() + weekOffset * 7);
    const startOfWeek = new Date(base);
    startOfWeek.setDate(base.getDate() - startOfWeek.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  // Function to group consecutive slots into blocks
  const groupSlots = (slots: Slot[]) => {
    if (!slots || slots.length === 0) return [];
    
    const sortedSlots = [...slots].sort((a, b) => {
      const toMinutes = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
      };
      return toMinutes(a.start) - toMinutes(b.start);
    });

    const groups: Slot[][] = [];
    let currentGroup: Slot[] = [sortedSlots[0]];

    for (let i = 1; i < sortedSlots.length; i++) {
      const current = sortedSlots[i];
      const last = currentGroup[currentGroup.length - 1];
      
      if (last.end === current.start && 
          last.status === current.status && 
          last.ticketClassId === current.ticketClassId &&
          last.booked === current.booked &&
          last.studentId === current.studentId) {
        currentGroup.push(current);
      } else {
        groups.push(currentGroup);
        currentGroup = [current];
      }
    }
    groups.push(currentGroup);
    
    return groups.map(group => ({
      start: group[0].start,
      end: group[group.length - 1].end,
      status: group[0].status,
      ticketClassId: group[0].ticketClassId,
      booked: group[0].booked,
      studentId: group[0].studentId,
      _id: group[0]._id,
      classType: group[0].classType,
      slots: group
    }));
  };

  // Component to render simple class info in table
  const SimpleClassInfo = ({ ticketClassId }: { ticketClassId?: string }) => {
    if (!ticketClassId) return null;
    
    const classInfo = getCompleteClassInfo(ticketClassId);
    
    if (!classInfo) {
      return (
        <div className="text-xs mt-1">
          <div className="font-semibold">Loading...</div>
        </div>
      );
    }
    
    return (
      <div className="text-xs mt-1">
        <div className="font-semibold">Available</div>
        <div className="text-gray-600">{classInfo.registeredCount}/{classInfo.cupos}</div>
      </div>
    );
  };

  if (!selectedInstructor || !selectedDate) {
    const weekDates = getWeekDates(selectedDate || new Date());
    const allTimes: string[] = [];
    for (let h = 6; h < 20; h++) {
      allTimes.push(`${h}:00-${h}:30`);
      allTimes.push(`${h}:30-${h+1}:00`);
    }
    
    return (
      <div className="overflow-x-auto w-full mt-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="border border-gray-300 p-2 text-black">Time</th>
              {weekDates.map((date) => (
                <th
                  key={date.toDateString()}
                  className="border border-gray-300 p-2 text-black"
                >
                  <span className="block font-bold text-black">
                    {date.toLocaleDateString("en-US", { weekday: "long" })}
                  </span>
                  <span className="block text-black">
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allTimes.map((time, index) => (
              <tr key={index} className="text-center">
                <td className="border border-gray-300 p-2 font-bold text-black">{time}</td>
                {weekDates.map((date) => (
                  <td key={date.toDateString()} className="border border-gray-300 py-1 bg-gray-300 text-black">-</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-gray-400 text-center mt-4">
          Select an instructor to see available {selectedClassType} class slots.
        </p>
      </div>
    );
  }

  const weekDates = getWeekDates(selectedDate);
  const allTimes: { start: string, end: string }[] = [];
  for (let h = 6; h < 20; h++) {
    allTimes.push({ start: `${pad(h)}:00`, end: `${pad(h)}:30` });
    allTimes.push({ start: `${pad(h)}:30`, end: `${pad(h+1)}:00` });
  }


  return (
    <div className="overflow-x-auto w-full mt-6">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th className="border border-gray-300 p-2 text-black">Time</th>
            {weekDates.map((date) => (
              <th
                key={date.toDateString()}
                className="border border-gray-300 p-2 text-black"
              >
                <span className="block font-bold text-black">
                  {date.toLocaleDateString("en-US", { weekday: "long" })}
                </span>
                <span className="block text-black">
                  {date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allTimes.map((block, index) => (
            <tr key={index} className="text-center">
              <td className="border border-gray-300 p-2 font-bold text-black">
                {`${block.start}-${block.end}`}
              </td>
              {weekDates.map((date) => {
                const dateString = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
                const sched = selectedInstructor.schedule?.find(s => s.date === dateString);
                
                if (!sched || !Array.isArray(sched.slots)) {
                  return (
                    <td key={date.toDateString()} className="border border-gray-300 py-1 bg-gray-50 text-black">-</td>
                  );
                }

                const groupedSlots = groupSlots(sched.slots);
                
                // Find if current block time is part of any grouped slot
                const matchingGroup = groupedSlots.find(group => {
                  const toMinutes = (time: string) => {
                    const [hours, minutes] = time.split(":").map(Number);
                    return hours * 60 + minutes;
                  };
                  const groupStartMin = toMinutes(group.start);
                  const groupEndMin = toMinutes(group.end);
                  const blockStartMin = toMinutes(block.start);
                  return blockStartMin >= groupStartMin && blockStartMin < groupEndMin;
                });

                if (!matchingGroup) {
                  return (
                    <td key={date.toDateString()} className="border border-gray-300 py-1 bg-gray-50 text-black">-</td>
                  );
                }

                // Only render the cell for the first block of the group
                const toMinutes = (time: string) => {
                  const [hours, minutes] = time.split(":").map(Number);
                  return hours * 60 + minutes;
                };
                
                const groupStartMin = toMinutes(matchingGroup.start);
                const blockStartMin = toMinutes(block.start);
                
                if (blockStartMin !== groupStartMin) {
                  return null; // This will be handled by rowSpan
                }

                // Calculate rowspan
                const groupEndMin = toMinutes(matchingGroup.end);
                const blockDuration = 30; // 30 minutes per block
                const rowSpan = (groupEndMin - groupStartMin) / blockDuration;

                if ((matchingGroup.status === 'free' || matchingGroup.status === 'available') && !matchingGroup.booked) {
                  return (
                    <td 
                      key={date.toDateString()} 
                      rowSpan={rowSpan}
                      className="border border-gray-300 py-1 bg-green-200 text-black font-bold cursor-pointer hover:bg-green-300"
                      onClick={() => {
                        onSlotClick({ 
                          start: matchingGroup.start, 
                          end: matchingGroup.end, 
                          date: dateString,
                          ticketClassId: matchingGroup.ticketClassId 
                        });
                      }}
                    >
                      <div className="text-xs text-gray-600">{matchingGroup.start}-{matchingGroup.end}</div>
                      <SimpleClassInfo ticketClassId={matchingGroup.ticketClassId} />
                    </td>
                  );
                }
                
                if ((matchingGroup.status === 'scheduled' || matchingGroup.booked) && matchingGroup.studentId && userId && matchingGroup.studentId.toString() === userId) {
                  return (
                    <td 
                      key={date.toDateString()} 
                      rowSpan={rowSpan}
                      className="border border-gray-300 py-1 bg-blue-500 text-white font-bold cursor-pointer hover:bg-red-500"
                      title="Click to cancel registration"
                    >
                      <div>Your Registration</div>
                      <div className="text-xs text-gray-200">{matchingGroup.start}-{matchingGroup.end}</div>
                      <SimpleClassInfo ticketClassId={matchingGroup.ticketClassId} />
                    </td>
                  );
                }
                
                if (matchingGroup.status === 'scheduled' || matchingGroup.booked) {
                  return (
                    <td 
                      key={date.toDateString()} 
                      rowSpan={rowSpan}
                      className="border border-gray-300 py-1 bg-blue-100 text-blue-900"
                    >
                      <div>Booked</div>
                      <div className="text-xs text-blue-700">{matchingGroup.start}-{matchingGroup.end}</div>
                      <SimpleClassInfo ticketClassId={matchingGroup.ticketClassId} />
                    </td>
                  );
                }
                
                if (matchingGroup.status === 'cancelled') {
                  return (
                    <td 
                      key={date.toDateString()} 
                      rowSpan={rowSpan}
                      className="border border-gray-300 py-1 bg-gray-300 text-gray-600"
                    >
                      <div>Cancelled</div>
                      <div className="text-xs text-gray-500">{matchingGroup.start}-{matchingGroup.end}</div>
                      <SimpleClassInfo ticketClassId={matchingGroup.ticketClassId} />
                    </td>
                  );
                }

                return (
                  <td key={date.toDateString()} className="border border-gray-300 py-1 bg-gray-50 text-black">-</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;
