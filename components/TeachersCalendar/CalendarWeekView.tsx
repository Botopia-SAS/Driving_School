import React, { useState, useEffect } from 'react';
import type { Class as CalendarClass } from './types';
import { normalizeType, classTypeColors, statusCardColors, statusBorderColors, generateDetailedTimeSlots } from './calendarUtils';
import useIsMobile from '../hooks/useIsMobile';

interface CalendarWeekViewProps {
  selectedDate: Date;
  classes: CalendarClass[];
  handleTimeBlockClick: (block: CalendarClass) => void;
  handleEmptyCellClick?: (date: Date, time: string) => void;
}

interface StudentInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  selectedDate,
  classes,
  handleTimeBlockClick,
  handleEmptyCellClick
}) => {
  const isMobile = useIsMobile();
  const [studentsData, setStudentsData] = useState<Record<string, StudentInfo>>({});
  const monthLabel = selectedDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  const startHour = 6;
  const endHour = 20;
  const timeLabels = generateDetailedTimeSlots(startHour, endHour);

  // Altura fija para todas las celdas - asegura consistencia visual
  const baseCellHeight = isMobile ? '60px' : '80px';

  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const weekDays: Date[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  }); // Solo 6 días (lunes a sábado, sin domingo)

  // Obtener información de estudiantes
  useEffect(() => {
    const fetchStudentInfo = async () => {
      const studentIds = classes
        .filter(c => c.studentId) // Obtener info para todas las clases con studentId
        .map(c => c.studentId as string)
        .filter((id, index, self) => self.indexOf(id) === index); // Unique IDs

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

  // Agrupar clases por día
  const classesByDay: Record<string, CalendarClass[]> = {};
  for (const day of weekDays) {
    const key = day.toISOString().slice(0, 10);
    classesByDay[key] = [];
  }
  for (const classItem of classes) {
    const dateKey = typeof classItem.date === 'string' ? classItem.date : classItem.date.toISOString().slice(0, 10);
    if (classesByDay[dateKey]) classesByDay[dateKey].push(classItem);
  }

  // Función helper para calcular slots y altura
  const calculateClassDimensions = (start: string, end: string) => {
    const [startHour, startMin] = start.split(':').map(value => Number.parseInt(value, 10));
    const [endHour, endMin] = end.split(':').map(value => Number.parseInt(value, 10));
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    let slots = Math.ceil(durationMinutes / 30);
    if (slots < 1) slots = 1;
    const shouldSpan = durationMinutes > 30;
    const actualRowSpan = shouldSpan ? slots : 1;
    const heightValue = isMobile ? 60 : 80;
    const cellHeight = `${heightValue * slots}px`;
    return { slots, actualRowSpan, cellHeight };
  };

  // Función helper para verificar si un slot está cubierto
  const isSlotCovered = (dayClasses: CalendarClass[], label: string) => {
    const parseTime = (timeStr: string) => {
      return timeStr.split(':').map(value => Number.parseInt(value, 10));
    };
    return dayClasses.some(classItem => {
      const [startHour, startMin] = parseTime(classItem.start!);
      const [endHour, endMin] = parseTime(classItem.end!);
      const [labelHour, labelMin] = parseTime(label);
      const labelMinutes = labelHour * 60 + (labelMin || 0);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      return labelMinutes > startMinutes && labelMinutes < endMinutes;
    });
  };

  // Función helper para renderizar celda con clase
  const renderClassCell = (classBlock: CalendarClass, dayKey: string, label: string) => {
    const { actualRowSpan, cellHeight } = calculateClassDimensions(classBlock.start!, classBlock.end!);
    const normalizedType = normalizeType(classBlock.classType ?? '');
    const status = classBlock.status ?? 'available';
    const typeText = classTypeColors[normalizedType] || '';
    const cardBgColor = statusCardColors[status] || 'bg-white border-gray-200';
    const borderColor = statusBorderColors[status] || 'border-l-gray-400';
    
    return (
      <td
        key={`cell-${dayKey}-${label}`}
        rowSpan={actualRowSpan}
        className="align-middle relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer"
        style={{
          padding: isMobile ? 4 : 2,
          height: cellHeight,
          minHeight: cellHeight,
          border: '2px solid #e0e0e0',
          width: `${100/6}%`
        }}
        onClick={() => handleTimeBlockClick(classBlock)}
      >
        <div
          className={`w-full h-full ${isMobile ? 'p-3' : 'p-2'} rounded-lg shadow-md transition-all duration-200 border-l-4 ${borderColor} ${cardBgColor} relative`}
          style={{
            backdropFilter: 'blur(10px)',
            fontSize: isMobile ? '0.85rem' : '0.75rem'
          }}
        >
          {classBlock.paid && (
            <div className="absolute top-1 right-1 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center shadow-md" title="Paid">
              <span className="text-white font-bold text-xs">$</span>
            </div>
          )}

          <div className="flex flex-col h-full justify-center items-start text-left px-2 gap-1">
            <div className={`font-bold ${isMobile ? 'text-base' : 'text-sm'} ${typeText.split(' ')[1]} leading-snug`}>
              {classBlock.classType?.replaceAll(/\b\w/g, letter => letter.toUpperCase())}
            </div>

            {classBlock.studentId && studentsData[classBlock.studentId as string] && (
              <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-800 leading-snug`}>
                <span className="font-semibold">
                  {studentsData[classBlock.studentId as string].firstName} {studentsData[classBlock.studentId as string].lastName}
                </span>
              </div>
            )}

            {classBlock.pickupLocation && (
              <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-700 leading-snug flex items-start gap-1`}>
                <span className="font-semibold text-blue-600">📍</span>
                <span className="flex-1">{classBlock.pickupLocation}</span>
              </div>
            )}

            {classBlock.dropoffLocation && (
              <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-700 leading-snug flex items-start gap-1`}>
                <span className="font-semibold text-green-600">🏁</span>
                <span className="flex-1">{classBlock.dropoffLocation}</span>
              </div>
            )}
          </div>
        </div>
      </td>
    );
  };

  // Función helper para renderizar celda vacía
  const renderEmptyCell = (day: Date, label: string, dayKey: string) => {
    return (
      <td
        key={`empty-${dayKey}-${label}`}
        className="border text-center align-middle bg-white relative hover:bg-blue-50 cursor-pointer transition-colors duration-200"
        style={{ border: '2px solid #e0e0e0', height: baseCellHeight, minHeight: baseCellHeight, width: `${100/6}%` }}
        onClick={() => handleEmptyCellClick?.(day, label)}
      >
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-gray-300 text-xs font-semibold hover:text-blue-500 transition-colors">+</span>
        </div>
      </td>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-center mb-2 md:mb-4 text-[#27ae60] tracking-wide select-none flex-shrink-0">{monthLabel}</div>
      <div className="flex-1 min-h-0 overflow-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
        <table className="w-full border-collapse shadow-2xl rounded-2xl bg-gradient-to-br from-[#e3f6fc] via-[#eafaf1] to-[#d4f1f4] instructor-calendar-table" style={{ tableLayout: 'fixed', minWidth: isMobile ? '800px' : 'auto' }}>
          <thead>
            <tr>
              <th className={`${isMobile ? 'p-3' : 'p-2'} bg-white text-center font-bold sticky left-0 z-20`} style={{ color: '#27ae60', border: '2px solid #e0e0e0', fontSize: isMobile ? '1rem' : '0.9rem', background: '#f8fafd', width: isMobile ? '80px' : '70px', minWidth: isMobile ? '80px' : '70px' }}>Time</th>
              {weekDays.map((day) => {
                const dayLabel = day.toLocaleDateString('en-US', { weekday: 'short' });
                return (
                <th key={`day-${day.toISOString()}`} className={`${isMobile ? 'p-3' : 'p-2'} text-center font-bold`} style={{ color: '#0056b3', border: '2px solid #e0e0e0', fontSize: isMobile ? '1rem' : '0.9rem', background: '#f8fafd', width: `${100/6}%` }}>
                  <div className="flex flex-col items-center justify-center">
                    <span className={`uppercase tracking-wide ${isMobile ? 'text-sm' : 'text-xs'} font-semibold`}>{dayLabel}</span>
                    <span className={`font-extrabold ${isMobile ? 'text-xl' : 'text-lg'}`}>{day.getDate()}</span>
                  </div>
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {timeLabels.map((label) => {
              const isHourLabel = label.endsWith(':00');
              // Si es media hora, omitir la celda de tiempo ya que la hora anterior la abarca con rowSpan
              return (
              <tr key={label}>
                {isHourLabel ? (
                  <td rowSpan={2} className="border text-center font-bold sticky left-0 z-20 relative" style={{ color: '#27ae60', border: '2px solid #e0e0e0', background: '#fff', width: isMobile ? '80px' : '70px', minWidth: isMobile ? '80px' : '70px', fontSize: isMobile ? '0.9rem' : '0.8rem', height: baseCellHeight }}>
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className="font-bold">{label}</span>
                    </div>
                  </td>
                ) : null}
                {weekDays.map((day) => {
                  const dayKey = day.toISOString().slice(0, 10);
                  const dayClasses = (classesByDay[dayKey] || []).slice().filter(classItem => classItem.start && classItem.end);
                  const classBlock = dayClasses.find(classItem => classItem.start === label);
                  
                  if (classBlock) {
                    return renderClassCell(classBlock, dayKey, label);
                  }
                  
                  if (isSlotCovered(dayClasses, label)) {
                    return null;
                  }
                  
                  return renderEmptyCell(day, label, dayKey);
                })}
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};