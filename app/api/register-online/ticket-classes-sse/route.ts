import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TicketClass from "@/models/TicketClass";
import Instructor from "@/models/Instructor";
import Classes from "@/models/Classes";
import mongoose from "mongoose";

// Type for SSE event data
interface SSEEvent {
  type: string;
  message?: string;
  ticketClasses?: unknown[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const instructorId = searchParams.get("instructorId");
  const classType = searchParams.get("type");
  const classId = searchParams.get("classId");
  const userId = searchParams.get("userId"); // Get userId to check user's requests

  // If we have classId, we don't require instructorId validation
  if (!classId && (!instructorId || !mongoose.Types.ObjectId.isValid(instructorId))) {
    return new Response(JSON.stringify({ error: "Invalid instructor ID" }), { status: 400 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  let isStreamClosed = false;

  const sendEvent = (data: SSEEvent) => {
    if (isStreamClosed) {
      return; // Don't try to write to closed stream
    }
    try {
      writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (error) {
      console.warn("SSE stream closed prematurely:", error);
      isStreamClosed = true;
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

  // Function to fetch and process ticket classes
  const fetchTicketClasses = async () => {
    try {
      // Build query to find ticket classes
      const query: Record<string, unknown> = {};
      
      // Filter by classId if specified (priority over everything else)
      if (classId && mongoose.Types.ObjectId.isValid(classId)) {
        query.classId = classId;
        // Note: instructorId filtering removed as ticket classes no longer have instructorId field
      } else if (instructorId && instructorId !== 'ALL') {
        // For instructor filtering, we need to get instructor's classes first
        // Since ticket classes don't have instructorId, we'll get all classes for the classType
        if (classType && classType !== 'ALL') {
          // Convert frontend format to database format
          let dbClassType = classType.toLowerCase();
          if (classType === 'A.D.I') dbClassType = 'adi';
          if (classType === 'B.D.I') dbClassType = 'bdi';
          if (classType === 'D.A.T.E') dbClassType = 'date';
          
          query.type = dbClassType;
        }
      } else if (instructorId === 'ALL') {
        // Get all ticket classes when instructor is 'ALL'
        // Apply classType filter if specified
        if (classType && classType !== 'ALL') {
          let dbClassType = classType.toLowerCase();
          if (classType === 'A.D.I') dbClassType = 'adi';
          if (classType === 'B.D.I') dbClassType = 'bdi';
          if (classType === 'D.A.T.E') dbClassType = 'date';
          
          query.type = dbClassType;
        }
      } else {
        // If no valid filters, return empty array
        return [];
      }

      const ticketClasses = await TicketClass.find(query).lean();
      
      // Populate class info for each ticket class
      const ticketClassesWithInfo = await Promise.all(
        ticketClasses.map(async (tc: Record<string, unknown>) => {
          // Get class info using classId
          const classInfo = await Classes.findById(tc.classId).lean() as Record<string, unknown>;
          
          // Set default status to available since we can't check instructor schedule anymore
          let status = 'available';
          
          // Calculate enrolled students and available spots
          const students = tc.students as unknown[] || [];
          const enrolledStudents = Array.isArray(students) ? students.length : 0;
          
          // Handle both field names: 'cupos' from model and 'spots' from database
          const totalSpots = (tc.cupos as number) || (tc.spots as number) || 0;
          const availableSpots = Math.max(0, totalSpots - enrolledStudents);
          
          // Check if current user has a pending request for this class
          const studentRequests = tc.studentRequests as Array<{
            studentId: string;
            requestDate: string;
            status: string;
          }> || [];
          
          const userHasPendingRequest = userId && studentRequests.some(
            request => request.studentId.toString() === userId && request.status === 'pending'
          );
          
          // Check if user is already enrolled
          const userIsEnrolled = userId && students.some(
            (student: unknown) => {
              if (typeof student === 'object' && student !== null && 'studentId' in student) {
                const studentObj = student as { studentId: unknown };
                return studentObj.studentId?.toString() === userId;
              }
              return false;
            }
          );
          
          // Check if user has cancelled this class
          const studentsCancelled = tc.students_cancelled as unknown[] || [];
          const userHasCancelled = userId && studentsCancelled.some(
            (cancelledStudent: unknown) => {
              if (typeof cancelledStudent === 'string') {
                return cancelledStudent === userId;
              } else if (typeof cancelledStudent === 'object' && cancelledStudent !== null && 'studentId' in cancelledStudent) {
                const cancelledStudentObj = cancelledStudent as { studentId: unknown };
                return cancelledStudentObj.studentId?.toString() === userId;
              }
              return false;
            }
          );
          
          // Force status to available if there are spots and no students
          if (availableSpots > 0 && enrolledStudents === 0) {
            status = 'available';
          }
          
          return {
            ...tc,
            status,
            availableSpots,
            enrolledStudents,
            totalSpots,
            endHour: tc.endHour,
            userHasPendingRequest,
            userIsEnrolled,
            userHasCancelled,
            classInfo: classInfo ? {
              _id: classInfo._id,
              title: classInfo.title as string,
              overview: classInfo.overview as string
            } : null,
            instructorInfo: null // Instructor info no longer available since instructorId was removed from ticket classes
          };
        })
      );
      
      return ticketClassesWithInfo;
    } catch (error) {
      console.error("Error fetching ticket classes:", error);
      return [];
    }
  };

  // Send initial data
  try {
    const ticketClasses = await fetchTicketClasses();
    sendEvent({ type: "initial", ticketClasses });
  } catch (error) {
    console.error("Error fetching initial ticket classes:", error);
    sendEvent({ type: "error", message: "Failed to fetch initial data" });
  }

  // Setup Change Stream for TicketClass collection
  let ticketClassChangeStream: unknown = null;
  let instructorChangeStream: unknown = null;
  
  try {
    // Watch for ALL changes in TicketClass collection - we'll filter in the callback
    // This ensures we don't miss any updates due to complex matching
    ticketClassChangeStream = mongoose.connection.collection('ticketclasses').watch();

    if (ticketClassChangeStream) {
      (ticketClassChangeStream as unknown as { on: (event: string, callback: (change: any) => void) => void }).on('change', async (change) => {
        if (isStreamClosed) return;
        
        // Check if this change is relevant to our current filters
        let isRelevant = false;
        
        if (classId) {
          // If we're filtering by classId, check if this change affects that class
          if (change.fullDocument?.classId?.toString() === classId || 
              change.updateDescription?.updatedFields) {
            isRelevant = true;
          }
        } else if (instructorId) {
          // If we're filtering by instructorId, check if this change affects that instructor
          if (change.fullDocument?.instructorId?.toString() === instructorId ||
              change.updateDescription?.updatedFields) {
            isRelevant = true;
          }
        } else {
          // If no specific filters, all changes are relevant
          isRelevant = true;
        }
        
        if (isRelevant) {
          console.log('🔔 Relevant TicketClass change detected!', {
            operationType: change.operationType,
            documentKey: change.documentKey,
            classId: classId,
            instructorId: instructorId,
            updatedFields: change.updateDescription?.updatedFields
          });
          
          try {
            const ticketClasses = await fetchTicketClasses();
            console.log('📡 Sending SSE update with', ticketClasses.length, 'ticket classes');
            sendEvent({ type: "update", ticketClasses });
          } catch(error) {
            console.error("Error fetching updated ticket classes:", error);
            if (!isStreamClosed) {
              sendEvent({ type: "error", message: "Failed to fetch updated data" });
            }
          }
        } else {
          console.log('🔕 TicketClass change not relevant for current filters, skipping');
        }
      });
    }

    // Watch for changes in Instructor collection (for schedule updates) - only if we have instructorId
    if (instructorId) {
      instructorChangeStream = mongoose.connection.collection('instructors').watch([
        { $match: { 'documentKey._id': new mongoose.Types.ObjectId(instructorId) } }
      ]);

      (instructorChangeStream as unknown as { on: (event: string, callback: () => void) => void }).on('change', async () => {
        if (isStreamClosed) return;
        
        console.log('🔔 Instructor change detected!');
        try {
          const ticketClasses = await fetchTicketClasses();
          sendEvent({ type: "update", ticketClasses });
        } catch(error) {
          console.error("Error fetching updated ticket classes after instructor change:", error);
          if (!isStreamClosed) {
            sendEvent({ type: "error", message: "Failed to fetch updated data" });
          }
        }
      });
    }

  } catch (error) {
    console.error("Failed to setup change streams:", error);
    sendEvent({ type: "error", message: "Failed to setup real-time updates" });
  }

  // Polling eliminado - solo usamos change streams de MongoDB para actualizaciones en tiempo real

  // Handle client disconnect
  req.signal.addEventListener('abort', () => {
    console.log('🔌 SSE client disconnected');
    isStreamClosed = true;
    
    if (ticketClassChangeStream && typeof ticketClassChangeStream === 'object' && 'close' in ticketClassChangeStream) {
      (ticketClassChangeStream as { close: () => void }).close();
    }
    if (instructorChangeStream && typeof instructorChangeStream === 'object' && 'close' in instructorChangeStream) {
      (instructorChangeStream as { close: () => void }).close();
    }
    
    if (!isStreamClosed) {
      writer.close().catch((error) => {
        console.warn("Error closing SSE writer:", error);
      });
    }
  });
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
