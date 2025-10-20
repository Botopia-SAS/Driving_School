import { NextResponse } from 'next/server';
import SessionChecklist from '@/models/SessionChecklist';
import { connectDB } from '@/lib/mongodb';

// GET /api/session-checklists?sessionId=...
export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  const checklists = await SessionChecklist.find({ sessionId }).lean();
  return NextResponse.json(checklists || []);
}

// POST /api/session-checklists
// Body: { sessionId, studentId, instructorId, checklistType, items }
export async function POST(req: Request) {
  await connectDB();
  const { sessionId, studentId, instructorId, checklistType, items } = await req.json();

  if (!sessionId || !studentId || !instructorId || !checklistType) {
    return NextResponse.json({
      error: 'sessionId, studentId, instructorId, and checklistType required'
    }, { status: 400 });
  }

  const checklist = await SessionChecklist.findOneAndUpdate(
    { sessionId, checklistType },
    {
      sessionId,
      studentId,
      instructorId,
      checklistType,
      items: items || []
    },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json(checklist);
}

// PUT /api/session-checklists
// Body: { sessionId, checklistType, items }
export async function PUT(req: Request) {
  await connectDB();
  const { sessionId, checklistType, items } = await req.json();

  if (!sessionId || !checklistType || !items) {
    return NextResponse.json({
      error: 'sessionId, checklistType, and items required'
    }, { status: 400 });
  }

  const checklist = await SessionChecklist.findOneAndUpdate(
    { sessionId, checklistType },
    { items },
    { new: true }
  ).lean();

  if (!checklist) {
    return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
  }

  return NextResponse.json(checklist);
}
