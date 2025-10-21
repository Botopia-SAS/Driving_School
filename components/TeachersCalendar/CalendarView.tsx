'use client';
import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import type { Class as CalendarClass } from './types';
import useIsMobile from '../hooks/useIsMobile';
import { CalendarHeader } from './CalendarHeader';
import { CalendarModalContent } from './CalendarModalContent';
import { CalendarMobileViews } from './CalendarMobileViews';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarSidebars } from './CalendarSidebars';
import { normalizeType, getVisibleDates, groupClassesByStatus } from './calendarUtils';
import { BookingModal } from './BookingModal';
import { EditBookingModal } from './EditBookingModal';
import { GoogleMapsProvider } from '../GoogleMapsProvider';

interface CalendarViewProps {
  classes: CalendarClass[];
  onClassClick: (classData: CalendarClass) => void;
  onScheduleUpdate?: () => void;
  hideSidebars?: boolean;
  instructorId?: string;
  instructorCapabilities?: string[];
}

const CalendarView: React.FC<CalendarViewProps> = ({
  classes: initialClasses,
  onClassClick,
  onScheduleUpdate,
  hideSidebars,
  instructorId,
  instructorCapabilities
}) => {
  // All hooks must be at the top level
  const [view, setView] = useState<'week' | 'month' | 'day'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<CalendarClass | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [classFilter, setClassFilter] = useState<'scheduled' | 'cancelled' | 'available' | 'pending'>('scheduled');
  const [studentInfo, setStudentInfo] = useState<{ firstName?: string; lastName?: string; email?: string; phone?: string; address?: string; emergencyContact?: string } | null>(null);
  const [ticketClassInfo, setTicketClassInfo] = useState<unknown>(null);
  const [drivingClassInfo, setDrivingClassInfo] = useState<unknown>(null);
  const [locationInfo, setLocationInfo] = useState<unknown>(null);
  const [studentsInfo, setStudentsInfo] = useState<unknown[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Booking Modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | null>(null);
  const [bookingTime, setBookingTime] = useState<string | null>(null);

  // Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false);

  // Derived state
  const classes = initialClasses;
  const isMobile = useIsMobile();

  // Navegación entre semanas/meses
  const handlePrev = () => {
    if (view === 'week') {
      const prev = new Date(selectedDate);
      prev.setDate(selectedDate.getDate() - 7);
      setSelectedDate(prev);
    } else if (view === 'day') {
      const prev = new Date(selectedDate);
      prev.setDate(selectedDate.getDate() - 1);
      setSelectedDate(prev);
    } else {
      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
    }
  };

  const handleNext = () => {
    if (view === 'week') {
      const next = new Date(selectedDate);
      next.setDate(selectedDate.getDate() + 7);
      setSelectedDate(next);
    } else if (view === 'day') {
      const next = new Date(selectedDate);
      next.setDate(selectedDate.getDate() + 1);
      setSelectedDate(next);
    } else {
      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
    }
  };

  // Handle empty cell click for booking
  const handleEmptyCellClick = (date: Date, time: string) => {
    if (instructorId) {
      setBookingDate(date);
      setBookingTime(time);
      setShowBookingModal(true);
    }
  };

  // Helper para cargar información del estudiante
  const loadStudentInfo = async (studentId: string | { toString(): string }) => {
    setStudentInfo(null);
    const id = typeof studentId === 'string' 
      ? studentId 
      : (studentId as { toString(): string }).toString();
    try {
      const res = await fetch(`/api/users?id=${id}`);
      const data = await res.json();
      setStudentInfo(data);
    } catch {
      setStudentInfo({ firstName: 'Not found', lastName: '' });
    }
  };

  // Handler para driving test
  const handleDrivingTestClick = async (block: CalendarClass) => {
    if (block.status === 'scheduled') {
      setSelectedBlock(block);
      setModalOpen(true);
      if (block.studentId) {
        await loadStudentInfo(block.studentId);
      } else {
        setStudentInfo(null);
      }
    }
    onClassClick(block);
  };

  // Handler para ticket classes
  const handleTicketClassClick = (block: CalendarClass) => {
    setSelectedBlock(block);
    setModalOpen(true);
    setStudentInfo(null);
    onClassClick(block);
  };

  // Handler genérico
  const handleDefaultClick = async (block: CalendarClass) => {
    setSelectedBlock(block);
    setModalOpen(true);
    if (block.studentId) {
      await loadStudentInfo(block.studentId);
    } else {
      setStudentInfo(null);
    }
    onClassClick(block);
  };

  // Permitir click para mostrar info en cualquier status para D.A.T.E., A.D.I., B.D.I.
  const handleTimeBlockClick = async (block: CalendarClass) => {
    if (block.classType === 'driving test') {
      await handleDrivingTestClick(block);
      return;
    }
    const normalizedType = normalizeType(block.classType ?? '');
    if (['ticket class', 'D.A.T.E.', 'A.D.I.', 'B.D.I.'].includes(normalizedType)) {
      handleTicketClassClick(block);
      return;
    }
    await handleDefaultClick(block);
  };

  const handleAddClass = async (date: Date, hour: number) => {
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: '67dda5c8448d12032b5d7a76',
          instructorId: selectedBlock?.instructorId || '681c2566f4e0eb5564f85205',
          date: date.toISOString().split('T')[0],
          start: `${hour.toString().padStart(2, '0')}:00`,
          end: `${(hour + 1).toString().padStart(2, '0')}:00`,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        if (onScheduleUpdate) onScheduleUpdate();
      } else {
        alert('This slot is no longer available.');
      }
    } catch {
      alert('Error booking the class');
    }
  };

  // Fetch extra info SOLO para ticket classes
  useEffect(() => {
    const normalizedType = normalizeType(selectedBlock?.classType ?? '');
    if (!selectedBlock?.classType ||
        (selectedBlock.classType === 'driving test' || normalizedType === 'driving test') ||
        !selectedBlock.ticketClassId) {
      setTicketClassInfo(null);
      setDrivingClassInfo(null);
      setLocationInfo(null);
      setStudentsInfo([]);
      setLoadingExtra(false);
      return;
    }
    setLoadingExtra(true);
    setTicketClassInfo(null);
    setDrivingClassInfo(null);
    setLocationInfo(null);
    setStudentsInfo([]);
    // 1. TicketClass
    const ticketClassId = typeof selectedBlock.ticketClassId === 'string'
      ? selectedBlock.ticketClassId
      : (selectedBlock.ticketClassId as { toString(): string }).toString();
    fetch(`/api/ticketclasses/${ticketClassId}`)
      .then(res => res.json())
      .then(async (ticketClass) => {
        setTicketClassInfo(ticketClass);
        // 2. DrivingClass
        if(ticketClass.classId) {
          fetch(`/api/drivingclasses/${ticketClass.classId}`)
            .then(res => res.json())
            .then(setDrivingClassInfo);
        }
        // 3. Location
        if(ticketClass.locationId) {
          fetch(`/api/locations/${ticketClass.locationId}`)
            .then(res => res.json())
            .then(setLocationInfo);
        }
        // 4. Students
        if(ticketClass.students && Array.isArray(ticketClass.students)) {
          const students = await Promise.all(ticketClass.students.map(async (s: unknown) => {
            let id = '';
            if (typeof s === 'string') id = s;
            else if (typeof s === 'object' && s !== null && 'studentId' in s) id = (s as { studentId: string }).studentId;
            else return null;
            const res = await fetch(`/api/users?id=${id}`);
            const user = await res.json();
            return user && !user.error ? user : null;
          }));
          setStudentsInfo(students.filter(Boolean));
        }
        setLoadingExtra(false);
      })
      .catch(() => setLoadingExtra(false));
  }, [selectedBlock]);

  // Obtener datos para la barra lateral
  const visibleDates = getVisibleDates(view, selectedDate);
  const { summaryClasses } = groupClassesByStatus(classes, view, selectedDate, () => visibleDates);

  // El return principal del componente debe estar fuera de cualquier función
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Encabezado único y margen superior responsivo */}
      <div className="flex-shrink-0">
        <CalendarHeader
          view={view}
          setView={setView}
          selectedDate={selectedDate}
          handlePrev={handlePrev}
          handleNext={handleNext}
        />
      </div>

      <div className="flex gap-4 w-full flex-1 min-h-0 flex-col lg:flex-row">
        {/* Sidebar izquierda */}
        {!hideSidebars && !isMobile && (
          <div className="flex-shrink-0">
            <CalendarSidebars
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              view={view}
              classFilter={classFilter}
              setClassFilter={setClassFilter}
              summaryClasses={summaryClasses}
              sidebar="left"
              instructorCapabilities={instructorCapabilities}
            />
          </div>
        )}

        {/* Calendario central */}
        <main className="flex-1 min-w-0 overflow-auto">
          {isMobile ? (
            <CalendarMobileViews
              view={view}
              selectedDate={selectedDate}
              classes={classes}
              handleTimeBlockClick={handleTimeBlockClick}
            />
          ) : (
            <>
              {view === 'month' ? (
                <CalendarMonthView
                  selectedDate={selectedDate}
                  classes={classes}
                  handleTimeBlockClick={handleTimeBlockClick}
                />
              ) : (
                <CalendarWeekView
                  selectedDate={selectedDate}
                  classes={classes}
                  handleTimeBlockClick={handleTimeBlockClick}
                  handleEmptyCellClick={handleEmptyCellClick}
                />
              )}
            </>
          )}
        </main>

        {/* Sidebar derecha */}
        {!hideSidebars && !isMobile && (
          <div className="flex-shrink-0">
            <CalendarSidebars
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              view={view}
              classFilter={classFilter}
              setClassFilter={setClassFilter}
              summaryClasses={summaryClasses}
              sidebar="right"
              instructorCapabilities={instructorCapabilities}
            />
          </div>
        )}
      </div>

      {/* Modales */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="flex flex-col max-h-[95vh] sm:max-h-[90vh]">
          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
            <CalendarModalContent
              selectedBlock={selectedBlock}
              studentInfo={studentInfo}
              ticketClassInfo={ticketClassInfo}
              drivingClassInfo={drivingClassInfo}
              locationInfo={locationInfo}
              studentsInfo={studentsInfo}
              loadingExtra={loadingExtra}
              instructorId={instructorId}
            />
          </div>

          <div className="flex-shrink-0 p-3 sm:p-4 border-t border-gray-200 bg-gray-50 flex gap-2 sm:gap-3">
            {instructorId && selectedBlock && (
              <button
                className="bg-[#27ae60] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold hover:bg-[#1e8449] transition-all flex-1 shadow text-xs sm:text-sm active:scale-95"
                onClick={() => {
                  setShowEditModal(true);
                  setModalOpen(false);
                }}
              >
                Edit Class
              </button>
            )}
            <button
              className="bg-[#0056b3] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold hover:bg-[#27ae60] transition-all flex-1 shadow text-xs sm:text-sm active:scale-95"
              onClick={() => setModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="p-6 text-black">
          <h2 className="text-xl font-bold mb-4">Schedule Class</h2>
          <div className="mb-2">Date: {selectedDate?.toLocaleDateString()}</div>
          <div className="mb-2">
            <label htmlFor="start-hour" className="mr-2">Start hour:</label>
            <input id="start-hour" type="number" min={6} max={17} value={selectedDate?.getHours() ?? ''} onChange={e => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), Number(e.target.value)))} className="border rounded p-1 w-16 text-black" />
          </div>
          <div className="mb-4">
            <label htmlFor="end-hour" className="mr-2">End hour:</label>
            <input id="end-hour" type="number" min={6} max={18} value={(selectedDate?.getHours() ?? 6) + 1} onChange={e => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), Number(e.target.value)))} className="border rounded p-1 w-16 text-black" />
          </div>
          <button className="bg-[#27ae60] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#0056b3]" onClick={() => handleAddClass(selectedDate, selectedDate.getHours())}>Confirm</button>
        </div>
      </Modal>

      {/* Booking Modal */}
      {instructorId && (
        <GoogleMapsProvider>
          <BookingModal
            isOpen={showBookingModal}
            onClose={() => setShowBookingModal(false)}
            selectedDate={bookingDate}
            selectedTime={bookingTime}
            instructorId={instructorId}
            instructorCapabilities={instructorCapabilities}
            onBookingCreated={() => {
              setShowBookingModal(false);
              if (onScheduleUpdate) onScheduleUpdate();
            }}
          />
          {selectedBlock && (
            <EditBookingModal
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              booking={selectedBlock}
              instructorId={instructorId}
              onBookingUpdated={() => {
                setShowEditModal(false);
                if (onScheduleUpdate) onScheduleUpdate();
              }}
            />
          )}
        </GoogleMapsProvider>
      )}
    </div>
  );
};

export default CalendarView;