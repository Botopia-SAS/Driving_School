"use client";

import React, { useEffect, useState } from "react";
import Modal from "@/components/Modal";

interface SlotInfo {
  date: string;
  start: string;
  end: string;
}

interface ScheduleSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageTitle?: string;
  price?: number;
  slot?: SlotInfo | null;
}

export default function ScheduleSuccessModal({
  isOpen,
  onClose,
  packageTitle,
  price,
  slot
}: ScheduleSuccessModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("(561) 330-7007");

  // Cargar número de teléfono desde la base de datos
  useEffect(() => {
    fetch("/api/phones")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPhoneNumber(data.data.phoneNumber);
        }
      })
      .catch((err) => console.error("Error loading phone:", err));
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md mx-auto">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-extrabold text-center text-green-700 mb-2">Slot Reserved Successfully!</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm mb-4">
          <div className="flex justify-between"><span className="text-gray-600">Package:</span><span className="font-semibold text-gray-800 truncate ml-2">{packageTitle || 'Driving Lesson'}</span></div>
          {typeof price === 'number' && (
            <div className="flex justify-between"><span className="text-gray-600">Price:</span><span className="font-semibold text-gray-800">${price}</span></div>
          )}
          {slot && (
            <div className="flex justify-between"><span className="text-gray-600">Selected:</span><span className="font-semibold text-gray-800">{slot.date} • {slot.start}-{slot.end}</span></div>
          )}
          <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="font-semibold text-orange-600">Pending Payment</span></div>
          <div className="mt-1 text-gray-700">Next Step: Contact us to complete your payment</div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center text-yellow-800 font-semibold mb-1">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 8l10-6 10 6v8l-10 6-10-6V8z" />
            </svg>
            Contact Information
          </div>
          <div className="text-center">
            <div className="text-yellow-900 font-bold">Call us at: {phoneNumber}</div>
            <div className="text-yellow-700 text-sm">Please call to complete your payment and confirm your driving lesson.</div>
          </div>
        </div>

        <p className="text-xs text-gray-600 text-center mb-4">Your slot will be held temporarily. Please contact us within 24 hours to complete the payment, or the slot may become available to other students.</p>

        <div className="flex justify-center">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold">Got it!</button>
        </div>
      </div>
    </Modal>
  );
}



