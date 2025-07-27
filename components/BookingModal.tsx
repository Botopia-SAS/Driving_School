import React from "react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: any;
  selectedInstructor: any;
  paymentMethod: 'online' | 'instructor';
  setPaymentMethod: (method: 'online' | 'instructor') => void;
  isOnlinePaymentLoading: boolean;
  isProcessingBooking: boolean;
  onConfirm: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedSlot,
  selectedInstructor,
  paymentMethod,
  setPaymentMethod,
  isOnlinePaymentLoading,
  isProcessingBooking,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={onClose}
    >
             <div 
         className="relative bg-white text-black rounded-lg shadow-2xl border border-[#e0e0e0] flex flex-col"
         style={{
           minWidth: '350px',
           maxWidth: '350px',
           width: '350px',
           minHeight: '350px'
         }}
         onClick={(e) => e.stopPropagation()}
       >
        {/* Botón de cierre */}
        <button
          onClick={onClose}
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
           <h2 className="text-xl font-bold mb-4 text-center">Confirm Driving Test Appointment</h2>
          
                     <div className="bg-blue-50 p-4 rounded-lg mb-4 flex-1">
             <div className="text-center space-y-2">
               <p className="text-base">
                 <strong>Instructor:</strong> {selectedSlot?.instructorName || selectedInstructor?.name || 'Not specified'}
               </p>
               <p className="text-base">
                 <strong>Amount:</strong> ${selectedSlot?.amount || 50}
               </p>
               <p className="text-base">
                 <strong>Date:</strong> {selectedSlot?.date}
               </p>
               <p className="text-base">
                 <strong>Time:</strong> {selectedSlot?.start} - {selectedSlot?.end}
               </p>
               <p className="text-base text-blue-600">
                 <strong>Service:</strong> Driving Test
               </p>
             </div>
           </div>

                     {/* Payment Method Selection */}
           <div className="mb-4">
             <h3 className="text-base font-semibold mb-3 text-center">Payment Method:</h3>
             <div className="flex flex-col gap-2">
               <label className="flex items-center justify-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200">
                                   <input
                    type="radio"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'instructor')}
                    className="mr-2"
                  />
                 <span className="font-medium text-sm">Pay Online (Add to Cart)</span>
               </label>
               <label className="flex items-center justify-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200">
                                   <input
                    type="radio"
                    value="instructor"
                    checked={paymentMethod === 'instructor'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'instructor')}
                    className="mr-2"
                  />
                 <span className="font-medium text-sm">Pay at Location</span>
               </label>
             </div>
           </div>

                     <div className="mt-4 flex justify-between gap-3">
             <button
               className="flex-1 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium text-sm"
               onClick={onClose}
             >
               Cancel
             </button>
             <button
               className="flex-1 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium text-sm"
               disabled={isOnlinePaymentLoading || isProcessingBooking}
               onClick={onConfirm}
             >
              {isOnlinePaymentLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-blue-500 rounded-full"></span> 
                  Adding to cart...
                </span>
              ) : isProcessingBooking ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-blue-500 rounded-full"></span> 
                  Reserving slot...
                </span>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal; 