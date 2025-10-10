"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import LoadingSpinner from './common/LoadingSpinner';
import { useRouter } from 'next/navigation';
import LocationMap from "../app/Location/LocationMapHome";
import LocationModal from "../app/Location/LocationModal";

// Definir interfaces
interface Instructor {
  _id: string;
  name: string;
  photo?: string;
}

interface Area {
  _id: string;
  title: string;
  zone: string;
  locationImage?: string;
  description?: string;
  instructors?: Instructor[];
  instructorsDetails?: Instructor[];
}

const AreasWeServe = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedZone, setSelectedZone] = useState<Area | null>(null);
  const router = useRouter();
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
      console.warn("⚠️ No instructor IDs provided.");
      return [];
    }
  
    try {
      const instructorDetails = await Promise.all(
        instructorIds.map(async (id) => {
          const res = await fetch(`/api/instructors/${id}`);
  
          if (!res.ok) {
            console.error(`❌ Invalid response for instructor ${id}, Status: ${res.status}`);
            return { _id: id, name: "Unknown Instructor", photo: "/default-avatar.png" };
          }
  
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            console.error(`❌ Response for instructor ${id} is not JSON.`);
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

  const handleBookNow = () => {
    setSelectedZone(null);
    try {
      router.push('/Book-Now');
    } catch {
      window.location.href = '/Book-Now';
    }
  };

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch("/api/locations");
        const data = await res.json();
        if (Array.isArray(data)) {
          setAreas(data);
        }
      } catch (error) {
        console.error("Error fetching areas:", error);
      }
    };
    fetchAreas();
  }, []);

  // Fondo blanco puro y layout premium
  return (
    <section className="bg-white py-20 w-full min-h-[70vh]">
      <div className="max-w-6xl mx-auto flex flex-col-reverse lg:flex-row items-center lg:items-start gap-16 px-4 lg:px-0" style={{maxWidth: '1500px'}}>
        {/* Tarjeta premium Boca Raton */}
        <div className="lg:w-2/3 w-full flex flex-col items-center lg:items-start">
          <h2 className="text-4xl font-black text-gray-900 mb-4 text-center lg:text-left tracking-tight">Areas We Serve</h2>
          <p className="text-lg text-gray-700 mb-10 w-full text-center lg:text-left max-w-2xl">We are dedicated to providing world-class driving school services throughout Palm Beach County and surrounding areas.</p>

          {/* Solo una zona: Boca Raton premium card */}
          {areas.length === 1 && (
            <div className="w-full flex flex-col items-center lg:items-start">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 w-full max-w-2xl mb-8 flex flex-col items-start gap-4 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 lg:ml-0 lg:mr-auto group cursor-pointer">
                {/* SVG pin premium */}
                <div className="mb-2">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform duration-300">
                    <circle cx="16" cy="16" r="15" fill="#F5F6FA" stroke="#1A7F5A" strokeWidth="2"/>
                    <path d="M16 8C12.6863 8 10 10.6863 10 14C10 18.25 16 24 16 24C16 24 22 18.25 22 14C22 10.6863 19.3137 8 16 8Z" fill="#1A7F5A"/>
                    <circle cx="16" cy="14" r="3" fill="white"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-[#1A7F5A] mb-2 tracking-tight group-hover:text-[#27ae60] transition-colors duration-300">Boca Raton, FL</h3>
                <p className="text-gray-700 text-base leading-relaxed mb-4">{areas[0].description}</p>
                <button
                  className="flex items-center gap-2 border-2 border-[#27ae60] text-[#27ae60] font-bold py-3 px-8 rounded-full bg-white shadow hover:bg-green-50 hover:shadow-lg hover:border-[#1A7F5A] hover:scale-105 transition-all duration-300 text-lg mt-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                  onClick={async () => {
                    if (!areas[0].instructors || areas[0].instructors.length === 0) {
                      setSelectedZone({ ...areas[0], instructorsDetails: [] });
                      return;
                    }
                  
                    const instructorIds = areas[0].instructors.map(instructor => instructor._id);
                    const instructorsData = await fetchInstructorsDetails(instructorIds);
                    setSelectedZone({ ...areas[0], instructorsDetails: instructorsData });
                  }}
                >
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} style={{minWidth: '1.5rem'}}>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z' />
                  </svg>
                  More Details
                </button>
              </div>
            </div>
          )}

          {/* Si hay varias zonas, mostrar como grid con máximo 2 por fila */}
          {areas.length > 1 && (
            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
                {areas.map((area) => (
                  <div
                    key={area._id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col items-center hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 cursor-pointer group min-h-[300px] max-h-[350px]"
                    onClick={async () => {
                      if (!area.instructors || area.instructors.length === 0) {
                        setSelectedZone({ ...area, instructorsDetails: [] });
                        return;
                      }
                    
                      const instructorIds = area.instructors.map(instructor => instructor._id);
                      const instructorsData = await fetchInstructorsDetails(instructorIds);
                      setSelectedZone({ ...area, instructorsDetails: instructorsData });
                    }}
                  >
                    <div className="w-12 h-12 mb-3 flex items-center justify-center bg-[#F5F6FA] rounded-full group-hover:bg-green-100 transition">
                      <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="15" fill="#F5F6FA" stroke="#1A7F5A" strokeWidth="2"/>
                        <path d="M16 8C12.6863 8 10 10.6863 10 14C10 18.25 16 24 16 24C16 24 22 18.25 22 14C22 10.6863 19.3137 8 16 8Z" fill="#1A7F5A"/>
                        <circle cx="16" cy="14" r="3" fill="white"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-[#1A7F5A] mb-3 text-center leading-tight">{area.zone}</h3>
                    <p className="text-gray-600 text-sm text-center mb-4 flex-grow leading-relaxed line-clamp-3 overflow-hidden">
                      {area.description?.slice(0, 100) || 'Driving lessons available here.'}
                      {area.description && area.description.length > 100 ? '...' : ''}
                    </p>
                    <button className="mt-auto flex items-center gap-2 border-2 border-[#27ae60] text-[#27ae60] font-bold py-2.5 px-5 rounded-full bg-white shadow hover:bg-green-50 hover:shadow-lg hover:border-[#1A7F5A] hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 text-sm">
                      <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} style={{minWidth: '1rem'}}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z' />
                      </svg>
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {areas.length === 0 && (
            <div className="flex justify-center w-full mt-8">
              <LoadingSpinner label="Loading areas..." />
            </div>
          )}
        </div>

        {/* Mapa premium alineado con bordes mejorados para móvil */}
        <div className="lg:w-1/2 w-full flex justify-center mb-8 lg:mb-0 px-4 lg:px-0">
          <div className="w-full max-w-[1200px] lg:min-w-[600px] rounded-3xl overflow-hidden shadow-xl border-4 border-gray-200 bg-white" style={{height: '700px', display: 'flex', alignItems: 'stretch'}}>
            <div style={{width: '100%', height: '100%', padding: '8px'}}>
              <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-gray-100">
                <LocationMap />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {selectedZone && (
        <LocationModal isOpen={selectedZone !== null} onClose={() => setSelectedZone(null)}>
          <div
            className="p-6 md:p-8 overflow-y-auto custom-scrollbar"
            style={{
              maxHeight: 'calc(90vh - 2rem)',
              paddingRight: '1rem'
            }}
          >
            <h2 className="text-2xl font-extrabold text-gray-900 text-center mt-2 mb-4 tracking-tight">
              {selectedZone?.title}
            </h2>

            {/* Descripción - Ancho completo */}
            <p className="text-base text-gray-700 whitespace-pre-line leading-relaxed mb-6 text-center">{selectedZone?.description}</p>

            {/* Location Info - Ancho completo */}
            <div className="p-4 bg-gray-50 rounded-2xl shadow-md border border-gray-100 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">Location Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <p className="flex items-center gap-2 text-gray-800 text-base justify-center md:justify-start">
                  <span className="inline-block w-5 h-5"><svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="#1A7F5A" strokeWidth="2"/><path d="M10 4C7.23858 4 5 6.23858 5 9C5 12.75 10 17 10 17C10 17 15 12.75 15 9C15 6.23858 12.7614 4 10 4Z" fill="#1A7F5A"/><circle cx="10" cy="9" r="2" fill="white"/></svg></span>
                  <strong>Phone:</strong>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedZone(null);
                      router.push('/contact');
                    }}
                    className="text-blue-700 hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
                  >
                    {phoneNumber}
                  </button>
                </p>
                <p className="flex items-center gap-2 text-gray-800 text-base justify-center md:justify-start">
                  <span className="inline-block w-5 h-5"><svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="2" y="4" width="16" height="12" rx="2" fill="#1A7F5A"/><rect x="2" y="4" width="16" height="12" rx="2" stroke="#1A7F5A" strokeWidth="2"/><path d="M2 4L10 12L18 4" stroke="white" strokeWidth="2"/></svg></span>
                  <strong>Email:</strong>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedZone(null);
                      router.push('/contact');
                    }}
                    className="text-blue-700 hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
                  >
                    drivingtrafficschool@gmail.com
                  </button>
                </p>
              </div>
              <div className="border-t pt-4 mt-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Opening Hours</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-gray-800 text-base">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                    <div key={day} className="flex justify-between border-b pb-1">
                      <span className="font-semibold">{day}:</span>
                      <span className="text-right">8:00am - 8:00pm</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Mapa integrado dentro del modal */}
            <div className="w-full flex justify-center mt-6 mb-6">
              <div className="w-full max-w-2xl h-64 md:h-80 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md">
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(selectedZone?.zone || "")}&z=12&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">Instructors</h3>
              <div className="flex justify-center">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center max-w-4xl">
                  {Array.isArray(selectedZone?.instructorsDetails) &&
                    selectedZone.instructorsDetails.map((instructor: Instructor, index) => (
                      <div key={instructor._id || `instructor-${index}`} className="text-center p-3 border rounded-xl shadow-sm bg-white flex flex-col items-center h-[200px]">
                        <div className="w-24 h-24 relative flex-shrink-0 mb-2">
                         <Image
                           src={instructor.photo || '/default-avatar.png'}
                           alt={instructor.name || "Instructor"}
                           width={96}
                           height={96}
                           className="rounded-full border border-gray-200 shadow-sm object-cover w-24 h-24"
                           priority
                           style={{
                             width: '96px',
                             height: '96px',
                             objectFit: 'cover'
                           }}
                         />
                       </div>
                                                                       <p className="text-gray-900 font-semibold text-center min-h-[1.5rem] max-h-[1.5rem] flex items-center justify-center text-sm leading-tight px-2 mb-1">
                          {instructor.name || "Instructor Name Missing"}
                        </p>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleBookNow();
                          }}
                          className="mt-auto w-full max-w-[140px] h-[44px] bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition flex flex-col justify-center items-center cursor-pointer"
                        >
                         <span>Book</span>
                         <span>{instructor.name ? instructor.name.split(" ")[0] : "No Name"}</span>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </LocationModal>
      )}
    </section>
  );
};

export default AreasWeServe;