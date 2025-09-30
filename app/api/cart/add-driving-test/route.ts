import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Instructor from "@/models/Instructor";
import mongoose from "mongoose";
import { broadcastScheduleUpdate } from '@/lib/sse-driving-test-broadcast';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const {
      userId,
      instructorId,
      date,
      start,
      end,
      classType,
      amount,
      paymentMethod
      // Removed orderId, orderNumber - not needed
      // Removed pickupLocation and dropoffLocation - not needed for driving tests
    } = await req.json();

    console.log('🛒 Adding driving test to cart:', {
      userId,
      instructorId,
      date,
      start,
      end,
      amount
    });

    // Validar datos requeridos
    if (!userId || !instructorId || !date || !start || !end) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validar ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(instructorId)) {
      return NextResponse.json(
        { error: "Invalid user or instructor ID" },
        { status: 400 }
      );
    }

    // Buscar el instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      console.error(`❌ Instructor not found with ID: ${instructorId}`);
      return NextResponse.json(
        { error: "Instructor not found" },
        { status: 404 }
      );
    }
    
    console.log(`✅ Instructor found: ${instructor.name}`);
    console.log(`🔍 Instructor has ${instructor.schedule_driving_test?.length || 0} driving test slots`);

    // Buscar el slot específico en schedule_driving_test
    const slot = instructor.schedule_driving_test?.find((s: {
      date: string;
      start: string;
      end: string;
      status: string;
      booked?: boolean;
      studentId?: string;
    }) => 
      s.date === date && s.start === start && s.end === end
    );

    if (!slot) {
      console.error(`❌ Slot not found for ${date} ${start}-${end}`);
      console.error(`🔍 Available slots:`, instructor.schedule_driving_test?.map(s => `${s.date} ${s.start}-${s.end} (${s.status})`));
      return NextResponse.json(
        { error: `Slot not found for ${date} ${start}-${end}` },
        { status: 404 }
      );
    }
    
    console.log(`✅ Slot found: ${date} ${start}-${end} (status: ${slot.status})`);

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

    // Buscar el usuario
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Crear el item del carrito - SOLO campos necesarios para driving test
    const cartItem = {
      instructorId: instructorId,
      instructorName: instructor.name,
      instructorPhoto: instructor.photo || "",
      slotId: slot._id.toString(),
      date: date,
      start: start,
      end: end,
      classType: classType || "driving test",
      amount: amount || 50,
      addedAt: new Date()
    };

    // Verificar si ya existe en el carrito
    const existingCartItem = user.cart?.find((item: {
      instructorId?: string;
      date?: string;
      start?: string;
      classType?: string;
    }) => 
      item.instructorId?.toString() === instructorId &&
      item.date === date &&
      item.start === start &&
      item.classType === classType
    );

    if (existingCartItem) {
      return NextResponse.json(
        { error: "This slot is already in your cart" },
        { status: 400 }
      );
    }

    // Agregar al carrito del usuario usando findByIdAndUpdate
    await User.findByIdAndUpdate(
      userId,
      { $push: { cart: cartItem } },
      { runValidators: false }
    );

    // Actualizar el slot a status "pending" - SOLO los campos necesarios para driving test
    slot.status = 'pending';
    slot.studentId = userId;
    slot.studentName = user.name || 'Pending Student';
    slot.reservedAt = new Date();
    slot.paymentMethod = paymentMethod || 'online'; // Use paymentMethod from frontend or default to online
    
    // ELIMINAR EXPLÍCITAMENTE campos innecesarios
    delete slot.pickupLocation;
    delete slot.dropoffLocation;
    delete slot.selectedProduct;
    delete slot.booked;
    delete slot.orderId;
    delete slot.orderNumber;

    // También limpiar a nivel de BD con $unset por si ya existen en subdocumento
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

    await instructor.save();

    // Broadcast real-time update to SSE connections
    try {
      broadcastScheduleUpdate(instructorId);
      console.log('✅ Schedule update broadcasted via SSE for cart addition');
    } catch (broadcastError) {
      console.error('❌ Failed to broadcast schedule update:', broadcastError);
    }

    console.log('✅ Driving test added to cart successfully');

    return NextResponse.json({
      success: true,
      message: "Driving test added to cart successfully",
      cartItem: cartItem
    });

  } catch (error) {
    console.error("❌ Error adding driving test to cart:", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    console.error("❌ Error message:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
