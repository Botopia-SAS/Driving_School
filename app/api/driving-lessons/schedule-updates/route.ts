import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Instructor from "@/models/Instructor";
import { addConnection, removeConnection, getActiveConnections } from "@/lib/sse-driving-lessons-broadcast";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const instructorId = searchParams.get('id');

  if (!instructorId) {
    return new Response('Instructor ID is required', { status: 400 });
  }

  const encoder = new TextEncoder();
  const connectionId = `${instructorId}-${Date.now()}`;

  const stream = new ReadableStream({
    start(controller) {
      console.log(`🔌 Starting driving lessons SSE connection ${connectionId}`);

      // Register the connection FIRST
      addConnection(connectionId, {
        interval: null,
        isActive: true,
        controller,
        encoder,
        instructorId
      });

      // Send initial data asynchronously to avoid blocking
      setTimeout(async () => {
        await sendInitialData(controller, encoder, instructorId);
      }, 10);

      // Set up interval for periodic updates (every 30 seconds)
      const interval = setInterval(async () => {
        try {
          await sendScheduleUpdate(controller, encoder, instructorId);
        } catch (error) {
          console.error(`❌ Error in periodic update for ${connectionId}:`, error);
          // Don't close connection on periodic update errors
        }
      }, 30000);

      // Update the connection with the interval
      const connections = getActiveConnections();
      const connection = connections.get(connectionId);
      if (connection) {
        connection.interval = interval;
        addConnection(connectionId, connection);
      }
    },

    cancel() {
      console.log(`🔌 Canceling driving lessons SSE connection ${connectionId}`);
      removeConnection(connectionId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

// Send initial schedule data
async function sendInitialData(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  instructorId: string
) {
  try {
    console.log(`📤 Sending initial driving lessons data for ${instructorId}`);
    await connectDB();
    
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      console.error(`❌ Instructor not found: ${instructorId}`);
      const errorData = `data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Instructor not found' 
      })}\n\n`;
      controller.enqueue(encoder.encode(errorData));
      return;
    }

    const drivingLessons = instructor.get('schedule_driving_lesson', { lean: true }) || [];
    
    console.log(`📊 Instructor ${instructorId} (${instructor.name}): Found ${drivingLessons.length} driving lessons`);
    
    const data = `data: ${JSON.stringify({ 
      type: 'initial', 
      schedule: drivingLessons 
    })}\n\n`;
    controller.enqueue(encoder.encode(data));
    
  } catch (error) {
    console.error("Error fetching initial driving lessons schedule:", error);
    const errorData = `data: ${JSON.stringify({ 
      type: 'error', 
      message: 'Failed to fetch initial data' 
    })}\n\n`;
    controller.enqueue(encoder.encode(errorData));
  }
}

// Send periodic schedule updates
async function sendScheduleUpdate(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  instructorId: string
) {
  try {

    await connectDB();
    const instructor = await Instructor.findById(instructorId);
    
    if (!instructor) {
      console.error(`❌ Instructor not found during update: ${instructorId}`);
      return;
    }

    const drivingLessons = instructor.get('schedule_driving_lesson', { lean: true }) || [];
    
    const data = `data: ${JSON.stringify({ 
      type: 'update', 
      schedule: drivingLessons 
    })}\n\n`;
    controller.enqueue(encoder.encode(data));
    
    console.log(`📊 Sent driving lessons update for instructor ${instructorId}: ${drivingLessons.length} lessons`);
    
  } catch (error) {
    console.error(`❌ Error sending driving lessons schedule update for ${instructorId}:`, error);
    
    const errorData = `data: ${JSON.stringify({ 
      type: 'error', 
      message: 'Failed to fetch updated data' 
    })}\n\n`;
    controller.enqueue(encoder.encode(errorData));
  }
}