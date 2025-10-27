"use client";

import React from "react";
import Image from "next/image";
import { Poppins } from "next/font/google";
import { motion } from "framer-motion";
import Link from "next/link";

// Fuente moderna y elegante
const poppins = Poppins({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

// Animación de entrada
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const CorporatePrograms = () => {
  return (
    <section
      id="corporate-programs-section"
      className={`${poppins.variable} bg-[#f5f5f5] py-2 px-4`}
    >
      {/* 📌 TÍTULO CENTRALIZADO */}
      <motion.h2
        className="text-5xl md:text-6xl font-extrabold text-center mb-8 leading-tight"
        initial="hidden"
        whileInView="visible"
        variants={fadeIn}
        viewport={{ once: true }}
      >
        <span className="text-[#27ae60]">Corporate</span>{" "}
        <span className="text-[#0056b3]">Programs</span>
      </motion.h2>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* 📜 CONTENIDO A LA IZQUIERDA */}
        <motion.div
          className="space-y-6 text-left"
          initial="hidden"
          whileInView="visible"
          variants={fadeIn}
          viewport={{ once: true }}
        >
          <h3 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            <span className="text-[#0056b3]">Upskill</span>{" "}
            <span className="text-black">Your</span>{" "}
            <span className="text-[#27ae60]">Organization</span>
          </h3>

          <p className="text-lg text-black leading-relaxed">
            Affordable Driving Traffic School offers courses that benefit
            industries of all sizes, training employees who need to drive as
            part of their occupation.
          </p>

          <p className="text-lg text-black leading-relaxed">
            Our instructors bring extensive experience from various industries,
            including Law Enforcement, Emergency Transportation, and the
            Transportation sector. Our focus is on reducing risks on the road by
            increasing driver awareness and enhancing knowledge of advanced
            driving techniques.
          </p>

          {/* 🔹 Contenedor para el texto y el botón con más separación */}
          <div className="flex flex-col space-y-3 pt-1">
            {/* 🔹 Contacto con enlace azul SOLO en "Contact us" */}
            <p className="text-lg font-semibold text-black">
              <Link href="/contact" className="text-[#0056b3] hover:text-[#27ae60] transition-colors duration-300 hover:underline">
                Contact us
              </Link>{" "}
              for more information
            </p>

            {/* Botón de "Inquire Now" */}
            <Link
              href="/contact"
              className="bg-[#0056b3] text-white font-semibold px-8 py-3 w-fit rounded-full shadow-lg hover:shadow-xl hover:bg-[#27ae60] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer active:translate-y-1 text-base"
            >
              Inquire Now
            </Link>
          </div>
        </motion.div>

        {/* 📌 IMAGEN A LA DERECHA */}
        <motion.div
          className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 group"
          style={{ minHeight: '324px' }}
          initial="hidden"
          whileInView="visible"
          variants={fadeIn}
          viewport={{ once: true }}
        >
          <Image
            src="https://res.cloudinary.com/dzi2p0pqa/image/upload/v1761584468/a62hzjcvgv3pdltss2ii.jpg"
            alt="Corporate Training"
            width={900}
            height={567}
            className="rounded-2xl object-cover w-full transition-all duration-500 group-hover:scale-105"
            style={{ objectFit: 'cover', height: '324px', minHeight: '324px' }}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default CorporatePrograms;
