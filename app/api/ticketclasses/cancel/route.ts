import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TicketClass from '@/models/TicketClass';
import User from '@/models/User';

/**
 * POST /api/ticketclasses/cancel
 *
 * Cancels a ticket class booking with 48-hour policy:
 * - Within 48 hours: Student pays $90 cancellation fee
 * - Outside 48 hours: Free cancellation, student gets credit
 *
 * This endpoint:
 * 1. Validates the booking exists and belongs to the student
 * 2. Checks the 48-hour cancellation policy
 * 3. Moves student from 'students' array to 'students_cancelled' array
 * 4. Adds to user.ticketclass_cancelled for redemption (if outside 48h)
 * 5. Does NOT create a new slot (unlike driving lessons)
 *
 * @param {string} studentId - ID of the student cancelling
 * @param {string} ticketClassId - ID of the ticket class
 *
 * @returns {object} Cancellation result with policy information
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { studentId, ticketClassId } = await request.json();

    console.log('🎫 [TICKET CLASS CANCEL] Cancel request:', {
      studentId, ticketClassId
    });

    // Validate required fields
    if (!studentId || !ticketClassId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the ticket class
    const ticketClass = await TicketClass.findById(ticketClassId).populate('classId');
    if (!ticketClass) {
      return NextResponse.json(
        { error: 'Ticket class not found' },
        { status: 404 }
      );
    }

    console.log('✅ [TICKET CLASS CANCEL] Found ticket class:', ticketClass.classId?.title || 'Unknown');

    // Check if student is in the students array
    const studentIndex = ticketClass.students.findIndex(
      (student: any) => student.studentId?.toString() === studentId || student.toString() === studentId
    );

    if (studentIndex === -1) {
      console.log('❌ [TICKET CLASS CANCEL] Student not found in students array');
      return NextResponse.json(
        { error: 'You are not enrolled in this class' },
        { status: 403 }
      );
    }

    console.log('✅ [TICKET CLASS CANCEL] Student found at index:', studentIndex);

    // Calculate if cancellation is within 48 hours
    const classDateTime = new Date(`${ticketClass.date}T${ticketClass.hour}:00`);
    const now = new Date();
    const timeDifference = classDateTime.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    const isWithin48Hours = hoursDifference <= 48;

    console.log('⏰ [TICKET CLASS CANCEL] Time analysis:', {
      classDateTime: classDateTime.toISOString(),
      now: now.toISOString(),
      hoursDifference: hoursDifference.toFixed(1),
      isWithin48Hours
    });

    // If within 48 hours, require payment first
    if (isWithin48Hours) {
      console.log('💰 [TICKET CLASS CANCEL] Cancellation within 48 hours - payment required');

      return NextResponse.json({
        success: false,
        requiresPayment: true,
        isWithin48Hours: true,
        message: 'Cancellation within 48 hours requires a $90 fee',
        hoursDifference: hoursDifference.toFixed(1),
        cancellationFee: 90
      });
    }

    // FREE CANCELLATION (>48 hours)
    console.log('🎉 [TICKET CLASS CANCEL] Free cancellation - outside 48 hours');

    // 1. Remove student from 'students' array
    ticketClass.students.splice(studentIndex, 1);
    console.log('✅ [TICKET CLASS CANCEL] Removed student from students array');

    // 2. Add student to 'students_cancelled' array (create if doesn't exist)
    if (!ticketClass.students_cancelled) {
      ticketClass.students_cancelled = [];
    }

    // Check if already in students_cancelled (shouldn't happen, but just in case)
    const alreadyCancelled = ticketClass.students_cancelled.some(
      (id: any) => id.toString() === studentId
    );

    if (!alreadyCancelled) {
      ticketClass.students_cancelled.push(studentId);
      console.log('✅ [TICKET CLASS CANCEL] Added student to students_cancelled array');
    }

    // Mark as modified and save
    ticketClass.markModified('students');
    ticketClass.markModified('students_cancelled');
    await ticketClass.save();

    console.log('✅ [TICKET CLASS CANCEL] Ticket class updated successfully');

    // 3. Add to user.ticketclass_cancelled for redemption
    const user = await User.findById(studentId);
    if (user) {
      const cancelledBooking = {
        ticketClassId: ticketClassId,
        className: ticketClass.classId?.title || 'Unknown Class',
        locationId: ticketClass.locationId,
        date: ticketClass.date,
        hour: ticketClass.hour,
        duration: ticketClass.duration || '2h',
        cancelledAt: new Date(),
        redeemed: false
      };

      // Initialize array if doesn't exist
      if (!user.ticketclass_cancelled) {
        user.ticketclass_cancelled = [];
      }

      user.ticketclass_cancelled.push(cancelledBooking);

      // Save without validation to avoid secondaryPhoneNumber error
      await user.save({ validateBeforeSave: false });

      console.log('✅ [TICKET CLASS CANCEL] Added to user.ticketclass_cancelled for redemption');
    } else {
      console.warn('⚠️ [TICKET CLASS CANCEL] User not found, could not add to cancelled credits');
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket class cancelled successfully. You have been credited and can redeem this for a future class.',
      isWithin48Hours: false,
      creditGranted: true
    });

  } catch (error) {
    console.error('❌ [TICKET CLASS CANCEL] Error cancelling ticket class:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
