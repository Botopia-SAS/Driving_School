import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Session from '@/models/Session';
import sessionCache from '@/lib/sessionCache';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { sessionId } = body;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
    }
    const session = sessionCache.get(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found in cache' }, { status: 404 });
    }
    if (session.sessionActive === false) {
      session.sessionActive = true;
      session.endTimestamp = null;
    }
    session.lastActive = new Date();
    sessionCache.set(sessionId, session);
    return NextResponse.json({ success: true, cached: true });
  } catch (error) {
    console.error('Error in session-ping:', error);
    return NextResponse.json({ success: false, error: 'Error in session-ping' }, { status: 500 });
  }
} 