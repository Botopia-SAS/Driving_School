"use client";

import React, { useState, useEffect } from "react";
import LocationMap from "./LocationMap";
import Modal from "@/components/Modal";

/** Definimos los tipos necesarios para evitar `any`. */
interface Instructor {
  _id: string;
  name: string;
  image?: string;
}

interface Zone {
  _id?: string;
  title: string;
  zone: string;
  locationImage?: string;
  description?: string;
  instructors?: Instructor[];
}

const LocationPage: React.FC = () => {
  const [location, setLocation] = useState<Zone | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [showZones, setShowZones] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch("/api/locations");
        /** Si tu API devuelve un array de estos objetos, tipamos el JSON como Zone[] */
        const data: Zone[] = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setLocation(data[0]);
          setZones(data);
        }
      } catch (error) {
        console.error("Error fetching location data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  return (
    <section className="bg-gray-100 pt-[150px] pb-20 px-4 sm:px-6 md:px-12 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <p className="text-center text-gray-500 text-lg">Loading location...</p>
        ) : (
          location && (
            <>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/2 flex items-center">
                  <div className="w-full h-64 md:h-[400px] rounded-lg overflow-hidden">
                    <LocationMap />
                  </div>
                </div>

                <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{location.title}</h2>
                  <div className="text-gray-700 mb-4">
                    <p>
                      <strong>Phone:</strong>{" "}
                      <span className="text-blue-600 font-bold">561 330 7007</span>
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      <a
                        href="mailto:info@drivingschoolpalmbeach.com"
                        className="text-blue-600 underline"
                      >
                        info@drivingschoolpalmbeach.com
                      </a>
                    </p>
                    <p>
                      <strong>Address:</strong> 3167 Forest Hill Blvd, West Palm Beach, Florida 33406
                    </p>
                  </div>
                  <div className="text-gray-900 grid grid-cols-2 gap-x-8">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                      (day, index) => (
                        <p key={index} className="flex justify-between w-full">
                          <strong>{day}:</strong> <span>8:00am - 8:00pm</span>
                        </p>
                      )
                    )}
                  </div>
                  <button className="mt-8 w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition">
                    Book Now
                  </button>
                </div>
              </div>

              <div className="text-center mt-10">
                <button
                  onClick={() => setShowZones(!showZones)}
                  className="text-blue-600 underline text-lg font-semibold"
                >
                  {showZones ? "Hide Areas" : "View all Areas Covered"}
                </button>
              </div>

              {showZones && (
                <div className="mt-6 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Covered Areas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-blue-600">
                    {zones.map((zone, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedZone(zone)}
                        className="underline cursor-pointer hover:text-blue-800"
                      >
                        {zone.zone}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedZone && (
                <Modal isOpen={selectedZone !== null} onClose={() => setSelectedZone(null)}>
                  <div className="p-6 bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto relative">
                    {/* Botón de cierre */}
                    <button
                      className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl"
                      onClick={() => setSelectedZone(null)}
                    >
                      ×
                    </button>

                    {/* 📌 Imagen Principal */}
                    {selectedZone?.locationImage && (
                      <img
                        src={selectedZone.locationImage}
                        alt={selectedZone.title}
                        className="w-full h-72 object-cover rounded-lg shadow-md"
                      />
                    )}

                    {/* 📌 Contenedor de Contenido */}
                    <div className="p-4">
                      {/* 📌 Título */}
                      <h2 className="text-3xl font-bold text-gray-900 text-center mt-4 mb-6">
                        {selectedZone?.title}
                      </h2>

                      {/* 📌 Descripción + Info en una Fila */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 📌 Descripción */}
                        <p className="text-lg text-gray-700 whitespace-pre-line">
                          {selectedZone?.description}
                        </p>

                        {/* 📌 Información de Contacto + Horarios */}
                        <div className="p-5 bg-gray-50 rounded-lg shadow-md border border-gray-200">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            📍 Location Info
                          </h3>
                          <p className="flex items-center gap-2 text-gray-800">
                            <span className="text-red-600">📞</span>
                            <strong>Phone:</strong>{" "}
                            <a
                              href="tel:5613307007"
                              className="text-blue-600 hover:underline"
                            >
                              561 330 7007
                            </a>
                          </p>
                          <p className="flex items-center gap-2 text-gray-800">
                            <span className="text-purple-600">✉️</span>
                            <strong>Email:</strong>
                            <a
                              href="mailto:info@drivingschoolpalmbeach.com"
                              className="text-blue-600 hover:underline"
                            >
                              info@drivingschoolpalmbeach.com
                            </a>
                          </p>

                          {/* 🕒 Horarios */}
                          <div className="border-t pt-4">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              🕒 Opening Hours
                            </h3>
                            <div className="grid grid-cols-1 gap-y-2 text-gray-800 text-sm">
                              {[
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday",
                                "Sunday",
                              ].map((day) => (
                                <div key={day} className="flex justify-between">
                                  <span className="font-semibold">{day}:</span>
                                  <span className="text-right">8:00am - 8:00pm</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 📌 Mapa */}
                      <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden border border-gray-300 shadow-md mt-6">
                        <iframe
                          src={`https://www.google.com/maps?q=${encodeURIComponent(
                            selectedZone?.zone || ""
                          )}&output=embed`}
                          width="100%"
                          height="100%"
                          allowFullScreen
                          loading="lazy"
                        ></iframe>
                      </div>

                      {/* 📌 Instructores */}
                      <div className="mt-6">
                        <h3 className="text-2xl font-semibold text-gray-900 text-center mb-4">
                          Instructors
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {selectedZone?.instructors?.map((instructor) => (
                            <div
                              key={instructor._id}
                              className="text-center p-4 border rounded-lg shadow-sm bg-white flex flex-col items-center"
                            >
                              <img
                                src={instructor.image || "/default-avatar.png"}
                                alt={instructor.name}
                                className="w-24 h-24 mx-auto rounded-full border border-gray-300 shadow-sm"
                              />
                              <p className="text-gray-900 mt-2 font-semibold text-center min-h-[3rem] flex items-center justify-center">
                                {instructor.name}
                              </p>
                              <button className="mt-auto w-full max-w-[160px] h-[50px] bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition flex flex-col justify-center items-center">
                                <span>Book</span>
                                <span>{instructor.name.split(" ")[0]}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Modal>
              )}
            </>
          )
        )}
      </div>
    </section>
  );
};

export default LocationPage;
