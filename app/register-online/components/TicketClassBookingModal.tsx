"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { formatDateForDisplay } from "@/utils/dateFormat";

interface Location {
  _id: string;
  title: string;
  zone: string;
}

interface TicketClassBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTicketClass: {
    _id: string;
    date: string;
    hour: string;
    endHour: string;
    locationId?: string;
    locationData?: {
      _id: string;
      title: string;
      zone: string;
    };
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
  const [location, setLocation] = useState<Location | null>(null);

  // Load location when modal opens
  useEffect(() => {
    if (isOpen) {
      // Use precached location data if available
      if (selectedTicketClass?.locationData) {
        setLocation(selectedTicketClass.locationData);
      } else if (selectedTicketClass?.locationId) {
        // Fallback to loading location if not precached
        loadLocation(selectedTicketClass.locationId);
      }
    }
  }, [isOpen, selectedTicketClass?.locationId, selectedTicketClass?.locationData]);

  const loadLocation = async (locationId: string) => {
    try {
      const response = await fetch(`/api/locations/${locationId}`);
      if (response.ok) {
        const locationData = await response.json();
        setLocation(locationData);
      }
    } catch (error) {
      console.error('Error loading location:', error);
    }
  };

  if (!selectedTicketClass) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 text-black">
        <h2 className="text-xl font-bold mb-4 text-blue-600">Book Class</h2>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="mb-2">
                <strong>Class:</strong> {selectedTicketClass.classInfo?.title || 'Unknown Class'}
              </p>
              <p className="mb-2">
                <strong>Date:</strong> {formatDateForDisplay(selectedTicketClass.date)}
              </p>
              <p className="mb-2">
                <strong>Time:</strong> {selectedTicketClass.hour} - {selectedTicketClass.endHour}
              </p>
              <p className="mb-2">
                <strong>Price:</strong> <span className="text-green-600 font-bold">${classPrice || 'TBD'}</span>
              </p>
            </div>
            
            <div>
              <p className="mb-2">
                <strong>Duration:</strong> {selectedTicketClass.endHour && selectedTicketClass.hour ? 
                  `${Math.abs(new Date(`2000-01-01T${selectedTicketClass.endHour}`).getTime() - new Date(`2000-01-01T${selectedTicketClass.hour}`).getTime()) / (1000 * 60 * 60)} hours` : 
                  'TBD'
                }
              </p>
              <p className="mb-2">
                <strong>Class Type:</strong> <span className="text-blue-600">Ticket Class</span>
              </p>
              <p className="mb-2">
                <strong>Status:</strong> <span className="text-green-600">Available</span>
              </p>
              <p className="mb-2">
                <strong>Location:</strong> <span className="text-blue-600">{location?.zone || 'Loading...'}</span>
              </p>
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
              isOnlinePaymentLoading || isProcessingBooking
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : paymentMethod === 'online'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            onClick={onConfirm}
            disabled={isOnlinePaymentLoading || isProcessingBooking}
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
