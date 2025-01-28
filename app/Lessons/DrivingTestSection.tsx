import React from "react";
import Image from "next/image";
import { Poppins } from "next/font/google";
import { motion } from "framer-motion";

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

const DrivingTestSection = () => {
  return (
    <section id="driving-test-section" className={`${poppins.variable} bg-gray-100 py-20 px-10`}>
      
      {/* 📌 TÍTULO CENTRADO ENCIMA DE TODO CON MÁS ESPACIO ABAJO */}
      <motion.h2 
        className="text-5xl font-extrabold text-center mb-16 leading-tight" // AUMENTÉ ESPACIADO CON mb-16
        initial="hidden"
        whileInView="visible"
        variants={fadeIn}
        viewport={{ once: true }}
      >
        <span className="text-[#27ae60]">DRIVING</span> <span className="text-black">TEST</span> <span className="text-[#0056b3]">REQUIREMENTS</span>
      </motion.h2>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* 📌 CONTENEDOR DE IMAGEN */}
        <motion.div 
          className="relative flex flex-col items-start"
          initial="hidden"
          whileInView="visible"
          variants={fadeIn}
          viewport={{ once: true }}
        >
          {/* 📌 IMAGEN ALINEADA A LA IZQUIERDA */}
          <div className="relative flex justify-center items-end">
            <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 
              group hover:brightness-105">
              <Image
                src="/DT.jpg"
                alt="Driving Test"
                width={410}
                height={320}
                className="rounded-2xl object-cover transition-all duration-500 group-hover:scale-110"
              />
            </div>
          </div>
        </motion.div>

        {/* 📜 TEXTO A LA DERECHA, MOVIDO A LA IZQUIERDA PARA NO PASAR LA MARGEN */}
        <motion.div 
          className="space-y-6 flex flex-col justify-start w-[95%] mr-auto"
          initial="hidden"
          whileInView="visible"
          variants={fadeIn}
          viewport={{ once: true }}
        >
          {/* 📌 TÍTULO "We give the Road Test!!" */}
          <h3 className="text-2xl font-bold text-black">We give the Road Test !!</h3>

          <p className="text-lg text-black text-xm leading-relaxed">
            Affordable Driving Traffic School is a Third Party Agency authorized by the Florida Department of Highway Safety and Motor Vehicles to issue the Road Test.
            There is no need to wait weeks to book an appointment at the DMV for testing. We have availability within a week to take your test with us.
          </p>

          {/* 🔹 Lista de servicios */}
          <div className="bg-white p-6 rounded-xl shadow-md w-full">
            <h3 className="text-xl font-semibold text-[#27ae60]">This Service Includes:</h3>
            <ul className="list-disc list-inside text-black mt-3 space-y-2">
              <li>Vehicle for the Road Test</li>
              <li>Assistance with DMV test booking process</li>
            </ul>
          </div>

          {/* 🔹 Lista de requisitos */}
          <div className="bg-white p-6 rounded-xl shadow-md w-full">
            <h3 className="text-xl font-semibold text-[#0056b3]">You must bring:</h3>
            <ul className="list-disc list-inside text-black mt-3 space-y-2">
              <li>Learner is permit</li>
              <li>Required documentation (if under 18 years old; parent consent form)</li>
              <li>Immigration documents (if applicable)</li>
              <li>Glasses or contact lenses if required</li>
            </ul>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default DrivingTestSection;
