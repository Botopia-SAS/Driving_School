import { NextRequest, NextResponse } from 'next/server';
import { broadcastScheduleUpdate } from '@/lib/sse-driving-lessons-broadcast';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instructorId = searchParams.get('instructorId');

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 });
    }

    console.log(`🔄 Force update requested for driving lessons instructor ${instructorId}`);

    // Trigger broadcast to all active SSE connections using the new system
    await broadcastScheduleUpdate(instructorId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Driving lessons schedule update broadcasted successfully' 
    });
  } catch (error) {
    console.error('❌ Error in driving lessons force update:', error);
    return NextResponse.json(
      { error: 'Failed to broadcast driving lessons update' },
      { status: 500 }
    );
  }
}