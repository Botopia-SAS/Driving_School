import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import TicketClass from "@/models/TicketClass";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const {
      userId,
      ticketClassId,
      date,
      start,
      end,
      instructorId,
      instructorName,
      amount,
      title
    } = await req.json();

    console.log('🛒 Adding ticket class to cart:', {
      userId,
      ticketClassId,
      date,
      start,
      end,
      amount,
      title
    });

    // Validar datos requeridos
    if (!userId || !ticketClassId || !date || !start || !end) {
      return NextResponse.json(
        { error: "Missing required fields: userId, ticketClassId, date, start, end" },
        { status: 400 }
      );
    }

    // Validar ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(ticketClassId)) {
      return NextResponse.json(
        { error: "Invalid user or ticket class ID" },
        { status: 400 }
      );
    }

    // Buscar la ticket class
    const ticketClass = await TicketClass.findById(ticketClassId);
    if (!ticketClass) {
      return NextResponse.json(
        { error: "Ticket class not found" },
        { status: 404 }
      );
    }

    console.log('✅ Found ticket class - BASIC INFO:', {
      id: ticketClass._id,
      type: ticketClass.type,
      date: ticketClass.date,
      hour: ticketClass.hour,
      endhour: ticketClass.endhour,
      spots: ticketClass.spots,
      cupos: ticketClass.cupos,
      status: ticketClass.status,
      studentsCount: ticketClass.students?.length || 0,
      requestsCount: ticketClass.studentRequests?.length || 0
    });
    
    console.log('📅 Comparing dates and times:', {
      requested: { date, start, end },
      ticketClass: { 
        date: ticketClass.date, 
        hour: ticketClass.hour, 
        endhour: ticketClass.endhour  // ← Nombre correcto
      }
    });

    // Por ahora, simplificar - solo verificar que la ticket class existe
    // Las validaciones detalladas las haremos después de ver todos los campos
    console.log('✅ Ticket class found, proceeding to add to cart...');

    // Buscar el usuario
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verificar si ya está en studentRequests
    const isAlreadyRequested = ticketClass.studentRequests?.some(
      (request: any) => request.studentId.toString() === userId
    );

    if (isAlreadyRequested) {
      return NextResponse.json(
        { error: "You have already requested this ticket class" },
        { status: 400 }
      );
    }

    // Crear el item del carrito
    const cartItem = {
      id: `ticket_${ticketClassId}_${Date.now()}`, // ID único para el carrito
      title: title || ticketClass.type || "Traffic Law & Substance Abuse Class",
      price: amount || 50,
      quantity: 1,
      classType: 'ticket',
      ticketClassId: ticketClassId,
      slotId: ticketClassId, // Para ticket class, slotId es el mismo ticketClassId
      date: date,
      start: start,
      end: end,
      instructorId: instructorId,
      instructorName: instructorName,
      addedAt: new Date()
    };

    // Verificar si ya existe en el carrito
    const existingCartItem = user.cart?.find((item: any) => 
      item.ticketClassId?.toString() === ticketClassId
    );

    if (existingCartItem) {
      return NextResponse.json(
        { error: "This ticket class is already in your cart" },
        { status: 400 }
      );
    }

    // Agregar student request a la ticket class (equivalente a poner slot en "pending")
    // Usar updateOne para evitar problemas de validación del modelo
    try {
      const newStudentRequest = {
        studentId: new mongoose.Types.ObjectId(userId),
        requestDate: new Date(),
        status: 'pending',
        paymentMethod: 'online' // Cuando se agrega al carrito, siempre es pago online
      };

      console.log('💾 Adding student request to ticket class using updateOne...');
      const updateResult = await TicketClass.updateOne(
        { _id: ticketClassId },
        { 
          $push: { 
            studentRequests: newStudentRequest 
          },
          $set: {
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error('Failed to update ticket class - no documents modified');
      }

      console.log('✅ Added student request to ticket class via updateOne');
    } catch (updateError) {
      console.error('❌ Error updating ticket class:', updateError);
      return NextResponse.json(
        { error: "Failed to add student request to ticket class", details: updateError.message },
        { status: 500 }
      );
    }

    // Agregar al carrito del usuario usando findByIdAndUpdate
    try {
      console.log('💾 Saving user cart...');
      await User.findByIdAndUpdate(
        userId,
        { $push: { cart: cartItem } },
        { runValidators: false }
      );
      console.log('✅ Ticket class added to user cart successfully');
    } catch (userSaveError) {
      console.error('❌ Error saving user cart:', userSaveError);
      return NextResponse.json(
        { error: "Failed to add to user cart", details: userSaveError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ticket class added to cart successfully",
      cartItem: cartItem
    });

  } catch (error) {
    console.error('❌ Error adding ticket class to cart:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
