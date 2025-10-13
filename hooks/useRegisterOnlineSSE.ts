import { useState, useEffect, useRef } from "react";

interface TicketClass {
  _id: string;
  type: string;
  hour: string;
  endHour: string;
  duration: string;
  date: string;
  cupos: number;
  status: string;
  availableSpots: number;
  enrolledStudents: number;
  totalSpots: number;
  students: unknown[];
  students_cancelled?: unknown[];
  userHasPendingRequest?: boolean;
  userIsEnrolled?: boolean;
  userHasCancelled?: boolean;
  classInfo?: {
    _id: string;
    title: string;
    overview: string;
  };
  instructorInfo?: {
    _id: string;
    name: string;
    email: string;
    photo: string;
  };
}

interface SSEData {
  type: "initial" | "update" | "error";
  ticketClasses?: TicketClass[];
  message?: string;
}

export default function useRegisterOnlineSSE(
  instructorId: string | null,
  classId: string | null = null,
  userId: string | null = null
) {
  const [ticketClasses, setTicketClasses] = useState<TicketClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;

  const connectSSE = () => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Clear existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // If we have classId, start connection immediately
    if (classId) {
      // For classId filtering, we can connect right away
    } else if (!instructorId || instructorId === "ALL") {
      setTicketClasses([]);
      setError(null);
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create new EventSource connection
      const url = classId
        ? `/api/register-online/ticket-classes-sse?classId=${classId}${
            instructorId && instructorId !== "ALL"
              ? `&instructorId=${instructorId}`
              : ""
          }${userId ? `&userId=${userId}` : ""}`
        : `/api/register-online/ticket-classes-sse?instructorId=${instructorId}&type=ALL${
            userId ? `&userId=${userId}` : ""
          }`;

      console.log("🔗 Connecting to SSE:", url);
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("✅ SSE connection established");
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEData = JSON.parse(event.data);

          console.log(
            "📡 [SSE] Received data:",
            data.type,
            data.ticketClasses?.length || 0,
            "classes"
          );

          if (data.type === "initial" || data.type === "update") {
            if (data.ticketClasses) {
              setTicketClasses(data.ticketClasses);
              setIsLoading(false);
              console.log("✅ [SSE] Ticket classes updated in UI");
            }
          } else if (data.type === "error") {
            setError(data.message || "Unknown error occurred");
            setIsLoading(false);
          }
        } catch (err) {
          console.error("Error parsing SSE data:", err);
          setError("Failed to parse server data");
          setIsLoading(false);
        }
      };

      eventSource.onerror = (event) => {
        // Event objects from EventSource may be empty when network drops; log type and readyState for clarity
        const readyState = (eventSourceRef.current as any)?.readyState;
        console.error("❌ SSE connection error:", {
          type: (event as any)?.type,
          readyState,
        });
        setError("Connection lost. Trying to reconnect...");
        setIsConnected(false);
        setIsLoading(false);

        // If page is hidden or offline, pause reconnection attempts until visible/online
        if (typeof document !== "undefined" && document.hidden) {
          console.log(
            "⏸️ Page hidden - will retry SSE when page becomes visible"
          );
          const onVisible = () => {
            document.removeEventListener("visibilitychange", onVisible);
            connectSSE();
          };
          document.addEventListener("visibilitychange", onVisible);
          return;
        }

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          console.log("⏸️ Offline - will retry SSE when back online");
          const onOnline = () => {
            window.removeEventListener("online", onOnline);
            connectSSE();
          };
          window.addEventListener("online", onOnline);
          return;
        }

        // Implement reconnection logic with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            10000
          ); // Exponential backoff, max 10s
          console.log(
            `🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, delay);
        } else {
          setError(
            "Failed to establish connection after multiple attempts. Please refresh the page."
          );
        }
      };
    } catch (error) {
      console.error("❌ Failed to create EventSource:", error);
      setError("Failed to create connection");
      setIsLoading(false);

      // Implement reconnection logic for creation errors
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptsRef.current),
          10000
        );
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE();
        }, delay);
      }
    }
  };

  useEffect(() => {
    connectSSE();

    // Cleanup function
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setIsConnected(false);
      setIsLoading(false);
    };
  }, [instructorId, classId, userId]);

  // Manual cleanup function
  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  };

  return {
    ticketClasses,
    isLoading,
    error,
    isConnected,
    disconnect,
  };
}
