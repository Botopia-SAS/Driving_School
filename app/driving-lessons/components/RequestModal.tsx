"use client";

import React, { useRef, useState, useEffect } from "react";
import Modal from "@/components/Modal";
import LocationInput from "@/components/LocationInput";
import { useJsApiLoader } from "@react-google-maps/api";
import TermsCheckbox from "@/components/TermsCheckbox";

// Google Maps configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const LIBRARIES: "places"[] = ["places"];

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

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: Product | null;
  selectedHours: number;
  onRequestSchedule: (pickupLocation: string, dropoffLocation: string, paymentMethod: 'online' | 'local') => Promise<void>;
}

export default function RequestModal({
  isOpen,
  onClose,
  selectedProduct,
  selectedHours,
  onRequestSchedule
}: RequestModalProps) {
  // Google Maps states
  const [pickupLocation, setPickupLocation] = useState<string>("");
  const [dropoffLocation, setDropoffLocation] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'local'>('online');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTermsAccepted(false);
      console.log('🎯 [REQUEST MODAL] Modal opened');
    }
  }, [isOpen]);
  const pickupAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const dropoffAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    preventGoogleFontsLoading: true,
  });

  // Google Maps Autocomplete handlers
  const onPickupLoad = (autocomplete: google.maps.places.Autocomplete) => {
    pickupAutocompleteRef.current = autocomplete;
  };

  const onPickupPlaceChanged = () => {
    if (pickupAutocompleteRef.current) {
      const place = pickupAutocompleteRef.current.getPlace();
      if (place?.formatted_address) {
        setPickupLocation(place.formatted_address);
      }
    }
  };

  const onDropoffLoad = (autocomplete: google.maps.places.Autocomplete) => {
    dropoffAutocompleteRef.current = autocomplete;
  };

  const onDropoffPlaceChanged = () => {
    if (dropoffAutocompleteRef.current) {
      const place = dropoffAutocompleteRef.current.getPlace();
      if (place?.formatted_address) {
        setDropoffLocation(place.formatted_address);
      }
    }
  };

  const handleRequestSchedule = async () => {
    if (!pickupLocation.trim() || !dropoffLocation.trim()) {
      alert("Please fill in both pickup and dropoff locations.");
      return;
    }
    
    if (!termsAccepted) {
      alert('Please accept the terms and conditions to continue.');
      return;
    }

    setIsLoading(true);
    try {
      await onRequestSchedule(pickupLocation, dropoffLocation, paymentMethod);
      onClose();
      // Reset form
      setPickupLocation("");
      setDropoffLocation("");
      setPaymentMethod('online');
      setTermsAccepted(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-3 text-gray-800 text-center">Schedule Request</h2>
        
        {selectedProduct && (
          <div className="bg-gray-50 p-2.5 rounded-lg mb-2.5 border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-800 mb-1.5">Package Summary</h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Package:</span>
                <span className="font-medium text-gray-800 truncate ml-2">{selectedProduct.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium text-gray-800">${selectedProduct.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hours:</span>
                <span className="font-medium text-gray-800">{selectedHours}/{selectedProduct.duration || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${selectedHours === (selectedProduct.duration || 0) ? 'text-green-600' : 'text-orange-600'}`}>
                  {selectedHours === (selectedProduct.duration || 0) ? "Complete" : "Partial"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-2.5">
          <h3 className="text-xs font-semibold text-gray-800 mb-1.5">Payment Method</h3>
          <div className="space-y-1.5">
            <label className="flex items-center p-2 border border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer">
              <input
                type="radio"
                value="online"
                checked={paymentMethod === 'online'}
                onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'local')}
                className="mr-2 text-green-600 focus:ring-green-500"
              />
              <div>
                <div className="font-semibold text-green-600 text-xs">Pay Online Now</div>
                <div className="text-xs text-gray-600">Add to cart and pay securely online</div>
              </div>
            </label>
            
            <label className="flex items-center p-2 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
              <input
                type="radio"
                value="local"
                checked={paymentMethod === 'local'}
                onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'local')}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-blue-600 text-xs">Pay at Location</div>
                <div className="text-xs text-gray-600">Complete payment when you arrive</div>
              </div>
            </label>
            
          </div>
        </div>

        <div className="mb-2.5">
          <h3 className="text-xs font-semibold text-gray-800 mb-1.5">Location Details</h3>
          
          <div className="space-y-1.5">
            <LocationInput
              label="Pickup Location *"
              value={pickupLocation}
              onChange={setPickupLocation}
              onLoad={onPickupLoad}
              onPlaceChanged={onPickupPlaceChanged}
              placeholder="Enter pickup location"
              isLoaded={isLoaded}
            />
            
            <LocationInput
              label="Drop-off Location *"
              value={dropoffLocation}
              onChange={setDropoffLocation}
              onLoad={onDropoffLoad}
              onPlaceChanged={onDropoffPlaceChanged}
              placeholder="Enter drop-off location"
              isLoaded={isLoaded}
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-2.5 rounded-lg mb-2.5 border border-blue-200">
          <h3 className="text-xs font-semibold text-blue-800 mb-1">Contact Information</h3>
          <p className="text-blue-700 text-xs mb-1.5">
            Please contact our team to finalize the process and coordinate your schedule.
          </p>
          <div className="bg-white p-2 rounded-lg border border-blue-300">
            <div className="text-center">
              <p className="text-blue-800 font-semibold text-xs">
                Call us: <span className="text-sm font-bold text-blue-900">{phoneNumber}</span>
              </p>
              <p className="text-blue-600 text-xs">
                Our team is ready to help you complete your booking.
              </p>
            </div>
          </div>
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="mb-4 mt-4">
          <TermsCheckbox
            isChecked={termsAccepted}
            onChange={setTermsAccepted}
            className="justify-center"
          />
        </div>

        <div className="flex justify-center gap-2 mt-3">
          <button
            className="bg-gray-500 text-white px-4 py-1.5 rounded-lg hover:bg-gray-600 transition-colors font-semibold text-xs min-w-[80px]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-1.5 rounded-lg font-semibold transition-colors text-xs min-w-[120px] ${
              pickupLocation.trim() && dropoffLocation.trim() && termsAccepted && !isLoading
                ? paymentMethod === 'online' 
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            onClick={handleRequestSchedule}
            disabled={!pickupLocation.trim() || !dropoffLocation.trim() || !termsAccepted || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              paymentMethod === 'online' 
                ? 'Add to Cart & Checkout' 
                : 'Request Schedule'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
