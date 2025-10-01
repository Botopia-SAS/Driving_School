import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Instructor from "@/models/Instructor";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    let userId;
    try {
      const body = await req.json();
      userId = body.userId;
    } catch (jsonError) {
      console.error("❌ Error parsing JSON:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    console.log("🧹 Clearing user cart for user:", userId);

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Clear driving test items from user.cart and free their slots
    if (user.cart && user.cart.length > 0) {
      console.log(`🗑️ Found ${user.cart.length} items in user cart, freeing slots...`);
      
      // Process each driving test item to free its slot
      for (const item of user.cart) {
        if (item.classType === 'driving test' && item.instructorId) {
          try {
            // Find the instructor and free the slot
            const instructor = await Instructor.findById(item.instructorId);
            if (instructor && instructor.schedule_driving_test) {
              // Priorizar slots que NO están cancelados
              const matchingSlots = instructor.schedule_driving_test.filter((s: { date?: string; start?: string; end?: string; status?: string }) =>
                s.date === item.date &&
                s.start === item.start &&
                s.end === item.end
              );

              // Priorizar slots NO cancelados
              const slot = matchingSlots.find((s: { status?: string }) => s.status !== 'cancelled') || matchingSlots[0];

              if (slot) {
                // For driving test, only keep essential fields
                (slot as Record<string, unknown>).status = 'available';
                (slot as Record<string, unknown>).studentId = null;
                (slot as Record<string, unknown>).studentName = null;
                (slot as Record<string, unknown>).paid = false;

                // DELETE fields that don't belong to driving test slots
                delete (slot as Record<string, unknown>).booked;
                delete (slot as Record<string, unknown>).reservedAt;
                delete (slot as Record<string, unknown>).paymentMethod;
                delete (slot as Record<string, unknown>).orderId;
                delete (slot as Record<string, unknown>).orderNumber;
                delete (slot as Record<string, unknown>).pickupLocation;
                delete (slot as Record<string, unknown>).dropoffLocation;
                delete (slot as Record<string, unknown>).selectedProduct;
                console.log(`✅ Freed slot: ${item.date} ${item.start}-${item.end}`);
              }
            }
            await instructor.save();
          } catch (error) {
            console.warn(`⚠️ Failed to free slot for item:`, error);
          }
        }
      }
      
      // Clear the user's cart using findByIdAndUpdate
      await User.findByIdAndUpdate(userId, { cart: [] }, { runValidators: false });
      console.log("✅ User cart cleared and slots freed");
    } else {
      console.log("ℹ️ User cart is already empty");
    }

    return NextResponse.json({
      success: true,
      message: "User cart cleared successfully",
      freedSlots: user.cart?.length || 0
    });

  } catch (error) {
    console.error("❌ Error clearing user cart:", error);
    return NextResponse.json(
      { error: "Failed to clear user cart", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
