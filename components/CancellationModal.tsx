import React from "react";

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotDetails: {
    date: string;
    start: string;
    end: string;
    amount: number;
    instructorName: string;
    status: string;
  } | null;
  onConfirmCancel: () => void;
  isProcessing: boolean;
}

const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  onClose,
  slotDetails,
  onConfirmCancel,
  isProcessing
}) => {
  if (!isOpen || !slotDetails) return null;

  // For "pending" slots (Pay at Location), always free cancellation
  // For "booked" slots, check if more than 48 hours away
  const isPendingSlot = slotDetails.status === 'pending';

  let isMoreThan48Hours = false;
  if (!isPendingSlot) {
    const bookingDateTime = new Date(`${slotDetails.date}T${slotDetails.start}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    isMoreThan48Hours = hoursUntilBooking > 48;
  }

  // Free cancellation if: pending slot OR booked slot with more than 48 hours
  const isFreeCancellation = isPendingSlot || isMoreThan48Hours;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={onClose}
    >
      <div
        className="relative bg-white text-black rounded-lg shadow-2xl border border-[#e0e0e0] flex flex-col"
        style={{
          minWidth: '420px',
          maxWidth: '420px',
          width: '420px',
          minHeight: '300px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
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
          <h2 className="text-xl font-bold mb-4 text-center text-red-600">Cancel Your Booking</h2>

          {/* Booking Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm mb-2"><strong>Instructor:</strong> {slotDetails.instructorName}</p>
            <p className="text-sm mb-2"><strong>Date:</strong> {slotDetails.date}</p>
            <p className="text-sm mb-2"><strong>Time:</strong> {slotDetails.start} - {slotDetails.end}</p>
            <p className="text-sm"><strong>Amount:</strong> ${slotDetails.amount}</p>
          </div>

          {/* Cancellation Policy Information */}
          {isFreeCancellation ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg className="h-6 w-6 text-green-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-green-800 font-semibold mb-1">Free Cancellation</h3>
                  <p className="text-green-700 text-sm">
                    {isPendingSlot
                      ? 'This is a pending reservation. You can cancel without any charges.'
                      : 'Your booking is more than 48 hours away. You can cancel without any charges.'
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg className="h-6 w-6 text-red-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.732-1.333-2.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-semibold mb-1">Cancellation with Fee</h3>
                  <p className="text-red-700 text-sm">
                    Your booking is less than 48 hours away. Cancellation will incur a fee.
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-gray-600 text-sm text-center mb-4">
            Are you sure you want to cancel this booking?
          </p>

          {/* Action Buttons */}
          <div className="mt-auto flex justify-between gap-3">
            <button
              className="flex-1 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium text-sm"
              onClick={onClose}
              disabled={isProcessing}
            >
              Keep Booking
            </button>
            <button
              className={`flex-1 px-6 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
              disabled={isProcessing}
              onClick={onConfirmCancel}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-red-500 rounded-full"></span>
                  Cancelling...
                </span>
              ) : (
                'Yes, Cancel Booking'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationModal;
