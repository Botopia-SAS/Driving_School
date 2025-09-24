import React from 'react';
import type { Class as CalendarClass } from './types';
import { normalizeType, classTypeColors, statusDotColors, blockBgColors, blockBorderColors, generateTimeSlots } from './calendarUtils';

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
  const monthLabel = selectedDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  const startHour = 6;
  const endHour = 20;
  const timeLabels = generateTimeSlots(startHour, endHour);

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
    <>
      <div className="text-3xl font-extrabold text-center mb-4 text-[#27ae60] tracking-wide select-none">{monthLabel}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse shadow-2xl rounded-2xl bg-gradient-to-br from-[#e3f6fc] via-[#eafaf1] to-[#d4f1f4] instructor-calendar-table">
          <thead>
            <tr>
              <th className="p-2 bg-white text-center font-bold w-20 md:w-32 sticky left-0 z-10" style={{ color: '#27ae60', border: '1px solid #e0e0e0', fontSize: '1rem', background: '#f8fafd', minWidth: 60, maxWidth: 60 }}>Time</th>
              {weekDays.map((d, i) => (
                <th key={i} className="p-2 text-center font-bold w-20 md:w-32" style={{ color: '#0056b3', border: '1px solid #e0e0e0', fontSize: '1rem', minWidth: 60, maxWidth: 60, background: '#f8fafd' }}>
                  <div className="flex flex-col items-center justify-center">
                    <span className="uppercase tracking-wide" style={{ fontSize: '0.95rem' }}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="font-extrabold text-lg" style={{ letterSpacing: 1 }}>{d.getDate()}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeLabels.map((label) => (
              <tr key={label}>
                <td className="p-2 border text-center font-bold w-20 md:w-32 sticky left-0 z-10" style={{ color: '#27ae60', border: '1px solid #e0e0e0', background: '#fff', minWidth: 60, maxWidth: 60 }}>{label}</td>
                {weekDays.map((d, colIdx) => {
                  const key = d.toISOString().slice(0, 10);
                  const dayClasses = (classesByDay[key] || []).slice().filter(c => c.start && c.end);
                  // Buscar si hay una clase que inicia en este slot
                  const classBlock = dayClasses.find(c => c.start === label);
                  if (classBlock) {
                    // Calcular cuántos slots abarca la clase
                    const [startHour, startMin] = classBlock.start!.split(':').map(Number);
                    const [endHour, endMin] = classBlock.end!.split(':').map(Number);
                    let slots = (endHour - startHour) * 2 + (endMin - startMin) / 30;
                    if (slots < 1) slots = 1;
                    // Normalizar el tipo de clase para buscar el color
                    const normalizedType = normalizeType(classBlock.classType ?? '');
                    const blockBg = blockBgColors[normalizedType] || '#fff';
                    const blockBorder = blockBorderColors[normalizedType] || '#e0e0e0';
                    const typeText = classTypeColors[normalizedType] || '';
                    const badgeColor = statusDotColors[(classBlock.status ?? '') as string] || 'bg-gray-400';
                    return (
                      <td
                        key={colIdx}
                        rowSpan={slots}
                        className={`align-middle w-20 md:w-32 relative overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer`}
                        style={{
                          padding: 2,
                          height: `${22 * slots}px`,
                          minHeight: `${22 * slots}px`,
                          minWidth: 60,
                          maxWidth: 60,
                          border: '1px solid #e0e0e0'
                        }}
                        onClick={() => handleTimeBlockClick(classBlock)}
                      >
                        {/* Barra lateral de color para el estado */}
                        <div
                          className={`absolute left-0 top-0 w-1 h-full ${badgeColor.replace('bg-', 'bg-')} z-10`}
                          style={{ borderRadius: '0 4px 4px 0' }}
                        ></div>

                        {/* Contenido de la tarjeta */}
                        <div
                          className="w-full h-full p-1 rounded-lg shadow-sm transition-all duration-200"
                          style={{
                            background: blockBg,
                            marginLeft: '4px',
                            border: `1px solid ${blockBorder}20`,
                            backdropFilter: 'blur(10px)',
                            fontSize: '0.75rem'
                          }}
                        >
                          <div className="flex flex-col h-full justify-center items-center text-center">
                            <div className={`font-bold text-xs mb-1 ${typeText.split(' ')[1]} leading-tight`}>
                              {classBlock.classType?.replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-xs text-gray-600 font-medium">
                              {classBlock.start} - {classBlock.end}
                            </div>
                            {slots > 2 && (
                              <div className="text-xs text-gray-500 mt-1 opacity-75">
                                {classBlock.studentId ? '👤' : '⭕'}
                              </div>
                            )}
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
                    <td key={colIdx} className="p-0 border text-center align-middle bg-white w-20 md:w-32" style={{ border: '1px solid #e0e0e0', height: '22px', minHeight: '22px', minWidth: 60, maxWidth: 60 }}>
                      <div className="flex items-center justify-center w-full" style={{ height: '22px' }}></div>
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