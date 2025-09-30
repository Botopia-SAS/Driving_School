"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

const OnlineCoursesPage: React.FC = () => {
  interface Course {
    _id: string;
    image?: string;
    title: string;
    description: string;
    buttonLabel?: string;
  }

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/online");
        const data = await res.json();

        if (Array.isArray(data)) {
          setCourses(data);
        }
      } catch (error) {
        console.error("❌ Error al obtener los cursos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <section className="bg-gray-50 pt-[200px] pb-20 px-4 sm:px-6 md:px-12 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* 📌 TÍTULO */}
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-6 tracking-wide">
          Online Driving Courses
        </h1>

        {/* 📌 DESCRIPCIÓN */}
        <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-12 leading-relaxed">
          Learn at your own pace with our online traffic courses. Study from home and complete your course anytime, anywhere.
        </p>

        {/* 📌 MOSTRAR CARGANDO */}
        {loading && (
          <p className="text-center text-gray-500 text-lg">Loading courses...</p>
        )}

        {/* 📌 GRID DE CURSOS */}
        {!loading && courses.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {courses.map((course) => (
              <motion.div
                key={course._id}
                className="bg-white rounded-xl shadow-lg border overflow-hidden flex flex-col transform transition duration-300 hover:scale-105 hover:shadow-xl"
              >
                {/* 📌 IMAGEN */}
                <div className="relative w-full h-52">
                  {course.image ? (
                    <Image
                      src={course.image}
                      alt={course.title}
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
                  <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
                  <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                    {course.description.length > 100
                      ? `${course.description.substring(0, 100)}...`
                      : course.description}
                  </p>
                </div>

                {/* 📌 BOTONES */}
                <div className="px-6 pb-6 flex flex-col gap-3">
                  {/* 📌 BOTÓN "VIEW MORE" (Blanco con borde azul y letra azul) */}
                  <button
                    onClick={() => setSelectedCourse(course)}
                    className="w-full border-2 border-[#0056b3] text-[#0056b3] font-semibold py-2 rounded-lg hover:bg-[#0056b3] hover:text-white transition duration-300 shadow-sm"
                  >
                    View More
                  </button>

                  {/* 📌 BOTÓN PRINCIPAL AZUL */}
                  <a
                    href={
                      course.buttonLabel === "Start Course"
                        ? "https://home.uceusa.com/registration/StudentInfo.aspx?cid=3&host=adtrafficschool.com&pid=328&language=en&g=fac80251-e113-4906-8d99-c77d4e8cad51"
                        : "/Location"
                    }
                    target={course.buttonLabel === "Start Course" ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className="w-full bg-[#0056b3] text-white font-semibold py-2 rounded-lg hover:bg-[#004494] transition duration-300 text-center shadow-md"
                  >
                    {course.buttonLabel || "Start Course"}
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          !loading && <p className="text-center text-gray-500 text-lg">No courses available.</p>
        )}
      </div>

      {/* 📌 POPUP DETALLE DEL CURSO */}
      {selectedCourse && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <motion.div
            className="bg-white p-10 rounded-lg shadow-2xl w-full max-w-2xl relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              onClick={() => setSelectedCourse(null)}
            >
              <FaTimes size={24} />
            </button>

            {/* 📌 IMAGEN EN EL POPUP */}
            {selectedCourse.image && (
              <Image
                src={selectedCourse.image}
                alt={selectedCourse.title}
                width={600}
                height={300}
                className="rounded-lg object-cover w-full mb-4"
              />
            )}

            <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.title}</h2>
            <p className="text-lg text-gray-700 mt-2 leading-relaxed">{selectedCourse.description}</p>

            <div className="flex justify-between mt-6">
              {/* 📌 VER DETALLES (Blanco con borde azul y letra azul) */}
              <a
                href="/Classes"
                className="border-2 border-[#0056b3] text-[#0056b3] font-semibold px-6 py-3 rounded-lg hover:bg-[#0056b3] hover:text-white transition text-center"
              >
                View Details
              </a>

              {/* 📌 BOTÓN DE ACCIÓN (Azul) */}
              <a
                href={
                  selectedCourse.buttonLabel === "Start Course"
                    ? "https://home.uceusa.com/registration/StudentInfo.aspx?cid=3&host=adtrafficschool.com&pid=328&language=en&g=fac80251-e113-4906-8d99-c77d4e8cad51"
                    : "/Location"
                }
                target={selectedCourse.buttonLabel === "Start Course" ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="bg-[#0056b3] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#004494] transition text-center"
              >
                {selectedCourse.buttonLabel || "Start Course"}
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default OnlineCoursesPage;
