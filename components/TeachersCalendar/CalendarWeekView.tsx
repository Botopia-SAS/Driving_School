import React from 'react';
import type { Class as CalendarClass } from './types';
import { normalizeType, classTypeColors, statusDotColors, statusCardColors, statusBorderColors, blockBgColors, blockBorderColors, generateTimeSlots, generateDetailedTimeSlots } from './calendarUtils';
import useIsMobile from '../hooks/useIsMobile';

interface CalendarWeekViewProps {
  selectedDate: Date;
  classes: CalendarClass[];
  handleTimeBlockClick: (block: CalendarClass) => void;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  selectedDate,
  classes,
  handleTimeBlockClick
}) => {
  const isMobile = useIsMobile();
  const monthLabel = selectedDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  const startHour = 6;
  const endHour = 20;
  const timeLabels = generateTimeSlots(startHour, endHour);
  const detailedTimeLabels = generateDetailedTimeSlots(startHour, endHour);

  // Calcular altura dinámica de celdas
  const totalHours = endHour - startHour;
  const baseCellHeight = isMobile ? 50 : `calc((100vh - 300px) / ${totalHours})`;

  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Agrupar clases por día
  const classesByDay: Record<string, CalendarClass[]> = {};
  weekDays.forEach((d) => {
    const key = d.toISOString().slice(0, 10);
    classesByDay[key] = [];
  });
  classes.forEach(c => {
    const d = typeof c.date === 'string' ? c.date : c.date.toISOString().slice(0, 10);
    if (classesByDay[d]) classesByDay[d].push(c);
  });

  return (
    <div className="h-full flex flex-col">
      <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-center mb-2 md:mb-4 text-[#27ae60] tracking-wide select-none flex-shrink-0">{monthLabel}</div>
      <div className={`flex-1 min-h-0 ${isMobile ? 'overflow-auto' : 'overflow-hidden'}`} style={isMobile ? { maxHeight: 'calc(100vh - 200px)' } : { height: 'calc(100vh - 250px)' }}>
        <table className="w-full h-full border-collapse shadow-2xl rounded-2xl bg-gradient-to-br from-[#e3f6fc] via-[#eafaf1] to-[#d4f1f4] instructor-calendar-table" style={{ tableLayout: 'fixed', minWidth: isMobile ? '800px' : 'auto' }}>
          <thead>
            <tr>
              <th className={`${isMobile ? 'p-3' : 'p-2'} bg-white text-center font-bold sticky left-0 z-20`} style={{ color: '#27ae60', border: '2px solid #e0e0e0', fontSize: isMobile ? '1rem' : '0.9rem', background: '#f8fafd', width: isMobile ? '80px' : '70px', minWidth: isMobile ? '80px' : '70px' }}>Time</th>
              {weekDays.map((d, i) => (
                <th key={i} className={`${isMobile ? 'p-3' : 'p-2'} text-center font-bold`} style={{ color: '#0056b3', border: '2px solid #e0e0e0', fontSize: isMobile ? '1rem' : '0.9rem', background: '#f8fafd', width: `${100/7}%` }}>
                  <div className="flex flex-col items-center justify-center">
                    <span className={`uppercase tracking-wide ${isMobile ? 'text-sm' : 'text-xs'} font-semibold`}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className={`font-extrabold ${isMobile ? 'text-xl' : 'text-lg'}`}>{d.getDate()}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeLabels.map((label) => (
              <tr key={label}>
                <td className="border text-center font-bold sticky left-0 z-20 relative" style={{ color: '#27ae60', border: '2px solid #e0e0e0', background: '#fff', width: isMobile ? '80px' : '70px', minWidth: isMobile ? '80px' : '70px', fontSize: isMobile ? '0.9rem' : '0.8rem', height: baseCellHeight }}>
                  <div className="flex flex-col items-center justify-start h-full pt-1">
                    <span className="font-bold">{label}</span>
                    {/* Línea de separación en la parte inferior para marcar los 30 minutos */}
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300"></div>
                  </div>
                </td>
                {weekDays.map((d, colIdx) => {
                  const key = d.toISOString().slice(0, 10);
                  const dayClasses = (classesByDay[key] || []).slice().filter(c => c.start && c.end);
                  // Buscar si hay una clase que inicia en este slot
                  const classBlock = dayClasses.find(c => c.start === label);
                  if (classBlock) {
                    // Calcular cuántos slots abarca la clase
                    const [startHour, startMin] = classBlock.start!.split(':').map(Number);
                    const [endHour, endMin] = classBlock.end!.split(':').map(Number);
                    // Calcular slots en base a intervalos de 1 hora (no 30 min)
                    let slots = Math.ceil((endHour * 60 + endMin - startHour * 60 - startMin) / 60);
                    if (slots < 1) slots = 1;

                    const cellHeight = isMobile ? 50 * slots : `calc(${slots} * (100vh - 300px) / ${totalHours})`;
                    // Normalizar el tipo de clase para buscar el color
                    const normalizedType = normalizeType(classBlock.classType ?? '');
                    const status = classBlock.status ?? 'available';
                    const blockBg = blockBgColors[normalizedType] || '#fff';
                    const blockBorder = blockBorderColors[normalizedType] || '#e0e0e0';
                    const typeText = classTypeColors[normalizedType] || '';
                    const badgeColor = statusDotColors[status] || 'bg-gray-400';
                    const cardBgColor = statusCardColors[status] || 'bg-white border-gray-200';
                    const borderColor = statusBorderColors[status] || 'border-l-gray-400';
                    return (
                      <td
                        key={colIdx}
                        rowSpan={slots}
                        className={`align-middle relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer`}
                        style={{
                          padding: isMobile ? 4 : 2,
                          height: cellHeight,
                          minHeight: cellHeight,
                          border: '2px solid #e0e0e0',
                          width: `${100/7}%`
                        }}
                        onClick={() => handleTimeBlockClick(classBlock)}
                      >
                        {/* Barra lateral de color para el estado */}
                        {/* Contenido de la tarjeta con borde lateral de estado */}
                        <div
                          className={`w-full h-full ${isMobile ? 'p-3' : 'p-2'} rounded-lg shadow-md transition-all duration-200 border-l-4 ${borderColor} ${cardBgColor}`}
                          style={{
                            backdropFilter: 'blur(10px)',
                            fontSize: isMobile ? '0.85rem' : '0.75rem'
                          }}
                        >
                          <div className="flex flex-col h-full justify-center items-center text-center">
                            <div className={`font-bold ${isMobile ? 'text-sm mb-2' : 'text-xs mb-1'} ${typeText.split(' ')[1]} leading-tight`}>
                              {classBlock.classType?.replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600 font-medium ${isMobile ? 'mb-1' : 'mb-0'}`}>
                              {classBlock.start} - {classBlock.end}
                            </div>
                            <div className={`${isMobile ? 'text-sm' : 'text-xs'} font-semibold capitalize ${
                              status === 'scheduled' ? 'text-blue-700' :
                              status === 'cancelled' ? 'text-red-700' :
                              status === 'pending' ? 'text-orange-700' :
                              'text-gray-600'
                            }`}>
                              {status}
                            </div>
                          </div>
                        </div>
                      </td>
                    );
                  }
                  // Si ya hay una clase que abarca este slot, dejar la celda vacía
                  const isCovered = dayClasses.some(c => {
                    const [startHour, startMin] = c.start!.split(':').map(Number);
                    const [endHour, endMin] = c.end!.split(':').map(Number);
                    const [labelHour, labelMin] = label.split(':').map(Number);
                    const labelMinutes = labelHour * 60 + (labelMin || 0);
                    const startMinutes = startHour * 60 + startMin;
                    const endMinutes = endHour * 60 + endMin;
                    return labelMinutes > startMinutes && labelMinutes < endMinutes;
                  });
                  if (isCovered) {
                    return null;
                  }
                  // Celda vacía
                  return (
                    <td key={colIdx} className="border text-center align-middle bg-white relative" style={{ border: '2px solid #e0e0e0', height: baseCellHeight, minHeight: baseCellHeight, width: `${100/7}%` }}>
                      <div className="flex items-center justify-center w-full h-full">
                        {/* Línea de separación en la parte inferior para marcar los 30 minutos */}
                        <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300"></div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};