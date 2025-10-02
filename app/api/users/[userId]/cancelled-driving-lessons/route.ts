import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

/**
 * GET /api/users/[userId]/cancelled-driving-lessons
 *
 * Retrieves all cancelled driving lesson slots for a specific user.
 * Returns only slots that can be redeemed (cancelled outside 48 hours).
 * Slots are grouped by duration for easy matching.
 *
 * @param {string} userId - ID of the user (from route params)
 *
 * @returns {object} List of redeemable cancelled slots
 * @throws {404} User not found
 * @throws {500} Server error
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();

    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(userId).select('driving_lesson_cancelled firstName lastName');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all cancelled slots with duration calculation and redemption eligibility
    const cancelledSlots = (user.driving_lesson_cancelled || []).map((slot: Record<string, unknown>) => {
      const slotStart = slot.start as string;
      const slotEnd = slot.end as string;
      const slotDate = slot.date as string;
      const cancelledAt = slot.cancelledAt as Date;

      // Calculate duration
      const [startHour, startMin] = slotStart.split(':').map(Number);
      const [endHour, endMin] = slotEnd.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const duration = (endMinutes - startMinutes) / 60;

      // Check if slot is eligible for redemption
      // Either: cancelled outside 48 hours (free cancellation) 
      // OR: cancelled within 48 hours but paid cancellation fee
      let isRedeemable = false;
      
      console.log(`🔍 [CANCELLED SLOTS API] Checking slot ${slot._id}:`, {
        paidCancellation: slot.paidCancellation,
        cancelledAt,
        slotDate,
        slotStart,
        redeemed: slot.redeemed
      });
      
      if (slot.paidCancellation === true) {
        // If cancellation fee was paid, always redeemable
        isRedeemable = true;
        console.log(`✅ [CANCELLED SLOTS API] Slot redeemable due to paid cancellation`);
      } else if (cancelledAt && slotDate && slotStart) {
        // Check if cancelled outside 48 hours (free cancellation)
        const originalSlotDateTime = new Date(`${slotDate}T${slotStart}:00`);
        const timeDifference = originalSlotDateTime.getTime() - cancelledAt.getTime();
        const hoursDifference = Math.abs(timeDifference) / (1000 * 60 * 60);
        isRedeemable = hoursDifference > 48;
        console.log(`🕒 [CANCELLED SLOTS API] Hours difference: ${hoursDifference}, redeemable: ${isRedeemable}`);
      }

      return {
        slotId: slot.slotId,
        instructorId: slot.instructorId,
        instructorName: slot.instructorName,
        date: slot.date,
        start: slot.start,
        end: slot.end,
        amount: slot.amount,
        bookedAt: slot.bookedAt,
        cancelledAt: slot.cancelledAt,
        packageName: slot.packageName,
        selectedProduct: slot.selectedProduct,
        duration: duration, // Add duration for easy filtering on frontend
        isRedeemable: isRedeemable // Add redemption eligibility
      };
    });

    // Filter only redeemable slots (cancelled outside 48 hours)
    const redeemableSlots = cancelledSlots.filter(slot => slot.isRedeemable);

    // Group by duration for statistics
    const slotsByDuration = redeemableSlots.reduce((acc: Record<string, number>, slot) => {
      const key = `${slot.duration}h`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    console.log(`✅ [CANCELLED DRIVING LESSONS] User ${userId} redeemable slots:`, slotsByDuration);

    return NextResponse.json({
      success: true,
      cancelledSlots: redeemableSlots,
      totalCancelled: cancelledSlots.length,
      totalRedeemable: redeemableSlots.length,
      slotsByDuration: slotsByDuration,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`
      }
    });

  } catch (error) {
    console.error('❌ [CANCELLED DRIVING LESSONS] Error fetching cancelled slots:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch cancelled driving lesson slots',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}