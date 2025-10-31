"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";

interface Instructor {
  _id: string;
  name: string;
  photo?: string;
}

interface Zone {
  _id: string;
  title: string;
  zone: string;
  locationImage?: string;
  description?: string;
  instructors?: Instructor[];
  instructorsDetails?: Instructor[];
}

const LocationDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [locationData, setLocationData] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("(561) 969-0150");

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

  useEffect(() => {
    const fetchLocationDetail = async () => {
      try {
        const res = await fetch(`/api/locations/${id}`);
        const data = await res.json();

        console.log("📍 Location data:", data);
        console.log("📍 Instructors:", data.instructors);

        // Los instructores ya vienen populados desde la API
        setLocationData({ ...data, instructorsDetails: data.instructors || [] });
      } catch (error) {
        console.error("❌ Error fetching location details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLocationDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <section className="bg-gray-50 pt-[200px] pb-20 px-4 sm:px-6 md:px-12 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500 text-lg">Loading location details...</p>
        </div>
      </section>
    );
  }

  if (!locationData) {
    return (
      <section className="bg-gray-50 pt-[200px] pb-20 px-4 sm:px-6 md:px-12 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500 text-lg">Location not found.</p>
          <div className="text-center mt-6">
            <button
              onClick={() => router.push("/locations")}
              className="bg-[#0056b3] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#004494] transition"
            >
              Back to Locations
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 pt-[180px] pb-20 px-4 sm:px-6 lg:px-12 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back Button */}
          <div className="px-6 sm:px-8 lg:px-12 pt-6">
            <button
              onClick={() => router.push("/locations")}
              className="flex items-center gap-2 text-[#0056b3] hover:text-[#004494] font-semibold transition"
            >
              <FaArrowLeft />
              Back to Locations
            </button>
          </div>

          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#0056b3] to-[#004494] px-6 sm:px-8 lg:px-12 py-8 mt-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mb-2">
              {locationData.title}
            </h1>
            <p className="text-blue-100 text-center text-lg">Main Office</p>
          </div>

          {/* Content */}
          <div className="px-6 sm:px-8 lg:px-12 py-10">
            {/* Location Image */}
            {locationData.locationImage && (
              <div className="w-full flex items-center justify-center mb-10">
                <div className="w-48 h-48 sm:w-56 sm:h-56 relative">
                  <Image
                    src={locationData.locationImage}
                    alt={locationData.title}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {/* Location Info Card */}
            <div className="mb-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 sm:p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Location Info</h2>

              {/* Contact Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <span className="inline-block w-6 h-6 flex-shrink-0 mt-1">
                    <svg width="24" height="24" fill="none" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="9" stroke="#1A7F5A" strokeWidth="2"/>
                      <path d="M10 4C7.23858 4 5 6.23858 5 9C5 12.75 10 17 10 17C10 17 15 12.75 15 9C15 6.23858 12.7614 4 10 4Z" fill="#1A7F5A"/>
                      <circle cx="10" cy="9" r="2" fill="white"/>
                    </svg>
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-600 text-sm font-medium mb-1">Phone</p>
                    <button
                      onClick={() => router.push('/contact')}
                      className="text-[#0056b3] hover:text-[#004494] font-semibold text-lg hover:underline"
                    >
                      {phoneNumber}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <span className="inline-block w-6 h-6 flex-shrink-0 mt-1">
                    <svg width="24" height="24" fill="none" viewBox="0 0 20 20">
                      <rect x="2" y="4" width="16" height="12" rx="2" fill="#1A7F5A"/>
                      <path d="M2 4L10 12L18 4" stroke="white" strokeWidth="2"/>
                    </svg>
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-600 text-sm font-medium mb-1">Email</p>
                    <button
                      onClick={() => router.push('/contact')}
                      className="text-[#0056b3] hover:text-[#004494] font-semibold hover:underline break-all"
                    >
                      drivingtrafficschool@gmail.com
                    </button>
                  </div>
                </div>
              </div>

              {/* Opening Hours */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-5 text-center">Opening Hours</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { day: "Monday", hours: "8:00am - 9:00pm" },
                    { day: "Tuesday", hours: "8:00am - 9:00pm" },
                    { day: "Wednesday", hours: "8:00am - 9:00pm" },
                    { day: "Thursday", hours: "8:00am - 9:00pm" },
                    { day: "Friday", hours: "8:00am - 9:00pm" },
                    { day: "Saturday", hours: "8:00am - 9:00pm" }
                  ].map((schedule) => (
                    <div
                      key={schedule.day}
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center"
                    >
                      <p className="font-bold text-gray-900 text-base mb-1">{schedule.day}</p>
                      <p className="text-gray-600 text-sm">{schedule.hours}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Map</h3>
              <div className="w-full h-[400px] sm:h-[450px] bg-white rounded-2xl overflow-hidden border-2 border-gray-200 shadow-md">
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(locationData.zone || "")}&z=12&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

            {/* Book Now Button */}
            <button
              onClick={() => router.push('/Book-Now')}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 sm:py-5 rounded-xl transition shadow-lg text-lg flex items-center justify-center gap-3 transform hover:scale-[1.02] duration-200"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Book Your Lesson Now
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LocationDetailPage;
