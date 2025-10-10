"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import "@/globals.css";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/app/context/CartContext";
import LoginModal from "@/components/LoginModal";
import Modal from "@/components/Modal";
import CancellationModal from "@/components/CancellationModal";
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
  canTeachDrivingLesson?: boolean;
}

interface ScheduleEntry {
  _id?: string; // Slot ID from database
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
  const [selectedInstructor, setSelectedInstructor] =
    useState<Instructor | null>(null);
  const [selectedInstructorForSchedule, setSelectedInstructorForSchedule] =
    useState<Instructor | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleEntry | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] =
    useState<SelectedTimeSlot | null>(null);
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
  const [isProcessingSlots, setIsProcessingSlots] = useState(false);

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
  const [slotToCancel, setSlotToCancel] = useState<
    (ScheduleEntry & { instructorId: string }) | null
  >(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Estados para redención de slots cancelados - Removed unused variable

  const { user, setUser } = useAuth();
  const { addToCart } = useCart();
  const userId = user?._id || "";

  // Estado para slots cancelados disponibles para redención
  const [cancelledSlots, setCancelledSlots] = useState<
    {
      slotId: string;
      instructorId: string;
      instructorName?: string;
      date: string;
      start: string;
      end: string;
      cancelledAt: string;
    }[]
  >([]);

  // Función para manejar el login exitoso
  const handleLoginSuccess = (loggedInUser: {
    _id: string;
    name: string;
    email: string;
  }) => {
    setShowLogin(false);
    setShowAuthWarning(false);
    setUser(loggedInUser);

    // Si hay un slot pendiente, proceder con la reserva
    if (pendingSlot) {
      // Para driving lessons, verificamos si es una reserva directa o solicitud de horario
      if (pendingSlot.classType === "direct_booking" && selectedProduct) {
        // Crear objeto compatible con handleTimeSlotSelect
        const timeSlot: SelectedTimeSlot = {
          date: pendingSlot.date,
          start: pendingSlot.start,
          end: pendingSlot.end,
          instructors: instructors.filter(
            (inst) => inst._id === pendingSlot.instructorId
          ),
        };

        const lesson: ScheduleEntry = {
          date: pendingSlot.date,
          start: pendingSlot.start,
          end: pendingSlot.end,
          status: "available",
        };

        handleTimeSlotSelect(timeSlot, lesson);
      } else {
        // Para solicitudes de horario múltiple, abrir el modal de solicitud
        setIsRequestModalOpen(true);
      }

      setPendingSlot(null);
    }
  };

  // Use SSE hook for real-time schedule updates for selected instructor only
  const { schedules, forceRefresh } = useAllDrivingLessonsSSE(
    selectedInstructorForSchedule ? [selectedInstructorForSchedule._id] : []
  );

  // Automatically process SSE schedule updates and update instructors state
  useEffect(() => {
    if (!selectedInstructorForSchedule || !schedules || schedules.size === 0) {
      console.log("⚠️ No selected instructor or SSE schedules Map is empty");
      return;
    }

    console.log(
      "📡 SSE schedules Map updated for selected instructor:",
      selectedInstructorForSchedule.name
    );
    console.log(
      "📡 SSE schedules data:",
      Array.from(schedules.entries()).map(([id, schedule]) => ({
        instructorId: id,
        slotsCount: Array.isArray(schedule) ? schedule.length : 0,
      }))
    );

    // Update only the selected instructor with SSE schedule data
    setInstructors((prevInstructors) => {
      console.log(
        "🔄 Updating instructors state with SSE data for selected instructor..."
      );
      return prevInstructors.map((instructor) => {
        if (instructor._id === selectedInstructorForSchedule._id) {
          const sseSchedule = schedules.get(instructor._id);

          if (sseSchedule && Array.isArray(sseSchedule)) {
            console.log(
              `✅ Updating instructor ${instructor.name} with ${sseSchedule.length} slots from SSE`
            );
            return {
              ...instructor,
              schedule_driving_lesson: sseSchedule as ScheduleEntry[],
            };
          }
        }

        return instructor;
      });
    });
  }, [schedules, selectedInstructorForSchedule]);

  // Helper functions - removed unused updateSlotsTopending and pad functions

  const handleDateChange = (value: Date | null | (Date | null)[]) => {
    if (!value || Array.isArray(value)) return;
    setSelectedDate(value);
  };

  // Fetch products (packages) on load
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products?category=Road Skills for Life");
        if (res.ok) {
          const data = await res.json();
          setProducts(data);

          // Check if there's a preselected package from localStorage
          const selectedPackageData = localStorage.getItem("selectedPackage");
          if (selectedPackageData) {
            try {
              const packageInfo = JSON.parse(selectedPackageData);
              const foundProduct = data.find(
                (p: Product) => p._id === packageInfo.id
              );
              if (foundProduct) {
                setSelectedProduct(foundProduct);
              }
              // Clear localStorage after use
              localStorage.removeItem("selectedPackage");
            } catch (error) {
              console.error(
                "Error parsing selected package from localStorage:",
                error
              );
              localStorage.removeItem("selectedPackage");
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
    console.log("🔄 [FETCH] Starting instructor fetch...");
    try {
      const res = await fetch(
        "/api/instructors?type=driving-lessons&includeSchedule=true",
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      console.log("📡 [FETCH] Response status:", res.status, res.statusText);

      if (res.ok) {
        const data = await res.json();
        console.log("🔍 [INSTRUCTORS] Raw data from API:", data);
        console.log(
          "🔍 [INSTRUCTORS] Total instructors received:",
          data.length
        );

        // Log cada instructor y su estado de canTeachDrivingLesson
        data.forEach((instructor: Instructor) => {
          console.log(`🔍 [INSTRUCTOR] ${instructor.name}:`, {
            id: instructor._id,
            canTeachDrivingLesson: instructor.canTeachDrivingLesson,
            hasSchedule: !!instructor.schedule_driving_lesson,
          });
        });

        // El API ya filtró los instructores con canTeachDrivingLesson: true
        console.log("✅ [INSTRUCTORS] Instructors from API:", data.length);
        console.log(
          "✅ [INSTRUCTORS] Instructor names:",
          data.map((i: Instructor) => i.name)
        );

        setInstructors(data);

        // Select a random instructor automatically if none is selected
        if (!selectedInstructorForSchedule && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          setSelectedInstructorForSchedule(data[randomIndex]);
          console.log(
            "🎯 [INSTRUCTORS] Auto-selected instructor:",
            data[randomIndex].name
          );
        } else if (data.length === 0) {
          console.log(
            "⚠️ [INSTRUCTORS] No instructors available for driving lessons"
          );
        } else {
          console.log(
            "⚠️ [INSTRUCTORS] No random selection - already have selected instructor:",
            selectedInstructorForSchedule?.name
          );
        }
      } else {
        console.error(
          "❌ [FETCH] Failed to fetch instructors:",
          res.status,
          res.statusText
        );
      }
    } catch (error) {
      console.error("❌ [FETCH] Error fetching instructors:", error);
    }
  }, [selectedInstructorForSchedule]);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  // Load cancelled slots for redemption when user is authenticated
  useEffect(() => {
    const loadCancelledSlots = async () => {
      if (!user?._id) return;

      try {
        console.log(
          "🔍 [DRIVING LESSONS] Fetching cancelled slots for user:",
          user._id
        );
        const response = await fetch(
          `/api/users/${user._id}/cancelled-driving-lessons`
        );
        console.log("📡 [DRIVING LESSONS] Response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log(
            "📋 [DRIVING LESSONS] Loaded cancelled slots response:",
            data
          );
          console.log(
            "📋 [DRIVING LESSONS] Raw cancelledSlots array:",
            data.cancelledSlots
          );
          setCancelledSlots(data.cancelledSlots || []);
          console.log(
            "✅ [DRIVING LESSONS] Available credits set to:",
            data.cancelledSlots?.length || 0
          );
        } else {
          console.warn("⚠️ [DRIVING LESSONS] Failed to load cancelled slots");
        }
      } catch (error) {
        console.error(
          "❌ [DRIVING LESSONS] Error loading cancelled slots:",
          error
        );
      }
    };

    loadCancelledSlots();
  }, [user?._id]);

  const generateCalendlyURL = (
    product: Product,
    instructor: Instructor,
    slot?: ScheduleEntry
  ) => {
    const baseUrl = "https://calendly.com/your-driving-school"; // Change to your real Calendly URL

    const params = new URLSearchParams({
      package_name: product.title,
      package_price: product.price.toString(),
      package_description: product.description,
      package_hours: product.duration?.toString() || "",
      preferred_instructor: instructor.name,
      instructor_id: instructor._id,
      user_id: userId,
      user_name: user?.name || "",
      user_email: user?.email || "",
      lesson_type: "driving_lesson_package",
    });

    // Add schedule information if available
    if (slot) {
      params.append("selected_date", slot.date);
      params.append("selected_start_time", slot.start);
      params.append("selected_end_time", slot.end);
    }

    return `${baseUrl}?${params.toString()}`;
  };

  const handleBookPackage = async (paymentMethod: "online" | "location") => {
    if (!selectedProduct || !selectedInstructor || !selectedSlot || !userId) {
      if (!userId) {
        setShowAuthWarning(true);
        return;
      }
      return;
    }

    try {
      if (paymentMethod === "online") {
        // Add to cart for online payment
        const cartItemId = `${selectedSlot.date}-${selectedSlot.start}-${selectedSlot.end}-${selectedInstructor._id}`;
        const cartItem = {
          _id: cartItemId,
          id: cartItemId,
          title: selectedProduct.title,
          price: selectedProduct.price,
          quantity: 1,
          image: selectedProduct.media?.[0] || "/default-lesson.jpg",
          category: "driving_lesson",
          date: selectedSlot.date,
          start: selectedSlot.start,
          end: selectedSlot.end,
          instructorId: selectedInstructor._id,
          instructorName: selectedInstructor.name,
          classType: "driving_lesson",
          duration: selectedProduct.duration || 1,
          description: selectedProduct.description,
        };

        addToCart(cartItem);

        // Update local state immediately to show slot as pending
        setInstructors((prevInstructors) => {
          return prevInstructors.map((instructor) => {
            if (
              instructor._id === selectedInstructor._id &&
              instructor.schedule_driving_lesson
            ) {
              const updatedSchedule = instructor.schedule_driving_lesson.map(
                (slot: ScheduleEntry) => {
                  if (
                    slot.date === selectedSlot.date &&
                    slot.start === selectedSlot.start &&
                    slot.end === selectedSlot.end
                  ) {
                    return {
                      ...slot,
                      status: "pending",
                      studentId: userId,
                      studentName: user
                        ? ((user as unknown as Record<string, unknown>)
                            .name as string) || "Unknown"
                        : "Unknown",
                      booked: true,
                      reservedAt: new Date(),
                    };
                  }
                  return slot;
                }
              );

              return {
                ...instructor,
                schedule_driving_lesson: updatedSchedule,
              };
            }
            return instructor;
          });
        });

        // Force refresh SSE to update calendar immediately
        if (forceRefresh && selectedInstructor) {
          forceRefresh(selectedInstructor._id);
        }

        setIsBookingModalOpen(false);
        setConfirmationMessage(
          `${selectedProduct.title} has been added to your cart. You can complete the payment process and then schedule your lesson.`
        );
        setShowConfirmation(true);
      } else {
        // Schedule directly with Calendly for pay at location
        const calendlyUrl = generateCalendlyURL(
          selectedProduct,
          selectedInstructor,
          selectedSlot
        );

        // Update local state immediately to show slot as pending
        setInstructors((prevInstructors) => {
          return prevInstructors.map((instructor) => {
            if (
              instructor._id === selectedInstructor._id &&
              instructor.schedule_driving_lesson
            ) {
              const updatedSchedule = instructor.schedule_driving_lesson.map(
                (slot: ScheduleEntry) => {
                  if (
                    slot.date === selectedSlot.date &&
                    slot.start === selectedSlot.start &&
                    slot.end === selectedSlot.end
                  ) {
                    return {
                      ...slot,
                      status: "pending",
                      studentId: userId,
                      studentName: user
                        ? ((user as unknown as Record<string, unknown>)
                            .name as string) || "Unknown"
                        : "Unknown",
                      booked: true,
                      reservedAt: new Date(),
                      paymentMethod: "location",
                    };
                  }
                  return slot;
                }
              );

              return {
                ...instructor,
                schedule_driving_lesson: updatedSchedule,
              };
            }
            return instructor;
          });
        });

        // Force refresh SSE to update calendar immediately
        if (forceRefresh && selectedInstructor) {
          forceRefresh(selectedInstructor._id);
        }

        setIsBookingModalOpen(false);
        setConfirmationMessage(
          `Redirecting to schedule your ${selectedProduct.title} with ${selectedInstructor.name} on ${selectedSlot.date} at ${selectedSlot.start}...`
        );
        setShowConfirmation(true);

        setTimeout(() => {
          window.location.href = calendlyUrl;
        }, 2000);
      }
    } catch (error) {
      console.error("Error processing reservation:", error);
      setConfirmationMessage(
        "Error processing your request. Please try again."
      );
      setShowConfirmation(true);
    }
  };

  const handleRequestSchedule = () => {
    if (!selectedProduct) {
      alert("Please select a package first.");
      return;
    }

    if (!userId) {
      // Guardar la intención de solicitar horario
      const slotData = {
        start: "",
        end: "",
        date: "",
        amount: selectedProduct.price,
        instructorName: "",
        instructorId: "",
        classType: "schedule_request",
      };
      setPendingSlot(slotData);
      setShowLogin(true);
      return;
    }

    setIsRequestModalOpen(true);
  };

  const handleRequestScheduleWithLocations = async (
    pickupLocation: string,
    dropoffLocation: string,
    paymentMethod: "online" | "local" | "redeem"
  ) => {
    if (!selectedProduct || selectedSlots.size === 0 || !userId) {
      alert(
        "Please make sure you have selected a package and time slots, and are logged in."
      );
      return;
    }

    setIsProcessingSlots(true);

    // Actualizar visualmente los slots a "pending" inmediatamente
    if (selectedInstructorForSchedule) {
      setInstructors((prevInstructors) => {
        return prevInstructors.map((instructor) => {
          if (
            instructor._id === selectedInstructorForSchedule._id &&
            instructor.schedule_driving_lesson
          ) {
            const updatedSchedule = instructor.schedule_driving_lesson.map(
              (slot) => {
                const slotKey = `${slot.date}-${slot.start}-${slot.end}`;
                if (selectedSlots.has(slotKey) && slot.status === "available") {
                  return {
                    ...slot,
                    status: "pending" as const,
                    studentId: userId,
                    studentName: user?.name || "Unknown",
                  };
                }
                return slot;
              }
            );

            return {
              ...instructor,
              schedule_driving_lesson: updatedSchedule,
            };
          }
          return instructor;
        });
      });
    }

    // REDEEM: Use cancelled slot to book new driving lesson
    if (paymentMethod === "redeem") {
      if (cancelledSlots.length === 0) {
        // No hay slots disponibles - cerrar modal
        setIsProcessingSlots(false);
        return;
      }

      if (!selectedInstructorForSchedule) {
        // No hay instructor seleccionado - cerrar modal
        setIsProcessingSlots(false);
        return;
      }

      try {
        // Get first selected slot for redemption
        const firstSlotKey = Array.from(selectedSlots)[0];
        console.log("🔍 [REDEEM] Selected slot key:", firstSlotKey);
        console.log(
          "🔍 [REDEEM] Selected instructor:",
          selectedInstructorForSchedule.name
        );

        // Parse the slot key - format: "2025-10-03-06:30-08:30"
        // Split gives: ["2025", "10", "03", "06:30", "08:30"]
        const parts = firstSlotKey.split("-");
        const date = `${parts[0]}-${parts[1]}-${parts[2]}`; // "2025-10-03"
        const start = parts[3]; // "06:30"
        const end = parts[4]; // "08:30"

        console.log("🔍 [REDEEM] Looking for slot:", { date, start, end });
        console.log(
          "🔍 [REDEEM] Instructor schedule:",
          selectedInstructorForSchedule.schedule_driving_lesson
        );

        // Find the slot in the selected instructor's schedule (filter out cancelled first)
        const validSlots =
          selectedInstructorForSchedule.schedule_driving_lesson?.filter(
            (slot) => slot.status !== "cancelled"
          ) || [];

        console.log("🔍 [REDEEM] Valid slots (non-cancelled):", validSlots);
        console.log(
          "🔍 [REDEEM] Available slots only:",
          validSlots.filter((s) => s.status === "available")
        );

        const availableSlot = validSlots.find(
          (slot) =>
            slot.date === date &&
            slot.start === start &&
            slot.end === end &&
            slot.status === "available"
        );

        if (!availableSlot) {
          console.log("❌ [REDEEM] Slot not found or not available");
          console.log("❌ [REDEEM] Looking for:", {
            date,
            start,
            end,
            status: "available",
          });
          console.log(
            "❌ [REDEEM] All valid slots:",
            validSlots.map((s) => ({
              date: s.date,
              start: s.start,
              end: s.end,
              status: s.status,
              _id: s._id,
            }))
          );
          // Slot no disponible - cerrar modal
          setIsProcessingSlots(false);
          return;
        }

        console.log("✅ [REDEEM] Found available slot:", availableSlot);

        const res = await fetch("/api/driving-lessons/redeem-cancelled-slot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            instructorId: selectedInstructorForSchedule._id,
            date: date,
            start: start,
            end: end,
            pickupLocation: pickupLocation,
            dropoffLocation: dropoffLocation,
            packageName: selectedProduct.title,
            selectedProduct: selectedProduct._id,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          console.log("✅ [DRIVING LESSONS] Slot redeemed successfully:", data);

          // Actualizar visualmente el slot a "booked" inmediatamente
          setInstructors((prevInstructors) => {
            return prevInstructors.map((instructor) => {
              if (
                instructor._id === selectedInstructorForSchedule._id &&
                instructor.schedule_driving_lesson
              ) {
                const updatedSchedule = instructor.schedule_driving_lesson.map(
                  (slot) => {
                    if (
                      slot.date === date &&
                      slot.start === start &&
                      slot.end === end
                    ) {
                      return {
                        ...slot,
                        status: "booked" as const,
                        studentId: userId,
                        studentName: user?.name || "Unknown",
                        paid: true,
                        paymentMethod: "redeem",
                      };
                    }
                    return slot;
                  }
                );

                return {
                  ...instructor,
                  schedule_driving_lesson: updatedSchedule,
                };
              }
              return instructor;
            });
          });

          // Force refresh SSE to update calendar immediately (igual que Pay Online Now)
          if (forceRefresh && selectedInstructorForSchedule) {
            console.log(
              "📡 [REDEEM] Sending SSE force refresh for instructor:",
              selectedInstructorForSchedule.name
            );
            forceRefresh(selectedInstructorForSchedule._id);
          }

          // Clear selections
          setSelectedSlots(new Set());
          setSelectedHours(0);
          setIsRequestModalOpen(false);
          setIsProcessingSlots(false); // Stop loading state

          // Refresh cancelled slots
          const slotsRes = await fetch(
            `/api/users/${userId}/cancelled-driving-lessons`
          );
          if (slotsRes.ok) {
            const slotsData = await slotsRes.json();
            setCancelledSlots(slotsData.cancelledSlots || []);
          }

          // El modal se cierra automáticamente al completar las operaciones
          return;
        } else {
          const error = await res.json();
          throw new Error(error.error || "Failed to redeem slot");
        }
      } catch (error) {
        console.error("❌ [DRIVING LESSONS] Error redeeming slot:", error);

        // Revertir el estado visual si falló la redención
        if (selectedInstructorForSchedule) {
          setInstructors((prevInstructors) => {
            return prevInstructors.map((instructor) => {
              if (
                instructor._id === selectedInstructorForSchedule._id &&
                instructor.schedule_driving_lesson
              ) {
                const revertedSchedule = instructor.schedule_driving_lesson.map(
                  (slot) => {
                    const slotKey = `${slot.date}-${slot.start}-${slot.end}`;
                    if (
                      selectedSlots.has(slotKey) &&
                      slot.status === "pending" &&
                      slot.studentId === userId
                    ) {
                      return {
                        ...slot,
                        status: "available" as const,
                        studentId: undefined,
                        studentName: undefined,
                      };
                    }
                    return slot;
                  }
                );

                return {
                  ...instructor,
                  schedule_driving_lesson: revertedSchedule,
                };
              }
              return instructor;
            });
          });
        }

        setIsProcessingSlots(false); // Stop loading state on error

        // Solo cerrar el modal sin mostrar mensaje
        return;
      } finally {
        setIsProcessingSlots(false); // Always stop loading state
      }
    }

    try {
      // Call API to create schedule request and mark slots as pending
      const response = await fetch("/api/schedule-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          productId: selectedProduct._id,
          selectedSlots: Array.from(selectedSlots),
          selectedHours: selectedHours,
          pickupLocation: pickupLocation,
          dropoffLocation: dropoffLocation,
          paymentMethod: paymentMethod,
          studentName: user ? user.name : "Unknown Student",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create schedule request");
      }

      // SSE will automatically update the schedule - no manual update needed (like Book-Now)

      // If online payment, add to cart and mark slots as pending (NO create order yet)
      if (paymentMethod === "online") {
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
            instructorData: instructors,
          };

          const cartResponse = await fetch(
            "/api/cart/add-driving-lesson-package",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(cartData),
            }
          );

          if (!cartResponse.ok) {
            const errorData = await cartResponse.json();
            throw new Error(errorData.error || "Failed to add to cart");
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
            slotDetails: cartResult.slotDetails, // Include slotDetails from the response
          });

          // Force refresh SSE to update calendar immediately
          if (forceRefresh && selectedInstructorForSchedule) {
            forceRefresh(selectedInstructorForSchedule._id);
          }

          // Package added to cart silently - no alert needed
        } catch (error) {
          console.error("❌ Error adding to cart:", error);

          // Revertir los slots a su estado original si hubo error agregando al carrito
          if (selectedInstructorForSchedule) {
            setInstructors((prevInstructors) => {
              return prevInstructors.map((instructor) => {
                if (
                  instructor._id === selectedInstructorForSchedule._id &&
                  instructor.schedule_driving_lesson
                ) {
                  const revertedSchedule =
                    instructor.schedule_driving_lesson.map((slot) => {
                      const slotKey = `${slot.date}-${slot.start}-${slot.end}`;
                      if (
                        selectedSlots.has(slotKey) &&
                        slot.status === "pending" &&
                        slot.studentId === userId
                      ) {
                        return {
                          ...slot,
                          status: "available" as const,
                          studentId: undefined,
                          studentName: undefined,
                        };
                      }
                      return slot;
                    });

                  return {
                    ...instructor,
                    schedule_driving_lesson: revertedSchedule,
                  };
                }
                return instructor;
              });
            });
          }

          setIsProcessingSlots(false);
          alert(
            `Error adding to cart: ${error.message || "Please try again."}`
          );
          throw error; // Re-throw para que el modal maneje el loading
        }
      } else {
        // Pay at location: show success modal like Driving Test
        setShowSuccessPendingModal(true);
        // Force SSE refresh to show updated schedule
        if (selectedInstructorForSchedule) {
          forceRefresh(selectedInstructorForSchedule._id);
        }
      }

      // Close the modal
      setIsRequestModalOpen(false);

      // Clear selections after successful request
      setSelectedSlots(new Set());
      setSelectedHours(0);
      setIsProcessingSlots(false);

      // SSE will automatically update the schedule, no manual refresh needed
    } catch (error) {
      console.error("Error creating schedule request:", error);

      // Revertir los slots a su estado original si hubo error
      if (selectedInstructorForSchedule) {
        setInstructors((prevInstructors) => {
          return prevInstructors.map((instructor) => {
            if (
              instructor._id === selectedInstructorForSchedule._id &&
              instructor.schedule_driving_lesson
            ) {
              const revertedSchedule = instructor.schedule_driving_lesson.map(
                (slot) => {
                  const slotKey = `${slot.date}-${slot.start}-${slot.end}`;
                  if (
                    selectedSlots.has(slotKey) &&
                    slot.status === "pending" &&
                    slot.studentId === userId
                  ) {
                    return {
                      ...slot,
                      status: "available" as const,
                      studentId: undefined,
                      studentName: undefined,
                    };
                  }
                  return slot;
                }
              );

              return {
                ...instructor,
                schedule_driving_lesson: revertedSchedule,
              };
            }
            return instructor;
          });
        });
      }

      setIsProcessingSlots(false);
      alert("Error submitting schedule request. Please try again.");
      throw error; // Re-throw para que el modal maneje el loading
    }
  };

  const handleCancelPendingSlot = async (
    slot: ScheduleEntry & { instructorId: string }
  ) => {
    // Mostrar modal de confirmación primero
    setSlotToCancel(slot);
    setShowCancelConfirm(true);
  };

  // confirmCancelPendingSlot function removed as it was unused - reserved for future implementation

  // Handle canceling a BOOKED slot (paid)
  const handleCancelBookedSlot = async (
    slot: ScheduleEntry & { instructorId: string; dateString: string }
  ) => {
    if (!userId) return;

    setSlotToCancel(slot);
    setShowCancelConfirm(true);
  };

  const getWeekDates = useCallback(
    (date: Date) => {
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
    },
    [weekOffset]
  );

  const weekDates = useMemo(() => {
    return selectedDate ? getWeekDates(selectedDate) : [];
  }, [selectedDate, getWeekDates]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleTimeSlotSelect = (
    timeSlot: SelectedTimeSlot,
    lesson: ScheduleEntry
  ) => {
    if (!selectedProduct) {
      alert("Please select a package first.");
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
        classType: "direct_booking",
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
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Loading Driving Lessons
          </h3>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Please wait while we load all packages and instructors for your
            driving lessons...
          </p>
          <div className="flex justify-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-[#10B981] rounded-full animate-bounce shadow-md"></div>
              <div
                className="w-3 h-3 bg-[#10B981] rounded-full animate-bounce shadow-md"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-3 h-3 bg-[#10B981] rounded-full animate-bounce shadow-md"
                style={{ animationDelay: "0.2s" }}
              ></div>
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
              start: "",
              end: "",
              date: "",
              amount: selectedProduct?.price || 0,
              instructorName: "",
              instructorId: "",
              classType: "schedule_request",
            };
            setPendingSlot(slotData);
            setShowLogin(true);
          }}
          onCancelPendingSlot={handleCancelPendingSlot}
          onCancelBookedSlot={handleCancelBookedSlot}
          isProcessingSlots={isProcessingSlots}
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
        cancelledSlots={cancelledSlots}
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
        slot={
          selectedSlot
            ? {
                date: selectedSlot.date,
                start: selectedSlot.start,
                end: selectedSlot.end,
              }
            : null
        }
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

      {/* Modal de resultado de cancelación */}
      <Modal
        isOpen={showCancellation}
        onClose={() => setShowCancellation(false)}
      >
        <div className="p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
              <svg
                className="h-6 w-6 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-4 text-orange-600">
              Cancellation Status
            </h2>
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

      {/* Cancellation Modal for Booked Slots */}
      <CancellationModal
        isOpen={showCancelConfirm}
        onClose={() => {
          setShowCancelConfirm(false);
          setSlotToCancel(null);
        }}
        slotDetails={
          slotToCancel
            ? {
                date: slotToCancel.date,
                start: slotToCancel.start,
                end: slotToCancel.end,
                amount: 90,
                instructorName:
                  instructors.find((i) => i._id === slotToCancel.instructorId)
                    ?.name || "Unknown Instructor",
                status: slotToCancel.status,
                slotId: slotToCancel._id || "",
                instructorId: slotToCancel.instructorId,
              }
            : null
        }
        onConfirmCancel={async (paymentMethod?: "online" | "call") => {
          if (!slotToCancel || !user) return;

          setIsCancelling(true);

          try {
            console.log(
              "🚙 [DRIVING LESSONS] Cancelling slot:",
              slotToCancel,
              "PaymentMethod:",
              paymentMethod
            );

            // Si se proporciona paymentMethod, es una cancelación con cargo
            if (paymentMethod) {
              if (paymentMethod === "online") {
                // Find the CURRENT booked slot in instructor's schedule to get the correct slotId
                const instructor = instructors.find(
                  (i) => i._id === slotToCancel.instructorId
                );
                const currentBookedSlot =
                  instructor?.schedule_driving_lesson?.find(
                    (slot) =>
                      slot.date === slotToCancel.date &&
                      slot.start === slotToCancel.start &&
                      slot.end === slotToCancel.end &&
                      slot.status === "booked" &&
                      slot.studentId === userId
                  );

                const correctSlotId =
                  currentBookedSlot?._id || slotToCancel._id || "unknown";
                console.log(
                  "🔍 [CANCEL] Using slotId for order:",
                  correctSlotId,
                  "from current booked slot:",
                  currentBookedSlot?._id
                );

                // PAID CANCELLATION - Pay Online: Stripe eliminado
                const orderRes = await fetch(
                  "/api/booking/create-cancellation-order",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: user._id,
                      instructorId: slotToCancel.instructorId,
                      slotId: correctSlotId,
                      date: slotToCancel.date,
                      start: slotToCancel.start,
                      end: slotToCancel.end,
                      amount: 90,
                      classType: "cancel_driving_lesson",
                    }),
                  }
                );

                if (!orderRes.ok) {
                  const errorData = await orderRes.json();
                  throw new Error(
                    errorData.error || "Failed to create cancellation order"
                  );
                }

                const { checkoutUrl } = await orderRes.json();
                // Stripe checkout eliminado

                // Stripe checkout eliminado
                window.location.href = checkoutUrl;
                return;
              } else {
                // PAID CANCELLATION - Call to Pay: Show phone number modal
                setIsCancelling(false);
                setShowCancelConfirm(false);
                setSlotToCancel(null);
                setCancellationMessage(
                  "Please call 561-330-7007 to complete your cancellation payment of $90.00 USD. Once payment is processed, your slot will be cancelled."
                );
                setShowCancellation(true);
                return;
              }
            }

            // FREE CANCELLATION - Process immediately
            // Find the CURRENT booked slot in instructor's schedule to get the correct slotId
            const instructor = instructors.find(
              (i) => i._id === slotToCancel.instructorId
            );
            const currentBookedSlot = instructor?.schedule_driving_lesson?.find(
              (slot) =>
                slot.date === slotToCancel.date &&
                slot.start === slotToCancel.start &&
                slot.end === slotToCancel.end &&
                slot.status === "booked" &&
                slot.studentId === userId
            );

            const correctSlotId =
              currentBookedSlot?._id || slotToCancel._id || "unknown";
            console.log(
              "🔍 [FREE CANCEL] Using slotId for cancellation:",
              correctSlotId,
              "from current booked slot:",
              currentBookedSlot?._id
            );

            const response = await fetch("/api/driving-lessons/cancel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                studentId: user._id,
                instructorId: slotToCancel.instructorId,
                date: slotToCancel.date,
                start: slotToCancel.start,
                end: slotToCancel.end,
                slotId: correctSlotId,
              }),
            });

            const result = await response.json();
            console.log("✅ [DRIVING LESSONS] Cancellation response:", result);

            if (response.ok) {
              // Show appropriate message based on 48-hour policy
              if (result.wasPending) {
                setCancellationMessage(
                  "Pending driving lesson cancelled successfully."
                );
              } else if (result.isWithin48Hours) {
                setCancellationMessage(
                  `Driving lesson cancelled. Since this was within 48 hours of your lesson, no credit has been issued. ` +
                    `The cancellation policy helps ensure fairness for all students.`
                );
              } else {
                setCancellationMessage(
                  `Driving lesson cancelled successfully! You have been credited and can redeem this for a future lesson. ` +
                    `Look for the "Redeem Credit" option when booking your next lesson.`
                );
              }

              setShowCancellation(true);

              // Close the cancel modal
              setShowCancelConfirm(false);
              setSlotToCancel(null);

              // The SSE connection will automatically update the schedule
            } else if (result.requiresPayment) {
              // Cancellation within 48 hours - requires payment
              console.log(
                "💰 [DRIVING LESSONS] Payment required for cancellation"
              );

              // Find the CURRENT booked slot in instructor's schedule to get the correct slotId
              const instructor = instructors.find(
                (i) => i._id === slotToCancel.instructorId
              );
              const currentBookedSlot =
                instructor?.schedule_driving_lesson?.find(
                  (slot) =>
                    slot.date === slotToCancel.date &&
                    slot.start === slotToCancel.start &&
                    slot.end === slotToCancel.end &&
                    slot.status === "booked" &&
                    slot.studentId === userId
                );

              const correctSlotId =
                currentBookedSlot?._id || slotToCancel._id || "unknown";
              console.log(
                "🔍 [CANCEL] Using slotId for order:",
                correctSlotId,
                "from current booked slot:",
                currentBookedSlot?._id
              );

              // Stripe eliminado
              const orderRes = await fetch(
                "/api/booking/create-cancellation-order",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: user._id,
                    instructorId: slotToCancel.instructorId,
                    slotId: correctSlotId,
                    date: slotToCancel.date,
                    start: slotToCancel.start,
                    end: slotToCancel.end,
                    amount: 90,
                    classType: "cancel_driving_lesson",
                  }),
                }
              );

              if (orderRes.ok) {
                const { checkoutUrl } = await orderRes.json();
                // Stripe checkout eliminado

                // Stripe checkout eliminado
                window.location.href = checkoutUrl;
                return;
              } else {
                const errorData = await orderRes.json();
                throw new Error(
                  errorData.error || "Failed to create cancellation order"
                );
              }
            } else {
              console.error(
                "❌ [DRIVING LESSONS] Cancellation failed:",
                result
              );
              setCancellationMessage(
                `Failed to cancel lesson: ${result.error || "Unknown error"}`
              );
              setShowCancellation(true);
            }
          } catch (error) {
            console.error(
              "❌ [DRIVING LESSONS] Error cancelling lesson:",
              error
            );
            setCancellationMessage(
              "Error cancelling lesson. Please try again or contact support."
            );
            setShowCancellation(true);
          } finally {
            setIsCancelling(false);
          }
        }}
        isProcessing={isCancelling}
      />
    </section>
  );
}

// Main component with Suspense
export default function DrivingLessonsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <DrivingLessonsContent />
    </Suspense>
  );
}
