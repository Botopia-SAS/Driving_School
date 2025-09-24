import React from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import CalendarToolbar from './CalendarToolbar';
import useIsMobile from '../hooks/useIsMobile';
import { weekRangeLabel } from './calendarUtils';

interface CalendarHeaderProps {
  view: 'week' | 'month' | 'day';
  setView: (view: 'week' | 'month' | 'day') => void;
  selectedDate: Date;
  handlePrev: () => void;
  handleNext: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  view,
  setView,
  selectedDate,
  handlePrev,
  handleNext
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        {/* Vista móvil: selector de vista */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => { setView('day'); }}
            className={`px-3 py-1 rounded font-semibold border ${view==='day' ? 'bg-[#27ae60] text-white' : 'bg-white text-[#27ae60] border-[#27ae60]'}`}
          >
            Day
          </button>
          <button
            onClick={() => { setView('week'); }}
            className={`px-3 py-1 rounded font-semibold border ${view==='week' ? 'bg-[#0056b3] text-white' : 'bg-white text-[#0056b3] border-[#0056b3]'}`}
          >
            Week
          </button>
        </div>

        {/* Flechas para avanzar día o semana en móvil */}
        <div className="flex justify-center items-center gap-4 mb-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full bg-[#e3f6fc] hover:bg-[#27ae60] text-[#0056b3] hover:text-white shadow transition-all"
          >
            <HiChevronLeft size={22} />
          </button>
          <span className="font-bold text-[#27ae60] text-lg">
            {view === 'day'
              ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : weekRangeLabel(selectedDate)
            }
          </span>
          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-[#e3f6fc] hover:bg-[#27ae60] text-[#0056b3] hover:text-white shadow transition-all"
          >
            <HiChevronRight size={22} />
          </button>
        </div>
      </>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${isMobile ? 'mt-4' : 'mt-32 md:mt-16'} pb-4 px-2 w-full`}>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center tracking-wide mb-2 w-full whitespace-pre-line break-words" style={{ wordBreak: 'break-word', lineHeight: 1.1 }}>
        <span className="text-[#0056b3]">INSTRUCTOR</span> <span className="text-[#27ae60]">SCHEDULE</span>
      </h1>
      <div className="flex items-center gap-2 mb-4 bg-white/70 rounded-xl shadow p-2 w-fit mx-auto">
        <button onClick={handlePrev} className="p-2 rounded-full bg-[#e3f6fc] hover:bg-[#27ae60] text-[#0056b3] hover:text-white shadow transition-all">
          <HiChevronLeft size={22} />
        </button>
        <CalendarToolbar view={view} setView={setView} />
        <button onClick={handleNext} className="p-2 rounded-full bg-[#e3f6fc] hover:bg-[#27ae60] text-[#0056b3] hover:text-white shadow transition-all">
          <HiChevronRight size={22} />
        </button>
      </div>
    </div>
  );
};