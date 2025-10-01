import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Instructor, { ScheduleSlot } from '@/models/Instructor';
import { broadcastScheduleUpdate } from '@/lib/sse-driving-test-broadcast';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { instructorId, date, start, end, slotId, orderId } = await request.json();

    console.log('🔥 Processing cancellation payment:', { instructorId, date, start, end, slotId, orderId });

    if (!instructorId || !date || !start || !end || !slotId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 });
    }

    console.log('🔍 Found instructor:', instructor.name);

    // Find the slot in driving test schedule
    let foundSlot: ScheduleSlot | null = null;
    let scheduleType: string | null = null;

    if (instructor.schedule_driving_test) {
      foundSlot = instructor.schedule_driving_test.find((slot: ScheduleSlot) =>
        slot.date === date && slot.start === start && slot.end === end
      );
      if (foundSlot) scheduleType = 'schedule_driving_test';
    }

    // Check in regular schedule if not found
    if (!foundSlot && instructor.schedule) {
      foundSlot = instructor.schedule.find((slot: ScheduleSlot) =>
        slot.date === date && slot.start === start && slot.end === end
      );
      if (foundSlot) scheduleType = 'schedule';
    }

    if (!foundSlot) {
      console.log('❌ Slot not found in instructor schedules');
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    console.log('✅ Found slot:', foundSlot, 'in', scheduleType);

    // Mark the slot as cancelled
    foundSlot.status = 'cancelled';

    // Create a new available slot with unique ID
    const newSlotId = new mongoose.Types.ObjectId();
    const slotIdString = `driving_test_${newSlotId.toString()}_${date.replace(/-/g, '')}_${start.replace(/:/g, '')}`;

    console.log('🆕 Creating new slot with ID:', slotIdString);

    // Create clean object with only necessary fields
    const newAvailableSlot = JSON.parse(JSON.stringify({
      _id: slotIdString,
      date: date,
      start: start,
      end: end,
      booked: false,
      studentId: null,
      status: 'available',
      classType: foundSlot.classType || 'driving test',
      studentName: null,
      paid: false,
      amount: foundSlot.amount || 50,
    }));

    console.log('🆕 New slot object:', JSON.stringify(newAvailableSlot, null, 2));

    // Add the new available slot to the schedule
    if (scheduleType === 'schedule_driving_test' && instructor.schedule_driving_test) {
      instructor.schedule_driving_test.push(newAvailableSlot);
      console.log('📊 Added to schedule_driving_test. Total slots before save:', instructor.schedule_driving_test.length);
    } else if (scheduleType === 'schedule' && instructor.schedule) {
      instructor.schedule.push(newAvailableSlot);
      console.log('📊 Added to schedule. Total slots before save:', instructor.schedule.length);
    }

    // Mark the correct schedule as modified
    if (scheduleType) {
      instructor.markModified(scheduleType);
    }
    await instructor.save();

    console.log('✅ Slot marked as cancelled and new available slot created with ID:', newAvailableSlot._id);

    // Verify the slot was added
    const updatedInstructor = await Instructor.findById(instructorId);
    const scheduleArray = scheduleType === 'schedule_driving_test' ? updatedInstructor?.schedule_driving_test : updatedInstructor?.schedule;
    console.log('📊 Total slots after save:', scheduleArray?.length);
    console.log('📊 New slot found in DB:', scheduleArray?.some((s: ScheduleSlot) => s._id === newAvailableSlot._id));

    // Broadcast real-time update to SSE connections
    try {
      broadcastScheduleUpdate(instructorId);
      console.log('✅ Schedule update broadcasted via SSE');
    } catch (broadcastError) {
      console.error('❌ Failed to broadcast schedule update:', broadcastError);
    }

    return NextResponse.json({
      success: true,
      message: 'Cancellation payment processed successfully. Slot cancelled and new slot created.',
      cancelledSlotId: foundSlot._id,
      newSlotId: newAvailableSlot._id
    });
  } catch (error) {
    console.error('❌ Error processing cancellation payment:', error);
    return NextResponse.json({
      error: 'Failed to process cancellation payment',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
