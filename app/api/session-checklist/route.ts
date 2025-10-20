import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SessionChecklist from "@/models/SessionChecklist";

// GET - Obtener checklist de una sesión
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const studentId = searchParams.get("studentId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    // Buscar por sessionId y checklistType
    const checklist = await SessionChecklist.findOne({
      sessionId,
      checklistType: "Driving Skills Basics"
    });

    if (!checklist) {
      return NextResponse.json({ checklist: null });
    }

    return NextResponse.json({ checklist });
  } catch (error) {
    console.error("Error fetching session checklist:", error);
    return NextResponse.json(
      { error: "Failed to fetch checklist" },
      { status: 500 }
    );
  }
}

// POST - Crear o actualizar checklist de una sesión (incluyendo notes)
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { sessionId, studentId, instructorId, checklistType, items, notes } = body;

    console.log('Received session data save request:', {
      sessionId,
      studentId,
      instructorId,
      checklistType,
      itemsCount: items?.length,
      notesCount: notes?.length
    });

    if (!sessionId || !studentId || !instructorId || !checklistType) {
      const missingFields: string[] = [];
      if (!sessionId) missingFields.push('sessionId');
      if (!studentId) missingFields.push('studentId');
      if (!instructorId) missingFields.push('instructorId');
      if (!checklistType) missingFields.push('checklistType');

      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: "Missing required fields", missingFields },
        { status: 400 }
      );
    }

    // Prepare update object
    const updateData: any = {
      sessionId,
      studentId,
      instructorId,
      checklistType
    };

    // Sanitize items if provided
    if (items) {
      updateData.items = items.map((item: any) => ({
        name: String(item.name),
        completed: Boolean(item.completed),
        completedAt: item.completedAt || undefined,
        rating: item.rating ? Number(item.rating) : undefined,
        comments: item.comments ? String(item.comments) : '',
        tally: Number(item.tally || 0)
      }));
      console.log('Sanitized items sample:', updateData.items[0]);
    }

    // Sanitize notes if provided
    if (notes) {
      updateData.notes = notes.map((note: any) => ({
        text: String(note.text),
        date: note.date || new Date().toISOString()
      }));
      console.log('Sanitized notes count:', updateData.notes.length);
    }

    // Usar findOneAndUpdate con upsert para crear o actualizar
    const checklist = await SessionChecklist.findOneAndUpdate(
      { sessionId, checklistType },
      updateData,
      {
        new: true,
        upsert: true,
        runValidators: false,
        strict: false
      }
    );

    console.log('Session data saved successfully:', {
      checklistId: checklist._id,
      sessionId: checklist.sessionId,
      itemsCount: checklist.items?.length,
      notesCount: checklist.notes?.length
    });

    return NextResponse.json({ success: true, checklist });
  } catch (error) {
    console.error("Error saving session data:", error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to save session data",
        details: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un item específico del checklist
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { sessionId, checklistType, items } = body;

    if (!sessionId || !checklistType || !items) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const checklist = await SessionChecklist.findOneAndUpdate(
      { sessionId, checklistType },
      { items },
      { new: true }
    );

    if (!checklist) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, checklist });
  } catch (error) {
    console.error("Error updating session checklist:", error);
    return NextResponse.json(
      { error: "Failed to update checklist" },
      { status: 500 }
    );
  }
}
