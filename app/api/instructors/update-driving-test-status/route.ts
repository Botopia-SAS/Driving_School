import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Instructor from "@/models/Instructor";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { slotId, instructorId, status, paid, paymentId, slotIds } = await req.json();

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
    const setFields: Record<string, any> = {
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
      const updateResult = await Instructor.updateOne(
        { _id: instructorId },
        {
          $set: {
            [`schedule_driving_test.$[slot].status`]: setFields.status,
            ...(setFields.paid !== undefined ? { [`schedule_driving_test.$[slot].paid`]: setFields.paid } : {}),
            ...(setFields.paymentId ? { [`schedule_driving_test.$[slot].paymentId`]: setFields.paymentId } : {}),
            ...(setFields.confirmedAt ? { [`schedule_driving_test.$[slot].confirmedAt`]: setFields.confirmedAt } : {})
          }
        },
        {
          arrayFilters: [{ "slot._id": { $in: slotsToUpdate } }]
        }
      );
      totalModified += updateResult.modifiedCount;
      console.log(`🎯 [DRIVING TEST UPDATE] Strategy 1 (by slotId): ${updateResult.modifiedCount} slots updated`);
      console.log(`🔍 [DRIVING TEST UPDATE] Searching for slotIds:`, slotsToUpdate);
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
      return NextResponse.json({
        success: true,
        message: `${totalModified} driving test slot(s) updated successfully`,
        modifiedCount: totalModified,
        results: updateResults
      });
    } else {
      console.log('❌ [DRIVING TEST UPDATE] No driving test slots were updated - slots not found');
      return NextResponse.json(
        { error: "Driving test slots not found or already updated" },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('❌ [DRIVING TEST UPDATE] Error updating driving test status:', (error as any)?.message || error);
    return NextResponse.json(
      { error: (error as any)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
