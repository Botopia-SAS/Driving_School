import React from 'react';
import type { Class as CalendarClass } from './types';
import { normalizeType, blockBgColors, blockBorderColors, statusDotColors } from './calendarUtils';

interface CalendarMobileViewsProps {
  view: 'week' | 'month' | 'day';
  selectedDate: Date;
  classes: CalendarClass[];
  handleTimeBlockClick: (block: CalendarClass) => void;
}

export const CalendarMobileViews: React.FC<CalendarMobileViewsProps> = ({
  view,
  selectedDate,
  classes,
  handleTimeBlockClick
}) => {
  // Vista móvil: semana actual estilo Google Calendar
  function renderMobileWeekView() {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7));
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <div className="space-y-2">
        {days.map((day) => {
          const dayClasses = classes.filter(c => {
            const d = c.date instanceof Date ? c.date : new Date(c.date);
            return d.toDateString() === day.toDateString();
          }).sort((a, b) => (a.start || '').localeCompare(b.start || ''));

          const isToday = day.toDateString() === today.toDateString();
          const dayOfWeek = day.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNumber = day.getDate();
          const monthYear = day.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

          return (
            <div
              key={day.toISOString()}
              className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all ${
                isToday ? 'ring-2 ring-blue-500 shadow-blue-100' : 'hover:shadow-xl'
              }`}
            >
              {/* Day header */}
              <div className={`px-4 py-3 ${
                isToday
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-bold ${isToday ? 'text-white' : 'text-gray-800'}`}>
                      {dayNumber}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold uppercase tracking-wide ${
                        isToday ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {dayOfWeek}
                      </div>
                      <div className={`text-xs ${isToday ? 'text-blue-200' : 'text-gray-500'}`}>
                        {monthYear}
                      </div>
                    </div>
                  </div>

                  {/* Class count badge */}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isToday
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}
                  </div>
                </div>
              </div>

              {/* Classes list */}
              <div className="p-3">
                {dayClasses.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">
                    <div className="text-2xl mb-1">🏖️</div>
                    <div className="text-sm">No classes today</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayClasses.map((event) => {
                      const normalizedType = normalizeType(event.classType ?? '');
                      const blockBg = blockBgColors[normalizedType] || '#fff';
                      const blockBorder = blockBorderColors[normalizedType] || '#e0e0e0';
                      const badgeColor = statusDotColors[(event.status ?? '') as string] || 'bg-gray-400';

                      return (
                        <div
                          key={event.id}
                          className="relative rounded-lg p-3 border-l-4 cursor-pointer transition-all hover:shadow-md transform hover:scale-[1.02] hover:bg-gray-50"
                          style={{
                            background: blockBg,
                            borderLeftColor: blockBorder,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                          onClick={() => handleTimeBlockClick(event)}
                        >
                          {/* Status dot */}
                          <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${badgeColor}`}></div>

                          <div className="pr-6">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-semibold text-sm text-gray-800">
                                {event.classType?.replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                {event.start} - {event.end}
                              </span>
                              {event.studentId && (
                                <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  <span>👤</span>
                                  <span>Student</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vista móvil: día actual estilo Google Calendar
  function renderMobileDayView() {
    const today = new Date(selectedDate);
    const dayClasses = classes.filter(c => {
      const d = c.date instanceof Date ? c.date : new Date(c.date);
      return d.toDateString() === today.toDateString();
    }).sort((a, b) => (a.start || '').localeCompare(b.start || ''));

    // Generar timeline de horas (6 AM - 8 PM)
    const timeSlots: Array<{
      hour: number;
      displayTime: string;
      classes: CalendarClass[];
    }> = [];
    for (let hour = 6; hour <= 20; hour++) {
      timeSlots.push({
        hour,
        displayTime: `${hour === 12 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        classes: dayClasses.filter(c => {
          const startHour = parseInt(c.start?.split(':')[0] || '0');
          return startHour === hour;
        })
      });
    }

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header del día */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="text-center">
            <div className="text-sm uppercase tracking-wide opacity-90">
              {today.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div className="text-3xl font-bold">
              {today.getDate()}
            </div>
            <div className="text-sm opacity-90">
              {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="divide-y divide-gray-100">
          {timeSlots.map((slot) => (
            <div key={slot.hour} className="flex min-h-[60px] hover:bg-gray-50 transition-colors">
              {/* Time column */}
              <div className="w-16 flex-shrink-0 p-3 text-right">
                <div className="text-xs text-gray-500 font-medium">
                  {slot.displayTime}
                </div>
              </div>

              {/* Events column */}
              <div className="flex-1 p-2 relative">
                {slot.classes.length === 0 ? (
                  <div className="h-full flex items-center text-gray-300 text-xs">
                    <div className="w-full border-l-2 border-gray-100 pl-3">
                      Available
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {slot.classes.map((event) => {
                      const normalizedType = normalizeType(event.classType ?? '');
                      const blockBg = blockBgColors[normalizedType] || '#fff';
                      const blockBorder = blockBorderColors[normalizedType] || '#e0e0e0';
                      const badgeColor = statusDotColors[(event.status ?? '') as string] || 'bg-gray-400';

                      return (
                        <div
                          key={event.id}
                          className="relative rounded-lg p-3 shadow-sm border-l-4 cursor-pointer transition-all hover:shadow-md transform hover:scale-[1.02]"
                          style={{
                            background: blockBg,
                            borderLeftColor: blockBorder,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                          onClick={() => handleTimeBlockClick(event)}
                        >
                          {/* Status indicator */}
                          <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${badgeColor}`}></div>

                          <div className="pr-4">
                            <div className="font-semibold text-sm text-gray-800 mb-1">
                              {event.classType?.replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-xs text-gray-600 font-medium">
                              {event.start} - {event.end}
                            </div>
                            {event.studentId && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs">👤</span>
                                <span className="text-xs text-gray-500">Student assigned</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {dayClasses.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">📅</div>
            <div className="text-lg font-medium">No classes scheduled</div>
            <div className="text-sm">Enjoy your free day!</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {view === 'day' && renderMobileDayView()}
      {view === 'week' && renderMobileWeekView()}
    </div>
  );
};