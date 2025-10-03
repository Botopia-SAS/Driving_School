// Helper types
export interface OrderDetails {
  orderNumber: string;
  total: number;
}

export interface Appointment {
  ticketClassId?: string;
  classType?: string;
  slotId?: string;
  instructorId?: string;
  date?: string;
  start?: string;
  end?: string;
}

export interface OrderDataShape {
  orderType: string;
  userId?: string;
  appointments?: Appointment[];
}

// Helpers: API Calls
export async function fetchOrderDetails(orderId: string): Promise<{ order: OrderDataShape & OrderDetails } | null> {
  const orderResponse = await fetch(`/api/orders/details?orderId=${orderId}`);
  if (!orderResponse.ok) return null;
  return orderResponse.json();
}

export async function processTicketClasses(appointments: Appointment[], userId: string, orderId: string): Promise<boolean> {
  let allProcessed = true;
  for (const appointment of appointments) {
    try {
      // Skip if this is a cancellation - it's handled by processCancellationOrder
      if (appointment.classType === 'ticket_class_cancellation') {
        console.log('⏭️ Skipping ticket class cancellation - already processed by processCancellationOrder');
        continue;
      }

      // Use the new specific route for ticket classes
      const updateResponse = await fetch('/api/ticketclasses/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketClassId: appointment.ticketClassId,
          studentId: userId,
          status: 'confirmed',
          paymentId: orderId,
          orderId: orderId
        })
      });

      if (!updateResponse.ok) {
        console.error(`❌ Failed to update ticket class status for ${appointment.ticketClassId}`);
        allProcessed = false;
      } else {
        console.log(`✅ Successfully updated ticket class status for ${appointment.ticketClassId}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ticket class ${appointment.ticketClassId}:`, error);
      allProcessed = false;
    }
  }
  return allProcessed;
}

export type DrivingLessonGroup = {
  instructorId: string;
  classType: string;
  slotIds: string[];
};

export function groupDrivingLessonsByInstructor(drivingLessons: Appointment[]): Record<string, DrivingLessonGroup> {
  return drivingLessons.reduce((acc: Record<string, DrivingLessonGroup>, apt: Appointment) => {
    const key = String(apt.instructorId);
    if (!acc[key]) {
      acc[key] = { instructorId: String(apt.instructorId), classType: String(apt.classType), slotIds: [] };
    }
    if (apt.slotId) acc[key].slotIds.push(apt.slotId);
    return acc;
  }, {});
}

export async function updateInstructorSlotsBatch(grouped: Record<string, DrivingLessonGroup>, orderId: string, userId?: string): Promise<boolean> {
  let allProcessed = true;
  for (const [instructorId, data] of Object.entries(grouped)) {
    try {
      const payload = {
        instructorId: instructorId,
        status: 'booked',
        paid: true,
        paymentId: orderId,
        slotIds: data.slotIds,
        userId: userId // Include userId for saving bookings in User model
      };

      // Use specific route based on class type
      const isDrivingTest = data.classType === 'driving_test' || data.classType === 'driving test';
      const isDrivingLesson = data.classType === 'driving_lesson' || data.classType === 'driving lesson';
      const endpoint = isDrivingTest ? '/api/instructors/update-driving-test-status' :
                      isDrivingLesson ? '/api/instructors/update-driving-lesson-status' :
                      '/api/instructors/update-driving-lesson-status'; // default fallback

      const routeType = isDrivingTest ? 'driving test' : isDrivingLesson ? 'driving lesson' : 'unknown';
      console.log(`🎯 Using ${routeType} specific route: ${endpoint}`);
      console.log(`🔍 [DEBUG] classType: "${data.classType}", isDrivingTest: ${isDrivingTest}, isDrivingLesson: ${isDrivingLesson}`);

      const slotUpdateResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!slotUpdateResponse.ok) {
        console.error(`❌ Failed to update ${isDrivingTest ? 'driving test' : 'driving lesson'} slots for instructor ${instructorId}`);
        allProcessed = false;
      } else {
        console.log(`✅ Successfully updated ${isDrivingTest ? 'driving test' : 'driving lesson'} slots for instructor ${instructorId}`);
      }
    } catch (error) {
      console.error(`❌ Error updating slots for instructor ${instructorId}:`, error);
      allProcessed = false;
    }
  }
  return allProcessed;
}

export async function forceUpdateLegacySlots(order: OrderDataShape, orderId: string): Promise<boolean> {
  let allSlotsUpdated = true;
  for (const appointment of order.appointments || []) {
    if (appointment.slotId) {
      try {
        const isDrivingTest = appointment.classType === 'driving_test' || appointment.classType === 'driving test' || order.orderType === 'driving_test';
        const isDrivingLesson = appointment.classType === 'driving_lesson' || appointment.classType === 'driving lesson' || order.orderType === 'driving_lesson';
        const endpoint = isDrivingTest ? '/api/instructors/update-driving-test-status' : 
                        isDrivingLesson ? '/api/instructors/update-driving-lesson-status' : 
                        '/api/instructors/update-driving-lesson-status'; // default fallback
        
        const routeType = isDrivingTest ? 'driving test' : isDrivingLesson ? 'driving lesson' : 'unknown';
        console.log(`🎯 [LEGACY] Using ${routeType} specific route: ${endpoint}`);
        console.log(`🔍 [LEGACY DEBUG] classType: "${appointment.classType}", orderType: "${order.orderType}", isDrivingTest: ${isDrivingTest}, isDrivingLesson: ${isDrivingLesson}`);
        
        const directUpdateResponse = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slotId: appointment.slotId,
            instructorId: appointment.instructorId,
            status: 'booked',
            paid: true,
            paymentId: orderId
          })
        });
        
        if (!directUpdateResponse.ok) {
          console.error(`❌ [LEGACY] Failed to update ${isDrivingTest ? 'driving test' : 'driving lesson'} slot ${appointment.slotId}`);
          allSlotsUpdated = false;
        } else {
          console.log(`✅ [LEGACY] Successfully updated ${isDrivingTest ? 'driving test' : 'driving lesson'} slot ${appointment.slotId}`);
        }
      } catch (error) {
        console.error(`❌ [LEGACY] Error updating slot ${appointment.slotId}:`, error);
        allSlotsUpdated = false;
      }
    }
  }
  return allSlotsUpdated;
}

export async function processCancellationOrder(appointments: Appointment[], orderId: string, userId?: string): Promise<boolean> {
  try {
    console.log('🔥 Processing cancellation order with appointments:', appointments);

    if (!appointments || appointments.length === 0) {
      console.error('❌ No appointments found in cancellation order');
      return false;
    }

    const appointment = appointments[0]; // Should only have one appointment for cancellation

    // Determine the correct endpoint based on classType
    let endpoint = '/api/booking/process-cancellation-payment'; // Default for driving test

    if (appointment.classType === 'cancel_driving_lesson') {
      endpoint = '/api/driving-lessons/process-paid-cancellation';
      console.log('🚙 Using driving lesson cancellation endpoint');
    } else if (appointment.classType === 'ticket_class_cancellation') {
      endpoint = '/api/ticketclasses/complete-paid-cancellation';
      console.log('🎫 Using ticket class cancellation endpoint');
    } else {
      console.log('🚗 Using driving test cancellation endpoint');
    }

    // Call the appropriate cancellation processing endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: userId, // For driving lessons
        userId: userId,    // For driving tests and ticket classes
        instructorId: appointment.instructorId,
        date: appointment.date,
        start: appointment.start,
        end: appointment.end,
        slotId: appointment.slotId,
        ticketClassId: appointment.ticketClassId, // For ticket classes
        paymentId: orderId,
        orderId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Failed to process cancellation:`, errorData);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Successfully processed cancellation:`, result);
    return true;
  } catch (error) {
    console.error(`❌ Error processing cancellation:`, error);
    return false;
  }
}

export async function revertAppointmentsOnFailure(order: OrderDataShape, userId?: string | null): Promise<void> {
  for (const appointment of order.appointments || []) {
    try {
      if (appointment.classType === 'ticket_class' || appointment.ticketClassId) {
        const studentIdToRevert = userId || order.userId;

        // Use the new specific route for ticket classes
        await fetch('/api/ticketclasses/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketClassId: appointment.ticketClassId,
            studentId: studentIdToRevert,
            status: 'cancelled'
          })
        });

        console.log(`🔄 Reverted ticket class ${appointment.ticketClassId} for student ${studentIdToRevert}`);

      } else if ((appointment.classType === 'driving_lesson' || appointment.classType === 'driving_test' || appointment.classType === 'driving test' || appointment.classType === 'driving lesson') && appointment.slotId) {
        const isDrivingTest = appointment.classType === 'driving_test' || appointment.classType === 'driving test';
        const isDrivingLesson = appointment.classType === 'driving_lesson' || appointment.classType === 'driving lesson';
        const endpoint = isDrivingTest ? '/api/instructors/update-driving-test-status' :
                        isDrivingLesson ? '/api/instructors/update-driving-lesson-status' :
                        '/api/instructors/update-driving-lesson-status'; // default fallback

        const routeType = isDrivingTest ? 'driving test' : isDrivingLesson ? 'driving lesson' : 'unknown';
        console.log(`🔍 [REVERT DEBUG] classType: "${appointment.classType}", isDrivingTest: ${isDrivingTest}, isDrivingLesson: ${isDrivingLesson}, using ${routeType} route`);

        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slotId: appointment.slotId,
            instructorId: appointment.instructorId,
            status: 'available',
            paid: false,
            paymentId: null
          })
        });

        console.log(`🔄 Reverted ${isDrivingTest ? 'driving test' : 'driving lesson'} slot ${appointment.slotId}`);
      }
    } catch (error) {
      console.error(`❌ Error reverting appointment:`, error);
      // continue best-effort
    }
  }
}


