import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Instructor from "@/models/Instructor";
import mongoose from "mongoose";
import { addConnection, removeConnection } from "@/lib/sse-broadcast";

// Type for SSE event data
interface SSEEvent {
  type: string;
  message?: string;
  schedule?: unknown[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const instructorId = searchParams.get("id");

  if (!instructorId || !mongoose.Types.ObjectId.isValid(instructorId)) {
    return new Response(JSON.stringify({ error: "Invalid instructor ID" }), { status: 400 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = (data: SSEEvent) => {
    try {
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      writer.write(encoder.encode(payload));
    } catch {
      // Connection likely closed, silently handle
      console.warn("SSE connection closed during write attempt");
    }
  };
  
  // Connect to the database
  try {
    await connectDB();
  } catch (error) {
    console.error("Failed to connect to DB for SSE:", error);
    sendEvent({ type: "error", message: "Database connection failed" });
    writer.close();
    return new Response(stream.readable, { status: 500 });
  }

  // Send initial data
  try {
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      console.log(`❌ Instructor not found: ${instructorId}`);
      sendEvent({ type: "error", message: "Instructor not found" });
      writer.close();
      return new Response(stream.readable, { status: 404 });
    }
    
    // Get only driving lessons
    const drivingLessons = instructor.get('schedule_driving_lesson', { lean: true }) || [];
    
    console.log(`📊 Instructor ${instructorId} (${instructor.name}): Found ${drivingLessons.length} driving lessons`);
    
    sendEvent({ type: "initial", schedule: drivingLessons });
    
    // Add this connection to active connections for broadcasting
    const connectionId = `${instructorId}-${Date.now()}-${Math.random()}`;
    addConnection(connectionId, {
      writer,
      encoder,
      instructorId,
      lastActivity: Date.now()
    });
    console.log(`📡 New connection added: ${connectionId} for instructor ${instructorId}`);
  } catch (error) {
    console.error("Error fetching initial driving lessons schedule:", error);
    sendEvent({ type: "error", message: "Failed to fetch initial data" });
  }

  // Add this connection to active connections for broadcasting
  const connectionId = `${instructorId}-${Date.now()}-${Math.random()}`;
  addConnection(connectionId, {
    writer,
    encoder,
    instructorId,
    lastActivity: Date.now()
  });
  console.log(`📡 New connection added: ${connectionId} for instructor ${instructorId}`);

  // Setup Change Stream with error handling
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let changeStream: any = null;
  let updateTimeout: NodeJS.Timeout | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;
  let lastUpdateTime = 0;
  const UPDATE_THROTTLE_MS = 1000; // Only send updates every 1 second max
  let isWriterClosed = false;

  // Setup heartbeat to keep connection alive
  heartbeatInterval = setInterval(() => {
    if (!isWriterClosed) {
      try {
        writer.write(encoder.encode(': heartbeat\n\n'));
      } catch {
        clearInterval(heartbeatInterval!);
      }
    } else {
      clearInterval(heartbeatInterval!);
    }
  }, 30000); // Send heartbeat every 30 seconds
  
  try {
    changeStream = mongoose.connection.collection('instructors').watch([
      { $match: { 'documentKey._id': new mongoose.Types.ObjectId(instructorId) } }
    ], {
      fullDocument: 'updateLookup', // Get full document after change
      resumeAfter: undefined // Don't try to resume from a specific point
    });

    changeStream.on('change', async () => {
      if (isWriterClosed) return;
      
      try {
        const now = Date.now();
        
        // Clear existing timeout
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        
        // If enough time has passed since last update, send immediately
        if (now - lastUpdateTime >= UPDATE_THROTTLE_MS) {
          await sendUpdate();
        } else {
          // Otherwise, debounce the update
          updateTimeout = setTimeout(async () => {
            if (!isWriterClosed) {
              await sendUpdate();
            }
          }, UPDATE_THROTTLE_MS - (now - lastUpdateTime));
        }
        
        async function sendUpdate() {
          if (isWriterClosed) return;
          
          try {
            const instructor = await Instructor.findById(instructorId);
            if (instructor) {
              // Get only driving lessons
              const drivingLessons = instructor.get('schedule_driving_lesson', { lean: true }) || [];
              
              sendEvent({ type: "update", schedule: drivingLessons });
              lastUpdateTime = Date.now();
            }
          } catch(err) {
            if (!isWriterClosed) {
              console.error("Error fetching updated driving lessons schedule for broadcast:", err);
              sendEvent({ type: "error", message: "Failed to fetch updated data" });
            }
          }
        }
      } catch(err) {
        if (!isWriterClosed) {
          console.error("Error in change stream handler:", err);
        }
      }
    });

    changeStream.on('error', (error: Error) => {
      if (!isWriterClosed) {
        console.error("Change stream error:", error);
        sendEvent({ type: "error", message: "Database change stream error" });
      }
    });

    changeStream.on('close', () => {
      console.log("Change stream closed for instructor:", instructorId);
    });

  } catch (error) {
    console.error("Failed to setup change stream:", error);
    sendEvent({ type: "error", message: "Failed to setup real-time updates" });
  }

  // Handle client disconnect
  req.signal.addEventListener('abort', () => {
    isWriterClosed = true;
    // Remove from active connections
    removeConnection(connectionId);
    console.log(`📡 Connection removed: ${connectionId}`);
    
    if (changeStream) {
      changeStream.close();
    }
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    writer.close().catch((err) => {
      console.warn("Error closing SSE writer:", err);
    });
  });
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  });
}