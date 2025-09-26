"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";

const ClassesPage: React.FC = () => {
  const router = useRouter();

  interface Class {
    _id: string;
    title: string;
    alsoKnownAs?: string[];
    image?: string;
    length?: number;
    price?: number;
    overview: string;
    objectives?: string[];
    contact?: string;
    buttonLabel?: string;
  }

  const [classList, setClassList] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/classes");
        const data = await res.json();

        if (Array.isArray(data)) {
          setClassList(data.sort((a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title)));
        }
      } catch (error) {
        console.error("❌ Error al obtener las clases:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return (
    <section className="bg-gray-50 pt-[200px] pb-20 px-4 sm:px-6 md:px-12 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* 📌 TÍTULO */}
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-6 tracking-wide">
          🚗 Driving Classes
        </h1>

        {/* 📌 DESCRIPCIÓN */}
        <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-12 leading-relaxed">
          Choose from our variety of driving classes. Learn from certified instructors and improve your driving skills.
        </p>

        {/* 📌 MOSTRAR CARGANDO */}
        {loading && (
          <p className="text-center text-gray-500 text-lg">Loading classes...</p>
        )}

        {/* 📌 GRID DE CLASES */}
        {!loading && classList.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {classList.map((cls) => (
              <motion.div
                key={cls._id}
                className="bg-white rounded-xl shadow-lg border overflow-hidden flex flex-col transform transition duration-300 hover:scale-105 hover:shadow-xl"
              >
                {/* 📌 IMAGEN */}
                <div className="relative w-full h-52">
                  {cls.image ? (
                    <Image
                      src={cls.image}
                      alt={cls.title}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-xl"
                    />
                  ) : (
                    <p className="text-gray-500 italic text-center pt-20">No image available</p>
                  )}
                </div>

                {/* 📌 CONTENIDO */}
                <div className="p-6 flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{cls.title}</h2>
                  <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                    {cls.overview.length > 100
                      ? `${cls.overview.substring(0, 100)}...`
                      : cls.overview}
                  </p>
                  {cls.price && (
                    <p className="text-lg font-semibold text-green-600 mt-2">${cls.price}</p>
                  )}
                </div>

                {/* 📌 BOTONES */}
                <div className="px-6 pb-6 flex flex-col gap-3">
                  {/* 📌 BOTÓN "VIEW MORE" (Blanco con borde azul y letra azul) */}
                  <button
                    onClick={() => setSelectedClass(cls)}
                    className="w-full border-2 border-[#0056b3] text-[#0056b3] font-semibold py-2 rounded-lg hover:bg-[#0056b3] hover:text-white transition duration-300 shadow-sm"
                  >
                    View More
                  </button>

                  {/* 📌 BOTÓN PRINCIPAL AZUL */}
                  <button
                    onClick={() => router.push(`/register-online?classId=${cls._id}`)}
                    className="w-full bg-[#0056b3] text-white font-semibold py-2 rounded-lg hover:bg-[#004494] transition duration-300 text-center shadow-md"
                  >
                    {cls.buttonLabel || "Register Now"}
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          !loading && <p className="text-center text-gray-500 text-lg">No classes available.</p>
        )}
      </div>

      {/* 📌 POPUP DETALLE DE LA CLASE */}
      {selectedClass && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <motion.div
            className="bg-white p-10 rounded-lg shadow-2xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              onClick={() => setSelectedClass(null)}
            >
              <FaTimes size={24} />
            </button>

            {/* 📌 IMAGEN EN EL POPUP */}
            {selectedClass.image && (
              <Image
                src={selectedClass.image}
                alt={selectedClass.title}
                width={600}
                height={300}
                className="rounded-lg object-cover w-full mb-4"
              />
            )}

            <h2 className="text-2xl font-bold text-gray-900">{selectedClass.title}</h2>

            {/* 📌 TAMBIÉN CONOCIDO COMO */}
            {(selectedClass.alsoKnownAs?.length ?? 0) > 0 && (
              <div className="mb-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Also known as:</h3>
                <ul className="list-disc pl-5 text-gray-700">
                  {selectedClass.alsoKnownAs?.map((item, index) => (
                    <li key={index} className="mb-1">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-lg text-gray-700 mt-2 leading-relaxed">{selectedClass.overview}</p>

            {/* 📌 PRECIO Y DURACIÓN */}
            <div className="flex gap-4 mt-4">
              {selectedClass.price && (
                <span className="text-lg font-semibold text-green-600">Price: ${selectedClass.price}</span>
              )}
              {selectedClass.length && (
                <span className="text-lg font-semibold text-blue-600">Duration: {selectedClass.length} hours</span>
              )}
            </div>

            {/* 📌 UPCOMING SECTION */}
            {selectedClass.contact && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-lg text-gray-700 leading-relaxed">
                  📆 <strong>Upcoming {selectedClass.title}:</strong>
                  <br />
                  <span className="text-xl font-bold text-blue-600">{selectedClass.contact}</span>
                </p>
              </div>
            )}

            <div className="flex justify-between mt-6 gap-4">
              {/* 📌 VER HORARIO (Blanco con borde azul y letra azul) */}
              <button
                onClick={() => {
                  setSelectedClass(null);
                  // Scroll to contact section if needed
                }}
                className="border-2 border-[#0056b3] text-[#0056b3] font-semibold px-6 py-3 rounded-lg hover:bg-[#0056b3] hover:text-white transition text-center"
              >
                View Schedule
              </button>

              {/* 📌 BOTÓN DE ACCIÓN (Azul) */}
              <button
                onClick={() => router.push(`/register-online?classId=${selectedClass._id}`)}
                className="bg-[#0056b3] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#004494] transition text-center"
              >
                Register Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default ClassesPage;
