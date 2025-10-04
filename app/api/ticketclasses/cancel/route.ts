import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TicketClass from '@/models/TicketClass';
import User from '@/models/User';

/**
 * POST /api/ticketclasses/cancel
 *
 * Cancels a ticket class booking - ALWAYS FREE CANCELLATION
 *
 * This endpoint:
 * 1. Validates the booking exists and belongs to the student
 * 2. Moves student from 'students' array to 'students_cancelled' array
 * 3. No fee charged regardless of timing
 * 4. Does NOT create a new slot (unlike driving lessons)
 *
 * @param {string} studentId - ID of the student cancelling
 * @param {string} ticketClassId - ID of the ticket class
 *
 * @returns {object} Cancellation result
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

    // FREE CANCELLATION - ALWAYS (no time restrictions for ticket classes)
    console.log('🎉 [TICKET CLASS CANCEL] Processing free cancellation');

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

    return NextResponse.json({
      success: true,
      message: 'Ticket class cancelled successfully!',
      isWithin48Hours: false
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
