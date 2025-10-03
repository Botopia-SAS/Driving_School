import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Instructor from "@/models/Instructor";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Parse request body with error handling
    let requestBody;
    try {
      const text = await req.text();
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: "Empty request body" },
          { status: 400 }
        );
      }
      requestBody = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const {
      userId,
      instructorId,
      date,
      start,
      end,
      classType
    } = requestBody;

    console.log('🗑️ Removing driving test from cart:', {
      userId,
      instructorId,
      date,
      start,
      end,
      classType
    });

    // Validate required fields
    if (!userId || !instructorId || !date || !start || !end) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(instructorId)) {
      return NextResponse.json(
        { error: "Invalid user or instructor ID" },
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

    // Find the specific slot in schedule_driving_test
    // Priorizar slots que NO están cancelados
    const matchingSlots = instructor.schedule_driving_test?.filter((s: {
      date: string;
      start: string;
      end: string;
      status: string;
      studentId?: string;
    }) =>
      s.date === date && s.start === start && s.end === end
    ) || [];

    console.log(`🔍 Found ${matchingSlots.length} matching slots for ${date} ${start}-${end}`);
    matchingSlots.forEach((s, i) => {
      console.log(`  Slot ${i + 1}: status=${s.status}, studentId=${s.studentId}`);
    });

    // Priorizar slots NO cancelados (pending o cualquier otro status)
    const slot = matchingSlots.find(s => s.status !== 'cancelled') || matchingSlots[0];

    if (!slot) {
      return NextResponse.json(
        { error: "Slot not found" },
        { status: 404 }
      );
    }

    // Verify that the slot belongs to this user (more flexible check)
    // Allow removal if slot is pending for this user OR if it's available (in case of sync issues)
    const isSlotOwnedByUser = slot.studentId && slot.studentId.toString() === userId;
    const isSlotAvailable = slot.status === 'available' || slot.status === 'free';
    
    if (!isSlotOwnedByUser && !isSlotAvailable) {
      return NextResponse.json(
        { error: "Slot is not available for this user" },
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

    // Remove the item from user's cart
    const initialCartLength = user.cart?.length || 0;
    if (user.cart) {
      user.cart = user.cart.filter((item: { classType?: string; instructorId?: string; date?: string; start?: string; end?: string }) => {
        // Remove driving test items that match this appointment
        if (item.classType === 'driving test' &&
            item.instructorId?.toString() === instructorId &&
            item.date === date &&
            item.start === start &&
            item.end === end) {
          return false;
        }
        return true;
      });
    }

    const finalCartLength = user.cart?.length || 0;
    console.log(`🗑️ Removed ${initialCartLength - finalCartLength} items from cart`);

    // Save cart using findByIdAndUpdate
    await User.findByIdAndUpdate(userId, { cart: user.cart }, { runValidators: false });

    // Free the slot - set status back to available and clean student info
    // For driving test, only keep essential fields
    const slotRecord = slot as Record<string, unknown>;
    slotRecord.status = 'available';
    slotRecord.studentId = null;
    slotRecord.studentName = null;
    slotRecord.paid = false;

    // DELETE fields that don't belong to driving test slots
    delete slotRecord.booked;
    delete slotRecord.reservedAt;
    delete slotRecord.paymentMethod;
    delete slotRecord.orderId;
    delete slotRecord.orderNumber;
    delete slotRecord.pickupLocation;
    delete slotRecord.dropoffLocation;
    delete slotRecord.selectedProduct;
    
    await instructor.save();

    console.log('✅ Driving test removed from cart and slot freed successfully');

    return NextResponse.json({
      success: true,
      message: "Driving test removed from cart and slot freed successfully"
    });

  } catch (error) {
    console.error("❌ Error removing driving test from cart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
