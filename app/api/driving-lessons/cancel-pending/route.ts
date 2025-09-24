import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Instructor from '@/models/Instructor';
import { broadcastScheduleUpdate } from '@/lib/sse-broadcast';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { instructorId, date, start, end, studentId } = await request.json();

    console.log('🗑️ Cancel pending slot request:', {
      instructorId,
      date,
      start,
      end,
      studentId
    });

    if (!instructorId || !date || !start || !end || !studentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find and update the specific slot to cancel it (set back to available and clean fields)
    const updateResult = await Instructor.updateOne(
      {
        _id: instructorId,
        'schedule_driving_lesson': {
          $elemMatch: {
            date: date,
            start: start,
            end: end,
            status: 'pending',
            studentId: studentId
          }
        }
      },
      {
        $set: {
          'schedule_driving_lesson.$.status': 'available',
          'schedule_driving_lesson.$.studentId': null,
          'schedule_driving_lesson.$.studentName': null,
          'schedule_driving_lesson.$.selectedProduct': '',
          'schedule_driving_lesson.$.pickupLocation': '',
          'schedule_driving_lesson.$.dropoffLocation': '',
          'schedule_driving_lesson.$.paymentMethod': null,
          'schedule_driving_lesson.$.requestDate': null,
          'schedule_driving_lesson.$.reservedAt': null,
          'schedule_driving_lesson.$.paid': false
        }
      }
    );

    console.log('✅ Cancel update result:', updateResult);

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Slot not found or not in pending status' },
        { status: 404 }
      );
    }

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No changes made to the slot' },
        { status: 400 }
      );
    }

    // Broadcast the schedule update
    try {
      await broadcastScheduleUpdate(instructorId);
    } catch (broadcastError) {
      console.warn('⚠️ Failed to broadcast schedule update:', broadcastError);
    }

    return NextResponse.json({
      success: true,
      message: 'Pending slot canceled successfully'
    });

  } catch (error) {
    console.error('❌ Error canceling pending slot:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}