"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { formatDateForDisplay } from "@/utils/dateFormat";
import TermsCheckbox from "@/components/TermsCheckbox";

interface TicketClassBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTicketClass: {
    _id: string;
    date: string;
    hour: string;
    endHour: string;
    classInfo?: {
      _id: string;
      title: string;
    };
    instructorInfo?: {
      _id: string;
      name: string;
    };
  } | null;
  classPrice: number | null;
  paymentMethod: 'online' | 'instructor';
  setPaymentMethod: (method: 'online' | 'instructor') => void;
  isOnlinePaymentLoading: boolean;
  isProcessingBooking: boolean;
  onConfirm: () => void;
  userId: string | null;
}

export default function TicketClassBookingModal({
  isOpen,
  onClose,
  selectedTicketClass,
  classPrice,
  paymentMethod,
  setPaymentMethod,
  isOnlinePaymentLoading,
  isProcessingBooking,
  onConfirm,
  userId
}: TicketClassBookingModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Reset terms when modal opens
  useEffect(() => {
    if (isOpen) {
      setTermsAccepted(false);
    }
  }, [isOpen]);

  if (!selectedTicketClass) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 text-black">
        <h2 className="text-xl font-bold mb-4 text-blue-600">Book Class</h2>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <p className="text-sm text-gray-600">Class</p>
              <p className="font-semibold">{selectedTicketClass.classInfo?.title || 'Unknown Class'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-semibold">
                {selectedTicketClass.endHour && selectedTicketClass.hour ?
                  `${Math.abs(new Date(`2000-01-01T${selectedTicketClass.endHour}`).getTime() - new Date(`2000-01-01T${selectedTicketClass.hour}`).getTime()) / (1000 * 60 * 60)} hours` :
                  'TBD'
                }
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold">{formatDateForDisplay(selectedTicketClass.date)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-semibold">{selectedTicketClass.hour} - {selectedTicketClass.endHour}</p>
            </div>

            <div className="col-span-2">
              <p className="text-sm text-gray-600">Price</p>
              <p className="text-green-600 font-bold text-lg">${classPrice || 'TBD'}</p>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Select Payment Method</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="online"
                checked={paymentMethod === 'online'}
                onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'instructor')}
                className="mr-2"
              />
              <span className="text-green-600 font-medium">Add to Cart</span>
              <span className="text-sm text-gray-500 ml-2">(Add to cart for online payment)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="instructor"
                checked={paymentMethod === 'instructor'}
                onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'instructor')}
                className="mr-2"
              />
              <span className="text-blue-600 font-medium">Pay at Location</span>
              <span className="text-sm text-gray-500 ml-2">(Pay when you arrive)</span>
            </label>
          </div>
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="mb-4">
          <TermsCheckbox
            isChecked={termsAccepted}
            onChange={setTermsAccepted}
            className="justify-center"
          />
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <button
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            onClick={onClose}
            disabled={isOnlinePaymentLoading || isProcessingBooking}
          >
            Cancel
          </button>
          
          <button
            className={`px-6 py-2 rounded font-medium transition-all ${
              !termsAccepted || isOnlinePaymentLoading || isProcessingBooking
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : paymentMethod === 'online'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            onClick={onConfirm}
            disabled={!termsAccepted || isOnlinePaymentLoading || isProcessingBooking}
          >
            {isOnlinePaymentLoading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </span>
            ) : isProcessingBooking ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </span>
            ) : paymentMethod === 'online' ? (
              'Add to Cart'
            ) : (
              'Reserve & Pay Later'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
