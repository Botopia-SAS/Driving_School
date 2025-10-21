import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Instructor from '@/models/Instructor';
import mongoose from 'mongoose';
import { broadcastScheduleUpdate } from '@/lib/sse-driving-test-broadcast';

// Helper para encontrar booking en los arrays
const findBookingInArrays = (
  arraysToCheck: Array<{ field: ScheduleField; array: ScheduleSlot[] }>,
  bookingId: string | undefined,
  date: string,
  start: string,
  end: string
) => {
  let slotIndex = -1;
  let scheduleArray: ScheduleSlot[] | null = null;
  let scheduleField: ScheduleField | null = null;

  for (const { field, array } of arraysToCheck) {
    if (bookingId) {
      slotIndex = array.findIndex((slot) => 
        slot._id?.toString() === bookingId
      );
      if (slotIndex !== -1) {
        scheduleArray = array;
        scheduleField = field;
        console.log('🔍 Found by bookingId in:', field, 'at index:', slotIndex);
        break;
      }
    }
    
    if (slotIndex === -1) {
      slotIndex = array.findIndex((slot) => 
        slot.date === date && slot.start === start && slot.end === end
      );
      if (slotIndex !== -1) {
        scheduleArray = array;
        scheduleField = field;
        console.log('🔍 Found by date/time in:', field, 'at index:', slotIndex);
        break;
      }
    }
  }

  return { slotIndex, scheduleArray, scheduleField };
};

type ScheduleField = 'schedule' | 'schedule_driving_lesson' | 'schedule_driving_test';
interface ScheduleSlot {
  _id?: { toString(): string };
  date: string;
  start: string;
  end: string;
  studentId?: mongoose.Types.ObjectId | null;
  status?: string;
  booked?: boolean;
  classType?: string;
  amount?: number;
  paid?: boolean;
  pickupLocation?: string;
  dropoffLocation?: string;
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const { 
      bookingId, 
      instructorId, 
      studentId, 
      date, 
      start, 
      end, 
      classType, 
      amount, 
      paid, 
      pickupLocation, 
      dropoffLocation 
    } = await request.json();

    console.log('📝 Update booking request:', { bookingId, instructorId, date, start, end, studentId });

    if (!instructorId || !date || !start || !end) {
      console.log('❌ Missing required fields');
      return NextResponse.json({ error: 'Missing required fields', received: { instructorId, date, start, end } }, { status: 400 });
    }

    // Buscar al instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    console.log('📊 Instructor schedules:', {
      schedule: instructor.schedule?.length || 0,
      schedule_driving_lesson: instructor.schedule_driving_lesson?.length || 0,
      schedule_driving_test: instructor.schedule_driving_test?.length || 0
    });

    // Buscar el slot a actualizar en los tres posibles arrays
    const arraysToCheck: Array<{ field: ScheduleField; array: ScheduleSlot[] }> = [
      { field: 'schedule', array: instructor.schedule || [] },
      { field: 'schedule_driving_lesson', array: instructor.schedule_driving_lesson || [] },
      { field: 'schedule_driving_test', array: instructor.schedule_driving_test || [] }
    ];

    const { slotIndex, scheduleArray, scheduleField } = findBookingInArrays(
      arraysToCheck, 
      bookingId, 
      date, 
      start, 
      end
    );

    if (slotIndex === -1 || !scheduleArray || !scheduleField) {
      console.log('❌ Booking not found in any schedule array');
      console.log('All schedules:', {
        schedule: instructor.schedule?.slice(0, 2),
        schedule_driving_lesson: instructor.schedule_driving_lesson?.slice(0, 2),
        schedule_driving_test: instructor.schedule_driving_test?.slice(0, 2)
      });
      return NextResponse.json({ 
        error: 'Booking not found', 
        searched: { bookingId, date, start, end },
        availableSlots: {
          schedule: instructor.schedule?.length || 0,
          schedule_driving_lesson: instructor.schedule_driving_lesson?.length || 0,
          schedule_driving_test: instructor.schedule_driving_test?.length || 0
        }
      }, { status: 404 });
    }

    // Actualizar el slot
    const slot = scheduleArray[slotIndex];
    
    console.log('📝 Current slot before update:', JSON.stringify(slot));
    console.log('📝 Updating in field:', scheduleField);
    
    // Solo actualizar studentId si se proporciona
    if (studentId) {
      slot.studentId = mongoose.Types.ObjectId.createFromHexString(studentId);
      slot.status = 'scheduled'; // Siempre 'scheduled' cuando hay estudiante
      slot.booked = true; // Marcar como booked también
      console.log('✅ Setting student and status to scheduled');
    } else {
      slot.studentId = null;
      slot.status = 'available';
      slot.booked = false;
      console.log('✅ Clearing student and setting status to available');
    }
    
    slot.classType = classType;
    
    if (amount !== undefined) slot.amount = amount;
    if (paid !== undefined) slot.paid = paid;
    if (pickupLocation !== undefined) slot.pickupLocation = pickupLocation;
    if (dropoffLocation !== undefined) slot.dropoffLocation = dropoffLocation;

    console.log('📝 Slot after update:', JSON.stringify(slot));

    instructor.markModified(scheduleField);
    await instructor.save();
    
    console.log('✅ Booking updated successfully in', scheduleField);

    // Recargar el instructor para verificar que se guardó correctamente
    const updatedInstructor = await Instructor.findById(instructorId);
    const updatedSlot = (updatedInstructor[scheduleField] as ScheduleSlot[])[slotIndex];
    console.log('✅ Verified saved slot:', JSON.stringify(updatedSlot));

    // Broadcast update
    try {
      broadcastScheduleUpdate(instructorId);
      console.log('✅ Schedule update broadcasted via SSE');
    } catch (broadcastError) {
      console.error('❌ Failed to broadcast schedule update:', broadcastError);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      booking: slot
    });
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json({ 
      error: 'Failed to update booking', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
