import { useEffect, useRef, useState, useCallback } from 'react';

interface DrivingTestSlot {
  _id: string;
  date: string;
  start: string;
  end: string;
  status: 'free' | 'scheduled' | 'cancelled' | 'available' | 'pending' | 'booked';
  studentId?: string;
  studentName?: string;
  booked?: boolean;
  classType?: string;
  amount?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  paymentMethod?: string;
  reservedAt?: string;
  orderId?: string;
  orderNumber?: string;
}

interface ScheduleData {
  type: 'initial' | 'update' | 'error';
  schedule?: DrivingTestSlot[];
  message?: string;
}

export function useDrivingTestSSE(instructorId: string | null) {
  const [schedule, setSchedule] = useState<DrivingTestSlot[]>([]);
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
      console.log('🔌 No instructor ID provided, clearing SSE connection');
      setSchedule([]);
      setError(null);
      setIsConnected(false);
      setHasInitial(false);
      return;
    }

    console.log('🔌 Setting up SSE connection for instructor:', instructorId);

    // Close previous connection if exists
    if (eventSourceRef.current) {
      console.log('🔌 Closing previous SSE connection');
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
      const eventSource = new EventSource(`${baseUrl}/api/sse/driving-test-schedule?instructorId=${instructorId}`);

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (mountedRef.current) {
          console.log('🔌 SSE Connected successfully for instructor:', instructorId);
          setIsConnected(true);
          setError(null);
        }
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const data: ScheduleData = JSON.parse(event.data);
          console.log('📡 SSE Data received for instructor', instructorId, ':', data);

          if (data.type === 'initial' || data.type === 'update') {
            if (data.schedule) {
              setSchedule(data.schedule);
            }
            if (!hasInitialRef.current) {
              setHasInitial(true);
            }
          } else if (data.type === 'error') {
            setError(data.message || 'Unknown error occurred');
          }
        } catch (err) {
          console.error('❌ Error parsing SSE data:', err);
          setError('Failed to parse schedule data');
        }
      };

      eventSource.onerror = (event) => {
        if (mountedRef.current) {
          console.error('❌ SSE Error for instructor', instructorId, ':', event);
          setIsConnected(false);
          setError('Connection issue. Reconnecting...');
        }
      };
    }, 100); // 100ms delay to prevent rapid connection changes

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up SSE connection for instructor:', instructorId);
      mountedRef.current = false;
      clearTimeout(connectionDelay);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      setHasInitial(false);
    };
  }, [instructorId]); // Removed hasInitial dependency to prevent loops

  // Manual cleanup function
  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setHasInitial(false);
  };

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    if (!instructorId) return;
    
    try {
      console.log('🔄 Forcing schedule refresh for instructor:', instructorId);
      // Trigger a manual update by calling the API directly
      const response = await fetch(`/api/sse/driving-test-schedule/force-update?instructorId=${instructorId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        console.log('✅ Force refresh triggered successfully');
      }
    } catch (error) {
      console.error('❌ Failed to force refresh:', error);
    }
  }, [instructorId]);

  return {
    schedule,
    error,
    isConnected,
    isReady: hasInitial,
    disconnect,
    forceRefresh
  };
}
