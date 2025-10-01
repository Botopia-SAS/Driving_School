import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

/**
 * GET /api/users/[userId]/cancelled-slots
 *
 * Retrieves all cancelled driving test slots for a specific user.
 * Returns all cancelled slots that can be redeemed for new bookings.
 * Slots are grouped by duration for easy matching.
 *
 * @param {string} userId - ID of the user (from route params)
 *
 * @returns {object} List of cancelled slots available for redemption
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
    const user = await User.findById(userId).select('driving_test_cancelled firstName lastName');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all cancelled slots with duration calculation
    const cancelledSlots = (user.driving_test_cancelled || []).map((slot: any) => {
      const [startHour, startMin] = slot.start.split(':').map(Number);
      const [endHour, endMin] = slot.end.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const duration = (endMinutes - startMinutes) / 60;

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
        duration: duration // Add duration for easy filtering on frontend
      };
    });

    // Group by duration for statistics
    const slotsByDuration = cancelledSlots.reduce((acc: Record<string, number>, slot: any) => {
      const key = `${slot.duration}h`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    console.log(`✅ [CANCELLED SLOTS] User ${userId} cancelled slots:`, slotsByDuration);

    return NextResponse.json({
      success: true,
      cancelledSlots: cancelledSlots,
      totalCancelled: cancelledSlots.length,
      slotsByDuration: slotsByDuration
    });

  } catch (error) {
    console.error('❌ [CANCELLED SLOTS] Error fetching cancelled slots:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch cancelled slots',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
