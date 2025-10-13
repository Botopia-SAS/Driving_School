import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Instructor from "@/models/Instructor";

/**
 * POST /api/orders/cancel
 * 
 * Cancela una orden y libera los recursos asociados
 * - Marca la orden como 'cancelled'
 * - Libera los slots reservados
 * - Limpia el carrito del usuario
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { orderId, userId } = await request.json();

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: "Missing orderId or userId" },
        { status: 400 }
      );
    }

    console.log(`🔄 [ORDER CANCEL] Processing cancellation for order: ${orderId}`);

    // Buscar la orden
    const order = await Order.findById(orderId);

    if (!order) {
      console.warn(`⚠️ [ORDER CANCEL] Order not found: ${orderId}`);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Verificar que la orden pertenece al usuario
    if (order.userId.toString() !== userId) {
      console.warn(`⚠️ [ORDER CANCEL] User ${userId} does not own order ${orderId}`);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Verificar que la orden está en estado pending
    if (order.estado !== 'pending') {
      console.warn(`⚠️ [ORDER CANCEL] Order ${orderId} is not pending (current status: ${order.estado})`);
      return NextResponse.json(
        { error: "Order is not in pending status" },
        { status: 400 }
      );
    }

    // Marcar la orden como cancelada
    order.estado = 'cancelled';
    order.paymentStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.updatedAt = new Date();

    await order.save();

    console.log(`✅ [ORDER CANCEL] Order ${orderId} marked as cancelled`);

    // Liberar SOLO los slots en estado 'pending' (no los 'booked')
    let slotsReleased = 0;
    let slotsSkipped = 0;
    
    if (order.appointments && order.appointments.length > 0) {
      console.log(`🔍 [ORDER CANCEL] Checking ${order.appointments.length} appointments for slot release`);
      
      for (const appointment of order.appointments) {
        if (!appointment.slotId || !appointment.instructorId) {
          console.warn(`⚠️ [ORDER CANCEL] Missing slotId or instructorId:`, appointment);
          continue;
        }

        try {
          // Buscar el instructor
          const instructor = await Instructor.findById(appointment.instructorId);
          if (!instructor) {
            console.warn(`⚠️ [ORDER CANCEL] Instructor not found: ${appointment.instructorId}`);
            continue;
          }

          // Buscar el slot por slotId en ambos horarios
          let slotFound = false;
          let slotStatus = 'unknown';
          let scheduleType = '';

          // Buscar en driving lesson schedule por slotId
          if (instructor.schedule_driving_lesson && Array.isArray(instructor.schedule_driving_lesson)) {
            for (const scheduleDay of instructor.schedule_driving_lesson) {
              if (scheduleDay.slots && Array.isArray(scheduleDay.slots)) {
                const slot = scheduleDay.slots.find(s => s._id === appointment.slotId);
                
                if (slot) {
                  slotStatus = slot.status;
                  scheduleType = 'driving lesson';
                  console.log(`🔍 [ORDER CANCEL] Found slot ${appointment.slotId} in driving lesson schedule - Status: ${slot.status}`);
                  
                  // SOLO liberar si está en 'pending'
                  if (slot.status === 'pending') {
                    slot.status = 'available';
                    slot.booked = false;
                    slot.paid = false;
                    slot.studentId = null;
                    slot.studentName = null;
                    
                    // Limpiar campos adicionales
                    delete slot.pickupLocation;
                    delete slot.dropoffLocation;
                    delete slot.paymentMethod;
                    delete slot.orderId;
                    delete slot.reservedAt;
                    delete slot.confirmedAt;
                    
                    slotFound = true;
                    slotsReleased++;
                    console.log(`✅ [ORDER CANCEL] Released pending slot ${appointment.slotId} in driving lesson schedule`);
                  } else {
                    slotsSkipped++;
                    console.log(`⚠️ [ORDER CANCEL] Skipped slot ${appointment.slotId} with status '${slot.status}' - not pending`);
                  }
                  break;
                }
              }
            }
          }

          // Buscar en driving test schedule por slotId si no se encontró en driving lesson
          if (!slotFound && instructor.schedule_driving_test && Array.isArray(instructor.schedule_driving_test)) {
            for (const scheduleDay of instructor.schedule_driving_test) {
              if (scheduleDay.slots && Array.isArray(scheduleDay.slots)) {
                const slot = scheduleDay.slots.find(s => s._id === appointment.slotId);
                
                if (slot) {
                  slotStatus = slot.status;
                  scheduleType = 'driving test';
                  console.log(`🔍 [ORDER CANCEL] Found slot ${appointment.slotId} in driving test schedule - Status: ${slot.status}`);
                  
                  // SOLO liberar si está en 'pending'
                  if (slot.status === 'pending') {
                    slot.status = 'available';
                    slot.booked = false;
                    slot.paid = false;
                    slot.studentId = null;
                    slot.studentName = null;
                    
                    // Limpiar campos adicionales
                    delete slot.pickupLocation;
                    delete slot.dropoffLocation;
                    delete slot.paymentMethod;
                    delete slot.orderId;
                    delete slot.reservedAt;
                    delete slot.confirmedAt;
                    
                    slotFound = true;
                    slotsReleased++;
                    console.log(`✅ [ORDER CANCEL] Released pending slot ${appointment.slotId} in driving test schedule`);
                  } else {
                    slotsSkipped++;
                    console.log(`⚠️ [ORDER CANCEL] Skipped slot ${appointment.slotId} with status '${slot.status}' - not pending`);
                  }
                  break;
                }
              }
            }
          }

          if (slotFound) {
            instructor.markModified(scheduleType === 'driving lesson' ? 'schedule_driving_lesson' : 'schedule_driving_test');
            await instructor.save();
          } else {
            console.warn(`⚠️ [ORDER CANCEL] Slot ${appointment.slotId} not found in instructor ${appointment.instructorId} schedules`);
          }

        } catch (error) {
          console.error(`❌ [ORDER CANCEL] Error processing appointment:`, error);
        }
      }

      console.log(`📊 [ORDER CANCEL] Slot release summary: ${slotsReleased} released, ${slotsSkipped} skipped (booked/confirmed)`);
    }

    // Limpiar el carrito del usuario
    try {
      const cartClearResponse = await fetch(`${request.nextUrl.origin}/api/cart`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (cartClearResponse.ok) {
        console.log(`✅ [ORDER CANCEL] Cart cleared for user ${userId}`);
      } else {
        console.warn(`⚠️ [ORDER CANCEL] Failed to clear cart for user ${userId}`);
      }
    } catch (error) {
      console.error(`❌ [ORDER CANCEL] Error clearing cart:`, error);
    }

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
      orderId,
      slotsReleased,
      slotsSkipped,
      summary: `${slotsReleased} slots released (pending), ${slotsSkipped} slots skipped (booked/confirmed)`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ [ORDER CANCEL] Error:", error);
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    );
  }
}
