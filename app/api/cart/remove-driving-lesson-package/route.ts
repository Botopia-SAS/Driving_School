import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Instructor from "@/models/Instructor";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    console.log('🗑️ Removing driving lesson package from cart:', body);

    const { userId, itemId, selectedSlots } = body;

    // Validation
    if (!userId || !itemId) {
      return NextResponse.json(
        { error: "Missing required fields: userId, itemId" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Step 1: Free up slots in instructors collection (mark as available)
    if (selectedSlots && selectedSlots.length > 0) {
      console.log('🔄 Freeing up slots in instructors...');
      
      const slotUpdatePromises = selectedSlots.map(async (slotKey: string) => {
        // Fix the slot parsing - slots are in format "2025-09-25-14:30-16:30" (5 parts)
        const parts = slotKey.split('-');
        const date = `${parts[0]}-${parts[1]}-${parts[2]}`; // 2025-09-25
        const start = parts[3]; // 14:30
        const end = parts[4]; // 16:30
        
        // Validate parsing
        if (!parts[3] || !parts[4]) {
          console.error(`❌ Invalid slot format: ${slotKey} - parts:`, parts);
          return null;
        }
        
        console.log(`🔍 Parsed slot: date=${date}, start=${start}, end=${end}`);
        console.log(`🔍 Raw slotKey: "${slotKey}"`);
        console.log(`🔍 Split parts:`, parts);
        console.log(`🔄 Freeing slot ${slotKey} -> date: ${date}, start: ${start}, end: ${end}`);

        // Update the specific slot back to available ONLY if it's still pending (not booked/paid)
        const updateResult = await Instructor.updateOne(
          {
            'schedule_driving_lesson.date': date,
            'schedule_driving_lesson.start': start,
            'schedule_driving_lesson.end': end,
            'schedule_driving_lesson.status': 'pending', // ONLY free pending slots
            'schedule_driving_lesson.studentId': userId,
            'schedule_driving_lesson.paid': { $ne: true } // ONLY free unpaid slots
          },
          {
            $set: {
              'schedule_driving_lesson.$.status': 'available'
            },
            $unset: {
              'schedule_driving_lesson.$.studentId': "",
              'schedule_driving_lesson.$.studentName': "",
              'schedule_driving_lesson.$.reservedAt': "",
              'schedule_driving_lesson.$.pickupLocation': "",
              'schedule_driving_lesson.$.dropoffLocation': ""
            }
          }
        );

        console.log(`✅ Slot ${slotKey} freed:`, updateResult.modifiedCount > 0 ? 'SUCCESS' : 'NO CHANGES (already booked/paid)');
        console.log(`📊 Update details: matchedCount: ${updateResult.matchedCount}, modifiedCount: ${updateResult.modifiedCount}`);
        return updateResult;
      });

      await Promise.all(slotUpdatePromises);
      console.log('✅ All slots freed and marked as available');
    }

    // Step 2: Remove from user's cart using findByIdAndUpdate
    if (user.cart) {
      const filteredCart = user.cart.filter((item: { id: string }) => item.id !== itemId);
      await User.findByIdAndUpdate(userId, { cart: filteredCart }, { runValidators: false });
      console.log('✅ Package removed from cart successfully');
    }

    return NextResponse.json({
      success: true,
      message: "Driving lesson package removed from cart and slots freed up"
    });

  } catch (error) {
    console.error("❌ Error removing driving lesson package from cart:", error);
    return NextResponse.json(
      { error: "Failed to remove package from cart", details: error.message },
      { status: 500 }
    );
  }
}
