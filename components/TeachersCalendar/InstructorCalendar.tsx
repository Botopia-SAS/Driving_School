import React from 'react';
import CalendarView from './CalendarView';
import type { Class } from './types';

//Adaptador: convierte el schedule de la base de datos al formato de clases para CalendarView
function adaptScheduleToClasses(schedule: Record<string, unknown>[]): Class[] {
  if (!Array.isArray(schedule)) return [];
  //Nueva estructura: cada objeto es un slot
  const result = schedule.map((slot: Record<string, unknown>, idx: number) => ({
    id: slot._id ? String(slot._id) : `${slot.date}_${slot.start}_${slot.end}_${idx}`,
    date: String(slot.date),
    dateObj: new Date(String(slot.date)),
    hour: typeof slot.start === 'string' ? parseInt(slot.start.split(':')[0], 10) : 0,
    status: (slot.status === 'canceled' ? 'cancelled' : slot.status || 'available') as Class['status'],
    studentId: slot.studentId as string | undefined,
    instructorId: slot.instructorId as string | undefined,
    start: typeof slot.start === 'string' ? slot.start.padStart(5, '0') : '',
    end: typeof slot.end === 'string' ? slot.end.padStart(5, '0') : '',
    classType: slot.classType as string || 'driving lesson', // Default to driving lesson if not specified
    amount: typeof slot.amount === 'number' ? slot.amount : Number(slot.amount),
    paid: Boolean(slot.paid),
    pickupLocation: slot.pickupLocation as string,
    dropoffLocation: slot.dropoffLocation as string,
    ticketClassId: slot.ticketClassId as string,
    slots: undefined,
  }));
  console.log('Clases adaptadas para el calendario:', result); // Debug temporalmente
  return result;
}

const InstructorCalendar: React.FC<{ 
  schedule?: unknown[];
  onScheduleUpdate?: () => void; 
  studentMode?: boolean 
}> = ({ schedule = [], onScheduleUpdate, studentMode }) => {
  const classes = adaptScheduleToClasses(schedule as Record<string, unknown>[]);
  //Si es modo estudiante, solo muestra el calendario central y el mensaje
  if (studentMode) {
    return (
      <div className="rounded-3xl shadow-2xl p-4 overflow-x-auto min-h-[520px] bg-gradient-to-br from-[#e8f6ef] via-[#f0f6ff] to-[#eafaf1] border border-[#e0e0e0] w-full max-w-5xl mx-auto">
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-[#0056b3] text-center text-lg font-semibold">
          Visualiza los espacios libres y agenda tu clase en uno de ellos.<br />No puedes editar ni cancelar reservas.
        </div>
        <CalendarView classes={classes} onScheduleUpdate={onScheduleUpdate} onClassClick={() => {}} />
      </div>
    );
  }
  // Modo instructor (por defecto)
  return (
    <div>
      <CalendarView classes={classes} onScheduleUpdate={onScheduleUpdate} onClassClick={() => {}} />
    </div>
  );
};

export default InstructorCalendar; 