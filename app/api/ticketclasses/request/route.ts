import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TicketClass from "@/models/TicketClass";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const { 
      studentId, 
      ticketClassId, 
      classId, 
      date, 
      start, 
      end, 
      paymentMethod 
    } = body;

    // Validation
    if (!studentId || !ticketClassId) {
      return NextResponse.json(
        { error: "Missing required fields: studentId or ticketClassId" },
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

    // Check if student is already enrolled
    const isAlreadyEnrolled = ticketClass.students.some(
      (student: any) => 
        (typeof student === 'string' && student === studentId) ||
        (typeof student === 'object' && student.studentId === studentId)
    );

    if (isAlreadyEnrolled) {
      return NextResponse.json(
        { error: "Student is already enrolled in this class" },
        { status: 400 }
      );
    }

    // Check if student already has a pending request
    const hasPendingRequest = ticketClass.studentRequests?.some(
      (request: any) => request.studentId === studentId && request.status === 'pending'
    );

    if (hasPendingRequest) {
      return NextResponse.json(
        { error: "Student already has a pending request for this class" },
        { status: 400 }
      );
    }

    // Check if there are available spots
    if (ticketClass.availableSpots <= 0) {
      return NextResponse.json(
        { error: "No available spots in this class" },
        { status: 400 }
      );
    }

    // If redeeming, mark one cancelled class as redeemed and add directly to students
    if (paymentMethod === 'redeem') {
      const user = await User.findById(studentId);
      if (!user || !user.ticketclass_cancelled || user.ticketclass_cancelled.length === 0) {
        return NextResponse.json(
          { error: "No cancelled classes available to redeem" },
          { status: 400 }
        );
      }

      // Find first unredeemed class
      const unredeemedIndex = user.ticketclass_cancelled.findIndex(
        (tc: any) => !tc.redeemed
      );

      if (unredeemedIndex === -1) {
        return NextResponse.json(
          { error: "No unredeemed cancelled classes available" },
          { status: 400 }
        );
      }

      // Mark as redeemed
      user.ticketclass_cancelled[unredeemedIndex].redeemed = true;
      await user.save({ validateBeforeSave: false });

      // Check if student was previously cancelled from THIS SAME slot
      const wasCancelled = ticketClass.students_cancelled?.some(
        (id: any) => id.toString() === studentId
      );

      // Add directly to students (not studentRequests)
      const enrolledStudent = {
        studentId: new mongoose.Types.ObjectId(studentId),
        enrolledAt: new Date(),
        status: 'confirmed',
        paymentId: 'redeemed',
        orderId: 'redeemed'
      };

      // Combine both operations in a SINGLE update to avoid race condition with SSE
      const updateOperation: any = {
        $push: {
          students: enrolledStudent
        },
        $set: {
          updatedAt: new Date()
        }
      };

      // If student was cancelled from this slot, also remove from students_cancelled
      if (wasCancelled) {
        updateOperation.$pull = {
          students_cancelled: studentId
        };
      }

      const updateResult = await TicketClass.updateOne(
        { _id: ticketClassId },
        updateOperation
      );

      if (updateResult.modifiedCount === 0) {
        return NextResponse.json(
          { error: "Failed to enroll student" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Class redeemed successfully - you are now enrolled!",
        ticketClassId: ticketClassId,
        studentId: studentId,
        status: 'confirmed',
        redeemed: true
      });
    }

    // For non-redemption: Create student request
    const studentRequest = {
      studentId: studentId,
      requestDate: new Date(),
      status: 'pending',
      paymentMethod: paymentMethod === 'instructor' ? 'local' : 'online',
      classDetails: {
        classId: classId,
        date: date,
        start: start,
        end: end
      }
    };

    // Update the ticket class with the request
    const updateResult = await TicketClass.updateOne(
      { _id: ticketClassId },
      {
        $push: { studentRequests: studentRequest },
        $set: { updatedAt: new Date() }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to create request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Request created successfully",
      ticketClassId: ticketClassId,
      studentId: studentId,
      requestId: studentRequest.requestDate.getTime().toString(),
      status: 'pending'
    });

  } catch (error) {
    console.error("❌ Error creating ticket class request:", error);
    return NextResponse.json(
      { error: "Failed to create request", details: error.message },
      { status: 500 }
    );
  }
}
