import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Instructor from '@/models/Instructor';
import mongoose from 'mongoose';
import { broadcastScheduleUpdate } from '@/lib/sse-driving-test-broadcast';

// Define proper types for socket.io
declare global {
  const io: {
    emit: (event: string, data: unknown) => void;
  };
}

interface Slot {
  date?: string;
  start: string;
  end: string;
  status: 'free' | 'scheduled' | 'available';
  booked?: boolean;
  studentId?: mongoose.Types.ObjectId;
  classType?: string;
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const { studentId, instructorId, date, start, end, classType, amount, paid, pickupLocation, dropoffLocation } = await request.json();

    // console.log('📅 Booking request:', { studentId, instructorId, date, start, end, classType });

    if (!studentId || !instructorId || !date || !start || !end) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Buscar al instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      // console.log('❌ Instructor not found:', instructorId);
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    // Determinar el array correcto según el classType
    let scheduleArray: Slot[] = instructor.schedule || [];
    let scheduleField = 'schedule';

    if (classType === 'driving lesson') {
      scheduleArray = instructor.schedule_driving_lesson || [];
      scheduleField = 'schedule_driving_lesson';
    } else if (classType === 'driving test') {
      scheduleArray = instructor.schedule_driving_test || [];
      scheduleField = 'schedule_driving_test';
    } else if (['ticket class', 'D.A.T.E.', 'A.D.I.', 'B.D.I.'].includes(classType)) {
      scheduleArray = instructor.schedule || [];
      scheduleField = 'schedule';
    }

    console.log(`📊 Instructor ${instructorId} has ${scheduleArray.length || 0} slots in ${scheduleField}`);

    // Buscar slots que se solapen con el horario solicitado
    const overlappingSlot = scheduleArray.find((slot: Slot) => {
      if (slot.date !== date) return false;

      // Verificar si hay solapamiento de horarios
      const slotStart = slot.start;
      const slotEnd = slot.end;

      // Hay solapamiento si:
      // - El nuevo slot empieza durante un slot existente
      // - El nuevo slot termina durante un slot existente
      // - El nuevo slot envuelve completamente un slot existente
      const overlaps = (start >= slotStart && start < slotEnd) ||
                      (end > slotStart && end <= slotEnd) ||
                      (start <= slotStart && end >= slotEnd);

      return overlaps && (slot.status === 'scheduled' || slot.booked);
    });

    if (overlappingSlot) {
      return NextResponse.json({
        error: 'Slot is not available - there is already a scheduled class at this time',
        details: { existingSlot: { start: overlappingSlot.start, end: overlappingSlot.end } }
      }, { status: 409 });
    }

    // Buscar si existe un slot exacto (libre o disponible) en el array correcto
    let slot = scheduleArray.find((slot: Slot) =>
      slot.date === date &&
      slot.start === start &&
      slot.end === end
    );

    // Si no existe el slot o existe pero está libre, crearlo/actualizarlo
    if (!slot || slot.status === 'free' || slot.status === 'available') {
      console.log('📝 Creating/updating slot:', { date, start, end, classType });

      if (!slot) {
        // Crear nuevo slot
        const newSlot: any = {
          _id: new mongoose.Types.ObjectId().toString(),
          date,
          start,
          end,
          status: 'scheduled',
          booked: true,
          studentId: new mongoose.Types.ObjectId(studentId),
          classType,
        };

        // Agregar campos adicionales
        if (amount !== undefined) newSlot.amount = amount;
        if (paid !== undefined) newSlot.paid = paid;
        if (pickupLocation) newSlot.pickupLocation = pickupLocation;
        if (dropoffLocation) newSlot.dropoffLocation = dropoffLocation;

        // Agregar al array correcto
        if (scheduleField === 'schedule_driving_lesson') {
          if (!instructor.schedule_driving_lesson) instructor.schedule_driving_lesson = [];
          instructor.schedule_driving_lesson.push(newSlot);
        } else if (scheduleField === 'schedule_driving_test') {
          if (!instructor.schedule_driving_test) instructor.schedule_driving_test = [];
          instructor.schedule_driving_test.push(newSlot);
        } else {
          if (!instructor.schedule) instructor.schedule = [];
          instructor.schedule.push(newSlot);
        }
      } else {
        // Actualizar slot existente
        slot.status = 'scheduled';
        slot.booked = true;
        slot.studentId = new mongoose.Types.ObjectId(studentId);
        slot.classType = classType;

        if (amount !== undefined) (slot as any).amount = amount;
        if (paid !== undefined) (slot as any).paid = paid;
        if (pickupLocation) (slot as any).pickupLocation = pickupLocation;
        if (dropoffLocation) (slot as any).dropoffLocation = dropoffLocation;
      }

      // Marcar el campo correcto como modificado
      instructor.markModified(scheduleField);
      await instructor.save();

      // Broadcast real-time update
      try {
        broadcastScheduleUpdate(instructorId);
        console.log('✅ Schedule update broadcasted via SSE');
      } catch (broadcastError) {
        console.error('❌ Failed to broadcast schedule update:', broadcastError);
      }

      return NextResponse.json({
        success: true,
        message: 'Class scheduled successfully',
        booking: {
          instructorId,
          date,
          start,
          end,
          classType,
          studentId
        }
      });
    }

    // Si llegamos aquí, el slot existe pero no está disponible
    return NextResponse.json({
      error: 'Slot is not available',
      details: { status: slot.status, booked: slot.booked }
    }, { status: 409 });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ 
      error: 'Failed to book slot', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 