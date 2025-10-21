'use client';
import { useEffect, useState } from 'react';
import InstructorCalendar from '../../components/TeachersCalendar/InstructorCalendar';
import AuthRedirector from "@/components/AuthRedirector";
import { useRouter } from "next/navigation";
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from "@/components/AuthContext";

export default function TeachersPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [rawSchedule, setRawSchedule] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructorCapabilities, setInstructorCapabilities] = useState<string[]>([]);
  const instructorId = user && user.type === 'instructor' ? user._id : undefined;

  useEffect(() => {
    if (user === null) {
      router.replace("/");
      return;
    }
    if (user && 'type' in user && user.type !== "instructor") {
      router.replace("/");
    }
  }, [user, router]);

  // Fetch instructor capabilities
  useEffect(() => {
    const fetchInstructorCapabilities = async () => {
      if (!instructorId) return;

      try {
        // Fetch from instructors API
        const res = await fetch(`/api/teachers?id=${instructorId}`);
        const data = await res.json();

        if (data) {
          const caps: string[] = [];
          if (data.canTeachDrivingLesson) caps.push('canTeachDrivingLesson');
          if (data.canTeachDrivingTest) caps.push('canTeachDrivingTest');
          if (data.canTeachTicketClass) caps.push('canTeachTicketClass');
          setInstructorCapabilities(caps);
        }
      } catch (error) {
        console.error('Error fetching instructor capabilities:', error);
      }
    };

    fetchInstructorCapabilities();
  }, [instructorId]);

  useEffect(() => {
    if (!instructorId) {
      console.log('No instructorId, no se abre SSE');
      return;
    }
    console.log('Abriendo SSE para instructorId:', instructorId);
    const eventSource = new EventSource(`/api/teachers/schedule-updates?id=${instructorId}`);
    eventSource.onopen = () => {
      console.log('SSE conexión abierta');
    };
    eventSource.onmessage = (event) => {
      console.log('📨 SSE mensaje recibido:', event.data);
      const data = JSON.parse(event.data);
      if (data.type === 'initial' || data.type === 'update') {
        console.log('📊 SSE schedule actualizado, total slots:', data.schedule?.length || 0);
        setRawSchedule(data.schedule || []);
        if (loading) setLoading(false);
      } else if (data.type === 'error') {
        console.error('SSE Error:', data.message);
        if (loading) setLoading(false);
      }
    };
    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      if (loading) setLoading(false);
      eventSource.close();
    };
    return () => {
      console.log('Cerrando SSE');
      eventSource.close();
    };
  }, [instructorId, loading]);


  if (user === null) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8f6ef] via-[#f0f6ff] to-[#eafaf1]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <AuthRedirector />
      <div className="min-h-screen bg-gradient-to-br from-[#e8f6ef] via-[#f0f6ff] to-[#eafaf1] p-4 flex flex-col md:max-h-screen md:overflow-hidden">
        {/* Header con título y botón de logout */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <div className="flex-1"></div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-center select-none flex-1">
            <span className="text-[#0056b3]">INSTRUCTOR</span>{' '}
            <span className="text-[#27ae60]">SCHEDULE</span>
          </h1>
          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-3">
              {/* Información del usuario */}
              <div className="text-right">
                <div className="text-sm font-semibold text-[#0056b3]">{user?.name}</div>
                <div className="text-xs text-gray-600">Instructor</div>
              </div>
              {/* Botón de logout */}
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
                title="Cerrar Sesión"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full text-black flex flex-row gap-4 min-h-0">
          <div className="flex-1 min-w-0">
            <InstructorCalendar
              schedule={rawSchedule}
              onScheduleUpdate={() => {}}
              instructorId={instructorId}
              instructorCapabilities={instructorCapabilities}
            />
          </div>
        </div>
      </div>
    </>
  );
}
