import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Instructor from "@/models/Instructor";
import TicketClass from "@/models/TicketClass";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { orderId, userId } = body;

    if (!orderId || !userId) {
      return NextResponse.json(
        { error: "Missing orderId or userId" },
        { status: 400 }
      );
    }

    console.log(`🔄 [REVERT-SLOTS] Starting revert process for order: ${orderId}`);

    // Obtener la orden
    const order = await Order.findById(orderId);

    if (!order) {
      console.warn(`⚠️ [REVERT-SLOTS] Order not found: ${orderId}`);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Verificar que la orden pertenece al usuario
    if (order.userId.toString() !== userId) {
      console.warn(`⚠️ [REVERT-SLOTS] User ${userId} does not own order ${orderId}`);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const appointments = order.appointments || [];
    console.log(`🔄 [REVERT-SLOTS] Found ${appointments.length} appointments to revert`);

    let revertedCount = 0;
    let failedCount = 0;

    // Procesar cada appointment
    for (const appointment of appointments) {
      try {
        // CASO 1: Ticket Classes - Remover estudiante del ticket class
        if (appointment.classType === 'ticket_class' || appointment.ticketClassId) {
          console.log(`🎫 [REVERT-SLOTS] Reverting ticket class: ${appointment.ticketClassId}`);

          const ticketClass = await TicketClass.findById(appointment.ticketClassId);

          if (ticketClass) {
            // Remover al estudiante de la lista
            ticketClass.students = ticketClass.students.filter(
              (studentId: any) => studentId.toString() !== userId
            );

            await ticketClass.save();
            console.log(`✅ [REVERT-SLOTS] Student removed from ticket class ${appointment.ticketClassId}`);
            revertedCount++;
          } else {
            console.warn(`⚠️ [REVERT-SLOTS] Ticket class not found: ${appointment.ticketClassId}`);
            failedCount++;
          }
        }

        // CASO 2: Driving Test - Liberar slot en schedule_driving_test
        else if ((appointment.classType === 'driving_test' || appointment.classType === 'driving test') && appointment.slotId && appointment.instructorId) {
          console.log(`🚙 [REVERT-SLOTS] Reverting DRIVING TEST slot ${appointment.slotId} for instructor ${appointment.instructorId}`);

          const instructor = await Instructor.findById(appointment.instructorId);

          if (!instructor) {
            console.warn(`⚠️ [REVERT-SLOTS] Instructor not found: ${appointment.instructorId}`);
            failedCount++;
            continue;
          }

          // Buscar el slot en schedule_driving_test del instructor
          let slotFound = false;

          if (instructor.schedule_driving_test && Array.isArray(instructor.schedule_driving_test)) {
            for (const scheduleDay of instructor.schedule_driving_test) {
              const slot = scheduleDay.slots?.id(appointment.slotId);

              if (slot) {
                // Liberar el slot - volver a estado "available"
                slot.status = 'available';
                slot.booked = false;
                slot.paid = false;
                slot.studentId = null;

                console.log(`✅ [REVERT-SLOTS] Driving test slot ${appointment.slotId} reverted to available`);
                slotFound = true;
                revertedCount++;
                break;
              }
            }
          }

          if (slotFound) {
            await instructor.save();
          } else {
            console.warn(`⚠️ [REVERT-SLOTS] Driving test slot not found: ${appointment.slotId} in instructor ${appointment.instructorId}`);
            failedCount++;
          }
        }

        // CASO 3: Driving Lesson - Liberar slot en schedule normal
        else if ((appointment.classType === 'driving_lesson' || appointment.classType === 'driving lesson') && appointment.slotId && appointment.instructorId) {
          console.log(`🚗 [REVERT-SLOTS] Reverting DRIVING LESSON slot ${appointment.slotId} for instructor ${appointment.instructorId}`);

          const instructor = await Instructor.findById(appointment.instructorId);

          if (!instructor) {
            console.warn(`⚠️ [REVERT-SLOTS] Instructor not found: ${appointment.instructorId}`);
            failedCount++;
            continue;
          }

          // Buscar el slot en schedule normal del instructor
          let slotFound = false;

          if (instructor.schedule && Array.isArray(instructor.schedule)) {
            for (const scheduleDay of instructor.schedule) {
              const slot = scheduleDay.slots?.id(appointment.slotId);

              if (slot) {
                // Liberar el slot - volver a estado "available"
                slot.status = 'available';
                slot.booked = false;
                slot.paid = false;
                slot.studentId = null;

                console.log(`✅ [REVERT-SLOTS] Driving lesson slot ${appointment.slotId} reverted to available`);
                slotFound = true;
                revertedCount++;
                break;
              }
            }
          }

          if (slotFound) {
            await instructor.save();
          } else {
            console.warn(`⚠️ [REVERT-SLOTS] Driving lesson slot not found: ${appointment.slotId} in instructor ${appointment.instructorId}`);
            failedCount++;
          }
        }

        // CASO 4: Slot genérico (fallback si no tiene classType específico)
        else if (appointment.slotId && appointment.instructorId) {
          console.log(`🔄 [REVERT-SLOTS] Reverting GENERIC slot ${appointment.slotId} for instructor ${appointment.instructorId}`);

          const instructor = await Instructor.findById(appointment.instructorId);

          if (!instructor) {
            console.warn(`⚠️ [REVERT-SLOTS] Instructor not found: ${appointment.instructorId}`);
            failedCount++;
            continue;
          }

          // Intentar buscar en schedule normal primero
          let slotFound = false;

          if (instructor.schedule && Array.isArray(instructor.schedule)) {
            for (const scheduleDay of instructor.schedule) {
              const slot = scheduleDay.slots?.id(appointment.slotId);

              if (slot) {
                slot.status = 'available';
                slot.booked = false;
                slot.paid = false;
                slot.studentId = null;

                console.log(`✅ [REVERT-SLOTS] Generic slot ${appointment.slotId} reverted in schedule`);
                slotFound = true;
                revertedCount++;
                break;
              }
            }
          }

          // Si no se encontró, buscar en schedule_driving_test
          if (!slotFound && instructor.schedule_driving_test && Array.isArray(instructor.schedule_driving_test)) {
            for (const scheduleDay of instructor.schedule_driving_test) {
              const slot = scheduleDay.slots?.id(appointment.slotId);

              if (slot) {
                slot.status = 'available';
                slot.booked = false;
                slot.paid = false;
                slot.studentId = null;

                console.log(`✅ [REVERT-SLOTS] Generic slot ${appointment.slotId} reverted in schedule_driving_test`);
                slotFound = true;
                revertedCount++;
                break;
              }
            }
          }

          if (slotFound) {
            await instructor.save();
          } else {
            console.warn(`⚠️ [REVERT-SLOTS] Generic slot not found: ${appointment.slotId} in instructor ${appointment.instructorId}`);
            failedCount++;
          }
        } else {
          console.warn(`⚠️ [REVERT-SLOTS] Unknown appointment type:`, appointment);
          failedCount++;
        }
      } catch (error) {
        console.error(`❌ [REVERT-SLOTS] Error reverting appointment:`, error);
        failedCount++;
      }
    }

    console.log(`✅ [REVERT-SLOTS] Completed: ${revertedCount} reverted, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      message: "Slots reverted successfully",
      reverted: revertedCount,
      failed: failedCount
    });

  } catch (error) {
    console.error("❌ [REVERT-SLOTS] Error:", error);
    return NextResponse.json(
      { error: "Failed to revert slots" },
      { status: 500 }
    );
  }
}
