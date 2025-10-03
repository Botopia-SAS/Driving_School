import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TicketClass from "@/models/TicketClass";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { ticketClassId, studentId, status, paymentId, orderId } = await req.json();

    if (!ticketClassId || !studentId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: ticketClassId, studentId, status" },
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

    let updateResult;

    if (status === 'confirmed' || status === 'enrolled') {
      // Move student from requests to enrolled students
      // First, find and remove the student request
      const studentObjectId = new mongoose.Types.ObjectId(studentId);

      updateResult = await TicketClass.updateOne(
        { _id: ticketClassId },
        {
          $pull: {
            studentRequests: { studentId: studentObjectId }
          }
        }
      );

      // Check if student was previously cancelled from THIS SAME slot
      const wasCancelled = ticketClass.students_cancelled?.some(
        (id: any) => id.toString() === studentId
      );

      if (wasCancelled) {
        // Remove from students_cancelled
        await TicketClass.updateOne(
          { _id: ticketClassId },
          {
            $pull: {
              students_cancelled: studentObjectId
            }
          }
        );

        // Mark as redeemed in user.ticketclass_cancelled
        const user = await User.findById(studentId);
        if (user && user.ticketclass_cancelled) {
          const cancelledIndex = user.ticketclass_cancelled.findIndex(
            (tc: any) => tc.ticketClassId === ticketClassId.toString() && !tc.redeemed
          );

          if (cancelledIndex !== -1) {
            user.ticketclass_cancelled[cancelledIndex].redeemed = true;
            await user.save({ validateBeforeSave: false });
          }
        }
      }

      // Then add the student to enrolled students
      const enrolledStudent = {
        studentId: studentObjectId,
        enrolledAt: new Date(),
        status: 'confirmed',
        paymentId: paymentId || null,
        orderId: orderId || null
      };

      updateResult = await TicketClass.updateOne(
        { _id: ticketClassId },
        {
          $push: {
            students: enrolledStudent
          },
          $set: {
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.modifiedCount === 0) {
        console.error('❌ [TICKET CLASS UPDATE] Failed to enroll student');
        return NextResponse.json(
          { error: "Failed to enroll student in ticket class" },
          { status: 500 }
        );
      }

    } else if (status === 'cancelled' || status === 'rejected') {
      // Remove student request (if payment failed)
      
      const studentObjectId = new mongoose.Types.ObjectId(studentId);
      
      updateResult = await TicketClass.updateOne(
        { _id: ticketClassId },
        {
          $pull: { 
            studentRequests: { studentId: studentObjectId } 
          },
          $set: {
            updatedAt: new Date()
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Ticket class student status updated to ${status}`,
      ticketClassId: ticketClassId,
      studentId: studentId,
      newStatus: status,
      modifiedCount: updateResult.modifiedCount
    });

  } catch (error) {
    console.error('❌ [TICKET CLASS UPDATE] Error updating ticket class status:', (error as any)?.message || error);
    return NextResponse.json(
      { error: (error as any)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
