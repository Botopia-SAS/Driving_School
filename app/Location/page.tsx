"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import LocationMap from "./LocationMap";
import LocationModal from "./LocationModal";
import { useRouter } from 'next/navigation';

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

const LocationPage: React.FC = () => {
  const [location, setLocation] = useState<Zone | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showZones, setShowZones] = useState(false);
  const [loading, setLoading] = useState(true);
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

  const handleBookNow = (instructorName: string) => {
    console.log('Navegando a Book-Now para instructor:', instructorName);
    setSelectedZone(null); // Cerrar el modal
    router.push('/Book-Now');
  };

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch("/api/locations");
        
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
    
        const data: Zone[] = await res.json();
    
        if (data.length > 0) {
          setLocation(data[0]); // 📌 Verifica que esto se ejecuta
          setZones(data);
        }
      } catch (error) {
        console.error("❌ Error fetching location data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    

    fetchLocation();
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
  


  const handleZoneClick = async (zone: Zone) => {
    if (!zone.instructors || zone.instructors.length === 0) {
      setSelectedZone({ ...zone, instructorsDetails: [] });
      return;
    }
  
    const instructorIds = zone.instructors.map(instructor => instructor._id);
  
    const instructorsData = await fetchInstructorsDetails(instructorIds);
  
    setSelectedZone({ ...zone, instructorsDetails: instructorsData });
  };
  

  return (
    <section className="bg-gray-100 pt-[150px] pb-20 px-4 sm:px-6 md:px-12 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <p className="text-center text-gray-500 text-lg">Loading location...</p>
        ) : (
          location && (
            <>
              {/* Sección superior con el mapa y la información */}
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/2 flex flex-col">
                  <div className="flex-1 rounded-lg overflow-hidden shadow-lg">
                    <LocationMap />
                  </div>
                </div>

                <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow-lg border border-gray-200 min-h-[500px] flex flex-col justify-between">
                  <div className="mb-4 text-center">
                    <h2 className="text-2xl font-bold text-blue-600 mb-2">
                      Main Office Location
                    </h2>
                    <p className="text-lg font-semibold text-gray-800">
                      {location.title}
                    </p>
                  </div>
                  
                  <div className="text-gray-700 mb-6 space-y-3">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      <div>
                        <strong>Phone:</strong>
                        <a href="/contact" className="text-blue-600 font-bold ml-2 hover:underline">{phoneNumber}</a>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <div>
                        <strong>Email:</strong>
                        <a
                          href="/contact"
                          className="text-blue-600 underline ml-2 hover:text-blue-800"
                        >
                          drivingtrafficschool@gmail.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 mt-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <strong>Address:</strong>
                        <p className="text-gray-800 font-medium">
                          3167 Forest Hill Blvd<br />
                          West Palm Beach, Florida 33406
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      Business Hours
                    </h3>
                    <div className="text-gray-900 grid grid-cols-1 gap-y-1">
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                      ].map((day, index) => (
                        <p key={index} className="flex justify-between">
                          <strong>{day}:</strong>
                          <span>8:00am - 8:00pm</span>
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg flex items-center justify-center" onClick={() => window.location.href = '/Book-Now'}>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Book Your Lesson Now
                  </button>
                </div>
              </div>

              {/* Separador visual claro */}
              <div className="mt-12 mb-8">
                <div className="border-t border-gray-300"></div>
                <div className="text-center -mt-3">
                  <span className="bg-gray-100 px-4 py-1 text-gray-600 text-sm">Service Areas</span>
                </div>
              </div>

              {/* Información de áreas de servicio */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Areas We Serve
                </h3>
                <p className="text-gray-600 max-w-3xl mx-auto">
                  While our main office is located in West Palm Beach, we provide driving lessons 
                  and services throughout the following areas. Our certified instructors will meet 
                  you at convenient locations within these zones.
                </p>
              </div>

              {/* Botón para mostrar/ocultar zonas */}
              <div className="text-center">
                <button
                  onClick={() => setShowZones(!showZones)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-lg"
                >
                  {showZones ? "Hide Service Areas" : "View All Service Areas"}
                </button>
              </div>

              {/* Listado de zonas cubiertas */}
              {showZones && (
                <div className="mt-6 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Covered Areas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-blue-600">
                    {zones.map((zone, index) => (
                      <button key={zone._id || `zone-${index}`} onClick={() => handleZoneClick(zone)} className="underline cursor-pointer hover:text-blue-800">
                        {zone.zone}
                      </button>

                    ))}

                  </div>
                </div>
              )}

              {/* Modal para mostrar la zona seleccionada */}
              {selectedZone && (
                <LocationModal
                  isOpen={selectedZone !== null}
                  onClose={() => setSelectedZone(null)}
                >
                  <div 
                    className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] relative flex flex-col"
                    style={{
                      margin: '0',
                      padding: '0',
                      boxSizing: 'border-box'
                    }}
                  >



                    {selectedZone?.locationImage && (
                      <div className="w-full flex items-center justify-center pt-8 pb-2 bg-white sticky top-0 z-10">
                        <div className="w-48 h-48 relative">
                          <Image
                            src={selectedZone.locationImage}
                            alt={selectedZone.title}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>
                      </div>
                    )}

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

                      {/* Location Info - Mismo ancho que el mapa */}
                      <div className="w-full flex justify-center mb-6">
                        <div className="w-full max-w-2xl p-4 bg-gray-50 rounded-2xl shadow-md border border-gray-100">
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
                              selectedZone.instructorsDetails.map((instructor, index) => (
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
                                      handleBookNow(instructor.name || "Unknown Instructor");
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
                  </div>
                </LocationModal>
              )}
            </>
          )
        )}
      </div>
    </section>
  );
};

export default LocationPage;
