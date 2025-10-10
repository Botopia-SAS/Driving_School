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

  const fetchInstructorsDetails = async (instructorIds: string[]) => {
    if (!instructorIds || instructorIds.length === 0) {
      return [];
    }

    try {
      const instructorDetails = await Promise.all(
        instructorIds.map(async (id) => {
          const res = await fetch(`/api/instructors/${id}`);

          if (!res.ok) {
            return { _id: id, name: "Unknown Instructor", photo: "/default-avatar.png" };
          }

          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            return { _id: id, name: "Unknown Instructor", photo: "/default-avatar.png" };
          }

          return await res.json();
        })
      );

      return instructorDetails;
    } catch (error) {
      console.error("❌ Error fetching instructors:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchLocationDetail = async () => {
      try {
        const res = await fetch(`/api/locations/${id}`);
        const data = await res.json();

        if (data.instructors && data.instructors.length > 0) {
          const instructorIds = data.instructors.map((instructor: Instructor) => instructor._id);
          const instructorsData = await fetchInstructorsDetails(instructorIds);
          setLocationData({ ...data, instructorsDetails: instructorsData });
        } else {
          setLocationData({ ...data, instructorsDetails: [] });
        }
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

  const handleBookNow = (instructorName: string) => {
    console.log('Navegando a Book-Now para instructor:', instructorName);
    router.push('/Book-Now');
  };

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
              onClick={() => router.push("/Location")}
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
    <section className="bg-gray-50 pt-[200px] pb-20 px-4 sm:px-6 md:px-12 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/Location")}
          className="flex items-center gap-2 text-[#0056b3] hover:text-[#004494] font-semibold mb-6 transition"
        >
          <FaArrowLeft />
          Back to Locations
        </button>

        <motion.div
          className="bg-white rounded-xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Location Image */}
          {locationData.locationImage && (
            <div className="w-full flex items-center justify-center pt-8 pb-4 bg-white">
              <div className="w-64 h-64 relative">
                <Image
                  src={locationData.locationImage}
                  alt={locationData.title}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-10">
            <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">{locationData.title}</h1>

            {/* Description */}
            <p className="text-lg text-gray-700 whitespace-pre-line leading-relaxed mb-8 text-center">
              {locationData.description}
            </p>

            {/* Location Info */}
            <div className="mb-8 p-6 bg-gray-50 rounded-2xl shadow-md border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Location Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-gray-800">
                  <span className="inline-block w-6 h-6">
                    <svg width="24" height="24" fill="none" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="9" stroke="#1A7F5A" strokeWidth="2"/>
                      <path d="M10 4C7.23858 4 5 6.23858 5 9C5 12.75 10 17 10 17C10 17 15 12.75 15 9C15 6.23858 12.7614 4 10 4Z" fill="#1A7F5A"/>
                      <circle cx="10" cy="9" r="2" fill="white"/>
                    </svg>
                  </span>
                  <div>
                    <strong>Phone:</strong>
                    <button
                      onClick={() => router.push('/contact')}
                      className="text-blue-700 hover:underline font-medium ml-2"
                    >
                      {phoneNumber}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-800">
                  <span className="inline-block w-6 h-6">
                    <svg width="24" height="24" fill="none" viewBox="0 0 20 20">
                      <rect x="2" y="4" width="16" height="12" rx="2" fill="#1A7F5A"/>
                      <path d="M2 4L10 12L18 4" stroke="white" strokeWidth="2"/>
                    </svg>
                  </span>
                  <div>
                    <strong>Email:</strong>
                    <button
                      onClick={() => router.push('/contact')}
                      className="text-blue-700 hover:underline font-medium ml-2"
                    >
                      drivingtrafficschool@gmail.com
                    </button>
                  </div>
                </div>
              </div>

              {/* Opening Hours */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Opening Hours</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-gray-800">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                    <div key={day} className="flex justify-between border-b pb-2">
                      <span className="font-semibold">{day}:</span>
                      <span>8:00am - 9:00pm</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Map</h3>
              <div className="w-full h-80 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md">
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

            {/* Instructors */}
            {locationData.instructorsDetails && locationData.instructorsDetails.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">Instructors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {locationData.instructorsDetails.map((instructor, index) => (
                    <div key={instructor._id || `instructor-${index}`} className="text-center p-4 border rounded-xl shadow-sm bg-white flex flex-col items-center">
                      <div className="w-24 h-24 relative mb-3">
                        <Image
                          src={instructor.photo || '/default-avatar.png'}
                          alt={instructor.name || "Instructor"}
                          width={96}
                          height={96}
                          className="rounded-full border border-gray-200 shadow-sm object-cover w-24 h-24"
                          priority
                        />
                      </div>
                      <p className="text-gray-900 font-semibold text-center mb-3 text-sm">
                        {instructor.name || "Instructor Name Missing"}
                      </p>
                      <button
                        onClick={() => handleBookNow(instructor.name || "Unknown Instructor")}
                        className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition"
                      >
                        Book {instructor.name ? instructor.name.split(" ")[0] : "Now"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Book Now Button */}
            <button
              onClick={() => router.push('/Book-Now')}
              className="w-full bg-blue-600 text-white font-semibold py-4 rounded-lg hover:bg-blue-700 transition shadow-lg text-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
