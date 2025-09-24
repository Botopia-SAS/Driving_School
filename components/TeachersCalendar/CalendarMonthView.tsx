import React from 'react';
import type { Class as CalendarClass } from './types';
import { normalizeType, blockBgColors, blockBorderColors, statusDotColors } from './calendarUtils';

interface CalendarMonthViewProps {
  selectedDate: Date;
  classes: CalendarClass[];
  handleTimeBlockClick: (block: CalendarClass) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  selectedDate,
  classes,
  handleTimeBlockClick
}) => {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const weeks: number[][] = [];
  let week: number[] = [];

  // Rellenar días vacíos al inicio
  for (let i = 0; i < startDayOfWeek; i++) week.push(0);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(0);
    weeks.push(week);
  }

  // Agrupar clases por día
  const classesByDay: Record<number, CalendarClass[]> = {};
  classes.forEach(c => {
    const date = new Date(c.date);
    if (date.getMonth() === month && date.getFullYear() === year) {
      const day = date.getDate();
      if (!classesByDay[day]) classesByDay[day] = [];
      classesByDay[day].push(c);
    }
  });

  return (
    <>
      <div className="text-[#27ae60] font-extrabold text-2xl mb-2 text-center tracking-wide uppercase drop-shadow-sm select-none">
        {selectedDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse shadow-2xl rounded-2xl bg-gradient-to-br from-[#e3f6fc] via-[#eafaf1] to-[#d4f1f4]">
          <thead>
            <tr>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                <th key={i} className="p-2 border-b bg-gradient-to-br from-[#e8f6ef] to-[#f0f6ff] text-[#0056b3] text-lg font-bold text-center tracking-wide uppercase shadow-inner">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week: number[], weekIndex: number) => (
              <tr key={weekIndex}>
                {week.map((day: number, dayIndex: number) => {
                  const isToday = day !== 0 && new Date(year, month, day).toDateString() === new Date().toDateString();
                  return (
                    <td
                      key={dayIndex}
                      className={`align-top min-h-[100px] h-[100px] w-[120px] border p-2 rounded-2xl transition-all duration-200 ${day === 0 ? 'bg-gray-50' : isToday ? 'bg-[#b2f2d7] border-2 border-[#27ae60] shadow-lg scale-105' : 'bg-white hover:bg-[#e3f6fc]'} group`}
                    >
                      {day !== 0 && (
                        <div className="flex flex-col h-full">
                          <div className={`text-center font-extrabold text-lg mb-1 ${isToday ? 'text-[#27ae60]' : 'text-[#0056b3]'}`}>{day}</div>
                          <div className="flex flex-col gap-1 flex-1">
                            {/* Agrupar bloques contiguos por status y mostrar rangos */}
                            {(() => {
                              const dayClasses = (classesByDay[day] || []).slice().filter(c => c.start && c.end).sort((a, b) => {
                                const [ah, am] = (a.start || '').split(':').map(Number);
                                const [bh, bm] = (b.start || '').split(':').map(Number);
                                return ah !== bh ? ah - bh : am - bm;
                              });
                              if (dayClasses.length === 0) return null;
                              // Agrupar por status y contiguos
                              const grouped: { status: string, start: string, end: string }[] = [];
                              let curr = { status: dayClasses[0].status, start: dayClasses[0].start!, end: dayClasses[0].end! };
                              for (let i = 1; i < dayClasses.length; i++) {
                                const currSlot = dayClasses[i];
                                if (curr.status === currSlot.status && currSlot.start === curr.end) {
                                  curr.end = currSlot.end!;
                                } else {
                                  grouped.push({ ...curr });
                                  curr = { status: currSlot.status, start: currSlot.start!, end: currSlot.end! };
                                }
                              }
                              grouped.push({ ...curr });
                              return grouped.map((g, idx) => {
                                const block = dayClasses.find(c => c.status === g.status && c.start === g.start && c.end === g.end);
                                const type = block?.classType;
                                const normalizedType = normalizeType(type ?? '');
                                const blockBg = blockBgColors[normalizedType] || '#fff';
                                const blockBorder = blockBorderColors[normalizedType] || '#e0e0e0';
                                const badgeColor = statusDotColors[(block?.status ?? '') as string] || 'bg-gray-400';
                                return (
                                  <div
                                    key={idx}
                                    className="rounded-lg px-2 py-1 text-xs font-bold shadow-sm transition-all mb-1 flex items-center gap-1 cursor-pointer hover:shadow-md transform hover:scale-105 border-l-2"
                                    style={{
                                      background: blockBg,
                                      borderLeftColor: blockBorder,
                                      border: `1px solid ${blockBorder}40`
                                    }}
                                    title={`${block?.classType ?? ''} ${g.start} - ${g.end}`}
                                    onClick={() => block && handleTimeBlockClick(block)}
                                  >
                                    {/* Solo barra de color lateral, sin punto ni texto de estado */}
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-xs truncate">
                                        {block?.classType?.replace(/\b\w/g, l => l.toUpperCase())}
                                      </div>
                                      <div className="text-xs opacity-75 font-normal">
                                        {g.start} - {g.end}
                                      </div>
                                    </div>
                                    {block?.studentId && (
                                      <div className="text-xs opacity-60">👤</div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};