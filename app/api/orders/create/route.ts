import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Instructor from "@/models/Instructor";

// Type definitions
interface AppointmentData {
  slotId: string;
  instructorId?: string;
  instructorName?: string;
  ticketClassId?: string;
  classId?: string;
  studentId?: string;
  date: string;
  start: string;
  end: string;
  classType: string;
  amount: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    console.log("📝 Creating order with data:", body);

    const { 
      userId, 
      orderType, 
      appointments, 
      packageDetails, 
      items,
      total, 
      paymentMethod 
    } = body;

    // Validation
    if (!userId || !orderType || !appointments || appointments.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: userId, orderType, or appointments" },
        { status: 400 }
      );
    }

    // Generate sequential order number using simple counter to avoid race conditions
    const lastOrder = await Order.findOne({}, { orderNumber: 1 })
      .sort({ createdAt: -1 })
      .lean() as { orderNumber?: string | number } | null;
    
    let nextOrderNumber = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const currentNumber = parseInt(lastOrder.orderNumber.toString());
      if (!isNaN(currentNumber)) {
        nextOrderNumber = currentNumber + 1;
      }
    }
    
    const generatedOrderNumber = nextOrderNumber.toString();

    // Create the order
    console.log('📝 Creating order with appointments:', appointments);
    const mappedAppointments = appointments.map((apt: AppointmentData) => {
      const mapped: AppointmentData & { status: string } = {
        slotId: apt.slotId || `${apt.date}-${apt.start}-${apt.end}`,
        instructorId: apt.instructorId,
        instructorName: apt.instructorName,
        date: apt.date,
        start: apt.start,
        end: apt.end,
        classType: apt.classType,
        amount: apt.amount,
        status: 'pending'
      };
      
      // Preserve ticket class specific fields
      if (apt.ticketClassId) {
        mapped.ticketClassId = apt.ticketClassId;
      }
      if (apt.classId) {
        mapped.classId = apt.classId;
      }
      if (apt.studentId) {
        mapped.studentId = apt.studentId;
      }
      
      // Preserve driving lesson specific fields
      if (apt.pickupLocation) {
        mapped.pickupLocation = apt.pickupLocation;
      }
      if (apt.dropoffLocation) {
        mapped.dropoffLocation = apt.dropoffLocation;
      }
      
      console.log('🎯 Mapped appointment:', mapped);
      return mapped;
    });
    
    const order = new Order({
      userId,
      orderType,
      orderNumber: generatedOrderNumber, // Set manually to ensure it's always present
      appointments: mappedAppointments,
      packageDetails: packageDetails || {},
      items: items || [],
      total,
      paymentMethod: paymentMethod || 'online',
      paymentStatus: 'pending',
      estado: 'pending'
    });

    const savedOrder = await order.save();
    console.log("✅ Order created successfully:", savedOrder._id, savedOrder.orderNumber);

    // Update instructor schedules to link slots with order reference (slots are already pending from cart)
    const updatePromises = appointments.map(async (apt: AppointmentData) => {
      try {
        console.log(`🔄 Linking slot ${apt.slotId} to order ${savedOrder._id}`);
        
        const scheduleField = apt.classType === 'driving_test' ? 'schedule_driving_test' : 'schedule_driving_lesson';
        
        // Use slotId if available, otherwise fall back to date/time matching
        let updateResult;
        if (apt.slotId) {
          updateResult = await Instructor.updateOne(
            {
              _id: apt.instructorId,
              [`${scheduleField}._id`]: apt.slotId,
              [`${scheduleField}.status`]: 'pending'
            },
            {
              $set: {
                [`${scheduleField}.$.orderId`]: savedOrder._id.toString(),
                [`${scheduleField}.$.orderNumber`]: savedOrder.orderNumber,
              }
            }
          );
        } else {
          // Fallback to date/time matching
          updateResult = await Instructor.updateOne(
            {
              _id: apt.instructorId,
              [`${scheduleField}.date`]: apt.date,
              [`${scheduleField}.start`]: apt.start,
              [`${scheduleField}.end`]: apt.end,
              [`${scheduleField}.status`]: 'pending'
            },
            {
              $set: {
                [`${scheduleField}.$.orderId`]: savedOrder._id.toString(),
                [`${scheduleField}.$.orderNumber`]: savedOrder.orderNumber,
              }
            }
          );
        }
        
        console.log(`✅ Linked slot ${apt.slotId || `${apt.date} ${apt.start}-${apt.end}`} to order:`, updateResult.modifiedCount > 0 ? 'SUCCESS' : 'NO CHANGES');
        return updateResult;
        
      } catch (error) {
        console.error(`❌ Error linking slot ${apt.slotId || `${apt.date} ${apt.start}-${apt.end}`} to order:`, error);
        throw error;
      }
    });

    await Promise.all(updatePromises);
    console.log("✅ All slots linked to order successfully");

    return NextResponse.json({
      success: true,
      order: {
        _id: savedOrder._id,
        orderNumber: savedOrder.orderNumber,
        total: savedOrder.total,
        orderType: savedOrder.orderType,
        appointments: savedOrder.appointments,
        packageDetails: savedOrder.packageDetails,
        createdAt: savedOrder.createdAt
      }
    });

  } catch (error) {
    console.error("❌ Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order", details: error.message },
      { status: 500 }
    );
  }
}
