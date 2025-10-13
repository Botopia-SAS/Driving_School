import React, { useState, useEffect } from 'react';
import type { Class as CalendarClass } from './types';
import { normalizeType, blockBgColors, blockBorderColors, statusDotColors, statusCardColors, statusBorderColors } from './calendarUtils';

interface CalendarMobileViewsProps {
  view: 'week' | 'month' | 'day';
  selectedDate: Date;
  classes: CalendarClass[];
  handleTimeBlockClick: (block: CalendarClass) => void;
}

interface StudentInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export const CalendarMobileViews: React.FC<CalendarMobileViewsProps> = ({
  view,
  selectedDate,
  classes,
  handleTimeBlockClick
}) => {
  const [studentsData, setStudentsData] = useState<Record<string, StudentInfo>>({});

  // Obtener información de estudiantes
  useEffect(() => {
    const fetchStudentInfo = async () => {
      const studentIds = classes
        .filter(c => c.studentId)
        .map(c => c.studentId as string)
        .filter((id, index, self) => self.indexOf(id) === index);

      const newStudentsData: Record<string, StudentInfo> = {};

      await Promise.all(
        studentIds.map(async (studentId) => {
          if (!studentsData[studentId]) {
            try {
              const res = await fetch(`/api/users?id=${studentId}`);
              const data = await res.json();
              if (data && !data.error) {
                newStudentsData[studentId] = data;
              }
            } catch (error) {
              console.error('Error fetching student:', error);
            }
          }
        })
      );

      if (Object.keys(newStudentsData).length > 0) {
        setStudentsData(prev => ({ ...prev, ...newStudentsData }));
      }
    };

    fetchStudentInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes]);
  // Vista móvil: semana actual estilo Google Calendar
  function renderMobileWeekView() {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7));
    const days = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    }); // Solo 6 días (lunes a sábado, sin domingo)

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
                    <div className="text-lg font-semibold mb-1">No Classes</div>
                    <div className="text-sm">Free day</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayClasses.map((event) => {
                      const normalizedType = normalizeType(event.classType ?? '');
                      const status = event.status ?? 'available';
                      const cardBgColor = statusCardColors[status] || 'bg-white border-gray-200';
                      const borderColor = statusBorderColors[status] || 'border-l-gray-400';

                      return (
                        <div
                          key={event.id}
                          className={`relative rounded-lg p-3 border-l-4 ${borderColor} ${cardBgColor} cursor-pointer transition-all hover:shadow-md transform hover:scale-[1.02]`}
                          style={{
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                          onClick={() => handleTimeBlockClick(event)}
                        >
                          {/* Indicador de pago en la esquina superior derecha */}
                          {event.paid && (
                            <div className="absolute top-2 right-2 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md" title="Paid">
                              <span className="text-white font-bold text-sm">$</span>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center justify-between pr-8">
                              <div className="font-semibold text-sm text-gray-800">
                                {event.classType?.replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                              <div className={`text-xs font-semibold capitalize px-2 py-1 rounded ${
                                status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {status}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="font-mono bg-white px-2 py-1 rounded shadow-sm">
                                {event.start} - {event.end}
                              </span>
                            </div>

                            {/* Información del estudiante */}
                            {event.studentId && studentsData[event.studentId as string] && (
                              <div className="text-sm text-gray-800 font-semibold">
                                {studentsData[event.studentId as string].firstName} {studentsData[event.studentId as string].lastName}
                              </div>
                            )}

                            {/* Ubicación de recogida */}
                            {event.pickupLocation && (
                              <div className="text-xs text-gray-700 flex items-start gap-1">
                                <span className="font-semibold text-blue-600">📍</span>
                                <span className="flex-1">{event.pickupLocation}</span>
                              </div>
                            )}

                            {/* Ubicación de dejada */}
                            {event.dropoffLocation && (
                              <div className="text-xs text-gray-700 flex items-start gap-1">
                                <span className="font-semibold text-green-600">🏁</span>
                                <span className="flex-1">{event.dropoffLocation}</span>
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
                      const status = event.status ?? 'available';
                      const cardBgColor = statusCardColors[status] || 'bg-white border-gray-200';
                      const borderColor = statusBorderColors[status] || 'border-l-gray-400';

                      return (
                        <div
                          key={event.id}
                          className={`relative rounded-lg p-3 shadow-sm border-l-4 ${borderColor} ${cardBgColor} cursor-pointer transition-all hover:shadow-md transform hover:scale-[1.02]`}
                          style={{
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                          onClick={() => handleTimeBlockClick(event)}
                        >
                          {/* Indicador de pago en la esquina superior derecha */}
                          {event.paid && (
                            <div className="absolute top-2 right-2 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md" title="Paid">
                              <span className="text-white font-bold text-sm">$</span>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center justify-between pr-8">
                              <div className="font-semibold text-sm text-gray-800">
                                {event.classType?.replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                              <div className={`text-xs font-semibold capitalize px-2 py-1 rounded ${
                                status === 'scheduled' ? 'bg-blue-200 text-blue-800' :
                                status === 'cancelled' ? 'bg-red-200 text-red-800' :
                                status === 'pending' ? 'bg-orange-200 text-orange-800' :
                                'bg-gray-200 text-gray-700'
                              }`}>
                                {status}
                              </div>
                            </div>

                            <div className="text-xs text-gray-600 font-medium">
                              {event.start} - {event.end}
                            </div>

                            {/* Información del estudiante */}
                            {event.studentId && studentsData[event.studentId as string] && (
                              <div className="text-sm text-gray-800 font-semibold">
                                {studentsData[event.studentId as string].firstName} {studentsData[event.studentId as string].lastName}
                              </div>
                            )}

                            {/* Ubicación de recogida */}
                            {event.pickupLocation && (
                              <div className="text-xs text-gray-700 flex items-start gap-1">
                                <span className="font-semibold text-blue-600">📍</span>
                                <span className="flex-1">{event.pickupLocation}</span>
                              </div>
                            )}

                            {/* Ubicación de dejada */}
                            {event.dropoffLocation && (
                              <div className="text-xs text-gray-700 flex items-start gap-1">
                                <span className="font-semibold text-green-600">🏁</span>
                                <span className="flex-1">{event.dropoffLocation}</span>
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
            <div className="text-lg font-bold mb-2">No Classes Scheduled</div>
            <div className="text-sm">Free day today!</div>
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