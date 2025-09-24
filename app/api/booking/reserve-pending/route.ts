import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Instructor from "@/models/Instructor";
import mongoose from "mongoose";
import User from "@/models/User";
import { broadcastScheduleUpdate } from '@/lib/sse-driving-test-broadcast';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const {
      studentId,
      instructorId,
      date,
      start,
      end,
      classType,
      amount,
      paymentMethod
      // Removed pickupLocation and dropoffLocation - not needed for driving tests
    } = await req.json();

    // Validar datos requeridos
    if (!studentId || !instructorId || !date || !start || !end) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validar ObjectIds - Allow custom string IDs for studentId, but check if instructorId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return NextResponse.json(
        { error: "Invalid instructor ID" },
        { status: 400 }
      );
    }

    // Buscar el instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json(
        { error: "Instructor not found" },
        { status: 404 }
      );
    }

    // Buscar el slot específico en schedule_driving_test
    const slot = instructor.schedule_driving_test?.find((s) => 
      s.date === date && s.start === start && s.end === end
    );

    if (!slot) {
      return NextResponse.json(
        { error: "Slot not found" },
        { status: 404 }
      );
    }

    // Verificar que el slot esté disponible
    if (slot.status !== 'available' && slot.status !== 'free') {
      return NextResponse.json(
        { error: "Slot is not available" },
        { status: 400 }
      );
    }

    // Verificar que el slot no esté ya reservado
    if (slot.booked || slot.studentId) {
      return NextResponse.json(
        { error: "Slot is already booked" },
        { status: 400 }
      );
    }

    // Actualizar el slot a status "pending" - SOLO campos necesarios para driving test
    slot.status = 'pending';
    slot.studentId = studentId;
    slot.classType = classType || 'driving test';
    slot.amount = amount || 50;
    slot.paymentMethod = paymentMethod || 'instructor';
    slot.reservedAt = new Date();
    
    // Eliminar campos innecesarios
    delete slot.booked;
    delete slot.orderId;
    delete slot.orderNumber;
    
    // Buscar el nombre del estudiante y guardarlo correctamente
    const student = await User.findById(studentId);
    let fullName = "";
    if (student) {
      fullName = student.firstName;
      if (student.middleName && student.middleName.trim() !== "") {
        fullName += " " + student.middleName;
      }
      fullName += " " + student.lastName;
    }
    slot.studentName = fullName;
    
    // ELIMINAR EXPLÍCITAMENTE campos de driving lessons para driving tests
    delete slot.pickupLocation;
    delete slot.dropoffLocation;
    delete slot.selectedProduct;

    // Asegurar limpieza también a nivel de BD (maneja subdocs existentes)
    await Instructor.updateOne(
      {
        _id: instructorId,
        'schedule_driving_test.date': date,
        'schedule_driving_test.start': start,
        'schedule_driving_test.end': end
      },
      {
        $unset: {
          'schedule_driving_test.$.pickupLocation': "",
          'schedule_driving_test.$.dropoffLocation': "",
          'schedule_driving_test.$.selectedProduct': "",
          'schedule_driving_test.$.booked': "",
          'schedule_driving_test.$.orderId': "",
          'schedule_driving_test.$.orderNumber': ""
        }
      }
    );

    // Mark the instructor document as modified to trigger save
    instructor.markModified('schedule_driving_test');
    await instructor.save();

    // Broadcast real-time update to SSE connections
    try {
      broadcastScheduleUpdate(instructorId);
      console.log('✅ Schedule update broadcasted via SSE for pending reservation');
    } catch (broadcastError) {
      console.error('❌ Failed to broadcast schedule update:', broadcastError);
    }

    return NextResponse.json({
      success: true,
      message: "Slot reserved as pending successfully",
      slotDetails: {
        instructorName: instructor.name,
        date: date,
        start: start,
        end: end,
        amount: amount || 50,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error("❌ Error reserving slot as pending:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
