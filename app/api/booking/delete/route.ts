import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Instructor from '@/models/Instructor';
import { broadcastScheduleUpdate } from '@/lib/sse-driving-test-broadcast';

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { bookingId, instructorId, date, start, end } = await request.json();

    console.log('🗑️ Delete booking request:', { bookingId, instructorId, date, start, end });

    if (!instructorId || !date || !start || !end) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Buscar al instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    // Buscar el slot a eliminar en los tres posibles arrays
    let slotIndex = -1;
    let scheduleField: 'schedule' | 'schedule_driving_lesson' | 'schedule_driving_test' | null = null;
    
    const arraysToCheck: Array<{ field: 'schedule' | 'schedule_driving_lesson' | 'schedule_driving_test', array: any[] }> = [
      { field: 'schedule', array: instructor.schedule || [] },
      { field: 'schedule_driving_lesson', array: instructor.schedule_driving_lesson || [] },
      { field: 'schedule_driving_test', array: instructor.schedule_driving_test || [] }
    ];

    for (const { field, array } of arraysToCheck) {
      if (bookingId) {
        slotIndex = array.findIndex((slot: any) => 
          slot._id?.toString() === bookingId
        );
        if (slotIndex !== -1) {
          scheduleField = field;
          console.log('🔍 Found by bookingId in:', field, 'at index:', slotIndex);
          break;
        }
      }
      
      if (slotIndex === -1) {
        slotIndex = array.findIndex((slot: any) => 
          slot.date === date && slot.start === start && slot.end === end
        );
        if (slotIndex !== -1) {
          scheduleField = field;
          console.log('🔍 Found by date/time in:', field, 'at index:', slotIndex);
          break;
        }
      }
    }

    if (slotIndex === -1 || !scheduleField) {
      console.log('❌ Booking not found in any schedule array');
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Eliminar el slot del array correcto
    (instructor[scheduleField] as any[]).splice(slotIndex, 1);
    instructor.markModified(scheduleField);
    await instructor.save();

    console.log('✅ Booking deleted successfully from', scheduleField);

    // Broadcast update
    try {
      broadcastScheduleUpdate(instructorId);
      console.log('✅ Schedule update broadcasted via SSE after deletion');
    } catch (broadcastError) {
      console.error('❌ Failed to broadcast schedule update:', broadcastError);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete booking', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
