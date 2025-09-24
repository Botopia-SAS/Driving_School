import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Instructor from '@/models/Instructor';
import { broadcastScheduleUpdate } from '@/lib/sse-broadcast';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const {
      userId,
      productId,
      selectedSlots,
      selectedHours,
      pickupLocation,
      dropoffLocation,
      paymentMethod,
      studentName
    } = await request.json();

    console.log('📋 Schedule request received:', {
      userId,
      productId,
      selectedSlots,
      selectedHours,
      pickupLocation,
      dropoffLocation,
      paymentMethod,
      studentName
    });

    if (!userId || !productId || !selectedSlots || selectedSlots.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get student information if not provided
    let finalStudentName = studentName;
    if (!finalStudentName) {
      const student = await User.findById(userId);
      if (student) {
        finalStudentName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim();
      }
    }

    console.log('👤 Final student name:', finalStudentName);

    // Find all instructors that have the selected slots
    const instructorsToUpdate: Array<{
      instructorId: string;
      date: string;
      start: string;
      end: string;
    }> = [];
    
    for (const slotKey of selectedSlots) {
      // Parse slot format: '2025-07-21-09:00-11:00'
      const match = slotKey.match(/^(\d{4}-\d{2}-\d{2})-(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
      if (!match) {
        console.error('❌ Invalid slot format:', slotKey);
        continue;
      }
      
      const [, parsedDate, parsedStart, parsedEnd] = match;
      console.log('🔍 Looking for slot:', { date: parsedDate, start: parsedStart, end: parsedEnd });
      
      // Find instructor with this specific slot in schedule_driving_lesson
      const instructor = await Instructor.findOne({
        'schedule_driving_lesson': {
          $elemMatch: {
            date: parsedDate,
            start: parsedStart,
            end: parsedEnd,
            status: 'available'
          }
        }
      });

      console.log('🔍 Found instructor for slot:', instructor ? instructor.name : 'None');

      if (instructor) {
        instructorsToUpdate.push({
          instructorId: instructor._id.toString(),
          date: parsedDate,
          start: parsedStart,
          end: parsedEnd
        });
      }
    }

    console.log('📝 Instructors to update:', instructorsToUpdate);

    if (instructorsToUpdate.length === 0) {
      return NextResponse.json(
        { error: 'No available slots found' },
        { status: 404 }
      );
    }

    // Update each slot to pending status with request information
    for (const slot of instructorsToUpdate) {
      console.log('🔄 Updating slot:', slot);
      
      // Use updateMany to ensure we only update the exact slot that matches all criteria
      const updateResult = await Instructor.updateOne(
        {
          _id: slot.instructorId,
          'schedule_driving_lesson': {
            $elemMatch: {
              date: slot.date,
              start: slot.start,
              end: slot.end,
              status: 'available'
            }
          }
        },
        {
          $set: {
            'schedule_driving_lesson.$.status': 'pending',
            'schedule_driving_lesson.$.studentId': userId,
            'schedule_driving_lesson.$.studentName': finalStudentName,
            'schedule_driving_lesson.$.selectedProduct': productId,
            'schedule_driving_lesson.$.pickupLocation': pickupLocation,
            'schedule_driving_lesson.$.dropoffLocation': dropoffLocation,
            'schedule_driving_lesson.$.paymentMethod': paymentMethod,
            'schedule_driving_lesson.$.requestDate': new Date(),
            'schedule_driving_lesson.$.reservedAt': new Date(),
            'schedule_driving_lesson.$.paid': false
          }
        }
      );

      console.log('✅ Update result:', updateResult);
      
      // Broadcast the schedule update for this instructor
      try {
        await broadcastScheduleUpdate(slot.instructorId);
      } catch (broadcastError) {
        console.warn('⚠️ Failed to broadcast schedule update:', broadcastError);
      }
    }

    // Create a schedule request record for tracking
    const scheduleRequest = {
      userId,
      productId,
      selectedSlots,
      selectedHours,
      pickupLocation,
      dropoffLocation,
      paymentMethod,
      status: 'pending',
      instructorsInvolved: instructorsToUpdate.map(slot => slot.instructorId),
      createdAt: new Date()
    };

    // Store the request in the user's record for tracking
    const userUpdateResult = await User.updateOne(
      { _id: userId },
      {
        $push: {
          scheduleRequests: scheduleRequest
        }
      }
    );

    console.log('👤 User update result:', userUpdateResult);

    return NextResponse.json({
      success: true,
      message: 'Schedule request created successfully',
      requestId: scheduleRequest.createdAt.getTime().toString(),
      slotsUpdated: instructorsToUpdate.length
    });

  } catch (error) {
    console.error('❌ Error creating schedule request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
