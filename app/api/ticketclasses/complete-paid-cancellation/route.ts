import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import TicketClass from '@/models/TicketClass';
import User from '@/models/User';

/**
 * Endpoint to complete a paid cancellation (within 48 hours)
 * Called after payment is successful
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { ticketClassId, userId, paymentId } = await request.json();

    if (!ticketClassId || !userId) {
      return NextResponse.json(
        { error: 'Missing ticketClassId or userId' },
        { status: 400 }
      );
    }

    console.log('💳 Processing paid cancellation:', { ticketClassId, userId, paymentId });

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

    console.log('🔍 Students array before removal:', JSON.stringify(ticketClass.students, null, 2));
    console.log('🔍 Looking for userId:', userId);

    // Find student index
    const studentIndex = ticketClass.students.findIndex(
      (student: any) => {
        console.log('🔍 Checking student:', student);
        if (typeof student === 'string') {
          console.log('  - String match:', student === userId);
          return student === userId;
        } else if (student.studentId) {
          console.log('  - Object match:', student.studentId.toString() === userId);
          return student.studentId.toString() === userId;
        }
        return false;
      }
    );

    console.log('🔍 Found student at index:', studentIndex);

    if (studentIndex === -1) {
      return NextResponse.json({ error: 'Student not found in class' }, { status: 404 });
    }

    // Remove student from students array using splice
    const removedStudent = ticketClass.students.splice(studentIndex, 1);
    console.log('✅ Removed student:', removedStudent);
    console.log('✅ Students array after removal:', ticketClass.students);

    // Add student to students_cancelled array
    if (!ticketClass.students_cancelled) {
      ticketClass.students_cancelled = [];
    }
    ticketClass.students_cancelled.push(userId);

    await ticketClass.save();
    console.log('✅ Removed student from class and added to students_cancelled');

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
      console.log('✅ Added cancelled class to user.ticketclass_cancelled');
    }

    return NextResponse.json({
      success: true,
      message: 'Paid cancellation completed successfully - credit added to your account',
      creditGranted: true,
      ticketClass: {
        _id: ticketClass._id,
        enrolledStudents: ticketClass.students.length,
        totalSpots: ticketClass.cupos,
        availableSpots: ticketClass.cupos - ticketClass.students.length
      }
    });

  } catch (error) {
    console.error('❌ Error completing paid cancellation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
