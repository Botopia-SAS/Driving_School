"use client";

import React, { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "@/globals.css";
import Modal from "@/components/Modal";
import BookingModal from "@/components/BookingModal";
import Image from "next/image";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/app/context/CartContext";
import LoginModal from "@/components/LoginModal";
import { useDrivingTestSSE } from "@/hooks/useDrivingTestSSE";
import { useRouter } from "next/navigation";

// Google Maps configuration - removed as not needed for driving test

interface Slot {
  _id: string;
  start: string;
  end: string;
  status: 'free' | 'scheduled' | 'cancelled' | 'available' | 'pending' | 'booked';
  studentId?: string;
  booked?: boolean;
  classType?: string;
  amount?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
}

interface SlotWithDate extends Slot {
  date: string;
}

interface Instructor {
  _id: string;
  name: string;
  photo?: string;
  schedule?: Schedule[];
}

interface InstructorWithSchedule extends Instructor {
  schedule: Schedule[];
}

interface Schedule {
  date: string;
  slots: Slot[];
}

interface Location {
  _id?: string;
  title: string;
  zone: string;
  instructors: Instructor[];
}

interface AvailableClass {
  instructorId: string;
  instructorName: string;
  instructorPhoto: string;
  date: string;
  start: string;
  end: string;
  status: string;
  classType: string;
  slotId: string;
  amount?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
}

export default function BookNowPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);

  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorWithSchedule | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([]); // Used for API data management
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingClasses, setIsLoadingClasses] = useState(false); // Used in location selection flow
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  const { user, setUser } = useAuth();
  const { addToCart, cart } = useCart();
  const userId = user?._id || "";

  // Function to check if a slot is already in the cart
  const isSlotInCart = (instructorId: string, date: string, start: string, end: string) => {
    return cart.some(item => 
      item.classType === 'driving test' &&
      item.instructorId === instructorId &&
      item.date === date &&
      item.start === start &&
      item.end === end
    );
  };

  const [weekOffset, setWeekOffset] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ 
    start: string, 
    end: string, 
    date: string,
    amount?: number,
    instructorName?: string,
    instructorId?: string
  } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage] = useState("");
  const [showCancellation, setShowCancellation] = useState(false);
  const [cancellationMessage, setCancellationMessage] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [slotToCancel, setSlotToCancel] = useState<{
    dateString: string;
    slot: Slot;
  } | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Función para manejar el login exitoso
  const handleLoginSuccess = (user: { _id: string; name: string; email: string; photo?: string | null; type?: 'student' | 'instructor' }) => {
    setShowLogin(false);
    // Actualizar el contexto de autenticación
    setUser(user);
    // Si hay un slot pendiente, abrir el modal de reserva
    if (pendingSlot) {
      setSelectedSlot(pendingSlot);
      setIsBookingModalOpen(true);
      setPendingSlot(null); // Limpiar el slot pendiente
    }
  };

  // Use SSE hook instead of polling
  const { schedule: sseSchedule, error: sseError, isConnected, isReady, forceRefresh } = useDrivingTestSSE(selectedInstructorId);


  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch("/api/locations");
        if (!res.ok) {
          throw new Error(
            `Error fetching locations: ${res.statusText} (${res.status})`
          );
        }
        const data = await res.json();
        setLocations(data);
      } catch (error) {
        console.error("❌ Error loading locations:", error);
      } finally {
        setInitialLoading(false);
      }
    }
    fetchLocations();
  }, []);

  // Process SSE schedule data
  useEffect(() => {
    if (!selectedInstructorId) {
      setIsLoadingSchedule(false);
      return;
    }

    if (!isReady || !sseSchedule) {
      setIsLoadingSchedule(true);
      return;
    }
    
    
    // Los datos de schedule_driving_test ya son de tipo "driving test", no necesitamos filtrar
    const scheduleSlots = Array.isArray(sseSchedule) ? sseSchedule as SlotWithDate[] : [];
    
    
    const groupedSchedule: Schedule[] = Object.values(
      scheduleSlots.reduce((acc, curr) => {
        if (!acc[curr.date]) acc[curr.date] = { date: curr.date, slots: [] };
        acc[curr.date].slots.push({
          start: curr.start,
          end: curr.end,
          status: curr.status, // Mantener el status original
          studentId: curr.studentId,
          booked: curr.booked,
          classType: curr.classType || "driving test",
          _id: curr._id,
          amount: curr.amount,
          pickupLocation: curr.pickupLocation,
          dropoffLocation: curr.dropoffLocation,
        });
        return acc;
      }, {} as Record<string, { date: string; slots: Slot[] }>)
    );
    
    
    // Busca el instructor base por ID
    const base = instructors.find(i => i._id === selectedInstructorId);
    
    if (base) {
      setSelectedInstructor({ ...base, schedule: groupedSchedule });
      setIsLoadingSchedule(false);
    } else {
      setIsLoadingSchedule(false);
    }
  }, [sseSchedule, selectedInstructorId, instructors, isReady]);

  useEffect(() => {
    if (
      selectedInstructor &&
      selectedInstructor.schedule &&
      selectedInstructor.schedule.length > 0
    ) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const availableDates = selectedInstructor.schedule.map(s => s.date);
      const selectedDateStr = selectedDate
        ? `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`
        : null;
      const firstAvailableDate = selectedInstructor.schedule[0].date;
      if (!selectedDateStr || !availableDates.includes(selectedDateStr)) {
        // Solo actualiza si la fecha es diferente
        if (!selectedDateStr || selectedDateStr !== firstAvailableDate) {
          setSelectedDate(new Date(firstAvailableDate));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstructor]);

  // Función para actualizar clases disponibles cuando cambie la semana
  const updateAvailableClasses = useCallback(async () => {
    if (selectedLocation?._id) {
      setIsLoadingClasses(true);
      try {
        const response = await fetch(`/api/driving-test/available-classes?locationId=${selectedLocation._id}&weekOffset=${weekOffset}`);
        const data = await response.json();
        
        if (data.success) {
          setAvailableClasses(data.availableClasses);
        } else {
          setAvailableClasses([]);
        }
      } catch {
        setAvailableClasses([]);
      }
      setIsLoadingClasses(false);
    }
  }, [selectedLocation, weekOffset]);

  // useEffect para actualizar clases cuando cambie weekOffset
  useEffect(() => {
    updateAvailableClasses();
  }, [updateAvailableClasses]);

  const handleSelectLocation = async (location: Location) => {
    
    setIsLoadingClasses(true);
    setSelectedLocation(location);
    setInstructors(location.instructors);
    setSelectedInstructor(null);
    setSelectedInstructorId(null);
    setIsLoadingSchedule(false);
    setIsModalOpen(false);
    
    // Obtener clases disponibles para esta ubicación  
    if (location._id) {
      try {
        const response = await fetch(`/api/driving-test/available-classes?locationId=${location._id}&weekOffset=${weekOffset}`);
        const data = await response.json();
        
        if (data.success) {
          setAvailableClasses(data.availableClasses);
          setInstructors(data.instructors);
          
          // Seleccionar automáticamente el primer instructor
          if (data.instructors && data.instructors.length > 0) {
            const firstInstructor = data.instructors[0];
            setIsLoadingSchedule(true);
            
            // Small delay to prevent rapid connection changes
            setTimeout(() => {
              setSelectedInstructorId(firstInstructor._id);
              setSelectedInstructor(null);
              setSelectedDate(null);
            }, 100);
          }
        } else {
          setAvailableClasses([]);
        }
      } catch {
        setAvailableClasses([]);
      }
    }
    
    setIsLoadingClasses(false);
    
    // Navigate to Book-Now page if not already there
    if (window.location.pathname !== '/Book-Now') {
      router.push('/Book-Now');
    }
  };

  const handleDateChange = (value: Date | Date[] | null) => {
    if (!value || Array.isArray(value)) return;
    
    
    // When a specific date is selected, reset weekOffset to 0
    // This way getWeekDates will show the week containing the selected date
    setSelectedDate(value);
    setWeekOffset(0);
  };

  const getWeekDates = (baseDate: Date) => {
    // Use the provided date as the reference point
    const referenceDate = new Date(baseDate);
    
    // Calculate the start of the week for the reference date (Sunday = 0)
    const startOfWeek = new Date(referenceDate);
    startOfWeek.setDate(referenceDate.getDate() - referenceDate.getDay());
    
    // Apply weekOffset to navigate weeks
    startOfWeek.setDate(startOfWeek.getDate() + weekOffset * 7);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  const renderScheduleTable = () => {

    if (!selectedInstructor || !selectedInstructor.schedule) {
    if (isLoadingSchedule && selectedInstructorId) {
        // Show skeleton table while loading
      return (
        <div className="overflow-x-auto w-full mt-6">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100 text-center">
                  <th className="border border-gray-300 p-1 text-black min-w-[70px] w-[70px] text-xs">Time</th>
                  {getWeekDates(selectedDate || new Date()).map((date) => {
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    return (
                      <th
                        key={date.toDateString()}
                        className="border border-gray-300 p-1 text-black min-w-[80px] w-[80px]"
                      >
                        <span className="block font-bold text-black text-xs">
                          {dayNames[date.getDay()]}
                        </span>
                        <span className="block text-black text-xs">
                          {date.toLocaleDateString('en-US', { month: 'short' })} {date.getDate()}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 28 }, (_, i) => (
                  <tr key={i}>
                    <td className="border border-gray-300 p-1 text-center text-xs bg-gray-50">
                      {Math.floor(i/2) + 6}:{i % 2 === 0 ? '00' : '30'}
                    </td>
                    {Array.from({ length: 7 }, (_, j) => (
                      <td key={j} className="border border-gray-300 p-1">
                        <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      );
    }

      return (
        <div className="text-center mt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">No driving test slots available for this instructor.</p>
            <p className="text-yellow-600 text-sm mt-1">Please select another instructor or check back later.</p>
          </div>
        </div>
      );
    }

    const weekDates = getWeekDates(selectedDate || new Date());
    
    // Generar bloques de 30 minutos
    const allTimes: { start: string, end: string }[] = [];
    for (let h = 6; h < 20; h++) {
      allTimes.push({ start: `${pad(h)}:00`, end: `${pad(h)}:30` });
      allTimes.push({ start: `${pad(h)}:30`, end: `${pad(h+1)}:00` });
    }
    
    return (
      <div className="overflow-x-auto w-full mt-6">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="border border-gray-300 p-1 text-black min-w-[70px] w-[70px] text-xs">Time</th>
              {weekDates.map((date) => {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return (
                  <th
                    key={date.toDateString()}
                    className="border border-gray-300 p-1 text-black min-w-[80px] w-[80px]"
                  >
                    <span className="block font-bold text-black text-xs">
                      {dayNames[date.getDay()]}
                    </span>
                    <span className="block text-black text-xs">
                      {date.toLocaleDateString('en-US', { month: 'short' })} {date.getDate()}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {allTimes.map((block, index) => {
              // Para cada fila, necesitamos verificar qué celdas mostrar
              const isRowStart = (dateString: string, slot: Slot) => {
                const toMinutes = (time: string) => {
                  const [hours, minutes] = time.split(':').map(Number);
                  return hours * 60 + minutes;
                };
                const slotStartMin = toMinutes(slot.start);
                const blockStartMin = toMinutes(block.start);
                return slotStartMin === blockStartMin;
              };

              // SIEMPRE renderizar todas las filas para evitar espacios vacíos
              return (
                <tr key={index} className="text-center">
                  <td className="border border-gray-300 p-1 font-bold text-black min-w-[70px] w-[70px] text-xs">{`${block.start}-${block.end}`}</td>
                  {weekDates.map((date) => {
                    const dateString = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
                    const sched = selectedInstructor.schedule?.find(s => s.date === dateString);
                    let slot: Slot | null = null;
                    
                    if (sched && Array.isArray(sched.slots)) {
                      slot = sched.slots.find(s => {
                        const toMinutes = (time: string) => {
                          const [hours, minutes] = time.split(':').map(Number);
                          return hours * 60 + minutes;
                        };
                        
                        const slotStartMin = toMinutes(s.start);
                        const slotEndMin = toMinutes(s.end);
                        const blockStartMin = toMinutes(block.start);
                        
                        return blockStartMin >= slotStartMin && blockStartMin < slotEndMin;
                      }) ?? null;
                    }
                    
                    // Filter out slots that should be hidden (cancelled, other students' bookings)
                    if (slot && (
                      slot.status === 'cancelled' || 
                      (slot.studentId && 
                       (slot.status === 'booked' || slot.status === 'scheduled' || slot.status === 'pending' || slot.booked) &&
                       (!userId || slot.studentId.toString() !== userId))
                    )) {
                      slot = null; // Treat as if there's no slot, so it shows "-"
                    }
                    
                    if (slot && isRowStart(dateString, slot)) {
                      // Calcular cuántos bloques abarca este slot
                      const toMinutes = (time: string) => {
                        const [hours, minutes] = time.split(':').map(Number);
                        return hours * 60 + minutes;
                      };
                      
                      const slotStartMin = toMinutes(slot.start);
                      const slotEndMin = toMinutes(slot.end);
                      const slotDurationMin = slotEndMin - slotStartMin;
                      const rowSpan = Math.ceil(slotDurationMin / 30);
                      
                      // Slot disponible para reservar
                      if ((slot.status === 'free' || slot.status === 'available') && !slot.booked) {
                        // Check if this slot is already in the cart
                        const slotInCart = isSlotInCart(selectedInstructor?._id || '', dateString, slot.start, slot.end);
                        
                        return (
                          <td key={date.toDateString()} 
                              rowSpan={rowSpan}
                              className={`border border-gray-300 py-1 font-bold min-w-[80px] w-[80px] ${
                                slotInCart 
                                  ? 'bg-orange-200 text-orange-800 cursor-not-allowed' 
                                  : 'bg-green-200 text-black cursor-pointer hover:bg-green-300'
                              }`}
                              onClick={() => {
                                // Don't allow clicking if slot is already in cart
                                if (slotInCart) {
                                  return;
                                }
                                
                                const slotData = { 
                                  start: slot.start, 
                                  end: slot.end, 
                                  date: dateString,
                                  amount: slot.amount,
                                  instructorName: selectedInstructor?.name,
                                  instructorId: selectedInstructor?._id
                                };
                                
                                if (!userId) {
                                  setPendingSlot(slotData);
                                  setShowLogin(true);
                                  return;
                                }
                                
                                setSelectedSlot(slotData);
                                setIsBookingModalOpen(true);
                              }}
                          >
                            <div className="text-xs">{slotInCart ? 'In Cart' : 'Available'}</div>
                            <div className={`text-xs font-bold ${slotInCart ? 'text-orange-700' : 'text-green-700'}`}>${slot.amount || 50}</div>
                          </td>
                        );
                      }
                      // Slot pendiente del usuario actual
                      if (slot.status === 'pending' && slot.studentId && userId && slot.studentId.toString() === userId) {
                        return (
                          <td key={date.toDateString()} 
                              rowSpan={rowSpan}
                              className="border border-gray-300 py-1 bg-orange-200 text-orange-800 font-bold cursor-pointer hover:bg-red-300 min-w-[80px] w-[80px]"
                              onClick={() => {
                                setSlotToCancel({ dateString, slot });
                                setShowCancelConfirm(true);
                              }}
                              title="Click to cancel pending request"
                          >
                            <div className="text-xs">Your Pending</div>
                            <div className="text-xs font-bold">${slot.amount || 50}</div>
                          </td>
                        );
                      }
                      // Slot reservado/booked del usuario actual
                      if ((slot.status === 'scheduled' || slot.status === 'booked' || slot.booked) && slot.studentId && userId && slot.studentId.toString() === userId) {
                        return (
                          <td key={date.toDateString()} 
                              rowSpan={rowSpan}
                              className="border border-gray-300 py-1 bg-blue-500 text-white font-bold cursor-not-allowed min-w-[80px] w-[80px]"
                              title="This is your booking - already reserved"
                          >
                            <div className="text-xs">Your Booking</div>
                            <div className="text-xs font-bold">${slot.amount || 50}</div>
                          </td>
                        );
                      }
                      // REMOVED: Slots from other students and cancelled slots - they are filtered out above
                      // If we reach here and there's a slot but none of the above conditions match,
                      // treat it as empty and show "-"
                      // This handles slots that exist but don't match any booking conditions
                      return (
                        <td key={date.toDateString()} className="border border-gray-300 py-1 bg-gray-50 text-black min-w-[80px] w-[80px]">-</td>
                      );
                    } else if (slot) {
                      // Este bloque está cubierto por un slot que ya fue renderizado
                      return <React.Fragment key={date.toDateString()}></React.Fragment>;
                    }
                    
                    // SIEMPRE mostrar algo - si no hay slot, mostrar '-'
                    return (
                      <td key={date.toDateString()} className="border border-gray-300 py-1 bg-gray-50 text-black min-w-[80px] w-[80px]">-</td>
                    );
                  })}
                </tr>
              );
            }).filter(row => row !== null)}
          </tbody>
        </table>
      </div>
    );
  };
  

  // Estado para controlar el modal de reserva y el slot seleccionado
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ 
    start: string, 
    end: string, 
    date: string,
    amount?: number,
    instructorName?: string,
    instructorId?: string
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'instructor'>('online');
  
  // Estados para el flujo de pago local
  const [showContactModal, setShowContactModal] = useState(false);
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);

  // Modal de reserva con confirmación
  const renderBookingModal = () => {
    const handleConfirm = async () => {
              if (!userId) {
                setShowLogin(true);
                setIsBookingModalOpen(false);
                return;
              }
              if (!selectedSlot?.instructorId || !selectedSlot) return;
              
              if (paymentMethod === 'online') {
        // PAGO ONLINE: Agregar al carrito directamente y marcar slot como pending
                try {
          
          // Step 1: Add to cart with appointment details - this will mark slot as pending automatically
          const cartRes = await fetch('/api/cart/add-driving-test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
            userId,
              instructorId: selectedSlot.instructorId,
              date: selectedSlot.date,
              start: selectedSlot.start,
              end: selectedSlot.end,
                      classType: 'driving test',
              amount: selectedSlot.amount || 50,
              paymentMethod: 'online' // Para pago online
                    }),
                  });
                  
          if (!cartRes.ok) {
            const errorData = await cartRes.json();
            throw new Error(errorData.error || 'Failed to add to cart');
          }

          await cartRes.json();

          // Force refresh SSE to update calendar immediately
          if (forceRefresh) {
            forceRefresh();
          }

          // Step 2: Add to local cart context
          await addToCart({
            id: `driving_test_${selectedSlot.instructorId}_${selectedSlot.date}_${selectedSlot.start}`,
            title: 'Driving Test',
            price: selectedSlot.amount || 50,
            quantity: 1,
                      instructorId: selectedSlot.instructorId,
            instructorName: selectedInstructor?.name || 'Unknown Instructor',
                      date: selectedSlot.date,
                      start: selectedSlot.start,
                      end: selectedSlot.end,
            classType: 'driving test'
          });

                    setIsBookingModalOpen(false);
                    setSelectedSlot(null);
          
          // No need to show confirmation modal - item is added to cart silently
            
              } catch (error) {
          console.error('❌ Error adding driving test to cart:', error);
          alert(`Error adding to cart: ${error.message || 'Please try again.'}`);
                }
                return;
              }
              
              // PAGO LOCAL: Reservar slot como pending y mostrar modal de contacto
              setIsProcessingBooking(true);
              try {
                const res = await fetch('/api/booking/reserve-pending', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    studentId: userId,
                    instructorId: selectedSlot.instructorId,
                    date: selectedSlot.date,
                    start: selectedSlot.start,
                    end: selectedSlot.end,
                    classType: 'driving test',
                    amount: selectedSlot.amount || 50,
                    paymentMethod: 'local' // Para pago local
                  }),
                });
                
                if (res.ok) {
                  setIsBookingModalOpen(false);
                  setSelectedSlot(null);
                  setIsProcessingBooking(false);
                  
                  // Force refresh SSE to update calendar immediately
                  if (forceRefresh) {
                    forceRefresh();
                  }
                  
                  setShowContactModal(true);
                } else {
                  setIsProcessingBooking(false);
                  const errorData = await res.json();
                  alert(`Could not reserve the slot: ${errorData.error || 'Please try again.'}`);
                }
              } catch {
                setIsProcessingBooking(false);
                alert('Error reserving appointment. Please try again.');
              }
    };

    return (
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedSlot={selectedSlot}
        selectedInstructor={selectedInstructor}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        isProcessingBooking={isProcessingBooking}
        onConfirm={handleConfirm}
      />
    );
  };

  // Loading inicial de pantalla completa
  if (initialLoading) {
    return (
      <section className="bg-white min-h-screen flex flex-col items-center justify-center w-full">
        <div className="text-center p-12 max-w-lg mx-auto">
          <div className="inline-block animate-spin rounded-full h-20 w-20 border-4 border-gray-100 border-t-[#10B981] mb-8 shadow-lg"></div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Loading Book Now</h3>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Please wait while we load all instructors and schedules...
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
      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        router.push('/driving_test');
      }}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Choose a Location for Driving Test
          </h2>
          <div className="flex flex-col space-y-2">
            {locations.length > 0 ? (
              locations.map((location, index) => (
                <button
                  key={location.zone || index}
                  onClick={() => handleSelectLocation(location)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-md transition-all font-medium"
                >
                  Book in {location.zone}
                </button>
              ))
            ) : (
              <p className="text-center text-gray-500">Loading locations...</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Initial Layout - Calendar and Instructors */}
      {!selectedInstructorId && selectedLocation && (
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 items-start">
          {/* Calendar and instructors column */}
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
                  // Use the handleDateChange function to update both date and week offset
                  handleDateChange(date);
                }}
              />
            </div>
            
            {/* Available Instructors Title */}
            <h3 className="text-lg sm:text-xl font-semibold text-center mb-4 text-black">
              Available Instructors
            </h3>
            
            {/* Instructors Grid - Improved Design */}
            <div className="flex flex-wrap gap-4 justify-center">
              {instructors.map((inst) => {
                const [firstName, ...lastNameParts] = inst.name.split(' ');
                const lastName = lastNameParts.join(' ');
                const isSelected = selectedInstructor?._id === inst._id;
                const isLoadingThis = isLoadingSchedule && selectedInstructorId === inst._id;
                return (
                  <div
                    key={inst._id}
                    className={`border-2 rounded-lg p-3 text-center bg-white shadow-lg cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl hover:scale-105 w-[110px] relative ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setIsLoadingSchedule(true);
                      setSelectedInstructorId(inst._id);
                    }}
                  >
                    {isLoadingThis && (
                      <div className="absolute inset-0 bg-blue-100 bg-opacity-90 rounded-lg flex items-center justify-center z-10">
                        <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                    )}
                    <div className="relative mb-2">
                    <Image
                      src={inst.photo || "/default-avatar.png"}
                      alt={inst.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full mx-auto object-cover border border-white shadow-md"
                      />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white text-xs font-bold">✓</span>
                    </div>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm text-gray-800 truncate mb-1 capitalize">{firstName}</h4>
                    <div className="text-xs text-gray-600 truncate">{lastName}</div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Message to select instructor */}
          <div className="w-full lg:w-2/3 mt-6 lg:mt-0 flex items-center justify-center">
            <div className="text-center py-16">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
                <span className="text-[#10B981]">Select an Instructor</span>
              </h2>
              <p className="text-gray-600 text-lg">
                Please select an instructor to view their available driving test appointments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Schedule View - Show when instructor is selected */}
      {selectedInstructorId && (
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 items-start">
          {/* Calendar and instructors column */}
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
                  // Use the handleDateChange function to update both date and week offset
                  handleDateChange(date);
                }}
              />
            </div>
            
            {/* Available Instructors Title */}
            <h3 className="text-lg sm:text-xl font-semibold text-center mb-4 text-black">
              Available Instructors
            </h3>
            
            {/* Instructors Grid - Improved Design */}
            <div className="flex flex-wrap gap-4 justify-center">
              {instructors.map((inst) => {
                const [firstName, ...lastNameParts] = inst.name.split(' ');
                const lastName = lastNameParts.join(' ');
                const isSelected = selectedInstructor?._id === inst._id;
                const isLoadingThis = isLoadingSchedule && selectedInstructorId === inst._id;
                return (
                  <div
                    key={inst._id}
                    className={`border-2 rounded-lg p-3 text-center bg-white shadow-lg cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl hover:scale-105 w-[110px] relative ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setIsLoadingSchedule(true);
                      setSelectedInstructorId(inst._id);
                    }}
                  >
                    {isLoadingThis && (
                      <div className="absolute inset-0 bg-blue-100 bg-opacity-90 rounded-lg flex items-center justify-center z-10">
                        <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                    )}
                    <div className="relative mb-2">
                    <Image
                      src={inst.photo || "/default-avatar.png"}
                      alt={inst.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full mx-auto object-cover border border-white shadow-md"
                      />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white text-xs font-bold">✓</span>
                    </div>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm text-gray-800 truncate mb-1 capitalize">{firstName}</h4>
                    <div className="text-xs text-gray-600 truncate">{lastName}</div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Schedule table column */}
          <div className="w-full lg:w-2/3 mt-6 lg:mt-0">

            {selectedInstructorId && (
              <>
                {/* Schedule Title - Moved to the right */}
                <div className="flex justify-center">
                  <div className="ml-16">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-4 mt-12">
                      <span className="text-blue-700">
                        {selectedInstructor ? selectedInstructor.name : 'Loading...'}&apos;s 
                      </span>
                  <span className="text-[#10B981]">Driving Test Schedule</span>
                </h2>
                <p className="text-center text-gray-600 mb-6 text-sm">
                  Showing only driving test appointments. Green slots are available for booking.
                </p>
                  </div>
                </div>
                
                {/* Week Navigation Buttons */}
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
                
                {/* Schedule Table */}
                <div className="overflow-x-auto w-full -mt-4 relative">
                  {renderScheduleTable()}
                  {isLoadingSchedule && selectedInstructorId && (
                    <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-blue-600 text-sm font-medium">Updating schedule...</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {renderBookingModal()}
      
      {/* Modal de contacto para pago local */}
      <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)}>
        <div className="p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-green-600">Slot Reserved Successfully!</h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-4 text-left">
              <p className="text-sm text-gray-600 mb-2">Your driving test appointment has been reserved:</p>
              <p><strong>Status:</strong> <span className="text-orange-600">Pending Payment</span></p>
              <p><strong>Next Step:</strong> Contact us to complete your payment</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">📞 Contact Information</h3>
              <p className="text-yellow-700 text-lg font-bold">Call us at: (561) 330-7007</p>
              <p className="text-yellow-600 text-sm mt-2">
                Please call to complete your payment and confirm your driving test appointment.
              </p>
            </div>
            <p className="text-gray-600 text-sm">
              Your slot will be held temporarily. Please contact us within 24 hours to complete the payment, 
              or the slot may become available to other students.
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
      
      {/* Modal de confirmación */}
      <Modal isOpen={showConfirmation} onClose={() => setShowConfirmation(false)}>
        <div className="p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-4 text-green-600">Booking Confirmed!</h2>
            <p className="text-gray-700 mb-4">{confirmationMessage}</p>
          </div>
          <button
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
            onClick={() => setShowConfirmation(false)}
          >
            OK
          </button>
        </div>
      </Modal>
      
      {/* Modal de cancelación */}
      <Modal isOpen={showCancellation} onClose={() => setShowCancellation(false)}>
        <div className="p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-4 text-orange-600">Booking Status</h2>
            <p className="text-gray-700 mb-4">{cancellationMessage}</p>
          </div>
          <button
            className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
            onClick={() => setShowCancellation(false)}
          >
            OK
          </button>
        </div>
      </Modal>
      
      {/* Modal de confirmación de cancelación */}
      <Modal isOpen={showCancelConfirm} onClose={() => setShowCancelConfirm(false)}>
        <div className="p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-4 text-red-600">Cancel Booking</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to cancel this booking?
            </p>
            {slotToCancel && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
                <p><strong>Date:</strong> {slotToCancel.dateString}</p>
                <p><strong>Time:</strong> {slotToCancel.slot.start} - {slotToCancel.slot.end}</p>
                <p><strong>Amount:</strong> ${slotToCancel.slot.amount || 100}</p>
              </div>
            )}
            <p className="text-sm text-gray-500">The slot will become available for other students.</p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              onClick={() => {
                setShowCancelConfirm(false);
                setSlotToCancel(null);
              }}
            >
              Keep Booking
            </button>
            <button
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
              onClick={async () => {
                if (slotToCancel && selectedInstructor) {
                  try {
                    
                    const res = await fetch('/api/booking/cancel', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        studentId: userId,
                        instructorId: selectedInstructor._id,
                        date: slotToCancel.dateString,
                        start: slotToCancel.slot.start,
                        end: slotToCancel.slot.end,
                        slotId: slotToCancel.slot._id,
                        classType: 'driving test'
                      }),
                    });
                    
                    setShowCancelConfirm(false);
                    setSlotToCancel(null);
                    
                    if (res.ok) {
                      await res.json();
                      
                      // Force refresh SSE to update calendar immediately
                      if (forceRefresh) {
                        forceRefresh();
                      }
                      
                      setCancellationMessage('Booking cancelled successfully. The slot is now available again.');
                      setShowCancellation(true);
                    } else {
                      const errorData = await res.json();
                      setCancellationMessage(`Could not cancel the booking: ${errorData.error || 'Please try again.'}`);
                      setShowCancellation(true);
                    }
                  } catch {
                    setCancellationMessage('Error cancelling booking. Please try again.');
                    setShowCancellation(true);
                  }
                }
              }}
            >
              Yes, Cancel Booking
            </button>
          </div>
        </div>
      </Modal>
      
      <LoginModal
        open={showLogin}
        onClose={() => {
          setShowLogin(false);
          setPendingSlot(null); // Limpiar el slot pendiente si se cierra sin login
        }}
        onLoginSuccess={handleLoginSuccess}
      />
    </section>
  );
}