import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Instructor from "@/models/Instructor";
import mongoose from "mongoose";

interface InstructorWithSchedule {
  schedule?: any[];
  [key: string]: any;
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

  const sendEvent = (data: object) => {
    try {
      writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (e) {
      console.warn("SSE stream for teachers closed prematurely.");
    }
  };
  
  try {
    await connectDB();
  } catch (error) {
    console.error("Failed to connect to DB for Teacher SSE:", error);
    sendEvent({ type: "error", message: "Database connection failed" });
    writer.close();
    return new Response(stream.readable, { status: 500 });
  }

  try {
    const instructor = await Instructor.findById(instructorId);
    if (instructor) {
      // Combinar schedule, schedule_driving_lesson y schedule_driving_test
      const generalSchedule = instructor.get('schedule', { lean: true }) || [];
      const drivingLessons = instructor.get('schedule_driving_lesson', { lean: true }) || [];
      const drivingTests = instructor.get('schedule_driving_test', { lean: true }) || [];
      const combinedSchedule = [...generalSchedule, ...drivingLessons, ...drivingTests];

      sendEvent({ type: "initial", schedule: combinedSchedule });
    } else {
      sendEvent({ type: "error", message: "Instructor not found" });
    }
  } catch (error) {
    console.error("Error fetching initial teacher schedule:", error);
    sendEvent({ type: "error", message: "Failed to fetch initial data" });
  }

  const changeStream = mongoose.connection.collection('instructors').watch([
    { $match: { 'documentKey._id': new mongoose.Types.ObjectId(instructorId) } }
  ]);

  changeStream.on('change', async () => {
    try {
      const instructor = await Instructor.findById(instructorId);
      if (instructor) {
        // Combinar schedule, schedule_driving_lesson y schedule_driving_test
        const generalSchedule = instructor.get('schedule', { lean: true }) || [];
        const drivingLessons = instructor.get('schedule_driving_lesson', { lean: true }) || [];
        const drivingTests = instructor.get('schedule_driving_test', { lean: true }) || [];
        const combinedSchedule = [...generalSchedule, ...drivingLessons, ...drivingTests];

        sendEvent({ type: "update", schedule: combinedSchedule });
      }
    } catch(err) {
      console.error("Error fetching updated teacher schedule for broadcast:", err);
    }
  });

  req.signal.addEventListener('abort', () => {
    changeStream.close();
    writer.close().catch(() => {});
  });
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 