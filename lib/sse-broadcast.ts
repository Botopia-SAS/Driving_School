import { connectDB } from "@/lib/mongodb";
import Instructor from "@/models/Instructor";

// Global connections map for broadcasting updates
const activeConnections = new Map<string, {
  writer: WritableStreamDefaultWriter<Uint8Array>;
  encoder: TextEncoder;
  instructorId: string;
  lastActivity: number;
}>();

// Broadcast function to send updates to all connected clients for a specific instructor
export async function broadcastScheduleUpdate(instructorId: string) {
  console.log(`📡 Broadcasting schedule update for instructor: ${instructorId}`);

  const connectionsToRemove: string[] = [];
  let updatesSent = 0;

  for (const [connectionId, connection] of activeConnections.entries()) {
    if (connection.instructorId === instructorId) {
      try {
        await connectDB();
        const instructor = await Instructor.findById(instructorId);
        if (instructor) {
          const drivingLessons = instructor.get('schedule_driving_lesson', { lean: true }) || [];
          const payload = `data: ${JSON.stringify({ type: "update", schedule: drivingLessons })}\n\n`;
          await connection.writer.write(connection.encoder.encode(payload));
          updatesSent++;
          console.log(`✅ Sent update to connection ${connectionId}`);
        }
      } catch (error) {
        console.warn(`❌ Failed to send update to connection ${connectionId}:`, error);
        connectionsToRemove.push(connectionId);
      }
    }
  }

  // Clean up failed connections
  connectionsToRemove.forEach(id => activeConnections.delete(id));

  console.log(`📡 Broadcast complete: ${updatesSent} updates sent, ${connectionsToRemove.length} connections removed`);
}

export function addConnection(connectionId: string, connection: {
  writer: WritableStreamDefaultWriter<Uint8Array>;
  encoder: TextEncoder;
  instructorId: string;
  lastActivity: number;
}) {
  activeConnections.set(connectionId, connection);
}

export function removeConnection(connectionId: string) {
  activeConnections.delete(connectionId);
}