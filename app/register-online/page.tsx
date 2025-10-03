"use client";

import React, { useState, useEffect, Suspense } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "@/globals.css";
import Modal from "@/components/Modal";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "../context/CartContext";
import LoginModal from "@/components/LoginModal";
import TicketClassBookingModal from "./components/TicketClassBookingModal";
import { useSearchParams } from "next/navigation";
import useRegisterOnlineSSE from "@/hooks/useRegisterOnlineSSE";
import { formatDateForDisplay } from "@/utils/dateFormat";

interface Instructor {
  _id: string;
  name: string;
  photo?: string;
}

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
  userHasPendingRequest?: boolean;
  userIsEnrolled?: boolean;
  students: {
    studentId: string;
    reason?: string;
    citation_number?: string;
    citation_ticket?: string;
    course_country?: string;
  }[];
  studentRequests?: {
    studentId: string;
    requestDate: string;
    status: 'pending' | 'accepted' | 'rejected';
  }[];
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

// Component that uses useSearchParams
function RegisterOnlineContent() {
  const searchParams = useSearchParams();
  const classId = searchParams?.get('classId') || null;
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [classList, setClassList] = useState<{_id: string; title: string}[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classId);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTicketClass, setSelectedTicketClass] = useState<TicketClass | null>(null);
  const [showUnbookConfirm, setShowUnbookConfirm] = useState(false);
  const [classToUnbook, setClassToUnbook] = useState<TicketClass | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestedTicketClass, setRequestedTicketClass] = useState<TicketClass | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [cancellationData, setCancellationData] = useState<{
    ticketClassId?: string;
    userId?: string;
    cancellationFee?: number;
    message?: string;
    requiresPayment: boolean;
  } | null>(null);
  
  // Estados para el modal de reserva
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'instructor' | 'redeem'>('online');
  const [isOnlinePaymentLoading, setIsOnlinePaymentLoading] = useState(false);
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedClassPrice, setSelectedClassPrice] = useState<number | null>(null);
  
  // Estados para manejo de autenticación y slots pendientes
  const [pendingSlot, setPendingSlot] = useState<{
    ticketClass: TicketClass;
    classPrice: number;
  } | null>(null);

  const { user, setUser } = useAuth();
  const { addToCart } = useCart();
  const userId = user?._id || "";

  // Función para manejar el login exitoso
  const handleLoginSuccess = (loggedInUser: { _id: string; name: string; email: string }) => {
    setShowLogin(false);
    setShowAuthWarning(false);
    setUser(loggedInUser);
    
    // Si hay un slot pendiente, proceder con la reserva
    if (pendingSlot) {
      setSelectedTicketClass(pendingSlot.ticketClass);
      setSelectedClassPrice(pendingSlot.classPrice);
      setIsBookingModalOpen(true);
      setPendingSlot(null);
    }
  };

  // Use SSE hook for real-time updates with selectedClassId and userId
  const { ticketClasses, isLoading } = useRegisterOnlineSSE(selectedInstructorId, selectedClassId, userId);

  // Effect to handle classId from URL - automatically show calendar if classId is present
  useEffect(() => {
    if (classId) {
      // If we have a classId, we don't need to select instructor manually
      // The calendar should show all instructors' classes for this specific class type
      setSelectedInstructorId("ALL");
      setSelectedClassId(classId);
    }
  }, [classId]);

  // Helper functions
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  // Función para manejar la confirmación de reserva
  const handleConfirm = async () => {
    if (!userId || !selectedTicketClass) {
      if (!userId) {
        setShowLogin(true);
        setIsBookingModalOpen(false);
        return;
      }
      return;
    }

    if (paymentMethod === 'redeem') {
      // REDIMIR: Reservar usando crédito de clase cancelada
      setIsProcessingBooking(true);
      try {
        const res = await fetch('/api/ticketclasses/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketClassId: selectedTicketClass._id,
            studentId: userId, // Usar studentId en lugar de userId
            classId: selectedTicketClass.classInfo?._id,
            date: selectedTicketClass.date,
            start: selectedTicketClass.hour,
            end: selectedTicketClass.endHour,
            paymentMethod: 'redeem' // Indicar que es redención
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to redeem class');
        }

        setIsBookingModalOpen(false);
        setSelectedTicketClass(null);
        setConfirmationMessage('Class redeemed successfully! You have been enrolled.');
        setShowConfirmation(true);
      } catch (error) {
        console.error('❌ Error redeeming class:', error);
        alert(`Error redeeming class: ${error.message || 'Please try again.'}`);
      } finally {
        setIsProcessingBooking(false);
      }
      return;
    }

    if (paymentMethod === 'online') {
      // AGREGAR AL CARRITO: Agregar al carrito y poner en studentRequests
      setIsOnlinePaymentLoading(true);
      try {
        
        // Obtener información de la clase para el precio
        const classInfo = selectedTicketClass.classInfo;
        if (!classInfo) {
          throw new Error('Class information not found');
        }
        
        // Buscar la clase en drivingclasses para obtener el precio
        const classResponse = await fetch(`/api/drivingclasses/${classInfo._id}`);
        if (!classResponse.ok) {
          throw new Error('Failed to fetch class information');
        }
        const classData = await classResponse.json();
        const classPrice = classData.price || 50; // Precio por defecto
        
        // Step 1: Agregar a studentRequests en la ticketclass
        // Usar el nuevo endpoint que hace ambas cosas: reservar slot Y agregar al carrito
        const addToCartRes = await fetch('/api/cart/add-ticket-class', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            ticketClassId: selectedTicketClass._id,
            date: selectedTicketClass.date,
            start: selectedTicketClass.hour,
            end: selectedTicketClass.endHour,
            instructorId: selectedTicketClass.instructorInfo?._id,
            instructorName: selectedTicketClass.instructorInfo?.name,
            amount: classPrice,
            title: classInfo.title
          }),
        });
        
        if (!addToCartRes.ok) {
          const errorData = await addToCartRes.json();
          throw new Error(errorData.error || 'Failed to add ticket class to cart');
        }
        
        
       // IMPORTANTE: Actualizar el contexto del carrito para sincronizar el frontend
        const responseData = await addToCartRes.json();
        if (responseData.cartItem) {
          // Usar el cartItem que viene del endpoint para actualizar el contexto
          addToCart(responseData.cartItem);
        }
        
        setIsBookingModalOpen(false);
        setSelectedTicketClass(null);
        setIsOnlinePaymentLoading(false);
        
        // No mostrar modal de confirmación - simplemente cerrar modal y agregar al carrito silenciosamente
        
      } catch (error) {
        console.error('❌ Error adding to cart:', error);
        setIsOnlinePaymentLoading(false);
        alert(`Error adding to cart: ${error.message || 'Please try again.'}`);
      }
      return;
    }
    
    // PAGO LOCAL: Reservar clase como pending y mostrar modal de contacto
    setIsProcessingBooking(true);
    try {
      const res = await fetch('/api/ticketclasses/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: userId,
          ticketClassId: selectedTicketClass._id,
          classId: selectedTicketClass.classInfo?._id,
          date: selectedTicketClass.date,
          start: selectedTicketClass.hour,
          end: selectedTicketClass.endHour,
          paymentMethod: 'instructor' // Para pago local
        }),
      });
      
      if (res.ok) {
        setIsBookingModalOpen(false);
        setSelectedTicketClass(null);
        setIsProcessingBooking(false);
        setShowContactModal(true);
      } else {
        setIsProcessingBooking(false);
        const errorData = await res.json();
        alert(`Could not reserve the class: ${errorData.error || 'Please try again.'}`);
      }
    } catch {
      setIsProcessingBooking(false);
      alert('Error reserving class. Please try again.');
    }
  };

  const handleDateChange = (value: Date | Date[] | null) => {
    if (!value || Array.isArray(value)) return;
    setSelectedDate(value);
  };

  const handleEnrollClass = async () => {
    if (!selectedTicketClass || !userId) {
      if (!userId) {
        setShowAuthWarning(true);
      }
      return;
    }

    try {
      const response = await fetch('/api/register-online/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketClassId: selectedTicketClass._id,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setConfirmationMessage(`Successfully enrolled in ${selectedTicketClass.classInfo?.title || 'the class'}!`);
        setShowConfirmation(true);
        setIsBookingModalOpen(false);
        setSelectedTicketClass(null);
        // The SSE will automatically update the UI with new enrollment data
      } else {
        setConfirmationMessage(data.error || 'Failed to enroll in class');
        setShowConfirmation(true);
        setIsBookingModalOpen(false);
      }
    } catch (error) {
      console.error('Error enrolling in class:', error);
      setConfirmationMessage('An error occurred while enrolling');
      setShowConfirmation(true);
      setIsBookingModalOpen(false);
    }
  };

  // Check cancellation policy when modal opens (does NOT cancel)
  const checkCancellationPolicy = async () => {
    if (!classToUnbook || !userId) return;

    try {
      const response = await fetch('/api/register-online/check-cancellation-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketClassId: classToUnbook._id,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (data.requiresPayment) {
        setCancellationData({
          ticketClassId: data.ticketClassId,
          userId: data.userId,
          cancellationFee: data.cancellationFee,
          message: data.message,
          requiresPayment: true
        });
      } else {
        setCancellationData({
          ticketClassId: data.ticketClassId,
          userId: data.userId,
          requiresPayment: false
        });
      }
    } catch (error) {
      console.error('Error checking cancellation policy:', error);
    }
  };

  const handleUnbookClass = async () => {
    if (!classToUnbook || !userId) {
      return;
    }

    try {
      // If payment required, create order and redirect to Elavon
      if (cancellationData?.requiresPayment) {
        const orderResponse = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: cancellationData.userId,
            total: cancellationData.cancellationFee,
            orderType: 'ticket_class_cancellation',
            appointments: [{
              ticketClassId: cancellationData.ticketClassId,
              classType: 'ticket_class_cancellation',
              date: classToUnbook?.date,
              start: classToUnbook?.hour,
              end: classToUnbook?.endHour,
              amount: cancellationData.cancellationFee
            }]
          })
        });

        if (!orderResponse.ok) {
          throw new Error('Failed to create cancellation order');
        }

        const orderData = await orderResponse.json();
        const orderId = orderData.order._id || orderData.order.orderNumber;

        // Redirect to Elavon
        const redirectResponse = await fetch(`/api/payments/redirect?userId=${cancellationData.userId}&orderId=${orderId}`);
        const redirectData = await redirectResponse.json();

        if (redirectData.redirectUrl) {
          window.location.href = redirectData.redirectUrl;
        } else {
          throw new Error('No redirect URL received');
        }
        return;
      }

      // Free cancellation
      const response = await fetch('/api/register-online/unbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketClassId: classToUnbook._id,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setConfirmationMessage(`Successfully unenrolled from ${classToUnbook.classInfo?.title || 'the class'}!`);
        setShowConfirmation(true);
        setShowUnbookConfirm(false);
        setClassToUnbook(null);
        setCancellationData(null);
      } else {
        setConfirmationMessage(data.error || 'Failed to unenroll from class');
        setShowConfirmation(true);
        setShowUnbookConfirm(false);
      }
    } catch (error) {
      console.error('Error unenrolling from class:', error);
      setConfirmationMessage('An error occurred while unenrolling');
      setShowConfirmation(true);
      setShowUnbookConfirm(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!requestedTicketClass || !userId) {
      return;
    }

    try {
      const response = await fetch('/api/register-online/cancel-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketClassId: requestedTicketClass._id,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowRequestModal(false);
        setRequestedTicketClass(null);
        setConfirmationMessage('Request cancelled successfully');
        setShowConfirmation(true);
        // The SSE will automatically update the UI
      } else {
        setConfirmationMessage(data.error || 'Failed to cancel request');
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      setConfirmationMessage('An error occurred while cancelling request');
      setShowConfirmation(true);
    }
  };

  const getWeekDates = () => {
    // Start from today's week, then add weekOffset
    const today = new Date();
    const base = new Date(today);
    base.setDate(today.getDate() + weekOffset * 7);
    
    // Get the start of that week (Sunday)
    const startOfWeek = new Date(base);
    startOfWeek.setDate(base.getDate() - base.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const getClassTypeDisplay = (type: string): string => {
    switch (type) {
      case 'A.D.I': return 'A.D.I';
      case 'B.D.I': return 'B.D.I';
      case 'D.A.T.E': return 'D.A.T.E';
      default: return type;
    }
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    return time;
  };


  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch instructors
        const instructorsRes = await fetch('/api/instructors');
        if (instructorsRes.ok) {
          const instructorsData = await instructorsRes.json();
          setInstructors(instructorsData);
        }

        // Fetch classes
        const classesRes = await fetch('/api/classes');
        if (classesRes.ok) {
          const classesData = await classesRes.json();
          setClassList(classesData);
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check cancellation policy when modal opens
  useEffect(() => {
    if (showUnbookConfirm && classToUnbook && userId) {
      checkCancellationPolicy();
    }
  }, [showUnbookConfirm, classToUnbook, userId]);

  // Update selected instructor when instructor ID changes
  useEffect(() => {
    if (selectedInstructorId && instructors.length > 0) {
      const instructor = instructors.find(inst => inst._id === selectedInstructorId);
      setSelectedInstructor(instructor || null);
    } else {
      setSelectedInstructor(null);
    }
  }, [selectedInstructorId, instructors]);

  // Render schedule table (similar to Book Now but for classes)
  const renderScheduleTable = () => {
    const weekDates = getWeekDates();
    
    // Generate 30-minute time blocks from 6:00 to 19:30
    const allTimes: { start: string, end: string }[] = [];
    for (let h = 6; h < 20; h++) {
      allTimes.push({ start: `${pad(h)}:00`, end: `${pad(h)}:30` });
      allTimes.push({ start: `${pad(h)}:30`, end: `${pad(h+1)}:00` });
    }

    // Helper function to convert time to minutes for comparison
    const timeToMinutes = (time: string): number => {
      if (!time || typeof time !== 'string') return 0;
      const [hours, minutes] = time.split(':').map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    };

    // Helper function to check if a time block overlaps with a class
    const doesBlockOverlapWithClass = (blockStart: string, blockEnd: string, classStart: string, classEnd: string): boolean => {
      const blockStartMin = timeToMinutes(blockStart);
      const blockEndMin = timeToMinutes(blockEnd);
      const classStartMin = timeToMinutes(classStart);
      const classEndMin = timeToMinutes(classEnd);
      
      return blockStartMin < classEndMin && blockEndMin > classStartMin;
    };

    // Helper function to check if this is the first block of a class
    const isFirstBlockOfClass = (blockStart: string, classStart: string): boolean => {
      return timeToMinutes(blockStart) === timeToMinutes(classStart);
    };

    return (
      <div id="schedule-table" className="overflow-x-auto w-full mt-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-white text-center">
              <th className="border border-gray-300 p-1 text-black min-w-[70px] w-[70px] text-xs">Time</th>
              {weekDates.map((date) => (
                <th
                  key={date.toDateString()}
                  className="border border-gray-300 p-1 text-black min-w-[80px] w-[80px]"
                >
                  <span className="block font-bold text-black text-xs">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="block text-black text-xs">
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allTimes.map((timeBlock, index) => (
              <tr key={index} className="text-center">
                <td className="border border-gray-300 p-1 font-bold text-black min-w-[70px] w-[70px] text-xs">
                  {timeBlock.start}-{timeBlock.end}
                </td>
                {weekDates.map((date) => {
                  // Find classes for this date
                  const classesForDate = ticketClasses.filter(tc => {
                    if (!tc.date) return false;
                    // Fuerza coincidencia exacta por string YYYY-MM-DD
                    const tcDateString = tc.date.length >= 10 ? tc.date.slice(0, 10) : '';
                    const calendarDateString = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    return tcDateString === calendarDateString;
                  });
                  
                  // Find class that overlaps with this time block
                  const overlappingClass = classesForDate.find(tc => 
                    tc.hour && tc.endHour && 
                    doesBlockOverlapWithClass(timeBlock.start, timeBlock.end, tc.hour, tc.endHour)
                  );
                  
                  if (overlappingClass) {
                    // Check if this is the first block of the class
                    if (isFirstBlockOfClass(timeBlock.start, overlappingClass.hour)) {
                      // Calculate how many 30-minute blocks this class spans
                      const classStartMin = timeToMinutes(overlappingClass.hour);
                      const classEndMin = timeToMinutes(overlappingClass.endHour);
                      const classDurationMin = classEndMin - classStartMin;
                      const rowSpan = Math.ceil(classDurationMin / 30);
                      
                      // FORCE AVAILABLE: Si hay spots disponibles, la clase DEBE estar disponible
                      const hasAvailableSpots = overlappingClass.availableSpots > 0;
                      const isAvailable = hasAvailableSpots || overlappingClass.status === 'available';
                      
                      // Check if current user is enrolled in this class
                      const isUserEnrolled = overlappingClass.students.some(
                        (student: string | { studentId?: string }) =>
                          (typeof student === 'string')
                            ? student === userId
                            : student.studentId === userId || student.studentId?.toString() === userId
                      );

                      // Check if current user has a pending request
                      const hasPendingRequest = overlappingClass.userHasPendingRequest;
                      
                      // User is enrolled - show blue slot with unbook option
                      if (isUserEnrolled) {
                        return (
                          <td
                            key={date.toDateString()}
                            className="border border-gray-300 p-1 cursor-pointer min-w-[80px] w-[80px] bg-blue-500 text-white hover:bg-red-500"
                            rowSpan={rowSpan}
                            onClick={() => {
                              // Show confirmation modal first
                              setClassToUnbook(overlappingClass as TicketClass);
                              setShowUnbookConfirm(true);
                            }}
                            title="Click to unenroll from this class"
                          >
                            <div className="text-xs">
                              Enrolled
                            </div>
                            <div className="text-xs font-bold">
                              {overlappingClass.classInfo?.title || getClassTypeDisplay(overlappingClass.type)}
                            </div>
                          </td>
                        );
                      }
                      
                      // User has pending request - show yellow slot with click to cancel
                      if (hasPendingRequest) {
                        return (
                          <td
                            key={date.toDateString()}
                            className="border border-gray-300 p-1 cursor-pointer min-w-[80px] w-[80px] bg-yellow-100 hover:bg-yellow-200 text-black"
                            rowSpan={rowSpan}
                            title="Click to cancel your pending request"
                            onClick={() => {
                              if (!userId) {
                                setShowLogin(true);
                                return;
                              }
                              // Show the request modal to allow cancellation
                              setRequestedTicketClass(overlappingClass as TicketClass);
                              setShowRequestModal(true);
                            }}
                          >
                            <div className="text-xs">
                              Pending
                            </div>
                            <div className="text-xs font-bold">
                              {overlappingClass.classInfo?.title || getClassTypeDisplay(overlappingClass.type)}
                            </div>
                          </td>
                        );
                      }
                      
                      // Class is available for enrollment
                      if (isAvailable) {
                        return (
                          <td
                            key={date.toDateString()}
                            className="border border-gray-300 p-1 cursor-pointer min-w-[80px] w-[80px] bg-green-100 hover:bg-green-200"
                            rowSpan={rowSpan}
                            onClick={async () => {
                                if (!userId) {
                                  // Obtener precio de la clase antes de mostrar login
                                  let classPrice = 50; // Precio por defecto
                                  try {
                                    const classInfo = overlappingClass.classInfo;
                                    if (classInfo) {
                                      const classResponse = await fetch(`/api/drivingclasses/${classInfo._id}`);
                                      if (classResponse.ok) {
                                        const classData = await classResponse.json();
                                        classPrice = classData.price || 50;
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Error fetching class price:', error);
                                  }
                                  
                                  // Guardar slot pendiente y mostrar login
                                  setPendingSlot({
                                    ticketClass: overlappingClass as TicketClass,
                                    classPrice: classPrice
                                  });
                                  setShowLogin(true);
                                  return;
                                }
                                
                                // Usuario autenticado, proceder normalmente
                                // Get class price before opening modal
                                try {
                                  const classInfo = overlappingClass.classInfo;
                                  if (classInfo) {
                                    const classResponse = await fetch(`/api/drivingclasses/${classInfo._id}`);
                                    if (classResponse.ok) {
                                      const classData = await classResponse.json();
                                      setSelectedClassPrice(classData.price || 50);
                                    } else {
                                      setSelectedClassPrice(50); // Default price
                                    }
                                  } else {
                                    setSelectedClassPrice(50); // Default price
                                  }
                                } catch (error) {
                                  console.error('Error fetching class price:', error);
                                  setSelectedClassPrice(50); // Default price
                                }
                                
                                // Open booking modal for payment selection
                                setSelectedTicketClass(overlappingClass as TicketClass);
                                setIsBookingModalOpen(true);
                              }}
                          >
                            <div className="text-xs text-black">
                              Available
                            </div>
                            <div className="text-xs font-bold text-black">
                              {overlappingClass.classInfo?.title || getClassTypeDisplay(overlappingClass.type)}
                            </div>
                          </td>
                        );
                      }
                      
                      // Class is not available (occupied by other students or not available)
                      return (
                        <td
                          key={date.toDateString()}
                          className="border border-gray-300 p-1 min-w-[80px] w-[80px] bg-gray-100"
                          rowSpan={rowSpan}
                        >
                          <div className="text-xs text-black">
                            Occupied
                          </div>
                          <div className="text-xs font-bold text-black">
                            {overlappingClass.classInfo?.title || getClassTypeDisplay(overlappingClass.type)}
                          </div>
                        </td>
                      );
                    } else {
                      // This row is covered by the rowSpan from above, skip it
                      return null;
                    }
                  } else {
                    // No class in this time slot
                    return (
                      <td
                        key={date.toDateString()}
                        className="border border-gray-300 py-1 bg-white text-black min-w-[80px] w-[80px]"
                      >
                        -
                      </td>
                    );
                  }
                })}
              </tr>
            )).filter(row => row !== null)}
          </tbody>
        </table>
      </div>
    );
  };

  // Loading inicial de pantalla completa
  if (initialLoading) {
    return (
      <section className="bg-white min-h-screen flex flex-col items-center justify-center w-full">
        <div className="text-center p-12 max-w-lg mx-auto">
          <div className="inline-block animate-spin rounded-full h-20 w-20 border-4 border-gray-100 border-t-[#10B981] mb-8 shadow-lg"></div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Loading Register Online</h3>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Please wait while we load all packages and classes for your registration...
          </p>
          <div className="flex justify-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-[#10B981] rounded-full animate-bounce shadow-md"></div>
              <div className="w-3 h-3 bg-[#10B981] rounded-full animate-bounce shadow-md" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-[#10B981] rounded-full animate-bounce shadow-md" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white pt-32 pb-8 px-2 sm:px-6 flex flex-col items-center w-full">
      
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Side - Calendar and Class Types */}
        {classList.length > 0 && (
          <div className="w-full lg:w-1/3 flex flex-col items-center mt-8 sm:mt-12">
            
            {/* Calendar Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 text-[#10B981]">
              Select Date
            </h2>
            
            {/* Calendar */}
            <div className="mb-4 w-full flex justify-center">
              <Calendar
                onChange={(value) => handleDateChange(value as Date | null)}
                value={selectedDate}
                locale="en-US"
                className="border rounded-lg shadow-md w-full max-w-xs p-2"
                minDate={new Date()}
                onClickDay={(date) => {
                  // ALWAYS change week when clicking on calendar
                  
                  // Calculate the start of the week for the clicked date (Sunday = 0)
                  const targetWeekStart = new Date(date);
                  targetWeekStart.setDate(date.getDate() - date.getDay());
                  targetWeekStart.setHours(0, 0, 0, 0);
                  
                  // Calculate the start of TODAY's week for reference
                  const today = new Date();
                  const currentWeekStart = new Date(today);
                  currentWeekStart.setDate(today.getDate() - today.getDay());
                  currentWeekStart.setHours(0, 0, 0, 0);
                  
                  // Calculate the week difference from current week
                  const weekDiff = Math.round((targetWeekStart.getTime() - currentWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
                  
                  
                  // ALWAYS update the week offset - force update
                  setWeekOffset(weekDiff);
                }}
              />
            </div>

            {/* Available Ticket Classes Title */}
            <h3 className="text-lg sm:text-xl font-semibold text-center mb-4 text-gray-700">
              Available Ticket Classes
            </h3>

            {/* Class Types Dropdown */}
            <div className="w-full mb-4">
              <select
                value={selectedClassId || ""}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setSelectedClassId(selectedId);
                  setSelectedInstructorId("ALL"); // Show all instructors for this class
                }}
                className="w-full p-3 border-2 border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-black font-medium"
              >
                <option value="" className="text-black text-sm">Select a ticket class...</option>
                {classList.map((cls) => (
                  <option key={cls._id} value={cls._id} className="text-black text-sm">
                    {cls.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Right Side - Schedule Table */}
        <div className="w-full lg:w-2/3 mt-6 lg:mt-0 flex justify-center">
          {/* Always show schedule - with or without classes */}
          {selectedClassId && (
            <div className="w-full max-w-4xl">
              <div className="flex justify-center">
                <div className="ml-16">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-4 mt-12">
                <span className="text-[#10B981]">Available Classes</span>
              </h2>
              <p className="text-center text-gray-600 mb-6 text-sm">
                Green slots are available for booking.
              </p>
                </div>
              </div>
              
              {/* Always show the schedule table - empty or with classes */}
              <div className="flex justify-center">
                <div className="ml-16">
                  <div className="flex flex-row justify-center items-center mb-8 gap-2 sm:gap-4">
                    <button
                      className="px-3 py-1.5 text-xs sm:text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 font-semibold shadow transition-all duration-200"
                      onClick={() => setWeekOffset(weekOffset - 1)}
                    >
                      ← Previous week
                    </button>
                    <button
                      className="px-3 py-1.5 text-xs sm:text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 font-semibold shadow transition-all duration-200"
                      onClick={() => setWeekOffset(weekOffset + 1)}
                    >
                      Next week →
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto w-full -mt-4">
                    {renderScheduleTable()}
                  </div>
              
              {/* Show message if no classes available */}
              {(!ticketClasses || ticketClasses.length === 0) && (
                <div className="text-center py-4 mt-4">
                  <p className="text-gray-500 text-sm">No classes available for this class type.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      >
        <div className="p-6 text-black">
          <h2 className="text-xl font-bold mb-4">Enroll in Class</h2>
          {selectedTicketClass && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p className="mb-2"><strong>Class Type:</strong> {getClassTypeDisplay(selectedTicketClass.type)}</p>
                <p className="mb-2"><strong>Date:</strong> {formatDateForDisplay(selectedTicketClass.date)}</p>
                <p className="mb-2"><strong>Time:</strong> {formatTime(selectedTicketClass.hour)} - {formatTime(selectedTicketClass.endHour)}</p>
                <p className="mb-2"><strong>Duration:</strong> {selectedTicketClass.duration}</p>
                <p className="mb-2"><strong>Enrolled Students:</strong> {selectedTicketClass.enrolledStudents}/{selectedTicketClass.totalSpots}</p>
                <p className="mb-2"><strong>Instructor:</strong> {selectedInstructor?.name}</p>
              </div>
            </div>
          )}
          <div className="mt-4 flex justify-center gap-3">
            <button
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              onClick={() => setIsBookingModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
              onClick={handleEnrollClass}
            >
              {isLoading ? 'Enrolling...' : 'Confirm Enrollment'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setShowConfirmation(false)}
        >
          <div 
            className="relative bg-white text-black rounded-lg shadow-2xl border border-[#e0e0e0] flex flex-col"
            style={{
              minWidth: '320px',
              maxWidth: '320px',
              width: '320px',
              minHeight: '200px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de cierre */}
            <button
              onClick={() => setShowConfirmation(false)}
              className="absolute top-3 right-3 p-2 z-[9999] transition-all duration-300 bg-red-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600 hover:text-gray-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="p-6 text-center w-full">
              <div className="mb-4 mt-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-4 text-green-600">Enrollment Status</h2>
            <p className="text-gray-700 mb-4">{confirmationMessage}</p>
          </div>
          <button
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
            onClick={() => setShowConfirmation(false)}
          >
            OK
          </button>
        </div>
          </div>
        </div>
      )}

      {showAuthWarning && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setShowAuthWarning(false)}
        >
          <div 
            className="relative bg-white text-black rounded-lg shadow-2xl border border-[#e0e0e0] flex flex-col"
            style={{
              minWidth: '320px',
              maxWidth: '320px',
              width: '320px',
              minHeight: '300px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de cierre */}
            <button
              onClick={() => setShowAuthWarning(false)}
              className="absolute top-3 right-3 p-2 z-[9999] transition-all duration-300 bg-red-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600 hover:text-gray-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="p-6 text-center w-full">
              <div className="mb-4 mt-4">
          <h2 className="text-xl font-bold mb-4 text-red-600">Authentication Required</h2>
          <p className="mb-4">You must be logged in to enroll in a class. Please sign in first.</p>
              </div>
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded"
            onClick={() => setShowAuthWarning(false)}
          >
            Close
          </button>
        </div>
          </div>
        </div>
      )}

      {/* Unified Cancellation Modal */}
      {showUnbookConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => {
            setShowUnbookConfirm(false);
            setCancellationData(null);
          }}
        >
          <div
            className="relative bg-white text-black rounded-lg shadow-2xl border border-[#e0e0e0] flex flex-col"
            style={{
              minWidth: '420px',
              maxWidth: '420px',
              width: '420px',
              minHeight: '350px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de cierre */}
            <button
              onClick={() => {
                setShowUnbookConfirm(false);
                setCancellationData(null);
              }}
              className="absolute top-3 right-3 p-2 z-[9999] transition-all duration-300 bg-red-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600 hover:text-gray-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="p-6 text-black flex flex-col h-full">
              <h2 className="text-xl font-bold mb-4 text-center text-red-600">Cancel Your Class</h2>

              {/* Class Details */}
              {classToUnbook && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm mb-2"><strong>Class:</strong> {classToUnbook.classInfo?.title || getClassTypeDisplay(classToUnbook.type)}</p>
                  <p className="text-sm mb-2"><strong>Date:</strong> {formatDateForDisplay(classToUnbook.date)}</p>
                  <p className="text-sm"><strong>Time:</strong> {formatTime(classToUnbook.hour)} - {formatTime(classToUnbook.endHour)}</p>
                </div>
              )}

              {/* Cancellation Policy Information */}
              {cancellationData === null ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
                  <span className="ml-3 text-gray-600">Checking cancellation policy...</span>
                </div>
              ) : cancellationData.requiresPayment ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <svg className="h-6 w-6 text-orange-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="w-full">
                      <h3 className="text-orange-800 font-semibold mb-1">Cancellation Fee Required</h3>
                      <p className="text-orange-700 text-sm mb-2">
                        Cancellation within 48 hours requires a <strong className="text-orange-900">${cancellationData.cancellationFee}.00 USD</strong> fee
                      </p>
                      <p className="text-orange-600 text-xs">
                        After payment, you'll receive credit to redeem for any future class.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <svg className="h-6 w-6 text-green-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="text-green-800 font-semibold mb-1">Free Cancellation</h3>
                      <p className="text-green-700 text-sm">
                        Your class is more than 48 hours away. You can cancel without any charges and receive credit for a future class.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-gray-600 text-sm text-center mb-4">
                {cancellationData?.requiresPayment
                  ? `You will be charged $${cancellationData.cancellationFee}.00 to cancel this class.`
                  : 'Are you sure you want to cancel this class?'
                }
              </p>

              {/* Action Buttons */}
              <div className="mt-auto flex justify-between gap-3">
                <button
                  className="flex-1 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium text-sm"
                  onClick={() => {
                    setShowUnbookConfirm(false);
                    setCancellationData(null);
                  }}
                  disabled={cancellationData === null}
                >
                  Keep Class
                </button>
                <button
                  className={`flex-1 px-6 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                    cancellationData === null
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : cancellationData.requiresPayment
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                  disabled={cancellationData === null}
                  onClick={handleUnbookClass}
                >
                  {cancellationData?.requiresPayment ? 'Pay & Cancel' : 'Yes, Cancel Class'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Confirmation Modal */}
      {showRequestModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setShowRequestModal(false)}
        >
                      <div 
              className="relative bg-white text-black rounded-lg shadow-2xl border border-[#e0e0e0] flex flex-col"
              style={{
                minWidth: '320px',
                maxWidth: '320px',
                width: '320px',
                minHeight: '300px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón de cierre */}
              <button
                onClick={() => setShowRequestModal(false)}
                className="absolute top-3 right-3 p-2 z-[9999] transition-all duration-300 bg-red-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-600 hover:text-gray-900"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="p-6 text-center w-full">
                <div className="mb-4 mt-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
                  <h2 className="text-lg font-semibold mb-3 text-green-600">Request Submitted Successfully!</h2>
          </div>
          
          {requestedTicketClass && (
                <div className="bg-green-50 p-3 rounded mb-3 text-left text-sm">
                  <p className="mb-1"><strong>Class:</strong> {requestedTicketClass.classInfo?.title || getClassTypeDisplay(requestedTicketClass.type)}</p>
                  <p className="mb-1"><strong>Date:</strong> {formatDateForDisplay(requestedTicketClass.date)}</p>
                  <p className="mb-1"><strong>Time:</strong> {formatTime(requestedTicketClass.hour)} - {formatTime(requestedTicketClass.endHour)}</p>
            </div>
          )}
          
              <div className="bg-blue-50 p-3 rounded mb-4">
                <p className="text-blue-800 text-sm font-medium mb-1">To complete enrollment, contact:</p>
                <p className="text-lg font-bold text-blue-900">(561) 330-7007</p>
          </div>
          
              <p className="text-gray-600 mb-4 text-sm">Your request is pending approval. Our team will contact you soon.</p>
          
              <div className="flex justify-center gap-2">
            <button
                  className="bg-red-500 text-white px-4 py-1.5 rounded text-sm hover:bg-red-600"
              onClick={handleCancelRequest}
            >
              Cancel Request
            </button>
            <button
                  className="bg-green-500 text-white px-4 py-1.5 rounded text-sm hover:bg-green-600"
              onClick={() => setShowRequestModal(false)}
            >
              OK
            </button>
          </div>
        </div>
          </div>
        </div>
      )}
      
      {/* Ticket Class Booking Modal */}
      <TicketClassBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedClassPrice(null);
        }}
        selectedTicketClass={selectedTicketClass}
        classPrice={selectedClassPrice}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        isOnlinePaymentLoading={isOnlinePaymentLoading}
        isProcessingBooking={isProcessingBooking}
        onConfirm={handleConfirm}
        userId={userId}
      />
      
      {/* Modal de contacto para pago local */}
      <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)}>
        <div className="p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-green-600">Class Reserved Successfully!</h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-4 text-left">
              <p className="text-sm text-gray-600 mb-2">Your class has been reserved:</p>
              <p><strong>Status:</strong> <span className="text-orange-600">Pending Payment</span></p>
              <p><strong>Next Step:</strong> Contact us to complete your payment</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">📞 Contact Information</h3>
              <p className="text-yellow-700 text-lg font-bold">Call us at: (561) 330-7007</p>
              <p className="text-yellow-600 text-sm mt-2">
                Please call to complete your payment and confirm your class enrollment.
              </p>
            </div>
            <p className="text-gray-600 text-sm">
              Your spot will be held temporarily. Please contact us within 24 hours to complete the payment, 
              or the spot may become available to other students.
            </p>
          </div>
          <button
            className="bg-green-500 text-white px-8 py-3 rounded hover:bg-green-600 font-semibold"
            onClick={() => setShowContactModal(false)}
          >
            Got it!
          </button>
        </div>
      </Modal>
      
      <LoginModal
        open={showLogin}
        onClose={() => {
          setShowLogin(false);
          setPendingSlot(null);
        }}
        onLoginSuccess={handleLoginSuccess}
      />

    </section>
  );
}

// Main component with Suspense wrapper
export default function RegisterOnlinePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <RegisterOnlineContent />
    </Suspense>
  );
}
