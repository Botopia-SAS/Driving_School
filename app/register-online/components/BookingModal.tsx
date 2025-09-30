"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import TermsCheckbox from "@/components/TermsCheckbox";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: {
    start: string;
    end: string;
    date: string;
    ticketClassId?: string;
  } | null;
  selectedInstructor: {
    _id: string;
    name: string;
  } | null;
  selectedClassType: string;
  userId: string;
  onRegister: () => Promise<void>;
  onShowLogin: () => void;
  getCompleteClassInfo: (ticketClassId: string) => any;
  isDataLoading: boolean;
}

export default function BookingModal({
  isOpen,
  onClose,
  selectedSlot,
  selectedInstructor,
  selectedClassType,
  userId,
  onRegister,
  onShowLogin,
  getCompleteClassInfo,
  isDataLoading
}: BookingModalProps) {
  const [modalInfo, setModalInfo] = useState<{
    className?: string;
    price?: number;
    locationName?: string;
    cupos?: number;
    registeredCount?: number;
  }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Reset terms state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTermsAccepted(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedSlot?.ticketClassId || isDataLoading) {
      setIsLoading(true);
      return;
    }

    try {
      const completeInfo = getCompleteClassInfo(selectedSlot.ticketClassId);
      
      if (completeInfo) {
        setModalInfo({
          className: completeInfo.className,
          price: completeInfo.price,
          locationName: completeInfo.locationName,
          cupos: completeInfo.cupos,
          registeredCount: completeInfo.registeredCount
        });
        setIsLoading(false);
      } else {
        // Si no hay info disponible, mantener loading
        setIsLoading(true);
      }
    } catch (error) {
      console.error('Error getting class info:', error);
      setIsLoading(true);
    }
  }, [isOpen, selectedSlot?.ticketClassId, getCompleteClassInfo, isDataLoading]);

  const handleClose = () => {
    onClose();
    setModalInfo({});
    setIsLoading(true);
  };

  // No mostrar el modal si los datos aún se están cargando
  if (!isOpen || isDataLoading || isLoading) {
    return isOpen ? (
      <Modal isOpen={true} onClose={handleClose}>
        <div className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
          <h2 className="text-lg font-semibold text-gray-700">Loading class information...</h2>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the details</p>
        </div>
      </Modal>
    ) : null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 text-black">
        <h2 className="text-xl font-bold mb-4 text-blue-600">Class Information</h2>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="mb-2">
                <strong>Class:</strong> {modalInfo.className}
              </p>
              <p className="mb-2">
                <strong>Instructor:</strong> {selectedInstructor?.name}
              </p>
              <p className="mb-2">
                <strong>Date:</strong> {selectedSlot?.date}
              </p>
              <p className="mb-2">
                <strong>Time:</strong> {selectedSlot?.start} - {selectedSlot?.end}
              </p>
            </div>
            
            <div>
              <p className="mb-2">
                <strong>Location:</strong> {modalInfo.locationName}
              </p>
              <p className="mb-2">
                <strong>Price:</strong> ${modalInfo.price}
              </p>
              <p className="mb-2">
                <strong>Available Spots:</strong> {(modalInfo.cupos || 0) - (modalInfo.registeredCount || 0)} / {modalInfo.cupos}
              </p>
              <p className="text-sm text-blue-600">
                <strong>Class Type:</strong> {selectedClassType}
              </p>
            </div>
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
            onClick={handleClose}
          >
            Close
          </button>
          
          {userId && (
            <button
              className={`px-6 py-2 rounded transition-all ${
                !termsAccepted 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              onClick={onRegister}
              disabled={!termsAccepted}
            >
              Register for Class
            </button>
          )}
          
          {!userId && (
            <button
              className={`px-6 py-2 rounded transition-all ${
                !termsAccepted 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              onClick={() => {
                if (termsAccepted) {
                  handleClose();
                  onShowLogin();
                }
              }}
              disabled={!termsAccepted}
            >
              Login to Register
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
