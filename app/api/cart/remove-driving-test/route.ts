import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Instructor from "@/models/Instructor";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const {
      userId,
      instructorId,
      date,
      start,
      end,
      classType
    } = await req.json();

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
    const slot = instructor.schedule_driving_test?.find((s: {
      date: string;
      start: string;
      end: string;
      status: string;
      studentId?: string;
    }) => 
      s.date === date && s.start === start && s.end === end
    );

    if (!slot) {
      return NextResponse.json(
        { error: "Slot not found" },
        { status: 404 }
      );
    }

    // Verify that the slot belongs to this user (more flexible check)
    // Allow removal if slot is pending for this user OR if it's available (in case of sync issues)
    const isSlotOwnedByUser = slot.studentId && slot.studentId.toString() === userId;
    const isSlotPending = slot.status === 'pending';
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
      user.cart = user.cart.filter((item: any) => {
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

    // Free the slot - set status back to available and remove ALL student info
    slot.status = 'available';
    slot.studentId = undefined;
    slot.studentName = undefined;
    slot.reservedAt = undefined;
    slot.paymentMethod = undefined;
    
    // Eliminar campos innecesarios
    delete slot.booked;
    delete slot.orderId;
    delete slot.orderNumber;
    
    // Remove any driving lesson specific fields that shouldn't be here
    delete slot.pickupLocation;
    delete slot.dropoffLocation;
    delete slot.selectedProduct;
    
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
