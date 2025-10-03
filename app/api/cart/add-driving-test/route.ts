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
      slotId, // ID del slot en el instructor (opcional)
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
      slotId,
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

    let slot;

    // Si tenemos slotId, buscar por ID primero
    if (slotId) {
      console.log(`🔍 Searching for slot by ID: ${slotId}`);
      slot = instructor.schedule_driving_test?.find((s: { _id: { toString: () => string } }) =>
        s._id.toString() === slotId
      );

      if (slot) {
        console.log(`✅ Found slot by ID: ${slotId}`);
      } else {
        console.warn(`⚠️ Slot not found by ID: ${slotId}, falling back to date/time search`);
      }
    }

    // Si no se encontró por ID, buscar por fecha/hora
    if (!slot) {
      const matchingSlots = instructor.schedule_driving_test?.filter((s: {
        date: string;
        start: string;
        end: string;
        status: string;
        booked?: boolean;
        studentId?: string;
      }) =>
        s.date === date && s.start === start && s.end === end
      ) || [];

      console.log(`🔍 Found ${matchingSlots.length} matching slots for ${date} ${start}-${end}`);
      matchingSlots.forEach((s, i) => {
        console.log(`  Slot ${i + 1}: status=${s.status}, studentId=${s.studentId}`);
      });

      // Priorizar slots disponibles sobre los cancelados
      slot = matchingSlots.find(s => s.status !== 'cancelled') || matchingSlots[0];
    }

    if (!slot) {
      console.error(`❌ Slot not found for ${date} ${start}-${end}`);
      console.error(`🔍 Available slots:`, instructor.schedule_driving_test?.map(s => `${s.date} ${s.start}-${s.end} (${s.status})`));
      return NextResponse.json(
        { error: `Slot not found for ${date} ${start}-${end}` },
        { status: 404 }
      );
    }
    
    console.log(`✅ Slot found: ${date} ${start}-${end} (status: ${slot.status})`);
    console.log('🔍 Slot details:', {
      status: slot.status,
      booked: slot.booked,
      studentId: slot.studentId,
      studentIdType: typeof slot.studentId,
      paymentMethod: slot.paymentMethod
    });

    // Verificar que el slot esté disponible
    if (slot.status !== 'available' && slot.status !== 'free') {
      console.log('❌ Slot status is not available:', slot.status);
      return NextResponse.json(
        { error: "Slot is not available" },
        { status: 400 }
      );
    }

    // Verificar que el slot no esté ya reservado (considerar null, undefined, y string "null")
    if (slot.booked || (slot.studentId && slot.studentId !== 'null' && slot.studentId !== null)) {
      console.log('❌ Slot is already booked:', { booked: slot.booked, studentId: slot.studentId });
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

    // Crear el item del carrito - TODOS los campos necesarios para el checkout
    const slotIdString = slot._id.toString();
    const cartItem = {
      itemId: slotIdString, // ID único del item (evitar usar 'id' por conflictos con MongoDB)
      id: slotIdString, // Mantener 'id' para compatibilidad con payment gateway
      slotId: slotIdString, // ID del slot en el instructor
      instructorId: instructorId,
      instructorName: instructor.name,
      instructorPhoto: instructor.photo || "",
      date: date,
      start: start,
      end: end,
      classType: classType || "driving test",
      title: "Driving Test", // Título del servicio
      price: amount || 150, // Precio (usar price en vez de amount para consistencia)
      amount: amount || 150, // Mantener amount por compatibilidad
      quantity: 1, // Cantidad siempre 1 para driving tests
      description: "Driving test appointment",
      addedAt: new Date()
    };

    console.log('📦 Cart item to be added:', {
      itemId: cartItem.itemId,
      id: cartItem.id,
      slotId: cartItem.slotId,
      slotIdFromSlot: slotIdString,
      allEqual: cartItem.itemId === slotIdString && cartItem.id === slotIdString && cartItem.slotId === slotIdString
    });

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
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { cart: cartItem } },
      { new: true, runValidators: false }
    );

    // Verificar lo que se guardó realmente
    const savedCartItem = updatedUser?.cart?.[updatedUser.cart.length - 1];
    console.log('✅ Cart item saved to DB:', {
      itemId: savedCartItem?.itemId,
      id: savedCartItem?.id,
      slotId: savedCartItem?.slotId,
      originalItemId: cartItem.itemId,
      originalId: cartItem.id,
      originalSlotId: cartItem.slotId,
      itemIdMatch: savedCartItem?.itemId === cartItem.itemId,
      idMatch: savedCartItem?.id === cartItem.id,
      slotIdMatch: savedCartItem?.slotId === cartItem.slotId
    });

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
