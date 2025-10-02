import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Instructor from '@/models/Instructor';
import User from '@/models/User';
import { broadcastScheduleUpdate } from '@/lib/sse-driving-lessons-broadcast';

/**
 * POST /api/driving-lessons/redeem-cancelled-slot
 *
 * Redeems a cancelled driving lesson slot to book a new slot.
 * Only slots cancelled outside 48 hours are eligible for redemption.
 * This endpoint:
 * 1. Validates user has a cancelled slot available for redemption
 * 2. Validates the new slot is available and matches duration
 * 3. Books the new slot for the user
 * 4. Removes one cancelled slot from user's driving_lesson_cancelled array
 * 5. Adds the new booking to user's driving_lesson_bookings array
 * 6. Broadcasts real-time updates via SSE
 *
 * @param {string} userId - ID of the user redeeming the slot
 * @param {string} instructorId - ID of the instructor for the new booking
 * @param {string} date - Date of the new slot (YYYY-MM-DD)
 * @param {string} start - Start time (HH:MM)
 * @param {string} end - End time (HH:MM)
 * @param {string} packageName - Name of the driving lesson package
 * @param {string} selectedProduct - Selected product/package identifier
 * @param {string} pickupLocation - Pickup location for the lesson
 * @param {string} dropoffLocation - Drop-off location for the lesson
 *
 * @returns {object} Redemption result
 * @throws {400} Missing fields or no cancelled slots available
 * @throws {404} User, instructor, or slot not found
 * @throws {409} Slot not available or duration mismatch
 * @throws {500} Server error
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { 
      userId, 
      instructorId, 
      date, 
      start, 
      end, 
      packageName,
      selectedProduct,
      pickupLocation,
      dropoffLocation
    } = await request.json();

    console.log('🔄 [REDEEM DRIVING LESSON] Redemption request:', { 
      userId, instructorId, date, start, end, packageName, selectedProduct, pickupLocation, dropoffLocation 
    });

    // Validate required fields
    if (!userId || !instructorId || !date || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate duration of the new slot
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationHours = (endMinutes - startMinutes) / 60;

    console.log('🕐 [REDEEM DRIVING LESSON] New slot duration:', durationHours, 'hours');

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ [REDEEM DRIVING LESSON] User not found:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has any cancelled slots with matching duration
    // Only consider slots cancelled outside 48 hours (they have credit)
    const cancelledMatchingSlots = (user.driving_lesson_cancelled || []).filter((slot: Record<string, unknown>) => {
      const slotStart = slot.start as string;
      const slotEnd = slot.end as string;
      const cancelledAt = slot.cancelledAt as Date;
      
      if (!slotStart || !slotEnd || !cancelledAt) return false;
      
      // Calculate slot duration
      const [slotStartHour, slotStartMin] = slotStart.split(':').map(Number);
      const [slotEndHour, slotEndMin] = slotEnd.split(':').map(Number);
      const slotStartMinutes = slotStartHour * 60 + slotStartMin;
      const slotEndMinutes = slotEndHour * 60 + slotEndMin;
      const slotDurationHours = (slotEndMinutes - slotStartMinutes) / 60;

      // Check if it was cancelled outside 48 hours (has credit)
      const originalSlotDateTime = new Date(`${slot.date}T${slotStart}:00`);
      const timeDifference = originalSlotDateTime.getTime() - cancelledAt.getTime();
      const hoursDifference = Math.abs(timeDifference) / (1000 * 60 * 60);
      const wasCancelledOutside48Hours = hoursDifference > 48;

      console.log('🔍 [REDEEM DRIVING LESSON] Checking cancelled slot:', {
        slotId: slot.slotId,
        slotDuration: slotDurationHours,
        requestedDuration: durationHours,
        wasCancelledOutside48Hours,
        hoursDifference: hoursDifference.toFixed(1)
      });

      return slotDurationHours === durationHours && wasCancelledOutside48Hours;
    });

    console.log('🎯 [REDEEM DRIVING LESSON] Found', cancelledMatchingSlots.length, 'redeemable cancelled slots');

    if (cancelledMatchingSlots.length === 0) {
      return NextResponse.json(
        { 
          error: `No cancelled driving lesson credits available for ${durationHours} hour duration. Only lessons cancelled outside 48 hours can be redeemed.` 
        },
        { status: 400 }
      );
    }

    // Find the instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      console.log('❌ [REDEEM DRIVING LESSON] Instructor not found:', instructorId);
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      );
    }

    console.log('✅ [REDEEM DRIVING LESSON] Found instructor:', instructor.name);

    // Find the slot in the instructor's schedule (ONLY status='available')
    let foundSlot: Record<string, unknown> | null = null;
    let scheduleType: string | null = null;

    // Check in driving lesson schedule
    if (instructor.schedule_driving_lesson) {
      foundSlot = instructor.schedule_driving_lesson.find((slot: Record<string, unknown>) =>
        slot.date === date &&
        slot.start === start &&
        slot.end === end &&
        slot.status === 'available'
      );
      if (foundSlot) scheduleType = 'schedule_driving_lesson';
    }

    if (!foundSlot) {
      console.log('❌ [REDEEM DRIVING LESSON] Available slot not found');
      return NextResponse.json(
        { error: 'Slot not available for booking' },
        { status: 404 }
      );
    }

    console.log('✅ [REDEEM DRIVING LESSON] Found available slot:', foundSlot);

    // Verify the new slot has the same duration as cancelled slot
    const newSlotStartMinutes = startMinutes;
    const newSlotEndMinutes = endMinutes;
    const newSlotDuration = (newSlotEndMinutes - newSlotStartMinutes) / 60;

    if (newSlotDuration !== durationHours) {
      return NextResponse.json(
        { error: 'New slot duration does not match cancelled slot duration' },
        { status: 409 }
      );
    }

    // Book the new slot
    foundSlot.status = 'booked';
    foundSlot.studentId = userId;
    foundSlot.studentName = `${user.firstName} ${user.lastName}`;
    foundSlot.booked = true;
    foundSlot.paid = true; // Already paid via cancelled slot credit
    foundSlot.selectedProduct = selectedProduct;
    foundSlot.paymentMethod = 'credit_redemption';
    foundSlot.pickupLocation = pickupLocation;
    foundSlot.dropoffLocation = dropoffLocation;

    // Mark the schedule as modified and save
    instructor.markModified(scheduleType!);
    await instructor.save();

    console.log('✅ [REDEEM DRIVING LESSON] Slot booked successfully');

    // Remove one cancelled slot (use the first matching one)
    const cancelledSlotToRemove = cancelledMatchingSlots[0];
    const cancelledIndex = user.driving_lesson_cancelled.findIndex(
      (slot: Record<string, unknown>) => 
        slot.slotId === cancelledSlotToRemove.slotId &&
        slot.date === cancelledSlotToRemove.date &&
        slot.start === cancelledSlotToRemove.start
    );

    if (cancelledIndex !== -1) {
      user.driving_lesson_cancelled.splice(cancelledIndex, 1);
      console.log('✅ [REDEEM DRIVING LESSON] Removed cancelled slot from user record');
    }

    // Add to bookings
    const newBooking = {
      slotId: foundSlot._id as string,
      instructorId: instructorId,
      instructorName: instructor.name,
      date: date,
      start: start,
      end: end,
      amount: foundSlot.amount as number || 90,
      bookedAt: new Date(),
      orderId: `redemption_${Date.now()}`,
      status: 'booked',
      redeemed: true,
      redeemedFrom: cancelledSlotToRemove.slotId as string,
      packageName: packageName || 'Driving Lesson',
      selectedProduct: selectedProduct
    };

    if (!user.driving_lesson_bookings) {
      user.driving_lesson_bookings = [];
    }

    user.driving_lesson_bookings.push(newBooking);

    // Save user changes
    await user.save();

    console.log('✅ [REDEEM DRIVING LESSON] Added new booking to user record');

    // Broadcast schedule update
    try {
      await broadcastScheduleUpdate(instructorId);
      console.log('📡 [REDEEM DRIVING LESSON] SSE update broadcast sent');
    } catch (sseError) {
      console.warn('⚠️ [REDEEM DRIVING LESSON] Failed to send SSE update:', sseError);
    }

    return NextResponse.json({
      success: true,
      message: `Driving lesson booked successfully using cancelled slot credit! Your ${durationHours} hour lesson is confirmed.`,
      booking: {
        instructorName: instructor.name,
        date: date,
        start: start,
        end: end,
        duration: durationHours,
        redeemedFrom: cancelledSlotToRemove.slotId
      },
      remainingCancelled: user.driving_lesson_cancelled.length
    });

  } catch (error) {
    console.error('❌ [REDEEM DRIVING LESSON] Error redeeming cancelled slot:', error);
    return NextResponse.json(
      {
        error: 'Failed to redeem cancelled slot',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}