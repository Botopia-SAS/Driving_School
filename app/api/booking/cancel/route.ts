import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Instructor, { ScheduleSlot } from '@/models/Instructor';
import { broadcastScheduleUpdate } from '@/lib/sse-driving-test-broadcast';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { studentId, instructorId, date, start, end } = await request.json();
    
    // console.log('🔥 Cancel booking request:', { studentId, instructorId, date, start, end, slotId, classType });
    
    if (!studentId || !instructorId || !date || !start || !end) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Buscar al instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    // console.log('🔍 Found instructor:', instructor.name);

    // Buscar el slot en la estructura correcta
    let foundSlot: ScheduleSlot | null = null;
    let scheduleType: string | null = null;

    // Check in driving test schedule
    if (instructor.schedule_driving_test) {
      foundSlot = instructor.schedule_driving_test.find((slot: ScheduleSlot) => 
        slot.date === date && slot.start === start && slot.end === end
      );
      if (foundSlot) scheduleType = 'schedule_driving_test';
    }

    // Check in regular schedule if not found
    if (!foundSlot && instructor.schedule) {
      foundSlot = instructor.schedule.find((slot: ScheduleSlot) => 
        slot.date === date && slot.start === start && slot.end === end
      );
      if (foundSlot) scheduleType = 'schedule';
    }
    
    if (!foundSlot) {
    // console.log('❌ Slot not found in instructor schedules');
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // console.log('✅ Found slot:', foundSlot, 'in', scheduleType);

    // Verificar que el slot pertenece al estudiante
    if (foundSlot.studentId?.toString() !== studentId) {
    // console.log('❌ Unauthorized - slot belongs to:', foundSlot.studentId, 'but request from:', studentId);
      return NextResponse.json({ error: 'Unauthorized to cancel this booking' }, { status: 403 });
    }

    // Liberar el slot y volverlo disponible
    foundSlot.status = 'available';
    foundSlot.studentId = null;
    foundSlot.studentName = undefined as unknown as string;
    foundSlot.reservedAt = undefined as unknown as Date;
    foundSlot.paymentMethod = undefined as unknown as string;
    
    // Eliminar campos innecesarios
    delete (foundSlot as unknown as Record<string, unknown>).booked;
    delete (foundSlot as unknown as Record<string, unknown>).orderId;
    delete (foundSlot as unknown as Record<string, unknown>).orderNumber;
    
    // Limpiar campos que solo aplican a driving lessons
    delete (foundSlot as unknown as Record<string, unknown>).pickupLocation;
    delete (foundSlot as unknown as Record<string, unknown>).dropoffLocation;
    delete (foundSlot as unknown as Record<string, unknown>).selectedProduct;
    
    // Mark the correct schedule as modified
    instructor.markModified(scheduleType);
    await instructor.save();

    // console.log('✅ Slot cancelled and set to available');

    // Broadcast real-time update to SSE connections
    try {
      broadcastScheduleUpdate(instructorId);
      console.log('✅ Schedule update broadcasted via SSE');
    } catch (broadcastError) {
      console.error('❌ Failed to broadcast schedule update:', broadcastError);
    }

    // Emit socket event for real-time updates (if socket.io is available)
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as unknown as { io?: unknown }).io) {
        ((globalThis as unknown as { io: { emit: (event: string, data: unknown) => void } }).io).emit('scheduleUpdate', {
          instructorId,
          date,
          start,
          end,
          status: 'available',
          studentId: null
        });
      }
    } catch {
      // console.log('Socket emission failed:', socketError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Booking cancelled successfully. Slot is now available.',
      slot: {
        date,
        start,
        end,
        status: 'available'
      }
    });
  } catch (error) {
    // console.error('❌ Error cancelling booking:', error);
    return NextResponse.json({ 
      error: 'Failed to cancel booking', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
