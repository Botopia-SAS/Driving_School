"use client";

import React from "react";
import Image from "next/image";
import { Poppins } from "next/font/google";
import CorporatePrograms from "./CorporatePrograms";
import Link from "next/link";
import useDrivingLessons from "@/app/hooks/useDrivingLessons";
import AuthenticatedButton from "@/components/AuthenticatedButton";
import { motion } from "framer-motion";
import clsx from "clsx";

// Fuente moderna
const poppins = Poppins({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const LessonsPage = () => {
  const lessons = useDrivingLessons("Road Skills for Life");

  return (
    <section className={clsx(poppins.variable, "bg-[#f5f5f5] py-20 px-4 relative")}> 
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        {/* Contenedor principal de texto e imagen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-10">
          {/* Texto con animaciones */}
          <motion.div
            className="flex flex-col justify-between mt-20 md:mt-28"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="space-y-6">
              <div className="hidden md:block text-left">
                <Link href="/driving-lessons" passHref>
                  <div className="bg-[#0056b3] text-white font-semibold px-6 py-2 w-fit self-start rounded-full shadow-lg shadow-gray-700 hover:shadow-black hover:bg-[#27ae60] hover:-translate-y-1 transition transform duration-300 ease-out cursor-pointer active:translate-y-1">
                    Book Driving Lessons
                  </div>
                </Link>
              </div>
              {/* Título con paleta profesional */}
              <h2 className="text-5xl md:text-6xl font-extrabold leading-tight">
                <span className="text-[#0056b3]">LEARN</span>{" "}
                <span className="text-black">ROAD SKILLS</span>{" "}
                <span className="text-[#27ae60]">FOR LIFE</span>
              </h2>
              <p className="text-lg text-black leading-relaxed">
                With over 25 years of experience, we go beyond preparing
                students for the DMV test. Our training covers real-world
                traffic scenarios, defensive driving, and high-speed highways
                like I-95.
              </p>
              <p className="text-lg text-black leading-relaxed">
                We provide personalized lessons tailored for each student,
                ensuring they gain confidence behind the wheel while learning
                essential safety and defensive driving techniques.
              </p>
              {/* Cartas informativas simétricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Carta para Nervous Driver */}
                <motion.div
                  className="bg-white rounded-xl shadow-lg border-2 border-[#0056b3]/20 p-6 hover:shadow-xl hover:border-[#0056b3]/40 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-[#0056b3] rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-[#0056b3]">
                      Nervous Driver or Parent?
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed flex-grow">
                    Get specialized guidance and tips for nervous drivers and concerned parents.
                  </p>
                  <Link
                    href="/Article/Information-for-Nervous-Drivers-and-Parents"
                    className="inline-flex items-center bg-[#0056b3] text-white font-semibold px-4 py-2 rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 hover:bg-[#27ae60] mt-auto"
                  >
                    Read More
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </motion.div>

                {/* Carta para FAQ */}
                <motion.div
                  className="bg-white rounded-xl shadow-lg border-2 border-[#27ae60]/20 p-6 hover:shadow-xl hover:border-[#27ae60]/40 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-[#27ae60] rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-[#27ae60]">
                      Want to know more?
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed flex-grow">
                    Find answers to frequently asked questions about our driving lessons and services.
                  </p>
                  <Link
                    href="/FAQ"
                    className="inline-flex items-center bg-[#27ae60] text-white font-semibold px-4 py-2 rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 hover:bg-[#0056b3] mt-auto"
                  >
                    Read our FAQ
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
          {/* Imagen con animación */}
          <motion.div className="relative flex justify-center items-start mt-20 lg:mt-28" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <div
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all"
              style={{ width: 480, height: 685, maxWidth: '100%' }}
            >
              <Image
                src="https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761584376/cdrrr2qzprxa4mbo2nw8.jpg"
                alt="Traffic in Palm Beach"
                width={480}
                height={685}
                className="rounded-2xl object-cover w-full h-full group-hover:scale-105 transition-all duration-500"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </motion.div>
        </div>

        {/* Sección de Driving Lessons */}
        <motion.div className="mt-16" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.25 }}>
          {/* Grid para mostrar las lecciones correctamente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {lessons.map((lesson) => {
              // Determinar si el botón es de tipo "book" o "buy" usando buttonLabel
              const isBooking = lesson.buttonLabel
                ?.toLowerCase()
                .includes("book");

              return (
                <motion.div
                  key={lesson._id}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 hover:border-[#0056b3]/30 p-4 flex flex-col items-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {/* Icono decorativo más pequeño */}
                  <div className="w-10 h-10 bg-[#0056b3] rounded-full flex items-center justify-center mb-2 group-hover:bg-[#27ae60] transition-colors duration-300">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>

                  <h3 className="text-base text-[#0056b3] font-bold text-center mb-2 group-hover:text-[#27ae60] transition-colors duration-300">
                    {lesson.title}
                  </h3>
                  
                  <p className="text-gray-600 text-center text-xs mb-2 leading-relaxed flex-grow">
                    {lesson.description}
                  </p>
                  
                  {/* Precio destacado más compacto */}
                  <div className="bg-[#27ae60]/10 rounded-lg p-2 mb-3 w-full">
                    <p className="text-xl font-extrabold text-[#27ae60] text-center">
                      ${lesson.price}
                    </p>
                  </div>
                  
                  {/* Contenedor flex para centrar el botón - siempre al final */}
                  <div className="flex justify-center w-full mt-auto">
                    <AuthenticatedButton
                      type={isBooking ? "book" : "buy"}
                      actionData={{
                        itemId: lesson._id,
                        title: lesson.title,
                        price: lesson.price,
                        category: lesson.category, // Pasar categoría
                        duration: lesson.duration, // Pasar duración
                      }}
                      label={lesson.buttonLabel || "Add to Cart"}
                      className="w-full bg-[#27ae60] text-white font-semibold text-sm px-4 py-2 rounded-full shadow-lg hover:bg-[#0056b3] hover:-translate-y-1 transition-all duration-300"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
        {/* Sección de Driving Test */}
        {/* <DrivingTestSection /> */}

      {/* Sección de Corporate Programs */}
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.3 }}>
        <CorporatePrograms />
      </motion.div>
      {/* CIERRE CORRECTO DEL motion.div PRINCIPAL */}
      </motion.div>
    </section>
  );
};

export default LessonsPage;
