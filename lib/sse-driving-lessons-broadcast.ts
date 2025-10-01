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

  for (const [connectionId, connection] of activeConnections.entries()) {
    if (connection.instructorId === instructorId && connection.isActive) {
      try {
        sendScheduleUpdate(connection.controller, connection.encoder, instructorId, connectionId);
      } catch (error) {
        console.error(`❌ Failed to broadcast driving lessons update to connection ${connectionId}:`, error);
        connection.isActive = false;
      }
    }
  }
}

export function addConnection(connectionId: string, connection: {
  interval: NodeJS.Timeout | null;
  isActive: boolean;
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
  instructorId: string;
}) {
  activeConnections.set(connectionId, connection);
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