import { useEffect, useRef, useState, useCallback } from 'react';

interface DrivingLessonSlot {
  _id: string;
  date: string;
  start: string;
  end: string;
  status: 'available' | 'pending' | 'booked' | 'scheduled';
  studentId?: string;
  studentName?: string;
  booked?: boolean;
  paid?: boolean;
  classType?: string;
  amount?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  selectedProduct?: string;
  paymentMethod?: string;
  reservedAt?: string;
  orderId?: string;
  orderNumber?: string;
}

interface ScheduleData {
  type: 'initial' | 'update' | 'error';
  schedule?: DrivingLessonSlot[];
  instructorId?: string;
  message?: string;
}

export function useDrivingLessonSSE(instructorId: string | null) {
  const [schedule, setSchedule] = useState<DrivingLessonSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasInitial, setHasInitial] = useState(false);
  const mountedRef = useRef(true);
  const hasInitialRef = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Update ref when hasInitial changes
  useEffect(() => {
    hasInitialRef.current = hasInitial;
  }, [hasInitial]);

  useEffect(() => {
    if (!instructorId) {
      console.log('🔌 [DL-SSE] No instructor ID provided, clearing SSE connection');
      setSchedule([]);
      setError(null);
      setIsConnected(false);
      setHasInitial(false);
      return;
    }

    console.log('🔌 [DL-SSE] Setting up SSE connection for instructor:', instructorId);

    // Close previous connection if exists
    if (eventSourceRef.current) {
      console.log('🔌 [DL-SSE] Closing previous SSE connection');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Reset states for new connection
    setSchedule([]);
    setError(null);
    setIsConnected(false);
    setHasInitial(false);
    mountedRef.current = true;

    // Small delay to prevent rapid connection changes
    const connectionDelay = setTimeout(() => {
      if (!mountedRef.current) return;

      // Simple connection approach - no global connection management
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const eventSource = new EventSource(`${baseUrl}/api/sse/driving-lessons-schedule?instructorId=${instructorId}`);

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (mountedRef.current) {
          console.log('✅ [DL-SSE] Connected successfully for instructor:', instructorId);
          setIsConnected(true);
          setError(null);
        }
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const data: ScheduleData = JSON.parse(event.data);
          console.log('📨 [DL-SSE] Received data:', data.type, 'slots:', data.schedule?.length || 0);

          if (data.type === 'initial') {
            if (!hasInitialRef.current) {
              setHasInitial(true);
              if (data.schedule) {
                setSchedule(data.schedule);
                console.log('✅ [DL-SSE] Initial schedule loaded:', data.schedule.length, 'slots');
              }
            }
          } else if (data.type === 'update') {
            if (data.schedule) {
              setSchedule(data.schedule);
              console.log('🔄 [DL-SSE] Schedule updated:', data.schedule.length, 'slots');
            }
          } else if (data.type === 'error') {
            if (data.message && !data.message.includes('Connection') && !data.message.includes('reconnect')) {
              setError(data.message);
              console.error('❌ [DL-SSE] Error:', data.message);
            }
          }
        } catch (err) {
          console.error('❌ [DL-SSE] Failed to parse SSE message:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('❌ [DL-SSE] Connection error for instructor:', instructorId, err);
        if (mountedRef.current) {
          setIsConnected(false);
          // Don't set error on initial connection attempts
          if (hasInitialRef.current) {
            setError('Connection lost. Reconnecting...');
          }
        }
      };
    }, 100);

    // Cleanup function
    return () => {
      console.log('🧹 [DL-SSE] Cleaning up SSE connection for instructor:', instructorId);
      clearTimeout(connectionDelay);
      mountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [instructorId]);

  // Force refresh function - triggers manual update
  const forceRefresh = useCallback(async () => {
    if (!instructorId) return;

    try {
      console.log('🔄 [DL-SSE] Forcing refresh for instructor:', instructorId);
      const response = await fetch(`/api/sse/driving-lessons-schedule/force-update?instructorId=${instructorId}`, {
        method: 'POST'
      });

      if (response.ok) {
        console.log('✅ [DL-SSE] Force refresh triggered successfully');
      } else {
        console.warn('⚠️ [DL-SSE] Force refresh failed');
      }
    } catch (error) {
      console.error('❌ [DL-SSE] Failed to force refresh:', error);
    }
  }, [instructorId]);

  return {
    schedule,
    error,
    isConnected,
    isReady: hasInitial,
    forceRefresh
  };
}
