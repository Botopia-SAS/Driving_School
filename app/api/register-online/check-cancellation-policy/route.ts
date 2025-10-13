import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TicketClass from '@/models/TicketClass';

/**
 * Endpoint to CHECK cancellation policy (does NOT cancel the class)
 * Returns whether payment is required and the fee amount
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { ticketClassId, userId } = await request.json();

    if (!ticketClassId || !userId) {
      return NextResponse.json(
        { error: 'Missing ticketClassId or userId' },
        { status: 400 }
      );
    }

    const ticketClass = await TicketClass.findById(ticketClassId).populate('classId');

    if (!ticketClass) {
      return NextResponse.json(
        { error: 'Ticket class not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled
    const isEnrolled = ticketClass.students.some(
      (student: any) =>
        (typeof student === 'string' || typeof student === 'object' && student.toString && !student.studentId)
          ? student.toString() === userId
          : student.studentId === userId || student.studentId?.toString() === userId
    );

    if (!isEnrolled) {
      return NextResponse.json({ error: 'User is not enrolled in this class' }, { status: 400 });
    }

    // Calculate class date/time
    const classDate = ticketClass.date instanceof Date ? ticketClass.date : new Date(ticketClass.date);
    const dateStr = classDate.toISOString().split('T')[0];
    const timeStr = ticketClass.hour.includes(':') ? ticketClass.hour : `${ticketClass.hour}:00`;
    const classDateTime = new Date(`${dateStr}T${timeStr}:00`);
    const now = new Date();
    
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get class date (without time)
    const classDateOnly = new Date(classDate);
    classDateOnly.setHours(0, 0, 0, 0);
    
    // Check if class is today or in the past
    const isTodayOrPast = classDateOnly <= today;
    
    if (isTodayOrPast) {
      return NextResponse.json({
        requiresPayment: false,
        message: 'Cannot cancel classes on the same day or classes that have already passed',
        canCancel: false,
        ticketClassId,
        userId
      });
    }

    // TICKET CLASSES: Free cancellation for future classes
    return NextResponse.json({
      requiresPayment: false,
      message: 'Free cancellation for ticket classes',
      canCancel: true,
      ticketClassId,
      userId
    });

  } catch (error) {
    console.error('❌ Error checking cancellation policy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
