import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import User from "@/models/User";

// Import models
const TicketClass = mongoose.models.TicketClass || mongoose.model('TicketClass', new mongoose.Schema({}, { strict: false }), 'ticketclasses');

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const {
      userId,
      ticketClassId,
      itemId
    } = await req.json();

    console.log('🗑️ Removing ticket class from cart:', {
      userId,
      ticketClassId,
      itemId
    });

    // Validate required fields
    if (!userId || !ticketClassId) {
      return NextResponse.json(
        { error: "Missing required fields: userId, ticketClassId" },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(ticketClassId)) {
      return NextResponse.json(
        { error: "Invalid userId or ticketClassId" },
        { status: 400 }
      );
    }

    // Find the ticket class
    const ticketClass = await TicketClass.findById(ticketClassId);
    if (!ticketClass) {
      return NextResponse.json(
        { error: "Ticket class not found" },
        { status: 404 }
      );
    }

    // Remove the student request from the ticket class
    if (ticketClass.studentRequests && Array.isArray(ticketClass.studentRequests)) {
      const initialLength = ticketClass.studentRequests.length;
      
      ticketClass.studentRequests = ticketClass.studentRequests.filter((request: any) => 
        request.studentId.toString() !== userId
      );

      const finalLength = ticketClass.studentRequests.length;
      const removedCount = initialLength - finalLength;

      if (removedCount > 0) {
        // Use updateOne to avoid validation issues
        await TicketClass.updateOne(
          { _id: ticketClassId },
          { 
            studentRequests: ticketClass.studentRequests,
            updatedAt: new Date()
          }
        );
        console.log(`✅ Removed ${removedCount} student request(s) from ticket class`);
      } else {
        console.log('ℹ️ No student request found to remove');
      }
    }

    // Remove from user's cart array
    const user = await User.findById(userId);
    if (user && user.cart && Array.isArray(user.cart)) {
      const initialCartLength = user.cart.length;

      user.cart = user.cart.filter((item: any) =>
        item.ticketClassId?.toString() !== ticketClassId
      );

      const removedFromCart = initialCartLength - user.cart.length;

      if (removedFromCart > 0) {
        await user.save({ validateBeforeSave: false });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Ticket class removed from cart and student request deleted successfully"
    });

  } catch (error) {
    console.error('❌ Error removing ticket class from cart:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
