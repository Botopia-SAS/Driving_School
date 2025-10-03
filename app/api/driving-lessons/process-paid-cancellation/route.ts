import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Instructor from '@/models/Instructor';
import User from '@/models/User';
import { broadcastScheduleUpdate } from '@/lib/sse-driving-lessons-broadcast';

interface ScheduleSlot {
  _id?: string;
  date: string;
  start: string;
  end: string;
  status: string;
  studentId?: string;
  studentName?: string;
  booked?: boolean;
  paid?: boolean;
  amount?: number;
  classType?: string;
  selectedProduct?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  paymentMethod?: string;
  requestDate?: Date;
}

/**
 * POST /api/driving-lessons/process-paid-cancellation
 *
 * Processes a driving lesson cancellation AFTER payment has been completed.
 * This endpoint is called after successful Stripe payment for cancellation fee.
 * 
 * This endpoint:
 * 1. Validates the booking exists and belongs to the student
 * 2. Marks the slot as cancelled in instructor's schedule  
 * 3. Creates a new available slot (same time)
 * 4. Moves booking from driving_lesson_bookings to driving_lesson_cancelled
 * 5. Does NOT add to cancelled credits (since paid cancellation within 48h)
 * 6. Broadcasts real-time updates via SSE
 *
 * @param {string} studentId - ID of the student cancelling
 * @param {string} instructorId - ID of the instructor
 * @param {string} date - Date of the slot (YYYY-MM-DD)
 * @param {string} start - Start time (HH:MM)
 * @param {string} end - End time (HH:MM) 
 * @param {string} slotId - ID of the specific slot
 * @param {string} orderId - Stripe order ID for payment tracking
 *
 * @returns {object} Cancellation result
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { studentId, instructorId, date, start, end, slotId, orderId } = await request.json();

    console.log('💰 [DRIVING LESSON PAID CANCEL] Processing paid cancellation:', { 
      studentId, instructorId, date, start, end, slotId, orderId 
    });

    // Validate required fields
    if (!studentId || !instructorId || !date || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      );
    }

    console.log('🔍 [DRIVING LESSON PAID CANCEL] Found instructor:', instructor.name);

    // Find the slot in the instructor's driving lesson schedule
    let foundSlot: ScheduleSlot | null = null;
    let scheduleType: string | null = null;

    // Check in driving lesson schedule
    // IMPORTANT: Use slotId if provided to avoid finding wrong slot when multiple slots exist at same time
    if (instructor.schedule_driving_lesson) {
      if (slotId) {
        // Use slotId for precise matching
        foundSlot = instructor.schedule_driving_lesson.find((slot: ScheduleSlot) =>
          slot._id === slotId
        );
        console.log('🔍 [DRIVING LESSON PAID CANCEL] Searching by slotId:', slotId, 'Found:', !!foundSlot);
      } else {
        // Fallback to date/time matching (also match studentId to avoid conflicts)
        foundSlot = instructor.schedule_driving_lesson.find((slot: ScheduleSlot) =>
          slot.date === date &&
          slot.start === start &&
          slot.end === end &&
          slot.studentId === studentId
        );
        console.log('🔍 [DRIVING LESSON PAID CANCEL] Searching by date/time/studentId. Found:', !!foundSlot);
      }
      if (foundSlot) scheduleType = 'schedule_driving_lesson';
    }

    if (!foundSlot) {
      console.log('❌ [DRIVING LESSON PAID CANCEL] Slot not found in instructor schedules');
      return NextResponse.json(
        { error: 'Slot not found' },
        { status: 404 }
      );
    }

    console.log('✅ [DRIVING LESSON PAID CANCEL] Found slot:', foundSlot, 'in', scheduleType);

    // Verify the slot belongs to the student
    if (foundSlot.studentId !== studentId) {
      console.log('❌ [DRIVING LESSON PAID CANCEL] Slot does not belong to student');
      return NextResponse.json(
        { error: 'This booking does not belong to you' },
        { status: 403 }
      );
    }

    // Process the paid cancellation (same as regular cancellation but no credit given)
    console.log('📋 [DRIVING LESSON PAID CANCEL] Original slot before cancellation:', 
      JSON.stringify(foundSlot, null, 2));

    // 1. Mark the slot as cancelled
    foundSlot.status = 'cancelled';

    // 2. Create a new available slot with unique ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 11);
    const slotIdString = `driving_lesson_${instructorId}_${date}_${start}_${timestamp}_${randomStr}`;

    console.log('🆕 [DRIVING LESSON PAID CANCEL] Creating new slot with ID:', slotIdString);

    const newAvailableSlot = {
      _id: slotIdString,
      date: date,
      start: start,
      end: end,
      booked: false,
      studentId: null,
      status: 'available',
      classType: foundSlot.classType || 'driving lesson',
      studentName: null,
      paid: false,
      pickupLocation: '',
      dropoffLocation: '',
      selectedProduct: ''
    };

    // Add the new available slot to the schedule
    if (scheduleType === 'schedule_driving_lesson' && instructor.schedule_driving_lesson) {
      instructor.schedule_driving_lesson.push(newAvailableSlot);
      console.log('📊 [DRIVING LESSON PAID CANCEL] Added to schedule_driving_lesson. Total slots before save:', 
        instructor.schedule_driving_lesson.length);
    }

    instructor.markModified(scheduleType!);
    await instructor.save();

    console.log('✅ [DRIVING LESSON PAID CANCEL] Slot marked as cancelled and new available slot created');

    // 3. Find the user and move booking from booked to cancelled
    const user = await User.findById(studentId);
    console.log('🔍 [DRIVING LESSON PAID CANCEL] User found for moving booking:', {
      userId: user?._id,
      drivingLessonBookingsCount: user?.driving_lesson_bookings?.length || 0,
      drivingLessonCancelledCount: user?.driving_lesson_cancelled?.length || 0
    });

    if (user && user.driving_lesson_bookings) {
      // Find the booking to move
      // IMPORTANT: Try to find by slotId first (most precise), then fallback to date/time matching
      let bookingIndex = -1;

      if (slotId) {
        bookingIndex = user.driving_lesson_bookings.findIndex((booking: Record<string, unknown>) =>
          booking.slotId?.toString() === slotId
        );
        console.log('🔍 [DRIVING LESSON PAID CANCEL] Searching by slotId:', slotId, 'Found index:', bookingIndex);
      }

      // Fallback to date/time/instructor matching if not found by slotId
      if (bookingIndex === -1) {
        bookingIndex = user.driving_lesson_bookings.findIndex((booking: Record<string, unknown>) =>
          booking.instructorId?.toString() === instructorId &&
          booking.date === date &&
          booking.start === start &&
          booking.end === end
        );
        console.log('🔍 [DRIVING LESSON PAID CANCEL] Searching by date/time/instructor. Found index:', bookingIndex);
      }

      console.log('🔍 [DRIVING LESSON PAID CANCEL] Looking for booking to move:', {
        slotId, instructorId, date, start, end, bookingIndex
      });

      if (bookingIndex !== -1) {
        const bookingToMove = user.driving_lesson_bookings[bookingIndex];
        console.log('✅ [DRIVING LESSON PAID CANCEL] Found booking to move:', bookingToMove);

        // Remove from bookings
        user.driving_lesson_bookings.splice(bookingIndex, 1);

        // Add to cancelled with current timestamp and order ID
        const cancelledBooking = {
          ...bookingToMove.toObject(),
          cancelledAt: new Date(),
          status: 'cancelled',
          paidCancellation: true, // Mark as paid cancellation
          cancellationOrderId: orderId // Track payment order
        };

        // Use direct update operation to avoid validation issues
        const updateResult = await User.updateOne(
          { _id: studentId },
          {
            $pull: {
              driving_lesson_bookings: {
                instructorId: instructorId,
                date: date,
                start: start,
                end: end
              }
            }
          }
        );

        console.log('🔄 [DRIVING LESSON PAID CANCEL] Removed booking from user:', updateResult);

        // Add to cancelled array
        const cancelledUpdateResult = await User.updateOne(
          { _id: studentId },
          {
            $push: {
              driving_lesson_cancelled: cancelledBooking
            }
          }
        );

        console.log('✅ [DRIVING LESSON PAID CANCEL] Added to cancelled bookings:', cancelledUpdateResult);
        console.log('💰 [DRIVING LESSON PAID CANCEL] Paid cancellation processed - no credit granted');
      } else {
        console.log('❌ [DRIVING LESSON PAID CANCEL] Booking not found in user bookings');
      }
    } else {
      console.log('❌ [DRIVING LESSON PAID CANCEL] User not found or no bookings');
    }

    // 4. Broadcast SSE update
    try {
      await broadcastScheduleUpdate(instructorId);
      console.log('📡 [DRIVING LESSON PAID CANCEL] SSE broadcast sent for instructor:', instructorId);
    } catch (sseError) {
      console.warn('⚠️ [DRIVING LESSON PAID CANCEL] SSE broadcast failed:', sseError);
    }

    return NextResponse.json({
      success: true,
      message: 'Driving lesson cancelled successfully after payment',
      wasPaid: true,
      creditGranted: false,
      newSlotCreated: true,
      slotId: slotIdString
    });

  } catch (error) {
    console.error('❌ [DRIVING LESSON PAID CANCEL] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}