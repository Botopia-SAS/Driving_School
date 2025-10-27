/**
 * Lazy-loaded Modal Components
 * Todos los modales se cargan solo cuando se necesitan
 * Esto reduce el bundle inicial ~50-100KB
 */

import dynamic from 'next/dynamic';

// Loading fallback simple
const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 animate-pulse">
      <div className="h-32 w-64 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// ✅ Login Modal
export const LoginModal = dynamic(
  () => import('@/components/LoginModal'),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false, // Los modales no necesitan SSR
  }
);

// ✅ Booking Modal
export const BookingModal = dynamic(
  () => import('@/components/BookingModal'),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

// ✅ Cancellation Modal
export const CancellationModal = dynamic(
  () => import('@/components/CancellationModal'),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

// ✅ Modal genérico
export const Modal = dynamic(
  () => import('@/components/Modal'),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

// ✅ Teachers Calendar modales
export const TeachersCalendarBookingModal = dynamic(
  () => import('@/components/TeachersCalendar/BookingModal').then((mod) => mod.BookingModal),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

export const EditBookingModal = dynamic(
  () => import('@/components/TeachersCalendar/EditBookingModal').then((mod) => mod.EditBookingModal),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

export const CreateStudentModal = dynamic(
  () => import('@/components/TeachersCalendar/CreateStudentModal').then((mod) => mod.CreateStudentModal),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

// ✅ Request Modal (driving lessons)
export const RequestModal = dynamic(
  () => import('@/app/driving-lessons/components/RequestModal'),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

// ✅ Schedule Success Modal
export const ScheduleSuccessModal = dynamic(
  () => import('@/app/driving-lessons/components/ScheduleSuccessModal'),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

// ✅ Ticket Class Booking Modal
export const TicketClassBookingModal = dynamic(
  () => import('@/app/register-online/components/TicketClassBookingModal'),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);

export const RegisterOnlineBookingModal = dynamic(
  () => import('@/app/register-online/components/BookingModal'),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
);
