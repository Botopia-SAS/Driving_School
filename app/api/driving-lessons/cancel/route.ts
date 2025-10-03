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
 * POST /api/driving-lessons/cancel
 *
 * Cancels a driving lesson booking with 48-hour policy:
 * - Within 48 hours: Student loses the lesson (no credit)
 * - Outside 48 hours: Student gets credit for future use
 * 
 * This endpoint:
 * 1. Validates the booking exists and belongs to the student
 * 2. Checks the 48-hour cancellation policy
 * 3. Marks the slot as cancelled in instructor's schedule
 * 4. Creates a new available slot (same time)
 * 5. Moves booking from driving_lesson_bookings to driving_lesson_cancelled
 * 6. Only adds to cancelled credits if cancelled outside 48 hours
 * 7. Broadcasts real-time updates via SSE
 *
 * @param {string} studentId - ID of the student cancelling
 * @param {string} instructorId - ID of the instructor
 * @param {string} date - Date of the slot (YYYY-MM-DD)
 * @param {string} start - Start time (HH:MM)
 * @param {string} end - End time (HH:MM)
 * @param {string} slotId - ID of the specific slot
 *
 * @returns {object} Cancellation result with policy information
 * @throws {400} Missing required fields
 * @throws {404} Instructor, slot, or booking not found
 * @throws {403} Booking doesn't belong to student
 * @throws {500} Server error
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { studentId, instructorId, date, start, end, slotId } = await request.json();

    console.log('🚙 [DRIVING LESSON CANCEL] Cancel request:', { 
      studentId, instructorId, date, start, end, slotId 
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

    console.log('🔍 [DRIVING LESSON CANCEL] Found instructor:', instructor.name);

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
        console.log('🔍 [DRIVING LESSON CANCEL] Searching by slotId:', slotId, 'Found:', !!foundSlot);
      } else {
        // Fallback to date/time matching (also match studentId to avoid conflicts)
        foundSlot = instructor.schedule_driving_lesson.find((slot: ScheduleSlot) =>
          slot.date === date &&
          slot.start === start &&
          slot.end === end &&
          slot.studentId === studentId
        );
        console.log('🔍 [DRIVING LESSON CANCEL] Searching by date/time/studentId. Found:', !!foundSlot);
      }
      if (foundSlot) scheduleType = 'schedule_driving_lesson';
    }

    if (!foundSlot) {
      console.log('❌ [DRIVING LESSON CANCEL] Slot not found in instructor schedules');
      return NextResponse.json(
        { error: 'Slot not found' },
        { status: 404 }
      );
    }

    console.log('✅ [DRIVING LESSON CANCEL] Found slot:', foundSlot, 'in', scheduleType);

    // Verify the slot belongs to the student
    if (foundSlot.studentId !== studentId) {
      console.log('❌ [DRIVING LESSON CANCEL] Slot does not belong to student');
      return NextResponse.json(
        { error: 'This booking does not belong to you' },
        { status: 403 }
      );
    }

    // Calculate if cancellation is within 48 hours
    const slotDateTime = new Date(`${date}T${start}:00`);
    const now = new Date();
    const timeDifference = slotDateTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    const isWithin48Hours = hoursDifference <= 48;

    console.log('⏰ [DRIVING LESSON CANCEL] Time analysis:', {
      slotDateTime: slotDateTime.toISOString(),
      now: now.toISOString(),
      hoursDifference: hoursDifference.toFixed(1),
      isWithin48Hours
    });

    // For booked/scheduled slots within 48 hours - require payment first
    if ((foundSlot.status === 'booked' || foundSlot.status === 'scheduled') && isWithin48Hours) {
      console.log('💰 [DRIVING LESSON CANCEL] Cancellation within 48 hours - payment required');
      
      return NextResponse.json({
        success: false,
        requiresPayment: true,
        isWithin48Hours: true,
        message: 'Cancellation within 48 hours requires a $90 fee',
        hoursDifference: hoursDifference.toFixed(1),
        cancellationFee: 90
      });
    }

    // Handle different slot statuses
    if (foundSlot.status === 'pending') {
      // For pending slots, clean completely and set to available (no cancellation needed)
      foundSlot.status = 'available';
      foundSlot.classType = 'driving lesson';
      foundSlot.studentId = undefined;
      foundSlot.studentName = undefined;
      foundSlot.paid = false;
      foundSlot.pickupLocation = '';
      foundSlot.dropoffLocation = '';

      // Clean ALL extra fields that shouldn't be there
      const slotRecord = foundSlot as unknown as Record<string, unknown>;
      delete slotRecord.selectedProduct;
      delete slotRecord.paymentMethod;
      delete slotRecord.requestDate;
      delete slotRecord.reservedAt;
      delete slotRecord.orderId;
      delete slotRecord.orderNumber;
      delete slotRecord.amount;
      delete slotRecord.booked;
      delete slotRecord.paymentId;
      delete slotRecord.confirmedAt;

      instructor.markModified(scheduleType!);
      await instructor.save();

      console.log('✅ [DRIVING LESSON CANCEL] Pending slot cancelled and cleaned completely');

      // Broadcast SSE update immediately
      broadcastScheduleUpdate(instructorId);

      return NextResponse.json({
        success: true,
        message: 'Pending driving lesson cancelled successfully',
        wasPending: true,
        creditGranted: false
      });
    }

    // For booked/scheduled slots - REMOVE the old slot and create new available slot
    if (foundSlot.status === 'booked' || foundSlot.status === 'scheduled') {
      console.log('📋 [DRIVING LESSON CANCEL] Original slot before cancellation:',
        JSON.stringify(foundSlot, null, 2));

      // 1. Find the index of the slot to remove
      const slotIndex = instructor.schedule_driving_lesson.findIndex((slot: ScheduleSlot) =>
        slot.date === date && slot.start === start && slot.end === end && slot.studentId === studentId
      );

      if (slotIndex === -1) {
        console.log('❌ [DRIVING LESSON CANCEL] Could not find slot index to remove');
        return NextResponse.json(
          { error: 'Could not find slot to cancel' },
          { status: 404 }
        );
      }

      // 2. KEEP the original slot but mark it as 'cancelled' (DON'T DELETE IT)
      const originalSlot = instructor.schedule_driving_lesson[slotIndex];
      originalSlot.status = 'cancelled';
      console.log('✅ [DRIVING LESSON CANCEL] Marked original slot as cancelled (preserving history)');

      // 3. Create a new available slot with unique ID
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 11);
      const slotIdString = `driving_lesson_${instructorId}_${date}_${start}_${timestamp}_${randomStr}`;

      console.log('🆕 [DRIVING LESSON CANCEL] Creating new slot with ID:', slotIdString);

      const newAvailableSlot = {
        _id: slotIdString,
        date: date,
        start: start,
        end: end,
        booked: false,
        studentId: undefined,
        status: 'available',
        classType: foundSlot.classType || 'driving lesson',
        studentName: undefined,
        paid: false,
        pickupLocation: '',
        dropoffLocation: '',
        selectedProduct: ''
      };

      // 4. Add the new available slot to the schedule
      if (scheduleType === 'schedule_driving_lesson' && instructor.schedule_driving_lesson) {
        instructor.schedule_driving_lesson.push(newAvailableSlot);
        console.log('📊 [DRIVING LESSON CANCEL] Added new available slot. Total slots:',
          instructor.schedule_driving_lesson.length);
      }

      instructor.markModified(scheduleType!);
      await instructor.save();

      console.log('✅ [DRIVING LESSON CANCEL] Original slot marked as cancelled and new available slot created with unique ID');

      // 3. Find the user and move booking from booked to cancelled
      const user = await User.findById(studentId);
      console.log('🔍 [DRIVING LESSON CANCEL] User found for moving booking:', {
        userId: user?._id,
        drivingLessonBookingsCount: user?.driving_lesson_bookings?.length || 0,
        drivingLessonCancelledCount: user?.driving_lesson_cancelled?.length || 0
      });

      if (user && user.driving_lesson_bookings) {
        // Find the booking to move
        const bookingIndex = user.driving_lesson_bookings.findIndex((booking: Record<string, unknown>) =>
          booking.instructorId?.toString() === instructorId &&
          booking.date === date &&
          booking.start === start &&
          booking.end === end
        );

        console.log('🔍 [DRIVING LESSON CANCEL] Looking for booking to move:', {
          instructorId, date, start, end, bookingIndex
        });

        if (bookingIndex !== -1) {
          const bookingToMove = user.driving_lesson_bookings[bookingIndex];
          console.log('✅ [DRIVING LESSON CANCEL] Found booking to move:', bookingToMove);

          // Remove from bookings
          user.driving_lesson_bookings.splice(bookingIndex, 1);

          // Add to cancelled with current timestamp
          const cancelledBooking = {
            ...bookingToMove.toObject(),
            cancelledAt: new Date(),
            status: 'cancelled'
          };

          // Initialize cancelled array if it doesn't exist
          if (!user.driving_lesson_cancelled) {
            user.driving_lesson_cancelled = [];
          }

          user.driving_lesson_cancelled.push(cancelledBooking);

          // Only add credit if cancelled outside 48 hours
          if (!isWithin48Hours) {
            console.log('✅ [DRIVING LESSON CANCEL] Cancelled outside 48 hours - credit will be available for redemption');
          } else {
            console.log('⚠️ [DRIVING LESSON CANCEL] Cancelled within 48 hours - no credit granted');
          }

          // Save without validation to avoid secondaryPhoneNumber error
          await user.save({ validateBeforeSave: false });

          console.log('✅ [DRIVING LESSON CANCEL] Booking moved from bookings to cancelled');
        } else {
          console.warn('⚠️ [DRIVING LESSON CANCEL] Booking not found in user.driving_lesson_bookings');
        }
      }

      // 4. Broadcast schedule update
      try {
        await broadcastScheduleUpdate(instructorId);
        console.log('📡 [DRIVING LESSON CANCEL] SSE update broadcast sent');
      } catch (sseError) {
        console.warn('⚠️ [DRIVING LESSON CANCEL] Failed to send SSE update:', sseError);
      }

      return NextResponse.json({
        success: true,
        message: isWithin48Hours 
          ? 'Driving lesson cancelled. Since this was within 48 hours of your lesson, no credit has been issued.'
          : 'Driving lesson cancelled successfully. You have been credited and can redeem this for a future lesson.',
        isWithin48Hours,
        creditGranted: !isWithin48Hours,
        newSlotId: newAvailableSlot._id
      });
    }

    // Invalid slot status
    return NextResponse.json(
      { error: `Cannot cancel slot with status: ${foundSlot.status}` },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ [DRIVING LESSON CANCEL] Error cancelling driving lesson:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}