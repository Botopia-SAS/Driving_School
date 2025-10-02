import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Instructor from "@/models/Instructor";
import User from "@/models/User";

interface DrivingLessonSlot {
  _id: string;
  status: string;
  paid: boolean;
  studentId?: string;
  studentName?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  date?: string;
  start?: string;
  end?: string;
  selectedProduct?: string;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { slotId, instructorId, status, paid, paymentId, slotIds, userId } = await req.json();

    console.log('🔄 [DRIVING LESSON UPDATE] Updating driving lesson status:', {
      slotId,
      instructorId,
      status,
      paid,
      paymentId,
      slotIds
    });

    // Handle both single slot and multiple slots (package)
    const rawSlots: (string | null | undefined)[] = (slotIds && Array.isArray(slotIds)) ? slotIds : [slotId];
    const slotsToUpdate = rawSlots.filter(Boolean) as string[];

    if (!slotsToUpdate.length || !instructorId) {
      return NextResponse.json(
        { error: "Missing slotId(s) or instructorId" },
        { status: 400 }
      );
    }

    // Find the instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json(
        { error: "Instructor not found" },
        { status: 404 }
      );
    }

    console.log('✅ [DRIVING LESSON UPDATE] Found instructor:', instructor.name);

    // SIMPLE: No need to prepare complex fields - just update status
    console.log(`🔍 [DRIVING LESSON UPDATE] SIMPLE MODE: Only updating status to 'booked'`);

    let totalModified = 0;
    const updateResults: { slotId: string; modified: boolean }[] = [];

    // SIMPLE STRATEGY: Just update status to 'booked' and paid to true - nothing else
    console.log(`🔍 [DRIVING LESSON UPDATE] SIMPLE STRATEGY: Updating status to 'booked' and paid to true for ${slotsToUpdate.length} slots`);
    
    // First, let's see what slots exist BEFORE update
    const beforeInstructor = await Instructor.findById(instructorId);
    if (beforeInstructor && beforeInstructor.schedule_driving_lesson) {
      console.log(`🔍 [DRIVING LESSON UPDATE] SLOTS BEFORE UPDATE:`, 
        beforeInstructor.schedule_driving_lesson.map((slot: DrivingLessonSlot) => ({
          _id: slot._id,
          status: slot.status,
          paid: slot.paid,
          studentId: slot.studentId,
          studentName: slot.studentName,
          pickupLocation: slot.pickupLocation,
          dropoffLocation: slot.dropoffLocation
        }))
      );
    }
    
    for (const slotIdToUpdate of slotsToUpdate) {
      try {
        console.log(`🔍 [DRIVING LESSON UPDATE] Processing slot: ${slotIdToUpdate}`);

        // SIMPLE UPDATE: Change status to 'booked' and paid to true - KEEP existing fields
        const updateResult = await Instructor.findOneAndUpdate(
          {
            _id: instructorId,
            'schedule_driving_lesson._id': slotIdToUpdate
          },
          {
            $set: {
              'schedule_driving_lesson.$.status': 'booked',
              'schedule_driving_lesson.$.paid': true,
              'schedule_driving_lesson.$.paymentId': paymentId,
              'schedule_driving_lesson.$.confirmedAt': new Date()
              // DO NOT remove studentId, studentName, pickupLocation, dropoffLocation, etc.
            }
          },
          {
            new: true,
            runValidators: true
          }
        );
        
        if (updateResult) {
          totalModified++;
          console.log(`✅ [DRIVING LESSON UPDATE] Successfully updated slot ${slotIdToUpdate} to 'booked'`);
          
          // Verify the update
          const afterInstructor = await Instructor.findById(instructorId);
          const updatedSlot = afterInstructor?.schedule_driving_lesson.find((slot: DrivingLessonSlot) => 
            slot._id.toString() === slotIdToUpdate
          );
          
          if (updatedSlot) {
            console.log(`🔍 [DRIVING LESSON UPDATE] SLOT AFTER UPDATE:`, {
              _id: updatedSlot._id,
              status: updatedSlot.status,
              paid: updatedSlot.paid,
              studentId: updatedSlot.studentId,
              studentName: updatedSlot.studentName,
              pickupLocation: updatedSlot.pickupLocation,
              dropoffLocation: updatedSlot.dropoffLocation
            });
          }
        } else {
          console.error(`❌ [DRIVING LESSON UPDATE] Failed to update slot ${slotIdToUpdate}`);
        }
      } catch (error) {
        console.error(`❌ [DRIVING LESSON UPDATE] Error updating slot ${slotIdToUpdate}:`, error);
      }
    }

    // Populate updateResults for transparency
    for (const id of slotsToUpdate) {
      updateResults.push({ slotId: id, modified: totalModified > 0 });
    }

    if (totalModified > 0) {
      console.log(`✅ [DRIVING LESSON UPDATE] Updated ${totalModified} driving lesson slots successfully`);

      // Add bookings to user.driving_lesson_bookings
      if (userId) {
        try {
          const instructor = await Instructor.findById(instructorId);
          const bookingsToAdd = [];

          for (const slotIdToUpdate of slotsToUpdate) {
            const slot = instructor?.schedule_driving_lesson.find((s: DrivingLessonSlot) =>
              s._id.toString() === slotIdToUpdate
            );

            if (slot) {
              bookingsToAdd.push({
                slotId: `${slot.date}-${slot.start}-${slot.end}`,
                instructorId: instructorId,
                instructorName: instructor.name,
                date: slot.date,
                start: slot.start,
                end: slot.end,
                amount: 90,
                bookedAt: new Date(),
                orderId: paymentId || '',
                status: 'booked' as const,
                redeemed: false,
                packageName: slot.selectedProduct || '',
                selectedProduct: slot.selectedProduct || ''
              });
            }
          }

          if (bookingsToAdd.length > 0) {
            await User.findByIdAndUpdate(
              userId,
              { $push: { driving_lesson_bookings: { $each: bookingsToAdd } } },
              { validateBeforeSave: false }
            );
            console.log(`✅ [DRIVING LESSON UPDATE] Added ${bookingsToAdd.length} bookings to user.driving_lesson_bookings`);
          }
        } catch (userError) {
          console.error('❌ [DRIVING LESSON UPDATE] Failed to add to user bookings:', userError);
        }
      }

      return NextResponse.json({
        success: true,
        message: `${totalModified} driving lesson slot(s) updated successfully`,
        modifiedCount: totalModified,
        results: updateResults
      });
    } else {
      console.log('❌ [DRIVING LESSON UPDATE] No driving lesson slots were updated - slots not found');
      return NextResponse.json(
        { error: "Driving lesson slots not found or already updated" },
        { status: 404 }
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [DRIVING LESSON UPDATE] Error updating driving lesson status:', errorMessage);
    return NextResponse.json(
      { error: errorMessage || "Internal server error" },
      { status: 500 }
    );
  }
}