"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/components/AuthContext";
import { FaShoppingCart, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";

interface CartIconProps {
  color?: string;
}

// Types for order details
interface OrderAppointment {
  slotId: string;
  instructorId: string;
  instructorName: string;
  date: string;
  start: string;
  end: string;
  classType: string;
  amount: number;
  status: string;
  pickupLocation?: string;
  dropoffLocation?: string;
}

interface OrderDetails {
  _id: string;
  orderNumber: string;
  total: number;
  appointments: OrderAppointment[];
  paymentStatus?: string;
  packageDetails?: {
    packageTitle: string;
    pickupLocation: string;
    dropoffLocation: string;
    selectedHours: number;
    totalHours: number;
  };
}

// Component to show order details
const OrderDetailsComponent: React.FC<{ orderId: string }> = ({ orderId }) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/orders/details?orderId=${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrderDetails(data.order);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return (
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-xs text-gray-500">Loading appointment details...</div>
      </div>
    );
  }

  if (!orderDetails) {
    return null;
  }

  return (
    <div className="bg-green-50 p-3 rounded-lg">
      <div className="text-sm text-green-800 font-medium mb-2">
        📅 Appointment Details
      </div>
      
      {/* Package Details */}
      {orderDetails.packageDetails && (
        <div className="mb-2">
          <div className="text-xs text-green-700">
            📦 {orderDetails.packageDetails.packageTitle}
          </div>
          <div className="text-xs text-green-600">
            📍 Pickup: {orderDetails.packageDetails.pickupLocation}
          </div>
          <div className="text-xs text-green-600">
            📍 Dropoff: {orderDetails.packageDetails.dropoffLocation}
          </div>
          <div className="text-xs text-green-600">
            ⏱️ Hours: {orderDetails.packageDetails.selectedHours} of {orderDetails.packageDetails.totalHours}
          </div>
        </div>
      )}

      {/* Appointments List */}
      {orderDetails.appointments && orderDetails.appointments.length > 0 && (
        <div>
          <div className="text-xs text-green-700 font-medium mb-1">
            📋 Scheduled Classes ({orderDetails.appointments.length}):
          </div>
          {orderDetails.appointments.map((apt: OrderAppointment, index: number) => (
            <div key={index} className="text-xs text-green-600 mb-1 pl-2 border-l-2 border-green-200">
              🧑‍🏫 {apt.instructorName} • 📅 {apt.date} • ⏰ {apt.start}-{apt.end}
              <br />
              <span className={`inline-block px-1 py-0.5 rounded text-[10px] ${
                apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {apt.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Payment Status */}
      <div className="text-xs text-green-600 mt-2 pt-2 border-t border-green-200">
        💳 Payment: {orderDetails.paymentStatus || 'pending'}
      </div>
    </div>
  );
};

const CartIcon: React.FC<CartIconProps> = ({ color = "black" }) => {
  const { cart, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  // Debug log for cart state
  useEffect(() => {
    console.log('🛒 [CartIcon] Cart state changed:', cart);
  }, [cart]);

  // Force cart sync when component mounts (only once)
  useEffect(() => {
    if (user?._id) {
      console.log('🔄 [CartIcon] Force syncing cart with database...');
      fetch(`/api/cart/status?userId=${user._id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('🔄 [CartIcon] Database cart items:', data.cartItems);
            
            // Don't force reload - let the CartContext handle the sync properly
            // The CartContext already handles this sync logic correctly
            console.log('🔄 [CartIcon] Database sync complete, cart will update via CartContext');
          }
        })
        .catch(err => {
          console.warn('[CartIcon] Failed to sync with database:', err);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // NO DEPENDENCIES - only run once on mount, user._id will be null initially
  const handleCheckout = async () => {
    // Prevent multiple simultaneous executions
    if (loading) {
      console.log("🔄 Checkout already in progress, ignoring duplicate call");
      return;
    }
    
    if (!user) {
      setShowAuthWarning(true);
      return;
    }
    if (cart.length === 0) {
      alert("❌ Tu carrito está vacío.");
      return;
    }
    // Validación extra de productos
    const invalid = cart.some(item => !item.id || !item.title || typeof item.price !== 'number' || item.price <= 0 || typeof item.quantity !== 'number' || item.quantity <= 0);
    if (invalid) {
      alert("❌ Hay productos inválidos en tu carrito. El carrito será vaciado. Por favor, agrega los productos nuevamente.");
      localStorage.removeItem("cart");
      window.location.reload();
      return;
    }
    setLoading(true);
    try {
      console.log("🛒 [DEBUG] Starting checkout process for user:", user._id);
      console.log("🛒 [DEBUG] Cart items:", cart);
      console.log("🛒 [DEBUG] Starting checkout at:", new Date().toISOString());
      
      // Proceed directly with payment redirect - /api/payments/redirect will handle order creation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
      
      const startTime = Date.now();
      // Llama al backend y espera la respuesta
      const res = await fetch(`/api/payments/redirect?userId=${user._id}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      console.log("🛒 [DEBUG] Request took:", endTime - startTime, "ms");
      console.log("🛒 [DEBUG] Response status:", res.status);
      
      if (!res.ok) {
        if (res.status === 504) {
          alert("⏰ El servidor está tardando en responder. Por favor, intenta nuevamente en unos momentos.");
          return;
        }
        const errorData = await res.text();
        console.error("🛒 [DEBUG] Error response:", errorData);
        alert("❌ There was an error processing the payment. Please try again.");
        return;
      }
      const data = await res.json();
      console.log("🛒 [DEBUG] Response data:", data);
      
      if (data.redirectUrl) {
        console.log("🛒 [DEBUG] Redirecting to payment gateway:", data.redirectUrl);
        console.log("🛒 [DEBUG] Cart will be cleared only after successful payment");
        window.location.href = data.redirectUrl;
      } else {
        console.error("🛒 [DEBUG] No redirectUrl in response:", data);
        alert("Error en el pago. Intenta de nuevo.");
      }
    } catch (error) {
      console.log("🛒 [DEBUG] Error occurred at:", new Date().toISOString());
      if (error.name === 'AbortError') {
        alert("⏰ La solicitud tardó demasiado tiempo. Por favor, intenta nuevamente.");
      } else {
        console.error("❌ Payment error:", error);
        alert("❌ There was an error processing the payment. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Ícono del Carrito */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative transition"
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? (
          <FaTimes size={24} style={{ color }} />
        ) : (
          <FaShoppingCart size={24} style={{ color }} />
        )}
        {cart.length > 0 && (
          <motion.span
            className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.5 }}
          >
            {cart.length}
          </motion.span>
        )}
      </motion.button>

      {/* Sidebar del Carrito */}
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed left-0 top-0 h-full w-full sm:w-[28rem] bg-white shadow-lg p-6 z-50 overflow-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold dark:text-black">Your Cart</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <FaTimes size={24} />
              </button>
            </div>
            {/* Total y botón para vaciar carrito */}
            {cart.length > 0 && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold dark:text-black">
                  Total: ${isNaN(cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)) ? '0.00' : cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0).toFixed(2)}
                </span>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="text-center">
                <p className="text-gray-500 dark:text-black mb-4">
                Your cart is empty.
              </p>
                
                <button
                  onClick={clearCart}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg flex items-center justify-center"
                  title="Clear all items from cart"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All
                </button>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-300">
                  {cart.map((item) => (
                    <li
                      key={item.id}
                      className="py-3 px-2 min-w-0"
                    >
                      {/* Item Title and Price */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-base mb-1">
                            {item.title}
                            {/* Show instance identifier for multiple packages */}
                            {item.packageDetails && item.packageDetails.uniquePackageId && (
                              <span className="text-xs text-gray-500 ml-2 font-normal">
                                (Instance #{item.packageDetails.uniquePackageId.split('_')[1]?.substring(0, 4) || 'N/A'})
                              </span>
                            )}
                          </h3>
                          <p className="text-lg font-bold text-green-600">
                            ${item.price}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-all duration-200"
                          aria-label="Remove from cart"
                          title="Remove item from cart"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Order Details (if available) */}
                      {item.orderNumber && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-2">
                          <div className="text-sm text-blue-800 font-medium">
                            Order: {item.orderNumber}
                          </div>
                          {item.orderId && (
                            <div className="text-xs text-blue-600">
                              ID: {item.orderId}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Appointment Details (fetch from order if available) */}
                      {item.orderId && (
                        <OrderDetailsComponent orderId={item.orderId} />
                      )}

                      {/* Driving Test Details */}
                      {item.classType === 'driving test' && item.instructorName && item.date && (
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              Driving Test Appointment
                            </h4>
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                              Ready
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 mb-1">
                            <div>
                              <span className="font-medium">Instructor:</span> {item.instructorName}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> {(() => {
                                const dateStr = item.date;
                                const [year, month, day] = dateStr.split('-').map(Number);
                                const date = new Date(year, month - 1, day);
                                return date.toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                });
                              })()}
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium">Time:</span> {item.start} - {item.end}
                            </div>
                          </div>
                          
                          <div className="bg-gray-100 p-1 rounded text-xs text-gray-600">
                            <span className="font-medium">Note:</span> Slot reserved temporarily. Complete checkout to confirm.
                          </div>
                        </div>
                      )}

                      {/* Ticket Class Details */}
                      {item.ticketClassId && (
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              Traffic Law & Substance Abuse Class
                            </h4>
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                              Online
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 mb-1">
                            <div>
                              <span className="font-medium">Course Type:</span> Online Traffic Law Course
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span> 4 Hours
                            </div>

                            {/* Show selected slot date and time if available */}
                            {item.date && item.start && item.end && (
                              <>
                                <div>
                                  <span className="font-medium">Date:</span> {(() => {
                                    try {
                                      let dateStr = item.date;
                                      
                                      // Handle ISO date format (2025-09-11T00:00:00.000Z)
                                      if (dateStr.includes('T')) {
                                        dateStr = dateStr.split('T')[0]; // Extract only the date part
                                      }
                                      
                                      // Parse the date string correctly to avoid timezone issues
                                      const [year, month, day] = dateStr.split('-').map(Number);
                                      const date = new Date(year, month - 1, day); // month is 0-indexed
                                      
                                      return date.toLocaleDateString('en-US', { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric' 
                                      });
                                    } catch (error) {
                                      console.error('Error parsing date:', item.date, error);
                                      return 'Invalid Date';
                                    }
                                  })()}
                                </div>
                                
                                <div>
                                  <span className="font-medium">Time:</span> {item.start} - {item.end}
                                </div>
                              </>
                            )}
                            
                            <div className="col-span-2">
                              <span className="font-medium">Access:</span> Immediate after payment
                            </div>
                          </div>
                          
                          <div className="bg-gray-100 p-1 rounded text-xs text-gray-600">
                            <span className="font-medium">Note:</span> Course access provided via email after payment completion.
                          </div>
                        </div>
                      )}

                      {/* Package Details (for driving lessons without order yet) */}
                      {!item.orderId && item.packageDetails && item.selectedSlots && (
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              Driving Lesson Package
                            </h4>
                            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                              Pending
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 mb-1">
                            <div className="truncate">
                              <span className="font-medium">Pickup:</span> {item.packageDetails.pickupLocation}
                            </div>
                            <div className="truncate">
                              <span className="font-medium">Dropoff:</span> {item.packageDetails.dropoffLocation}
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium">Hours:</span> {item.packageDetails.selectedHours} of {item.packageDetails.totalHours}
                            </div>
                          </div>
                          
                          <div className="mb-1">
                            <div className="flex items-center justify-between bg-white p-1 rounded border border-gray-200 text-xs">
                              {item.slotDetails && item.slotDetails.length > 0 ? (
                                <div className="flex flex-col">
                                  <span className="text-gray-800 font-medium">{item.slotDetails[0].date} • {item.slotDetails[0].start} - {item.slotDetails[0].end}</span>
                                  <span className="text-gray-600">{item.slotDetails[0].instructorName}</span>
                                </div>
                              ) : (
                                <div>
                                  {(() => {
                                    const [date, start, end] = item.selectedSlots[0].split('-');
                                    return <span className="text-gray-800 font-medium">{date} • {start} - {end}</span>;
                                  })()}
                                </div>
                              )}
                              <div className="flex flex-col items-end">
                                <span className="text-xs bg-orange-100 text-orange-700 px-1 py-0.5 rounded mb-0.5">
                                  PENDING
                                </span>
                                {item.selectedSlots && item.selectedSlots.length > 1 && (
                                  <span className="text-xs text-gray-500">
                                    +{item.selectedSlots.length - 1} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-100 p-1 rounded text-xs text-gray-600">
                            <span className="font-medium">Note:</span> Slots reserved temporarily. Complete checkout to confirm.
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                
                {/* Botón de limpiar carrito */}
                <button
                  onClick={clearCart}
                  className="w-full bg-red-500 hover:bg-red-600 text-white mt-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg flex items-center justify-center"
                  title="Clear all items from cart"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Cart
                </button>
                
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white mt-2 py-3 rounded-lg disabled:opacity-50 transition-all duration-200 font-semibold text-base shadow-lg hover:shadow-xl flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Proceed to Checkout
                    </>
                  )}
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
      {/* Modal de advertencia de autenticación */}
      {showAuthWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-600 max-w-md w-full p-8 relative animate-fadeIn">
            <h2 className="text-xl font-bold mb-4 text-red-600 text-center">Authentication Required</h2>
            <p className="mb-4 text-center text-black">You must be logged in to checkout. Please sign in first.</p>
            <button
              className="bg-blue-500 text-white px-6 py-2 rounded mx-auto block"
              onClick={() => setShowAuthWarning(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartIcon;
