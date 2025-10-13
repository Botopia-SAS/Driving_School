"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";

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

const ClassDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassDetail = async () => {
      try {
        // Usar la ruta correcta del API que existe: /api/drivingclasses/[id]
        const res = await fetch(`/api/drivingclasses/${id}`);

        // Si la respuesta no es OK, intentar parsear JSON para obtener mensaje
        if (!res.ok) {
          let errBody: any = null;
          try {
            errBody = await res.json();
          } catch (e) {
            console.error('Respuesta de error no es JSON', e);
          }
          throw new Error(
            `Error fetching class detail: ${res.status} ${res.statusText} ${errBody ? JSON.stringify(errBody) : ''}`
          );
        }

        // Verificar content-type antes de parsear como JSON
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Esperaba JSON pero el servidor respondió: ${text.substring(0, 200)}`);
        }

        const data = await res.json();
        setClassData(data);
      } catch (error) {
        console.error("❌ Error fetching class details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClassDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <section className="bg-gray-50 pt-[200px] pb-20 px-4 sm:px-6 md:px-12 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500 text-lg">Loading class details...</p>
        </div>
      </section>
    );
  }

  if (!classData) {
    return (
      <section className="bg-gray-50 pt-[200px] pb-20 px-4 sm:px-6 md:px-12 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500 text-lg">Class not found.</p>
          <div className="text-center mt-6">
            <button
              onClick={() => router.push("/classes")}
              className="bg-[#0056b3] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#004494] transition"
            >
              Back to Classes
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
          onClick={() => router.push("/classes")}
          className="flex items-center gap-2 text-[#0056b3] hover:text-[#004494] font-semibold mb-6 transition"
        >
          <FaArrowLeft />
          Back to Classes
        </button>

        <motion.div
          className="bg-white rounded-xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Image */}
          {classData.image && (
            <div className="relative w-full h-96">
              <Image
                src={classData.image}
                alt={classData.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{classData.title}</h1>

            {/* Also Known As */}
            {(classData.alsoKnownAs?.length ?? 0) > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Also known as:</h3>
                <ul className="list-disc pl-5 text-gray-700">
                  {classData.alsoKnownAs?.map((item, index) => (
                    <li key={index} className="mb-1">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Overview */}
            <p className="text-lg text-gray-700 leading-relaxed mb-6">{classData.overview}</p>

            {/* Price and Duration */}
            <div className="flex gap-4 mb-6">
              {classData.price && (
                <span className="text-xl font-semibold text-green-600">Price: ${classData.price}</span>
              )}
              {classData.length && (
                <span className="text-xl font-semibold text-blue-600">Duration: {classData.length} hours</span>
              )}
            </div>

            {/* Upcoming Section */}
            {classData.contact && (
              <div className="mb-6 p-6 bg-blue-50 rounded-lg">
                <p className="text-lg text-gray-700 leading-relaxed">
                  📆 <strong>Upcoming {classData.title}:</strong>
                  <br />
                  <span className="text-xl font-bold text-blue-600">{classData.contact}</span>
                </p>
              </div>
            )}

            {/* Register Button */}
            <button
              onClick={() => router.push(`/register-online?classId=${classData._id}`)}
              className="w-full bg-[#0056b3] text-white font-semibold py-4 rounded-lg hover:bg-[#004494] transition text-center shadow-md text-lg"
            >
              {classData.buttonLabel || "Register Now"}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ClassDetailPage;
