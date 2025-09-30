"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import "@/globals.css";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/app/context/CartContext";
import LoginModal from "@/components/LoginModal";
import Modal from "@/components/Modal";
import { useAllDrivingLessonsSSE } from "../../hooks/useAllDrivingLessonsSSE";

// Import our new components
import PackageSelector from "./components/PackageSelector";
import ScheduleTableImproved from "./components/ScheduleTableImproved";
import BookingModal from "./components/BookingModal";
import RequestModal from "./components/RequestModal";
import ConfirmationModal from "./components/ConfirmationModal";
import ScheduleSuccessModal from "./components/ScheduleSuccessModal";
import AuthWarningModal from "./components/AuthWarningModal";

interface Instructor {
  _id: string;
  name: string;
  photo?: string;
  email?: string;
  schedule_driving_lesson?: ScheduleEntry[];
}

interface ScheduleEntry {
  date: string;
  start: string;
  end: string;
  status: string;
  classType?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  selectedProduct?: string;
  studentId?: string;
  studentName?: string;
  paid?: boolean;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  buttonLabel: string;
  category: string;
  duration?: number;
  media?: string[];
}

interface SelectedTimeSlot {
  date: string;
  start: string;
  end: string;
  instructors: Instructor[];
}

// Component principal
function DrivingLessonsContent() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [selectedInstructorForSchedule, setSelectedInstructorForSchedule] = useState<Instructor | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleEntry | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<SelectedTimeSlot | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [showSuccessPendingModal, setShowSuccessPendingModal] = useState(false);
  const [selectedHours, setSelectedHours] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Estados para manejo de autenticación y slots pendientes
  const [pendingSlot, setPendingSlot] = useState<{
    start: string;
    end: string;
    date: string;
    amount?: number;
    instructorName?: string;
    instructorId?: string;
    classType?: string;
  } | null>(null);

  // Estados para modal de cancelación
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const [cancellationMessage, setCancellationMessage] = useState("");
  const [slotToCancel, setSlotToCancel] = useState<ScheduleEntry & { instructorId: string } | null>(null);

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
      // Para driving lessons, verificamos si es una reserva directa o solicitud de horario
      if (pendingSlot.classType === 'direct_booking' && selectedProduct) {
        // Crear objeto compatible con handleTimeSlotSelect
        const timeSlot: SelectedTimeSlot = {
          date: pendingSlot.date,
          start: pendingSlot.start,
          end: pendingSlot.end,
          instructors: instructors.filter(inst => inst._id === pendingSlot.instructorId)
        };
        
        const lesson: ScheduleEntry = {
          date: pendingSlot.date,
          start: pendingSlot.start,
          end: pendingSlot.end,
          status: 'available'
        };
        
        handleTimeSlotSelect(timeSlot, lesson);
      } else {
        // Para solicitudes de horario múltiple, abrir el modal de solicitud
        setIsRequestModalOpen(true);
      }
      
      setPendingSlot(null);
    }
  };

  // Use SSE hook for real-time schedule updates for all instructors
  const instructorIds = React.useMemo(() => 
    instructors.map(instructor => instructor._id), 
    [instructors]
  );
  
  // Only use SSE when we have instructors and they're not empty
  const { 
    getScheduleForInstructor 
    // Removed unused variables: schedules, isConnectedForInstructor, getAllSchedules
  } = useAllDrivingLessonsSSE(instructorIds.length > 0 ? instructorIds : []);


  // Function to immediately update selected slots to pending status locally
  const updateSlotsTopending = () => {
    setInstructors(prevInstructors => {
      return prevInstructors.map(instructor => {
        if (!instructor.schedule_driving_lesson) return instructor;

        const updatedSchedule = instructor.schedule_driving_lesson.map(entry => {
          const slotKey = `${entry.date}-${entry.start}-${entry.end}`;
          if (selectedSlots.has(slotKey)) {
            return {
              ...entry,
              status: 'pending',
              studentId: userId,
              studentName: user?.name || 'Unknown Student'
            };
          }
          return entry;
        });

        return {
          ...instructor,
          schedule_driving_lesson: updatedSchedule,
          lastUpdated: Date.now()
        };
      });
    });
  };

  // Helper functions - removed unused pad function

  const handleDateChange = (value: Date | null | (Date | null)[]) => {
    if (!value || Array.isArray(value)) return;
    setSelectedDate(value);
  };

  // Fetch products (packages) on load
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?category=Road Skills for Life');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
          
          // Check if there's a preselected package from localStorage
          const selectedPackageData = localStorage.getItem('selectedPackage');
          if (selectedPackageData) {
            try {
              const packageInfo = JSON.parse(selectedPackageData);
              const foundProduct = data.find((p: Product) => p._id === packageInfo.id);
              if (foundProduct) {
                setSelectedProduct(foundProduct);
              }
              // Clear localStorage after use
              localStorage.removeItem('selectedPackage');
            } catch (error) {
              console.error('Error parsing selected package from localStorage:', error);
              localStorage.removeItem('selectedPackage');
            }
          }
        } else {
        }
      } catch {
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch driving lesson instructors on load (basic info only, schedules come via SSE)
  const fetchInstructors = useCallback(async () => {
    try {
      const res = await fetch('/api/instructors?type=driving-lessons&includeSchedule=true', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setInstructors(data);

        // Select a random instructor automatically if none is selected
        if (!selectedInstructorForSchedule && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          setSelectedInstructorForSchedule(data[randomIndex]);
        }
      } else {
      }
    } catch {
    }
  }, [selectedInstructorForSchedule]);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);


  const generateCalendlyURL = (product: Product, instructor: Instructor, slot?: ScheduleEntry) => {
    const baseUrl = "https://calendly.com/your-driving-school"; // Change to your real Calendly URL
    
    const params = new URLSearchParams({
      package_name: product.title,
      package_price: product.price.toString(),
      package_description: product.description,
      package_hours: product.duration?.toString() || '',
      preferred_instructor: instructor.name,
      instructor_id: instructor._id,
      user_id: userId,
      user_name: user?.name || '',
      user_email: user?.email || '',
      lesson_type: 'driving_lesson_package'
    });

    // Add schedule information if available
    if (slot) {
      params.append('selected_date', slot.date);
      params.append('selected_start_time', slot.start);
      params.append('selected_end_time', slot.end);
    }

    return `${baseUrl}?${params.toString()}`;
  };

  const handleBookPackage = async (paymentMethod: 'online' | 'location') => {
    if (!selectedProduct || !selectedInstructor || !selectedSlot || !userId) {
      if (!userId) {
        setShowAuthWarning(true);
        return;
      }
      return;
    }

    try {
      if (paymentMethod === 'online') {
        // Add to cart for online payment
        const cartItemId = `${selectedSlot.date}-${selectedSlot.start}-${selectedSlot.end}-${selectedInstructor._id}`;
        const cartItem = {
          _id: cartItemId,
          id: cartItemId,
          title: selectedProduct.title,
          price: selectedProduct.price,
          quantity: 1,
          image: selectedProduct.media?.[0] || '/default-lesson.jpg',
          category: 'driving_lesson',
          date: selectedSlot.date,
          start: selectedSlot.start,
          end: selectedSlot.end,
          instructorId: selectedInstructor._id,
          instructorName: selectedInstructor.name,
          classType: 'driving_lesson',
          duration: selectedProduct.duration || 1,
          description: selectedProduct.description
        };
        
        addToCart(cartItem);
        
        setIsBookingModalOpen(false);
        setConfirmationMessage(`${selectedProduct.title} has been added to your cart. You can complete the payment process and then schedule your lesson.`);
        setShowConfirmation(true);
        
      } else {
        // Schedule directly with Calendly for pay at location
        const calendlyUrl = generateCalendlyURL(selectedProduct, selectedInstructor, selectedSlot);
        
        setIsBookingModalOpen(false);
        setConfirmationMessage(`Redirecting to schedule your ${selectedProduct.title} with ${selectedInstructor.name} on ${selectedSlot.date} at ${selectedSlot.start}...`);
        setShowConfirmation(true);
        
        setTimeout(() => {
          window.location.href = calendlyUrl;
        }, 2000);
      }

    } catch (error) {
      console.error('Error processing reservation:', error);
      setConfirmationMessage('Error processing your request. Please try again.');
      setShowConfirmation(true);
    }
  };

  const handleRequestSchedule = () => {
    if (!selectedProduct) {
      alert('Please select a package first.');
      return;
    }
    
    if (!userId) {
      // Guardar la intención de solicitar horario
      const slotData = {
        start: '',
        end: '',
        date: '',
        amount: selectedProduct.price,
        instructorName: '',
        instructorId: '',
        classType: 'schedule_request'
      };
      setPendingSlot(slotData);
      setShowLogin(true);
      return;
    }
    
    setIsRequestModalOpen(true);
  };

  const handleRequestScheduleWithLocations = async (pickupLocation: string, dropoffLocation: string, paymentMethod: 'online' | 'local') => {
    if (!selectedProduct || selectedSlots.size === 0 || !userId) {
      alert('Please make sure you have selected a package and time slots, and are logged in.');
      return;
    }

    try {
      // Call API to create schedule request and mark slots as pending
      const response = await fetch('/api/schedule-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          productId: selectedProduct._id,
          selectedSlots: Array.from(selectedSlots),
          selectedHours: selectedHours,
          pickupLocation: pickupLocation,
          dropoffLocation: dropoffLocation,
          paymentMethod: paymentMethod,
          studentName: user ? user.name : 'Unknown Student'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create schedule request');
      }

      
      // Immediately update selected slots to pending in the UI
      updateSlotsTopending();

      // If online payment, add to cart and mark slots as pending (NO create order yet)
      if (paymentMethod === 'online') {
        try {
          
          // Step 1: Add to cart with package and slot details using specific endpoint
          const cartData = {
            userId: userId,
            packageDetails: {
              productId: selectedProduct._id,
              packageTitle: selectedProduct.title,
              packagePrice: selectedProduct.price,
              totalHours: selectedProduct.duration || 0,
              selectedHours: selectedHours,
              pickupLocation: pickupLocation,
              dropoffLocation: dropoffLocation,
            },
            selectedSlots: Array.from(selectedSlots),
            instructorData: instructors
          };

          const cartResponse = await fetch('/api/cart/add-driving-lesson-package', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cartData),
          });

          if (!cartResponse.ok) {
            const errorData = await cartResponse.json();
            throw new Error(errorData.error || 'Failed to add to cart');
          }

          const cartResult = await cartResponse.json();

          // Add to local cart context with slotDetails and unique ID

        await addToCart({
          id: cartResult.cartItem?.id || selectedProduct._id, // Use unique ID from server
          title: selectedProduct.title,
          price: selectedProduct.price,
            quantity: 1,
            packageDetails: cartData.packageDetails,
            selectedSlots: cartData.selectedSlots,
            instructorData: cartData.instructorData,
            slotDetails: cartResult.slotDetails // Include slotDetails from the response
          });

          // Package added to cart silently - no alert needed
          // SSE will automatically update the schedule, no manual refresh needed

        } catch (error) {
          console.error('❌ Error adding to cart:', error);
          alert(`Error adding to cart: ${error.message || 'Please try again.'}`);
          return; // Don't continue with the rest of the function
        }
      } else {
        // Pay at location: show success modal like Driving Test
        setShowSuccessPendingModal(true);
      }

      // Close the modal
      setIsRequestModalOpen(false);

      // Clear selections after successful request
      setSelectedSlots(new Set());
      setSelectedHours(0);

      // SSE will automatically update the schedule, no manual refresh needed
      
    } catch (error) {
      console.error('Error creating schedule request:', error);
      alert('Error submitting schedule request. Please try again.');
    }
  };

  const handleCancelPendingSlot = async (slot: ScheduleEntry & { instructorId: string }) => {
    // Mostrar modal de confirmación primero
    setSlotToCancel(slot);
    setShowCancelConfirm(true);
  };

  const confirmCancelPendingSlot = async () => {
    if (!slotToCancel) return;
    
    try {
      
      const response = await fetch('/api/driving-lessons/cancel-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: slotToCancel.instructorId,
          date: slotToCancel.date,
          start: slotToCancel.start,
          end: slotToCancel.end,
          studentId: userId
        })
      });

      const result = await response.json();
      
      setShowCancelConfirm(false);
      setSlotToCancel(null);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel pending slot');
      }

      setCancellationMessage('Slot cancelled successfully. The slot is now available again.');
      setShowCancellation(true);
      
      // SSE will automatically update the schedule
      
    } catch (error) {
      console.error('❌ Error canceling pending slot:', error);
      setCancellationMessage(`Error canceling slot: ${error.message || 'Please try again.'}`);
      setShowCancellation(true);
    }
  };

  const getWeekDates = useCallback((date: Date) => {
    // Use UTC methods to avoid timezone issues
    const base = new Date(date.getTime());
    base.setUTCDate(base.getUTCDate() + weekOffset * 7);
    
    const startOfWeek = new Date(base.getTime());
    const dayOfWeek = startOfWeek.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - dayOfWeek);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek.getTime());
      d.setUTCDate(startOfWeek.getUTCDate() + i);
      return d;
    });
  }, [weekOffset]);

  const weekDates = useMemo(() => {
    return selectedDate ? getWeekDates(selectedDate) : [];
  }, [selectedDate, getWeekDates]);
  

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleTimeSlotSelect = (timeSlot: SelectedTimeSlot, lesson: ScheduleEntry) => {
    if (!selectedProduct) {
      alert('Please select a package first.');
      return;
    }
    
    // Verificar autenticación antes de proceder
    if (!userId) {
      const slotData = {
        start: lesson.start,
        end: lesson.end,
        date: lesson.date,
        amount: selectedProduct.price,
        instructorName: timeSlot.instructors[0]?.name,
        instructorId: timeSlot.instructors[0]?._id,
        classType: 'direct_booking'
      };
      setPendingSlot(slotData);
      setShowLogin(true);
      return;
    }
    
    setSelectedTimeSlot(timeSlot);
    setSelectedSlot(lesson);
    
    // If only one instructor, select them automatically
    if (timeSlot.instructors.length === 1) {
      setSelectedInstructor(timeSlot.instructors[0]);
    } else {
      setSelectedInstructor(null);
    }
    
    setIsBookingModalOpen(true);
  };

  // Loading inicial de pantalla completa
  if (initialLoading) {
    return (
      <section className="bg-white min-h-screen flex flex-col items-center justify-center w-full">
        <div className="text-center p-12 max-w-lg mx-auto">
          <div className="inline-block animate-spin rounded-full h-20 w-20 border-4 border-gray-100 border-t-[#10B981] mb-8 shadow-lg"></div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Loading Driving Lessons</h3>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Please wait while we load all packages and instructors for your driving lessons...
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
        
        {/* Left Side - Package Selector */}
        <PackageSelector
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          products={products}
          selectedProduct={selectedProduct}
          onProductSelect={handleProductSelect}
          instructors={instructors}
          selectedInstructorForSchedule={selectedInstructorForSchedule}
          onInstructorSelect={setSelectedInstructorForSchedule}
          getScheduleForInstructor={getScheduleForInstructor}
        />

        {/* Right Side - Schedule Table Improved */}
        <ScheduleTableImproved
          selectedProduct={selectedProduct}
          weekOffset={weekOffset}
          onWeekOffsetChange={setWeekOffset}
          weekDates={weekDates}
          instructors={instructors}
          userId={userId}
          onSelectedHoursChange={setSelectedHours}
          selectedSlots={selectedSlots}
          onSelectedSlotsChange={setSelectedSlots}
          selectedInstructorForSchedule={selectedInstructorForSchedule}
          selectedHours={selectedHours}
          onRequestSchedule={handleRequestSchedule}
          onAuthRequired={() => {
            const slotData = {
              start: '',
              end: '',
              date: '',
              amount: selectedProduct?.price || 0,
              instructorName: '',
              instructorId: '',
              classType: 'schedule_request'
            };
            setPendingSlot(slotData);
            setShowLogin(true);
          }}
          onCancelPendingSlot={handleCancelPendingSlot}
          key={`schedule-${Date.now()}`}
        />
      </div>

      {/* Booking Modal - For available slots */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedProduct={selectedProduct}
        selectedSlot={selectedSlot}
        selectedTimeSlot={selectedTimeSlot}
        selectedInstructor={selectedInstructor}
        onInstructorSelect={setSelectedInstructor}
        onBookPackage={handleBookPackage}
      />

      {/* Request Schedule Modal */}
      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        selectedProduct={selectedProduct}
        selectedHours={selectedHours}
        onRequestSchedule={handleRequestScheduleWithLocations}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        message={confirmationMessage}
      />

      {/* Success Modal for Pay at Location */}
      <ScheduleSuccessModal
        isOpen={showSuccessPendingModal}
        onClose={() => setShowSuccessPendingModal(false)}
        packageTitle={selectedProduct?.title}
        price={selectedProduct?.price}
        slot={selectedSlot ? { date: selectedSlot.date, start: selectedSlot.start, end: selectedSlot.end } : null}
      />

      {/* Auth Warning Modal */}
      <AuthWarningModal
        isOpen={showAuthWarning}
        onClose={() => setShowAuthWarning(false)}
        onLogin={() => {}}
      />

      {/* Login Modal */}
      <LoginModal 
        open={showLogin} 
        onClose={() => {
          setShowLogin(false);
          setPendingSlot(null);
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Modal de confirmación de cancelación */}
      <Modal
        isOpen={showCancelConfirm}
        onClose={() => {
          setShowCancelConfirm(false);
          setSlotToCancel(null);
        }}
      >
        <div className="p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-4 text-red-600">Cancel Pending Slot</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to cancel this pending driving lesson slot?
            </p>
            {slotToCancel && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
                <p><strong>Date:</strong> {slotToCancel.date}</p>
                <p><strong>Time:</strong> {slotToCancel.start} - {slotToCancel.end}</p>
                <p><strong>Status:</strong> <span className="text-orange-600">Pending</span></p>
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
              Keep Slot
            </button>
            <button
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
              onClick={confirmCancelPendingSlot}
            >
              Yes, Cancel Slot
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de resultado de cancelación */}
      <Modal
        isOpen={showCancellation}
        onClose={() => setShowCancellation(false)}
      >
        <div className="p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-4 text-orange-600">Cancellation Status</h2>
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
    </section>
  );
}

// Main component with Suspense
export default function DrivingLessonsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <DrivingLessonsContent />
    </Suspense>
  );
}