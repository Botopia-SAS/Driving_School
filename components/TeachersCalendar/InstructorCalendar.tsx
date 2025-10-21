import React from 'react';
import CalendarView from './CalendarView';
import type { Class } from './types';

//Adaptador: convierte el schedule de la base de datos al formato de clases para CalendarView
function adaptScheduleToClasses(schedule: Record<string, unknown>[]): Class[] {
  if (!Array.isArray(schedule)) return [];
  //Nueva estructura: cada objeto es un slot
  const result = schedule.map((slot: Record<string, unknown>, idx: number) => {
    // Normalizar el status: 'booked' y 'canceled' se convierten a 'scheduled' y 'cancelled'
    let normalizedStatus = slot.status as string;
    if (normalizedStatus === 'canceled') normalizedStatus = 'cancelled';
    if (normalizedStatus === 'booked') normalizedStatus = 'scheduled';
    
    // Convertir _id a string de forma segura
    const mongoId = slot._id;
    let idString: string | undefined;
    if (mongoId) {
      if (typeof mongoId === 'string') {
        idString = mongoId;
      } else {
        idString = (mongoId as { toString(): string }).toString();
      }
    }
    
    const slotId = idString || `${slot.date}_${slot.start}_${slot.end}_${idx}`;
    const startTime = typeof slot.start === 'string' ? slot.start : '';
    const startHour = startTime ? Number.parseInt(startTime.split(':')[0], 10) : 0;
    
    return {
      id: slotId,
      _id: idString, // Preservar el _id original como string
      date: String(slot.date),
      dateObj: new Date(String(slot.date)),
      hour: startHour,
      status: (normalizedStatus || 'available') as Class['status'],
      studentId: slot.studentId as string | undefined,
      instructorId: slot.instructorId as string | undefined,
      start: startTime.padStart(5, '0'),
      end: typeof slot.end === 'string' ? slot.end.padStart(5, '0') : '',
      classType: slot.classType as string || 'driving lesson', // Default to driving lesson if not specified
      amount: typeof slot.amount === 'number' ? slot.amount : Number(slot.amount),
      paid: Boolean(slot.paid),
      pickupLocation: slot.pickupLocation as string,
      dropoffLocation: slot.dropoffLocation as string,
      ticketClassId: slot.ticketClassId as string,
      slots: undefined,
    };
  });
  console.log('Clases adaptadas para el calendario:', result); // Debug temporalmente
  return result;
}

const InstructorCalendar: React.FC<{
  schedule?: unknown[];
  onScheduleUpdate?: () => void;
  studentMode?: boolean;
  instructorId?: string;
  instructorCapabilities?: string[];
}> = ({ schedule = [], onScheduleUpdate, studentMode, instructorId, instructorCapabilities }) => {
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
      <CalendarView
        classes={classes}
        onScheduleUpdate={onScheduleUpdate}
        onClassClick={() => {}}
        instructorId={instructorId}
        instructorCapabilities={instructorCapabilities}
      />
    </div>
  );
};

export default InstructorCalendar; 