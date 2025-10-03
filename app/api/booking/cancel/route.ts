import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Instructor, { ScheduleSlot } from '@/models/Instructor';
import User from '@/models/User';
import { broadcastScheduleUpdate } from '@/lib/sse-driving-test-broadcast';


export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { studentId, instructorId, date, start, end, slotId, classType } = await request.json();
    
    console.log('🔥 [CANCEL API] Cancel booking request:', { studentId, instructorId, date, start, end, slotId, classType });
    
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

    console.log('🔍 [CANCEL API] Searching for slot with:', { slotId, date, start, end, studentId });

    // 🎯 PRIORITY 1: If slotId is provided, use it for precise matching
    if (slotId) {
      console.log('🎯 [CANCEL API] Searching by slotId:', slotId);
      
      // Check in driving test schedule first
      if (instructor.schedule_driving_test) {
        foundSlot = instructor.schedule_driving_test.find((slot: ScheduleSlot) =>
          slot._id?.toString() === slotId &&
          slot.studentId?.toString() === studentId
        );
        if (foundSlot) {
          scheduleType = 'schedule_driving_test';
          console.log('✅ [CANCEL API] Found slot by ID in driving test schedule');
        }
      }

      // Check in regular schedule if not found
      if (!foundSlot && instructor.schedule) {
        foundSlot = instructor.schedule.find((slot: ScheduleSlot) =>
          slot._id?.toString() === slotId &&
          slot.studentId?.toString() === studentId
        );
        if (foundSlot) {
          scheduleType = 'schedule';
          console.log('✅ [CANCEL API] Found slot by ID in regular schedule');
        }
      }
    }

    // 🔄 FALLBACK: If not found by slotId, search by date/time (legacy)
    if (!foundSlot) {
      console.log('🔄 [CANCEL API] Slot not found by ID, falling back to date/time search');
      
      // Check in driving test schedule - find the slot that belongs to this student
      if (instructor.schedule_driving_test) {
        foundSlot = instructor.schedule_driving_test.find((slot: ScheduleSlot) =>
          slot.date === date &&
          slot.start === start &&
          slot.end === end &&
          slot.studentId?.toString() === studentId &&
          (slot.status === 'booked' || slot.status === 'scheduled' || slot.status === 'pending')
        );
        if (foundSlot) scheduleType = 'schedule_driving_test';
      }

      // Check in regular schedule if not found
      if (!foundSlot && instructor.schedule) {
        foundSlot = instructor.schedule.find((slot: ScheduleSlot) =>
          slot.date === date &&
          slot.start === start &&
          slot.end === end &&
          slot.studentId?.toString() === studentId &&
          (slot.status === 'booked' || slot.status === 'scheduled' || slot.status === 'pending')
        );
        if (foundSlot) scheduleType = 'schedule';
      }
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

    // SOLO para slots "pending" - liberar el slot directamente
    if (foundSlot.status === 'pending') {
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

      console.log('✅ Pending slot cancelled and set to available');
    }
    // Para slots "booked" o "scheduled" - marcar como cancelled y crear nuevo slot disponible
    else if (foundSlot.status === 'booked' || foundSlot.status === 'scheduled') {
      console.log('📋 Original slot before cancellation:', JSON.stringify(foundSlot, null, 2));
      console.log('📋 Slot payment method:', foundSlot.paymentMethod);
      console.log('📋 Is this a redeemed slot?', foundSlot.paymentMethod === 'redeemed');

      // 1. Marcar el slot actual como 'cancelled'
      foundSlot.status = 'cancelled';

      // 2. Crear un nuevo slot con el mismo horario pero disponible con un _id único
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 11);
      const slotIdString = `driving_test_${instructorId}_${date}_${start}_${timestamp}_${randomStr}`;

      console.log('🆕 Creating new slot with ID:', slotIdString);

      // Crear objeto LIMPIO con SOLO los campos necesarios para un slot available
      // Usar JSON.parse(JSON.stringify()) para asegurar que es un objeto completamente nuevo
      const newAvailableSlot = JSON.parse(JSON.stringify({
        _id: slotIdString,
        date: date,
        start: start,
        end: end,
        booked: false,
        studentId: null,
        status: 'available',
        classType: foundSlot.classType || 'driving test',
        studentName: null,
        paid: false,
        amount: foundSlot.amount || 50,
      }));

      console.log('🆕 New slot object:', JSON.stringify(newAvailableSlot, null, 2));

      // Agregar el nuevo slot disponible al schedule correspondiente
      if (scheduleType === 'schedule_driving_test' && instructor.schedule_driving_test) {
        instructor.schedule_driving_test.push(newAvailableSlot);
        console.log('📊 Added to schedule_driving_test. Total slots before save:', instructor.schedule_driving_test.length);
      } else if (scheduleType === 'schedule' && instructor.schedule) {
        instructor.schedule.push(newAvailableSlot);
        console.log('📊 Added to schedule. Total slots before save:', instructor.schedule.length);
      }

      // Mark the correct schedule as modified
      instructor.markModified(scheduleType);
      await instructor.save();

      console.log('✅ Booked slot marked as cancelled and new available slot created with ID:', newAvailableSlot._id);

      // Verify the slot was added
      const updatedInstructor = await Instructor.findById(instructorId);
      const scheduleArray = scheduleType === 'schedule_driving_test' ? updatedInstructor?.schedule_driving_test : updatedInstructor?.schedule;
      console.log('📊 Total slots after save:', scheduleArray?.length);
      console.log('📊 New slot found in DB:', scheduleArray?.some((s: ScheduleSlot) => s._id === newAvailableSlot._id));

      // Move booking from driving_test_bookings to driving_test_cancelled in User
      try {
        const user = await User.findById(studentId);
        console.log('🔍 User found for moving booking:', {
          userId: user?._id,
          bookingsCount: user?.driving_test_bookings?.length || 0,
          cancelledCount: user?.driving_test_cancelled?.length || 0
        });

        if (user && user.driving_test_bookings) {
          console.log('🔍 All bookings:', user.driving_test_bookings.map((b: { slotId?: string; date: string; start: string; end: string }) => ({
            slotId: b.slotId?.toString(),
            date: b.date,
            start: b.start,
            end: b.end
          })));

          console.log('🔍 Looking for slot:', {
            slotId: foundSlot._id?.toString(),
            date: date,
            start: start,
            end: end
          });

          // Find the booking to move by matching date, start, end (more reliable than just slotId)
          const bookingIndex = user.driving_test_bookings.findIndex(
            (b: { slotId?: string; date: string; start: string; end: string }) =>
              b.date === date &&
              b.start === start &&
              b.end === end
          );

          console.log('🔍 Booking found at index:', bookingIndex);

          if (bookingIndex !== -1) {
            const booking = user.driving_test_bookings[bookingIndex];

            // Check if this booking was redeemed (used a cancelled slot)
            const wasRedeemed = booking.redeemed === true;
            const redeemedFromSlotId = booking.redeemedFrom;

            console.log('🔍 Booking redeemed status:', {
              wasRedeemed,
              redeemedFromSlotId
            });

            // If this booking was redeemed, restore the original cancelled slot back
            if (wasRedeemed && redeemedFromSlotId) {
              console.log('🔄 This was a redeemed booking, restoring original cancelled slot:', redeemedFromSlotId);

              // Find the original cancelled slot info from the current booking
              // We need to restore it to driving_test_cancelled
              const restoredCancelledSlot = {
                slotId: redeemedFromSlotId,
                instructorId: booking.instructorId,
                instructorName: booking.instructorName,
                date: booking.date,
                start: booking.start,
                end: booking.end,
                amount: booking.amount,
                bookedAt: booking.bookedAt,
                cancelledAt: new Date(), // When it was originally cancelled
                orderId: booking.orderId,
                status: 'cancelled' as const
              };

              await User.findByIdAndUpdate(
                studentId,
                {
                  $pull: {
                    driving_test_bookings: {
                      date: date,
                      start: start,
                      end: end
                    }
                  },
                  $push: { driving_test_cancelled: restoredCancelledSlot }
                },
                { new: true }
              );

              console.log('✅ Restored cancelled slot back to user (redeemed booking cancelled)');
            } else {
              // Normal cancellation: move booking to cancelled array
              const cancelledBooking = {
                ...booking.toObject(),
                status: 'cancelled' as const,
                cancelledAt: new Date()
              };

              const updatedUser = await User.findByIdAndUpdate(
                studentId,
                {
                  $pull: {
                    driving_test_bookings: {
                      date: date,
                      start: start,
                      end: end
                    }
                  },
                  $push: { driving_test_cancelled: cancelledBooking }
                },
                { new: true }
              );

              console.log('✅ Moved booking to cancelled array in User:', {
                remainingBookings: updatedUser?.driving_test_bookings?.length || 0,
                totalCancelled: updatedUser?.driving_test_cancelled?.length || 0
              });
            }
          } else {
            console.log('⚠️ Booking not found in user.driving_test_bookings');
          }
        } else {
          console.log('⚠️ User or driving_test_bookings not found');
        }
      } catch (userError) {
        console.error('❌ Error updating User bookings:', userError);
        // Don't fail the whole request if User update fails
      }
    }

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
