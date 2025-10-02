import { connectDB } from "@/lib/mongodb";
import Instructor from "@/models/Instructor";

// Global map to track active connections and their intervals
const activeConnections = new Map<string, {
  interval: NodeJS.Timeout | null;
  isActive: boolean;
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
  instructorId: string;
}>();

// Send schedule update to a specific connection
export async function sendScheduleUpdate(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  instructorId: string,
  connectionId: string
) {
  try {
    await connectDB();
    const instructor = await Instructor.findById(instructorId);

    if (!instructor) {
      console.error(`❌ Instructor not found: ${instructorId}`);
      return;
    }

    const drivingLessons = instructor.get('schedule_driving_lesson', { lean: true }) || [];

    const sseData = `data: ${JSON.stringify({
      type: 'update',
      instructorId,
      schedule: drivingLessons,
      timestamp: new Date().toISOString()
    })}\n\n`;

    controller.enqueue(encoder.encode(sseData));
    console.log(`✅ Sent driving lessons schedule update to connection ${connectionId}`);
  } catch (error) {
    console.error(`❌ Error sending driving lessons schedule update to ${connectionId}:`, error);
  }
}

// Global function to broadcast updates to all active connections for an instructor
export function broadcastScheduleUpdate(instructorId: string) {
  console.log(`📢 Broadcasting driving lessons schedule update for instructor ${instructorId}`);
  console.log(`📊 Total active connections: ${activeConnections.size}`);
  console.log(`📊 Connection details:`, Array.from(activeConnections.entries()).map(([id, conn]) => ({
    connectionId: id,
    instructorId: conn.instructorId,
    isActive: conn.isActive
  })));

  let updatesSent = 0;
  for (const [connectionId, connection] of activeConnections.entries()) {
    console.log(`🔍 Checking connection ${connectionId}: instructorId=${connection.instructorId}, target=${instructorId}, isActive=${connection.isActive}`);
    if (connection.instructorId === instructorId && connection.isActive) {
      try {
        console.log(`📤 Sending update to connection ${connectionId}`);
        sendScheduleUpdate(connection.controller, connection.encoder, instructorId, connectionId);
        updatesSent++;
      } catch (error) {
        console.error(`❌ Failed to broadcast driving lessons update to connection ${connectionId}:`, error);
        connection.isActive = false;
      }
    }
  }
  console.log(`✅ Broadcast complete: ${updatesSent} updates sent`);
}

export function addConnection(connectionId: string, connection: {
  interval: NodeJS.Timeout | null;
  isActive: boolean;
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
  instructorId: string;
}) {
  console.log(`➕ Adding SSE connection: ${connectionId} for instructor: ${connection.instructorId}`);
  activeConnections.set(connectionId, connection);
  console.log(`📊 Total connections after add: ${activeConnections.size}`);
}

export function removeConnection(connectionId: string) {
  const connection = activeConnections.get(connectionId);
  if (connection) {
    connection.isActive = false;
    if (connection.interval) {
      clearInterval(connection.interval);
    }
    activeConnections.delete(connectionId);
  }
}

export function getActiveConnections() {
  return activeConnections;
}