import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Instructor from "@/models/Instructor";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { slotId, instructorId, status, paid, paymentId, slotIds, userId } = await req.json();

    console.log('🔄 [DRIVING TEST UPDATE] Updating driving test status:', {
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

    if (!slotsToUpdate.length || !instructorId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: slotId(s), instructorId, status" },
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

    console.log('✅ [DRIVING TEST UPDATE] Found instructor:', instructor.name);

    // Prepare update fields
    const setFields: Record<string, string | boolean | Date> = {
      status,
    };
    
    if (paid !== undefined) setFields.paid = paid;
    if (paymentId) setFields.paymentId = paymentId;
    if (status === 'booked') {
      setFields.confirmedAt = new Date();
    }

    let totalModified = 0;
    const updateResults: { slotId: string; modified: boolean }[] = [];

    // Separate ObjectId and string IDs
    const objectIdList: mongoose.Types.ObjectId[] = [];
    const stringIdList: string[] = [];
    
    for (const id of slotsToUpdate) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        objectIdList.push(new mongoose.Types.ObjectId(id));
      } else {
        stringIdList.push(id);
      }
    }

    // Strategy 1: Update by slotId directly (most common case)
    if (slotsToUpdate.length > 0) {
      // First, let's see what slots exist BEFORE update
      const beforeInstructor = await Instructor.findById(instructorId);
      if (beforeInstructor && beforeInstructor.schedule_driving_test) {
        console.log(`🔍 [DRIVING TEST UPDATE] SLOTS BEFORE UPDATE:`, 
          beforeInstructor.schedule_driving_test.map((slot) => ({
            _id: slot._id,
            status: slot.status,
            paid: slot.paid,
            date: slot.date,
            start: slot.start,
            end: slot.end
          }))
        );
      }

      // Build update object with only the fields we want to update
      const updateFields: Record<string, string | boolean | Date> = {};
      
      // Always update status
      updateFields[`schedule_driving_test.$[slot].status`] = setFields.status;
      
      // Only update paid if provided
      if (setFields.paid !== undefined) {
        updateFields[`schedule_driving_test.$[slot].paid`] = setFields.paid;
      }
      
      // Only update paymentId if provided
      if (setFields.paymentId) {
        updateFields[`schedule_driving_test.$[slot].paymentId`] = setFields.paymentId;
      }
      
      // Only update confirmedAt if provided
      if (setFields.confirmedAt) {
        updateFields[`schedule_driving_test.$[slot].confirmedAt`] = setFields.confirmedAt;
      }
      
      console.log(`🔍 [DRIVING TEST UPDATE] Update fields:`, updateFields);
      console.log(`🔍 [DRIVING TEST UPDATE] Looking for slots with IDs:`, slotsToUpdate);
      
        // Enhanced slot ID matching with multiple strategies
        for (const slotIdToFind of slotsToUpdate) {
          console.log(`🔍 [DRIVING TEST UPDATE] Processing individual slot: ${slotIdToFind}`);
          let slotFound = false;
          
          // Strategy A: Try exact string match first
          let updateResult = await Instructor.updateOne(
            { _id: instructorId },
            { $set: updateFields },
            {
              arrayFilters: [{ "slot._id": slotIdToFind }]
            }
          );
          
          if (updateResult.modifiedCount > 0) {
            console.log(`✅ [DRIVING TEST UPDATE] Found slot with exact string match: ${slotIdToFind}`);
            totalModified += updateResult.modifiedCount;
            slotFound = true;
            continue;
          }
          
          // Strategy B: Try as ObjectId if it's a valid ObjectId format
          if (mongoose.Types.ObjectId.isValid(slotIdToFind)) {
            updateResult = await Instructor.updateOne(
              { _id: instructorId },
              { $set: updateFields },
              {
                arrayFilters: [{ "slot._id": new mongoose.Types.ObjectId(slotIdToFind) }]
              }
            );
            
            if (updateResult.modifiedCount > 0) {
              console.log(`✅ [DRIVING TEST UPDATE] Found slot with ObjectId match: ${slotIdToFind}`);
              totalModified += updateResult.modifiedCount;
              slotFound = true;
              continue;
            }
          }
          
          // Strategy C: Parse complex slot ID format for driving tests
          // Format: "driving_test_{instructorId}_{date}_{time}_{timestamp}_{random}"
          if (slotIdToFind.includes('driving_test_') && slotIdToFind.includes('_')) {
            console.log(`🔍 [DRIVING TEST UPDATE] Parsing complex slot ID: ${slotIdToFind}`);
            
            const parts = slotIdToFind.split('_');
            if (parts.length >= 5) {
              // Extract date and time components
              const dateFromId = parts[3]; // "2025-10-08"
              const timeFromId = parts[4]; // "15:00" 
              
              console.log(`🔍 [DRIVING TEST UPDATE] Extracted: date=${dateFromId}, time=${timeFromId}`);
              
              // First, let's find all slots for this date and time to debug
              const currentInstructor = await Instructor.findById(instructorId);
              if (currentInstructor?.schedule_driving_test) {
                const matchingSlots = currentInstructor.schedule_driving_test.filter(slot => 
                  slot.date === dateFromId && slot.start === timeFromId
                );
                
                console.log(`🔍 [DRIVING TEST UPDATE] Found ${matchingSlots.length} slots matching date/time:`, 
                  matchingSlots.map(s => ({ 
                    _id: s._id, 
                    status: s.status, 
                    date: s.date, 
                    start: s.start,
                    end: s.end,
                    paid: s.paid
                  }))
                );
                
                // Try to update by date/time combination
                updateResult = await Instructor.updateOne(
                  { _id: instructorId },
                  { $set: updateFields },
                  {
                    arrayFilters: [{ 
                      "slot.date": dateFromId,
                      "slot.start": timeFromId,
                      "slot.classType": "driving_test"
                    }]
                  }
                );
                
                if (updateResult.modifiedCount > 0) {
                  console.log(`✅ [DRIVING TEST UPDATE] Found slot with date/time match: ${dateFromId} ${timeFromId}`);
                  totalModified += updateResult.modifiedCount;
                  slotFound = true;
                  continue;
                }
              }
            }
          }
          
          if (!slotFound) {
            console.log(`❌ [DRIVING TEST UPDATE] Could not find slot with ID: ${slotIdToFind}`);
          }
        }      console.log(`🎯 [DRIVING TEST UPDATE] Strategy 1 total: ${totalModified} slots updated`);
    }

    // Strategy 3: If still no updates and slotId looks like date-time format, try parsing
    if (totalModified === 0 && slotId && slotId.includes('-')) {
      const parts = slotId.split('-');
      if (parts.length >= 5) {
        const date = `${parts[0]}-${parts[1]}-${parts[2]}`;
        const start = parts[3];
        const end = parts[4];
        
        console.log(`🎯 [DRIVING TEST UPDATE] Strategy 3 (by date-time): date=${date}, start=${start}, end=${end}`);
        
        const updateResult = await Instructor.updateOne(
          {
            _id: instructorId,
            'schedule_driving_test.date': date,
            'schedule_driving_test.start': start,
            'schedule_driving_test.end': end
          },
          {
            $set: {
              [`schedule_driving_test.$[slot].status`]: setFields.status,
              ...(setFields.paid !== undefined ? { [`schedule_driving_test.$[slot].paid`]: setFields.paid } : {}),
              ...(setFields.paymentId ? { [`schedule_driving_test.$[slot].paymentId`]: setFields.paymentId } : {}),
              ...(setFields.confirmedAt ? { [`schedule_driving_test.$[slot].confirmedAt`]: setFields.confirmedAt } : {})
            }
          },
          {
            arrayFilters: [{ 
              "slot.date": date,
              "slot.start": start,
              "slot.end": end
            }]
          }
        );
        
        totalModified += updateResult.modifiedCount;
        console.log(`🎯 [DRIVING TEST UPDATE] Strategy 3 result: ${updateResult.modifiedCount} slots updated`);
      }
    }

    // Populate updateResults for transparency
    for (const id of slotsToUpdate) {
      updateResults.push({ slotId: id, modified: totalModified > 0 });
    }

    if (totalModified > 0) {
      console.log(`✅ [DRIVING TEST UPDATE] Updated ${totalModified} driving test slots successfully`);

      // Verify the update by fetching the instructor again
      const verifyInstructor = await Instructor.findById(instructorId);
      if (verifyInstructor && verifyInstructor.schedule_driving_test) {
        const updatedSlots = verifyInstructor.schedule_driving_test
          .filter((slot) => slotsToUpdate.includes(slot._id?.toString()) || slotsToUpdate.includes(slot._id))
          .map((slot) => ({
            _id: slot._id,
            status: slot.status,
            paid: slot.paid,
            date: slot.date,
            start: slot.start,
            end: slot.end,
            paymentId: (slot as never)['paymentId']
          }));
        console.log(`🔍 [DRIVING TEST UPDATE] SLOTS AFTER UPDATE:`, updatedSlots);
      }

      // If status is 'booked' and userId is provided, save to User's driving_test_bookings
      if (status === 'booked' && userId) {
        try {
          console.log('💾 [DRIVING TEST UPDATE] Saving bookings to User:', userId);

          // Fetch updated instructor to get slot details
          const updatedInstructor = await Instructor.findById(instructorId);
          if (updatedInstructor && updatedInstructor.schedule_driving_test) {
            interface BookingToAdd {
              slotId: string;
              instructorId: string;
              instructorName: string;
              date: string;
              start: string;
              end: string;
              amount: number;
              bookedAt: Date;
              orderId?: string;
              status: string;
            }
            
            const bookingsToAdd: BookingToAdd[] = [];

            for (const slotIdToFind of slotsToUpdate) {
              const slot = updatedInstructor.schedule_driving_test.find((s) =>
                s._id?.toString() === slotIdToFind || s._id === slotIdToFind
              );

              if (slot) {
                bookingsToAdd.push({
                  slotId: slot._id,
                  instructorId: instructorId,
                  instructorName: updatedInstructor.name,
                  date: slot.date,
                  start: slot.start,
                  end: slot.end,
                  amount: slot.amount || 50,
                  bookedAt: new Date(),
                  orderId: paymentId,
                  status: 'booked'
                });
              }
            }

            if (bookingsToAdd.length > 0) {
              await User.findByIdAndUpdate(
                userId,
                { $push: { driving_test_bookings: { $each: bookingsToAdd } } },
                { new: true }
              );
              console.log(`✅ [DRIVING TEST UPDATE] Saved ${bookingsToAdd.length} bookings to User`);
            }
          }
        } catch (userError) {
          console.error('❌ [DRIVING TEST UPDATE] Error saving to User bookings:', userError);
          // Don't fail the whole request if User update fails
        }
      }

      return NextResponse.json({
        success: true,
        message: `${totalModified} driving test slot(s) updated successfully`,
        modifiedCount: totalModified,
        results: updateResults
      });
    } else {
      console.log('❌ [DRIVING TEST UPDATE] No driving test slots were updated - slots not found');
      
      // Debug: Show all available driving test slots for this instructor
      const debugInstructor = await Instructor.findById(instructorId);
      if (debugInstructor?.schedule_driving_test) {
        console.log(`🔍 [DRIVING TEST UPDATE] Available slots in instructor's schedule_driving_test:`,
          debugInstructor.schedule_driving_test.map(slot => ({
            _id: slot._id,
            date: slot.date,
            start: slot.start,
            end: slot.end,
            status: slot.status,
            classType: slot.classType,
            paid: slot.paid
          }))
        );
        
        console.log(`🔍 [DRIVING TEST UPDATE] Requested slot IDs that were not found:`, slotsToUpdate);
      }
      
      return NextResponse.json(
        { error: "Driving test slots not found or already updated" },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('❌ [DRIVING TEST UPDATE] Error updating driving test status:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
