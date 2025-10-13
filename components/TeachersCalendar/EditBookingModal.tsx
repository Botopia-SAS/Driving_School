'use client';
import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { GooglePlacesAutocomplete } from './GooglePlacesAutocomplete';
import type { Class as CalendarClass } from './types';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: CalendarClass;
  instructorId: string;
  onBookingUpdated: () => void;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  instructorId,
  onBookingUpdated
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>(booking.studentId as string || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [pickupLocation, setPickupLocation] = useState(booking.pickupLocation || '');
  const [dropoffLocation, setDropoffLocation] = useState(booking.dropoffLocation || '');
  const [amount, setAmount] = useState<number>(booking.amount || 0);
  const [paid, setPaid] = useState(booking.paid || false);
  const [loading, setLoading] = useState(false);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/users?type=student');
        const data = await res.json();
        if (Array.isArray(data)) {
          setStudents(data);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    if (isOpen) {
      fetchStudents();
      // Reset form with booking data
      setSelectedStudent(booking.studentId as string || '');
      setPickupLocation(booking.pickupLocation || '');
      setDropoffLocation(booking.dropoffLocation || '');
      setAmount(booking.amount || 0);
      setPaid(booking.paid || false);
    }
  }, [isOpen, booking]);

  // Filter students based on search
  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           student.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSubmit = async () => {
    // No requerir estudiante para permitir guardar slots disponibles
    setLoading(true);

    try {
      const updateData = {
        bookingId: booking.id || booking._id,
        instructorId,
        studentId: selectedStudent || null,
        date: typeof booking.date === 'string' ? booking.date : booking.date.toISOString().split('T')[0],
        start: booking.start,
        end: booking.end,
        classType: booking.classType,
        amount,
        paid,
        pickupLocation: pickupLocation || undefined,
        dropoffLocation: dropoffLocation || undefined,
      };

      console.log('📤 Sending booking update:', updateData);
      console.log('📋 Original booking object:', booking);

      const res = await fetch('/api/booking/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      console.log('📥 Response status:', res.status);

      if (res.ok) {
        const result = await res.json();
        console.log('✅ Update successful:', result);
        alert('Class updated successfully!');
        onBookingUpdated();
        onClose();
      } else {
        const error = await res.json();
        console.error('❌ Update error:', error);
        alert(error.message || error.error || 'Failed to update class');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Error updating class: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/booking/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id || booking._id,
          instructorId,
          date: typeof booking.date === 'string' ? booking.date : booking.date.toISOString().split('T')[0],
          start: booking.start,
          end: booking.end,
        }),
      });

      if (res.ok) {
        alert('Class deleted successfully!');
        onBookingUpdated();
        onClose();
      } else {
        const error = await res.json();
        console.error('Delete error:', error);
        alert(error.message || error.error || 'Failed to delete class');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Error deleting class: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Class</h2>

        {/* Date and Time Info */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600">Date: <span className="font-semibold">{typeof booking.date === 'string' ? new Date(booking.date).toLocaleDateString() : booking.date.toLocaleDateString()}</span></p>
          <p className="text-sm text-gray-600">Time: <span className="font-semibold">{booking.start} - {booking.end}</span></p>
          <p className="text-sm text-gray-600">Class Type: <span className="font-semibold capitalize">{booking.classType}</span></p>
        </div>

        {/* Student Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Student <span className="text-gray-400 text-xs">(Optional - leave empty for available slot)</span>
          </label>
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-black"
          />
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
          >
            <option value="">-- No student (Available slot) --</option>
            {filteredStudents.map((student) => (
              <option key={student._id} value={student._id}>
                {student.firstName} {student.lastName} ({student.email})
              </option>
            ))}
          </select>
        </div>

        {/* Locations - only for driving lessons and tests */}
        {(booking.classType === 'driving lesson' || booking.classType === 'driving test') && (
          <>
            <div className="mb-4">
              <GooglePlacesAutocomplete
                label="Pickup Location"
                value={pickupLocation}
                onChange={setPickupLocation}
                placeholder="Enter pickup location"
              />
            </div>

            <div className="mb-4">
              <GooglePlacesAutocomplete
                label="Dropoff Location"
                value={dropoffLocation}
                onChange={setDropoffLocation}
                placeholder="Enter dropoff location"
              />
            </div>
          </>
        )}

        {/* Payment Info */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Amount ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-semibold text-gray-700">Mark as Paid</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Updating...' : 'Update Class'}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
