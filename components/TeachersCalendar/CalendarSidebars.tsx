import React from 'react';
import dynamic from 'next/dynamic';
import type { Class as CalendarClass } from './types';

const MiniCalendar = dynamic(() => import('./MiniCalendar'), { ssr: false });

interface CalendarSidebarsProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  view: 'week' | 'month' | 'day';
  classFilter: 'scheduled' | 'cancelled' | 'available' | 'pending';
  setClassFilter: (filter: 'scheduled' | 'cancelled' | 'available' | 'pending') => void;
  summaryClasses: CalendarClass[];
  sidebar: 'left' | 'right';
  instructorCapabilities?: string[];
}

export const CalendarSidebars: React.FC<CalendarSidebarsProps> = ({
  selectedDate,
  setSelectedDate,
  view,
  classFilter,
  setClassFilter,
  summaryClasses,
  sidebar,
  instructorCapabilities = []
}) => {
  // Leyenda de colores para tipos de clase - solo mostrar las que el instructor puede enseñar
  function renderClassTypeLegend() {
    const canTeachTicketClass = instructorCapabilities.includes('canTeachTicketClass');
    const canTeachDrivingLesson = instructorCapabilities.includes('canTeachDrivingLesson');
    const canTeachDrivingTest = instructorCapabilities.includes('canTeachDrivingTest');

    return (
      <div className="w-full flex flex-col items-start justify-center gap-y-2 mt-2 mb-0 text-base font-bold tracking-wide">
        {canTeachTicketClass && (
          <span className="flex flex-row items-center gap-x-2">
            <span className="w-3 h-3 rounded-full bg-[#27ae60]"></span>
            <span className="text-[#27ae60]">Ticket Classes</span>
          </span>
        )}
        {canTeachDrivingLesson && (
          <span className="flex flex-row items-center gap-x-2">
            <span className="w-3 h-3 rounded-full bg-[#0056b3]"></span>
            <span className="text-[#0056b3]">Driving Lessons</span>
          </span>
        )}
        {canTeachDrivingTest && (
          <span className="flex flex-row items-center gap-x-2">
            <span className="w-3 h-3 rounded-full bg-[#f39c12]"></span>
            <span className="text-[#f39c12]">Driving Tests</span>
          </span>
        )}
      </div>
    );
  }

  // Generar resumen por status
  const summaryByStatus = { scheduled: [], cancelled: [], available: [] } as Record<'scheduled'|'cancelled'|'available', { day: string, time: string }[]>;
  summaryClasses.forEach(c => {
    const dateObj = new Date(c.date);
    const dayStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    const timeStr = `${c.start || (c.hour?.toString().padStart(2, '0') + ':00')} - ${c.end || ((c.hour + 1)?.toString().padStart(2, '0') + ':00')}`;
    if (c.status === 'scheduled') summaryByStatus.scheduled.push({ day: dayStr, time: timeStr });
    if (c.status === 'cancelled') summaryByStatus.cancelled.push({ day: dayStr, time: timeStr });
    if (c.status === 'available') summaryByStatus.available.push({ day: dayStr, time: timeStr });
  });

  if (sidebar === 'left') {
    return (
      <aside className="hidden md:flex flex-col w-64 bg-gradient-to-br from-[#e3f6fc] via-[#eafaf1] to-[#d4f1f4] border-l-4 border-[#27ae60] rounded-2xl shadow-2xl p-4 h-full relative overflow-hidden">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#0056b3] mb-3">Calendars</h2>
          <ul className="space-y-3 text-black">
            <li className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
              <span className="w-4 h-4 rounded-full bg-[#0056b3]"></span>
              <span className="font-semibold text-[#0056b3]">Scheduled</span>
            </li>
            <li className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
              <span className="w-4 h-4 rounded-full bg-[#f44336]"></span>
              <span className="font-semibold text-[#f44336]">Cancelled</span>
            </li>
            <li className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
              <span className="w-4 h-4 rounded-full bg-gray-400"></span>
              <span className="font-semibold text-gray-600">Available</span>
            </li>
            <li className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200">
              <span className="w-4 h-4 rounded-full bg-[#ff9800]"></span>
              <span className="font-semibold text-[#ff9800]">Pending</span>
            </li>
          </ul>
        </div>
        <div className="flex-1 min-h-0">
          <h2 className="text-lg font-bold text-[#0056b3] mb-2">Month</h2>
          <div className="bg-white/70 rounded-lg p-2 text-center text-gray-500 border border-[#27ae60]">
            <MiniCalendar value={selectedDate} onChange={(date) => {
              setSelectedDate(date);
              // Si la vista es mensual, asegúrate de que el mes cambie
              if (view === 'month') {
                setSelectedDate(new Date(date.getFullYear(), date.getMonth(), 1));
              }
            }} />
          </div>
        </div>
        {renderClassTypeLegend()}
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-gradient-to-br from-[#e3f6fc] via-[#eafaf1] to-[#d4f1f4] border-r-4 border-[#0056b3] rounded-2xl shadow-2xl p-4 h-full relative overflow-hidden">
      <h2 className="text-lg font-bold text-[#0056b3] mb-4">Class Summary</h2>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button onClick={() => setClassFilter('scheduled')} className={`px-2 py-1 rounded font-semibold border text-xs ${classFilter==='scheduled' ? 'bg-[#0056b3] text-white' : 'bg-white text-[#0056b3] border-[#0056b3]'}`}>Scheduled</button>
        <button onClick={() => setClassFilter('cancelled')} className={`px-2 py-1 rounded font-semibold border text-xs ${classFilter==='cancelled' ? 'bg-[#f44336] text-white' : 'bg-white text-[#f44336] border-[#f44336]'}`}>Cancelled</button>
        <button onClick={() => setClassFilter('available')} className={`px-2 py-1 rounded font-semibold border text-xs ${classFilter==='available' ? 'bg-gray-400 text-white' : 'bg-white text-gray-400 border-gray-400'}`}>Available</button>
        <button onClick={() => setClassFilter('pending')} className={`px-2 py-1 rounded font-semibold border text-xs ${classFilter==='pending' ? 'bg-[#ff9800] text-white' : 'bg-white text-[#ff9800] border-[#ff9800]'}`}>Pending</button>
      </div>
      <div className="font-bold mb-1" style={{ color: classFilter === 'scheduled' ? '#0056b3' : classFilter === 'cancelled' ? '#f44336' : classFilter === 'pending' ? '#ff9800' : '#888' }}>
        {classFilter.charAt(0).toUpperCase() + classFilter.slice(1)}
      </div>
      {/* Panel derecho: lista agrupada de rangos por día */}
      <div className="overflow-y-auto max-h-[60vh] pr-1">
        <ul className="text-sm text-gray-700 space-y-1 transition-all duration-300">
          {(() => {
            // Filtrar por status seleccionado SOLO sobre summaryClasses
            const filtered = summaryClasses.filter((slot: CalendarClass) => {
              let status = slot.status;
              if (String(status) === 'canceled' || String(status) === 'cancelled') status = 'cancelled';
              return status === classFilter;
            });
            if (filtered.length === 0) {
              return (
                <li className="text-center py-4 text-gray-400">
                  <div className="text-sm">No {classFilter} classes</div>
                  <div className="text-xs">for this period</div>
                </li>
              );
            }
            // Agrupar por fecha
            const byDate: Record<string, Partial<CalendarClass>[]> = {};
            filtered.forEach(slot => {
              let dateStr = '';
              if (typeof slot.date === 'string') {
                dateStr = (slot.date as string).replace(/-/g, '/');
              } else if (slot.date instanceof Date && !isNaN(slot.date.getTime())) {
                dateStr = slot.date.toISOString().split('T')[0].replace(/-/g, '/');
              } else {
                dateStr = '';
              }
              if (!byDate[dateStr]) byDate[dateStr] = [];
              byDate[dateStr].push(slot);
            });
            // Para cada fecha, agrupar slots contiguos
            return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, slots]) => {
              // Ordenar por hora de inicio
              const sorted = slots.slice().sort((a, b) => {
                const [ah, am] = (a.start ?? '').split(':').map(Number);
                const [bh, bm] = (b.start ?? '').split(':').map(Number);
                return ah !== bh ? ah - bh : am - bm;
              });
              // Agrupar contiguos
              const ranges: { start: string; end: string }[] = [];
              let rangeStart = sorted[0].start ?? '';
              let rangeEnd = sorted[0].end ?? '';
              for (let i = 1; i < sorted.length; i++) {
                if ((sorted[i].start ?? '') === rangeEnd) {
                  rangeEnd = sorted[i].end ?? '';
                } else {
                  ranges.push({ start: rangeStart, end: rangeEnd });
                  rangeStart = sorted[i].start ?? '';
                  rangeEnd = sorted[i].end ?? '';
                }
              }
              ranges.push({ start: rangeStart, end: rangeEnd });
              return (
                <li key={date} className="mb-2 animate-fade-in">
                  <span className="font-bold text-[#27ae60] bg-[#eafaf1] px-2 py-1 rounded shadow-sm mr-2 block mb-1" style={{fontWeight: 700}}>{date}</span>
                  <div className="flex flex-col gap-1 ml-2">
                    {ranges.map((r, idx) => (
                      <span key={idx} className={`inline-block rounded px-3 py-1 mb-1 shadow font-semibold w-full transition-all duration-300
                        ${classFilter === 'available' ? 'bg-[#eafaf1] text-[#27ae60] border border-[#27ae60]' : ''}
                        ${classFilter === 'scheduled' ? 'bg-[#0056b3] text-white' : ''}
                        ${classFilter === 'cancelled' ? 'bg-[#f44336] text-white' : ''}
                        ${classFilter === 'pending' ? 'bg-[#ff9800] text-white' : ''}
                      `} style={{marginBottom: 4}}>
                        {r.start}-{r.end}
                      </span>
                    ))}
                  </div>
                </li>
              );
            });
          })()}
        </ul>
      </div>
    </aside>
  );
};