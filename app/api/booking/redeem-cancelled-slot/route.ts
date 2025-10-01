import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Instructor from '@/models/Instructor';
import User from '@/models/User';
import { broadcastScheduleUpdate } from '@/lib/sse-driving-test-broadcast';

/**
 * POST /api/booking/redeem-cancelled-slot
 *
 * Redeems a cancelled driving test slot (2 hours) to book a new slot.
 * This endpoint:
 * 1. Validates user has a cancelled 2-hour slot available
 * 2. Books the new slot for the user
 * 3. Removes one cancelled slot from user's driving_test_cancelled array
 * 4. Adds the new booking to user's driving_test_bookings array
 * 5. Broadcasts real-time updates via SSE
 *
 * @param {string} userId - ID of the user redeeming the slot
 * @param {string} instructorId - ID of the instructor for the new booking
 * @param {string} date - Date of the new slot (YYYY-MM-DD)
 * @param {string} start - Start time of the new slot (HH:MM)
 * @param {string} end - End time of the new slot (HH:MM)
 *
 * @returns {object} Success response with booking details
 * @throws {400} Missing required fields or validation errors
 * @throws {403} User doesn't have a 2-hour cancelled slot available
 * @throws {404} Instructor or slot not found
 * @throws {409} Slot is not available for booking
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const { userId, instructorId, date, start, end } = await request.json();

    console.log('🎁 [REDEEM SLOT] Request received:', {
      userId,
      instructorId,
      date,
      start,
      end
    });

    // Validate required fields
    if (!userId || !instructorId || !date || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, instructorId, date, start, end' },
        { status: 400 }
      );
    }

    // Calculate duration of the slot being booked
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationHours = (endMinutes - startMinutes) / 60;

    console.log('🕐 [REDEEM SLOT] New slot duration:', durationHours, 'hours');

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ [REDEEM SLOT] User not found:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has any cancelled slots with matching duration
    const cancelledMatchingSlots = (user.driving_test_cancelled || []).filter((slot: any) => {
      const [slotStartHour, slotStartMin] = slot.start.split(':').map(Number);
      const [slotEndHour, slotEndMin] = slot.end.split(':').map(Number);
      const slotStartMinutes = slotStartHour * 60 + slotStartMin;
      const slotEndMinutes = slotEndHour * 60 + slotEndMin;
      const slotDuration = (slotEndMinutes - slotStartMinutes) / 60;
      return slotDuration === durationHours;
    });

    if (!cancelledMatchingSlots || cancelledMatchingSlots.length === 0) {
      console.log('❌ [REDEEM SLOT] User has no cancelled slots with matching duration:', durationHours, 'hours');
      return NextResponse.json(
        { error: `You do not have any ${durationHours}-hour cancelled slots available to redeem` },
        { status: 403 }
      );
    }

    console.log(`✅ [REDEEM SLOT] User has ${cancelledMatchingSlots.length} cancelled ${durationHours}-hour slot(s) available`);

    // Find the instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      console.log('❌ [REDEEM SLOT] Instructor not found:', instructorId);
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      );
    }

    console.log('✅ [REDEEM SLOT] Found instructor:', instructor.name);

    // Find the slot in the instructor's schedule (ONLY status='available')
    let foundSlot = null;
    let scheduleType = null;

    // Check in driving test schedule first
    if (instructor.schedule_driving_test) {
      foundSlot = instructor.schedule_driving_test.find((slot: any) =>
        slot.date === date &&
        slot.start === start &&
        slot.end === end &&
        slot.status === 'available'
      );
      if (foundSlot) scheduleType = 'schedule_driving_test';
    }

    // Check in regular schedule if not found
    if (!foundSlot && instructor.schedule) {
      foundSlot = instructor.schedule.find((slot: any) =>
        slot.date === date &&
        slot.start === start &&
        slot.end === end &&
        slot.status === 'available'
      );
      if (foundSlot) scheduleType = 'schedule';
    }

    if (!foundSlot) {
      console.log('❌ [REDEEM SLOT] Slot not found in instructor schedules');
      return NextResponse.json(
        { error: 'Slot not found' },
        { status: 404 }
      );
    }

    console.log('✅ [REDEEM SLOT] Found slot:', {
      slotId: foundSlot._id,
      status: foundSlot.status,
      scheduleType
    });

    // Validate slot is available
    if (foundSlot.status !== 'available') {
      console.log('❌ [REDEEM SLOT] Slot is not available:', foundSlot.status);
      return NextResponse.json(
        { error: `Slot is not available (current status: ${foundSlot.status})` },
        { status: 409 }
      );
    }

    // Check if slot is already booked by someone
    if (foundSlot.booked || (foundSlot.studentId && foundSlot.studentId !== 'null')) {
      console.log('❌ [REDEEM SLOT] Slot is already booked');
      return NextResponse.json(
        { error: 'Slot is already booked by another student' },
        { status: 409 }
      );
    }

    // Book the slot for the user
    foundSlot.status = 'booked';
    foundSlot.studentId = userId;
    foundSlot.studentName = `${user.firstName} ${user.lastName}`;
    foundSlot.booked = true;
    foundSlot.paid = true; // Redeemed slots are considered paid
    foundSlot.confirmedAt = new Date();
    foundSlot.reservedAt = new Date(); // Save reservation timestamp
    foundSlot.paymentMethod = 'redeemed';

    // Mark the schedule as modified and save
    if (scheduleType) {
      instructor.markModified(scheduleType);
    }
    await instructor.save();

    console.log('✅ [REDEEM SLOT] Slot booked successfully');

    // Remove one cancelled slot from user (FIFO - first in, first out)
    const slotToRemove = cancelledMatchingSlots[0];

    console.log('🎫 [REDEEM SLOT] Redeeming slot:', {
      removing: slotToRemove.slotId,
      date: slotToRemove.date,
      time: `${slotToRemove.start}-${slotToRemove.end}`
    });

    // Add new booking to user's driving_test_bookings with redeemed flag
    const newBooking = {
      slotId: foundSlot._id,
      instructorId: instructorId,
      instructorName: instructor.name,
      date: date,
      start: start,
      end: end,
      amount: 0, // Redeemed, no cost
      bookedAt: new Date(),
      orderId: 'REDEEMED',
      status: 'booked',
      redeemed: true, // Mark as redeemed
      redeemedFrom: slotToRemove.slotId // Track which cancelled slot was used
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          driving_test_cancelled: {
            slotId: slotToRemove.slotId
          }
        },
        $push: {
          driving_test_bookings: newBooking
        }
      },
      { new: true }
    );

    console.log('✅ [REDEEM SLOT] Updated user bookings:', {
      removedCancelledSlot: slotToRemove.slotId,
      addedNewBooking: foundSlot._id,
      redeemed: true,
      redeemedFrom: slotToRemove.slotId,
      remainingBookings: updatedUser?.driving_test_bookings?.length || 0,
      remainingCancelled: updatedUser?.driving_test_cancelled?.length || 0
    });

    // Broadcast real-time update via SSE
    try {
      broadcastScheduleUpdate(instructorId);
      console.log('✅ [REDEEM SLOT] Schedule update broadcasted via SSE');
    } catch (broadcastError) {
      console.error('❌ [REDEEM SLOT] Failed to broadcast schedule update:', broadcastError);
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json({
      success: true,
      message: 'Slot redeemed and booked successfully',
      booking: {
        slotId: foundSlot._id,
        instructorId: instructorId,
        instructorName: instructor.name,
        date: date,
        start: start,
        end: end,
        status: 'booked',
        paymentMethod: 'redeemed'
      },
      remainingCancelledSlots: cancelledMatchingSlots.length - 1
    });

  } catch (error) {
    console.error('❌ [REDEEM SLOT] Error processing redemption:', error);
    return NextResponse.json(
      {
        error: 'Failed to redeem cancelled slot',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
