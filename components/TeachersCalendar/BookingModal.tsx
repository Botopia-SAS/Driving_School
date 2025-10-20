'use client';
import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { CreateStudentModal } from './CreateStudentModal';
import { GooglePlacesAutocomplete } from './GooglePlacesAutocomplete';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedTime: string | null;
  instructorId: string;
  instructorCapabilities?: string[];
  onBookingCreated: () => void;
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  instructorId,
  instructorCapabilities = [],
  onBookingCreated
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [classType, setClassType] = useState<string>('driving lesson');
  const [duration, setDuration] = useState<number>(1);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [amount, setAmount] = useState<string>('0');
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreateStudent, setShowCreateStudent] = useState(false);

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
    }
  }, [isOpen]);

  // Filter students based on search
  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           student.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Available class types based on instructor capabilities
  const getAvailableClassTypes = () => {
    const types: { value: string; label: string }[] = [];

    // Check for canTeachDrivingLesson capability
    if (instructorCapabilities.includes('canTeachDrivingLesson') ||
        instructorCapabilities.includes('driving_lesson') ||
        instructorCapabilities.includes('drivingLesson')) {
      types.push({ value: 'driving lesson', label: 'Driving Lesson' });
    }

    // Check for canTeachDrivingTest capability
    if (instructorCapabilities.includes('canTeachDrivingTest') ||
        instructorCapabilities.includes('driving_test') ||
        instructorCapabilities.includes('drivingTest')) {
      types.push({ value: 'driving test', label: 'Driving Test' });
    }

    // Check for canTeachTicketClass capability
    if (instructorCapabilities.includes('canTeachTicketClass') ||
        instructorCapabilities.includes('ticket_class') ||
        instructorCapabilities.includes('ticketClass')) {
      types.push({ value: 'ticket class', label: 'Ticket Class' });
      types.push({ value: 'D.A.T.E.', label: 'D.A.T.E.' });
      types.push({ value: 'A.D.I.', label: 'A.D.I.' });
      types.push({ value: 'B.D.I.', label: 'B.D.I.' });
    }

    return types.length > 0 ? types : [{ value: 'driving lesson', label: 'Driving Lesson' }];
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !selectedDate || !selectedTime) {
      alert('Please select a student and ensure date/time are set');
      return;
    }

    setLoading(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const endHour = hours + duration;
      const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      const bookingData = {
        studentId: selectedStudent,
        instructorId,
        date: selectedDate.toISOString().split('T')[0],
        start: selectedTime,
        end: endTime,
        classType,
        amount: parseFloat(amount) || 0,
        paid,
        pickupLocation: pickupLocation || undefined,
        dropoffLocation: dropoffLocation || undefined,
      };

      console.log('Sending booking data:', bookingData);

      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      console.log('Response status:', res.status);

      if (res.ok) {
        alert('Class scheduled successfully!');
        onBookingCreated();
        resetForm();
        onClose();
      } else {
        const error = await res.json();
        console.error('Booking error:', error);
        alert(error.message || error.error || 'Failed to schedule class');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error scheduling class: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedStudent('');
    setSearchTerm('');
    setClassType('driving lesson');
    setDuration(1);
    setPickupLocation('');
    setDropoffLocation('');
    setAmount('0');
    setPaid(false);
  };

  const availableTypes = getAvailableClassTypes();

  const handleStudentCreated = async (studentId: string) => {
    // Refresh students list
    const res = await fetch('/api/users?type=student');
    const data = await res.json();
    if (Array.isArray(data)) {
      setStudents(data);
    }
    // Select the newly created student
    setSelectedStudent(studentId);
    setShowCreateStudent(false);
  };

  if (showCreateStudent) {
    return (
      <CreateStudentModal
        isOpen={isOpen}
        onClose={() => {
          setShowCreateStudent(false);
          onClose();
        }}
        onStudentCreated={handleStudentCreated}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Schedule New Class</h2>

        {/* Date and Time Info */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600">Date: <span className="font-semibold">{selectedDate?.toLocaleDateString()}</span></p>
          <p className="text-sm text-gray-600">Start Time: <span className="font-semibold">{selectedTime}</span></p>
        </div>

        {/* Student Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Student</label>
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
            <option value="">-- Select a student --</option>
            {filteredStudents.map((student) => (
              <option key={student._id} value={student._id}>
                {student.firstName} {student.lastName} ({student.email})
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateStudent(true)}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            + Create New Student
          </button>
        </div>

        {/* Class Type */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Class Type</label>
          <select
            value={classType}
            onChange={(e) => setClassType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
          >
            {availableTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (hours)</label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={duration}
            onChange={(e) => setDuration(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black"
          />
        </div>

        {/* Locations - only for driving lessons and tests */}
        {(classType === 'driving lesson' || classType === 'driving test') && (
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
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const value = e.target.value;
              // Allow only numbers and one decimal point
              if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                setAmount(value);
              }
            }}
            onBlur={(e) => {
              // Format on blur to ensure valid number
              const num = parseFloat(e.target.value);
              if (isNaN(num) || num < 0) {
                setAmount('0');
              } else {
                setAmount(num.toFixed(2));
              }
            }}
            placeholder="0.00"
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
            {loading ? 'Scheduling...' : 'Schedule Class'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
