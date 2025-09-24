import { NextRequest } from "next/server";
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const instructorId = searchParams.get('instructorId');

  if (!instructorId) {
    return new Response('Instructor ID is required', { status: 400 });
  }

  const encoder = new TextEncoder();
  const connectionId = `${instructorId}-${Date.now()}`;

  const stream = new ReadableStream({
    start(controller) {
      console.log(`🔌 Starting SSE connection ${connectionId}`);

      // Register the connection FIRST
      activeConnections.set(connectionId, {
        interval: null,
        isActive: true,
        controller,
        encoder,
        instructorId
      });

      // Send initial data asynchronously to avoid blocking
      setTimeout(async () => {
        await sendInitialData(controller, encoder, instructorId, connectionId);
      }, 10);

      // Set up interval for periodic updates (every 30 seconds)
      const interval = setInterval(async () => {
        const connection = activeConnections.get(connectionId);
        if (!connection || !connection.isActive) {
          console.log(`🔌 Connection ${connectionId} no longer active, clearing interval`);
          clearInterval(interval);
          activeConnections.delete(connectionId);
          return;
        }

        try {
          await sendScheduleUpdate(controller, encoder, instructorId, connectionId);
        } catch (error) {
          console.error(`❌ Error in SSE interval for ${connectionId}:`, error);
          // Mark connection as inactive on persistent errors
          if (connection) {
            connection.isActive = false;
          }
          clearInterval(interval);
          activeConnections.delete(connectionId);
        }
      }, 30000);

      // Update the connection with the interval
      const connection = activeConnections.get(connectionId);
      if (connection) {
        connection.interval = interval;
      }

      // Cleanup function
      return () => {
        console.log(`🧹 Cleaning up SSE connection ${connectionId}`);
        const connection = activeConnections.get(connectionId);
        if (connection) {
          connection.isActive = false;
          if (connection.interval) {
            clearInterval(connection.interval);
          }
          activeConnections.delete(connectionId);
        }
      };
    },

    cancel() {
      console.log(`❌ SSE stream cancelled by client for ${connectionId}`);
      const connection = activeConnections.get(connectionId);
      if (connection) {
        connection.isActive = false;
        if (connection.interval) {
          clearInterval(connection.interval);
        }
        activeConnections.delete(connectionId);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

async function sendInitialData(controller: ReadableStreamDefaultController, encoder: TextEncoder, instructorId: string, connectionId: string) {
  try {
    // Check if connection is still active
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.isActive) {
      console.log(`⏭️ Connection ${connectionId} inactive, skipping initial data send`);
      return;
    }

    await connectDB();

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      console.log(`❌ Instructor ${instructorId} not found`);
      const errorData = `data: ${JSON.stringify({ type: 'error', message: 'Instructor not found' })}\n\n`;

      // Safe send with double-check
      if (connection.isActive && controller.desiredSize !== null) {
        try {
          controller.enqueue(encoder.encode(errorData));
        } catch (enqueueError) {
          console.log(`⚠️ Failed to send error data for ${connectionId}:`, enqueueError);
          connection.isActive = false;
        }
      }
      return;
    }

    const schedule = instructor.schedule_driving_test || [];
    console.log(`📡 Sending initial driving test schedule for instructor ${instructorId} (${connectionId}):`, schedule.length, 'slots');

    const data = `data: ${JSON.stringify({
      type: 'initial',
      schedule: schedule,
      instructorId: instructorId
    })}\n\n`;

    // Safe send with double-check
    if (connection.isActive && controller.desiredSize !== null) {
      try {
        controller.enqueue(encoder.encode(data));
      } catch (enqueueError) {
        console.log(`⚠️ Failed to send initial data for ${connectionId}:`, enqueueError);
        connection.isActive = false;
      }
    }
  } catch (error) {
    console.error(`❌ Error sending initial data for ${connectionId}:`, error);
    const connection = activeConnections.get(connectionId);
    if (connection) {
      connection.isActive = false;
    }
  }
}

async function sendScheduleUpdate(controller: ReadableStreamDefaultController, encoder: TextEncoder, instructorId: string, connectionId: string) {
  try {
    // Check if connection is still active
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.isActive) {
      console.log(`⏭️ Connection ${connectionId} inactive, skipping schedule update`);
      return;
    }

    await connectDB();

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      console.log(`❌ Instructor ${instructorId} not found for update`);
      return;
    }

    const schedule = instructor.schedule_driving_test || [];
    console.log(`📡 Sending driving test schedule update for instructor ${instructorId} (${connectionId}):`, schedule.length, 'slots');

    const data = `data: ${JSON.stringify({
      type: 'update',
      schedule: schedule,
      instructorId: instructorId
    })}\n\n`;

    // Safe send with double-check
    if (connection.isActive && controller.desiredSize !== null) {
      try {
        controller.enqueue(encoder.encode(data));
      } catch (enqueueError) {
        console.log(`⚠️ Failed to send update data for ${connectionId}:`, enqueueError);
        connection.isActive = false;
        throw enqueueError; // Re-throw to trigger interval cleanup
      }
    } else {
      console.log(`⏭️ Controller closed or connection inactive for ${connectionId}, skipping update`);
      connection.isActive = false;
      throw new Error('Connection no longer active');
    }
  } catch (error) {
    console.error(`❌ Error sending schedule update for ${connectionId}:`, error);
    const connection = activeConnections.get(connectionId);
    if (connection) {
      connection.isActive = false;
    }
    throw error; // Re-throw to trigger interval cleanup
  }
}