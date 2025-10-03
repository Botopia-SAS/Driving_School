"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import TermsCheckbox from "@/components/TermsCheckbox";

interface Instructor {
  _id: string;
  name: string;
  photo?: string;
  email?: string;
  canTeachDrivingLesson?: boolean;
}

interface ScheduleEntry {
  date: string;
  start: string;
  end: string;
  status: string;
  classType?: string;
  pickupLocation?: string;
  dropOffLocation?: string;
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

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: Product | null;
  selectedSlot: ScheduleEntry | null;
  selectedTimeSlot: SelectedTimeSlot | null;
  selectedInstructor: Instructor | null;
  onInstructorSelect: (instructor: Instructor | null) => void;
  onBookPackage: (paymentMethod: 'online' | 'location') => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  selectedProduct,
  selectedSlot,
  selectedTimeSlot,
  selectedInstructor,
  onInstructorSelect,
  onBookPackage
}: BookingModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'location'>('online');
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTermsAccepted(false);
      setPaymentMethod('online');
    }
  }, [isOpen]);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 text-black">
        <h2 className="text-xl font-bold mb-4 text-blue-600">Confirm Booking</h2>
        {selectedProduct && selectedSlot && selectedTimeSlot && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="mb-2"><strong>Package:</strong> {selectedProduct.title}</p>
            <p className="mb-2"><strong>Price:</strong> ${selectedProduct.price}</p>
            {selectedProduct.duration && (
              <p className="mb-2"><strong>Duration:</strong> {selectedProduct.duration} hours</p>
            )}
            
            {/* Instructor selector if multiple available */}
            {selectedTimeSlot.instructors.length > 1 ? (
              <div className="mb-2">
                <label className="block font-semibold mb-1">Select Instructor:</label>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={selectedInstructor?._id || ''}
                  onChange={e => {
                    const id = e.target.value;
                    const found = selectedTimeSlot.instructors.find(i => i._id === id);
                    onInstructorSelect(found || null);
                  }}
                >
                  <option value="">Choose an instructor...</option>
                  {selectedTimeSlot.instructors.map((inst) => (
                    <option key={inst._id} value={inst._id}>{inst.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="mb-2"><strong>Instructor:</strong> {selectedTimeSlot.instructors[0]?.name}</p>
            )}
            
            <p className="mb-2"><strong>Date:</strong> {selectedTimeSlot.date}</p>
            <p className="mb-2"><strong>Time:</strong> {selectedTimeSlot.start} - {selectedTimeSlot.end}</p>
            <p className="mb-2"><strong>Description:</strong> {selectedProduct.description}</p>
          </div>
        )}
        
        {/* Payment Method Selection */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 text-center">Select Payment Method</h3>
          <div className="space-y-2">
            <label className="flex items-center justify-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
              <input
                type="radio"
                name="paymentMethod"
                value="online"
                checked={paymentMethod === 'online'}
                onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'location')}
                className="mr-2"
              />
              <span className="text-green-600 font-medium">Add to Cart (Pay Online)</span>
            </label>
            <label className="flex items-center justify-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
              <input
                type="radio"
                name="paymentMethod"
                value="location"
                checked={paymentMethod === 'location'}
                onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'location')}
                className="mr-2"
              />
              <span className="text-blue-600 font-medium">Pay at Location</span>
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
        
        <div className="flex justify-center gap-3">
          <button
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`px-6 py-2 rounded transition-all ${
              !termsAccepted || !!(selectedTimeSlot && selectedTimeSlot.instructors.length > 1 && !selectedInstructor)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : paymentMethod === 'online'
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            onClick={() => onBookPackage(paymentMethod)}
            disabled={!termsAccepted || !!(selectedTimeSlot && selectedTimeSlot.instructors.length > 1 && !selectedInstructor)}
          >
            {paymentMethod === 'online' ? 'Add to Cart' : 'Schedule & Pay Later'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
