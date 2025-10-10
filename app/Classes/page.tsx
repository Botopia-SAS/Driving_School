"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
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
          Driving Classes
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
                    onClick={() => router.push(`/Classes/${cls._id}`)}
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
    </section>
  );
};

export default ClassesPage;
