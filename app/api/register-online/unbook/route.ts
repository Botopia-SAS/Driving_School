import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TicketClass from '@/models/TicketClass';
import User from '@/models/User';

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

    // Find the ticket class
    const ticketClass = await TicketClass.findById(ticketClassId).populate('classId');
    if (!ticketClass) {
      return NextResponse.json(
        { error: 'Ticket class not found' },
        { status: 404 }
      );
    }

    // Check if the user is enrolled (soporta ambos formatos)
    const isEnrolled = ticketClass.students.some(
      (student: any) =>
        (typeof student === 'string' || typeof student === 'object' && student.toString && !student.studentId)
          ? student.toString() === userId
          : student.studentId === userId || student.studentId?.toString() === userId
    );

    if (!isEnrolled) {
      return NextResponse.json({ error: 'User is not enrolled in this class' }, { status: 400 });
    }

    // Calculate 48-hour policy
    // Handle both ISO date strings and Date objects
    const classDate = ticketClass.date instanceof Date ? ticketClass.date : new Date(ticketClass.date);
    const dateStr = classDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
    const timeStr = ticketClass.hour.includes(':') ? ticketClass.hour : `${ticketClass.hour}:00`;

    const classDateTime = new Date(`${dateStr}T${timeStr}:00`);
    const now = new Date();
    const hoursDifference = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isWithin48Hours = hoursDifference <= 48;

    // If within 48 hours, require payment
    if (isWithin48Hours) {
      return NextResponse.json({
        requiresPayment: true,
        message: 'Cancellation within 48 hours requires a $90 fee',
        cancellationFee: 90,
        hoursDifference,
        ticketClassId,
        userId
      }, { status: 402 }); // 402 Payment Required
    }

    // FREE CANCELLATION (>48 hours)
    // Find student index
    const studentIndex = ticketClass.students.findIndex(
      (student: any) => {
        if (typeof student === 'string') {
          return student === userId;
        } else if (student.studentId) {
          return student.studentId.toString() === userId;
        }
        return false;
      }
    );

    if (studentIndex === -1) {
      return NextResponse.json({ error: 'Student not found in class' }, { status: 404 });
    }

    // Remove student from students array using splice
    ticketClass.students.splice(studentIndex, 1);

    // Add student to students_cancelled array
    if (!ticketClass.students_cancelled) {
      ticketClass.students_cancelled = [];
    }
    ticketClass.students_cancelled.push(userId);

    await ticketClass.save();

    // Add to user.ticketclass_cancelled for redemption
    const user = await User.findById(userId);
    if (user) {
      if (!user.ticketclass_cancelled) {
        user.ticketclass_cancelled = [];
      }

      const className = ticketClass.classId?.title || ticketClass.type || 'Unknown Class';
      const locationId = ticketClass.classId?.locationId || '';

      user.ticketclass_cancelled.push({
        ticketClassId: ticketClass._id.toString(),
        className,
        locationId,
        date: ticketClass.date,
        hour: ticketClass.hour,
        duration: ticketClass.duration || '',
        cancelledAt: new Date(),
        redeemed: false
      });

      await user.save({ validateBeforeSave: false });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully cancelled class - credit added to your account',
      creditGranted: true,
      ticketClass: {
        _id: ticketClass._id,
        enrolledStudents: ticketClass.students.length,
        totalSpots: ticketClass.cupos,
        availableSpots: ticketClass.cupos - ticketClass.students.length
      }
    });

  } catch (error) {
    console.error('❌ Error cancelling class:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
